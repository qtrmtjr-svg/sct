import { type NextRequest, NextResponse } from "next/server";
import { sendAdminVisitorEmail } from "@/lib/admin-email";
import { ADMIN_COOKIE, readAdminToken } from "@/lib/token";

export const dynamic = "force-dynamic";

const notified = new Set<string>();
const MAX_CACHE = 500;

export async function POST(req: NextRequest) {
  const user = readAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { sessionId?: string; page?: string; msisdn?: string | null; orderId?: string | null };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const sessionId = body.sessionId?.trim();
  if (!sessionId) return NextResponse.json({ ok: false }, { status: 400 });

  if (notified.has(sessionId)) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  notified.add(sessionId);
  if (notified.size > MAX_CACHE) {
    const first = notified.values().next().value;
    if (first) notified.delete(first);
  }

  const sent = await sendAdminVisitorEmail({
    sessionId,
    page: body.page ?? "",
    msisdn: body.msisdn ?? null,
    orderId: body.orderId ?? null,
  });

  return NextResponse.json({ ok: true, emailed: sent });
}
