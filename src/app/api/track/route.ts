import { type NextRequest, NextResponse } from "next/server";
import { scheduleAdminRealtimeBroadcast } from "@/lib/admin-realtime-hub";
import { recordEvent, upsertSession } from "@/models/tracking.repository";
import { readToken } from "@/lib/auth";

// Blocked field names — never log these
const BLOCKED_FIELDS = new Set(["password", "passwordHash", "cvv", "cvc", "cc-csc"]);

function isBlockedField(name: string | null | undefined): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return BLOCKED_FIELDS.has(lower) || lower.includes("password") || lower.includes("cvv") || lower.includes("cvc");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, userId, events, page: pageOverride, flowStage, locked, orderId } = body as {
      sessionId: string;
      userId?: string | null;
      events?: Array<{
        type: string;
        page: string;
        element?: string;
        value?: string;
        meta?: string;
      }>;
      page?: string;
      flowStage?: string;
      locked?: boolean;
      orderId?: string;
    };

    const batch = Array.isArray(events) ? events : [];
    if (!sessionId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Resolve userId from cookie if not sent (SSR sessions)
    let resolvedUserId = userId ?? null;
    if (!resolvedUserId) {
      const cookie = req.cookies.get("stc_session")?.value;
      if (cookie) {
        const user = readToken(cookie);
        if (user) resolvedUserId = user.id;
      }
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const userAgent = req.headers.get("user-agent") ?? "";

    // Find current page from last page_view or first event
    const pageViewEvent = [...batch].reverse().find((e) => e.type === "page_view");
    const currentPage = pageOverride ?? pageViewEvent?.page ?? batch[0]?.page ?? "/";

    await upsertSession({
      sessionId,
      userId: resolvedUserId,
      ip,
      userAgent,
      page: currentPage,
      flowStage,
      locked,
      orderId: orderId ?? null,
    });

    // Record events, sanitising blocked fields
    for (const ev of batch) {
      const blocked = isBlockedField(ev.element);
      await recordEvent({
        sessionId,
        userId: resolvedUserId,
        type: ev.type,
        page: ev.page,
        element: ev.element ?? null,
        value: blocked ? null : (ev.value ?? null),
        meta: ev.meta ?? null,
      });
    }

    scheduleAdminRealtimeBroadcast();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[track]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
