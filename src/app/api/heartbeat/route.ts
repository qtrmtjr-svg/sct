import { NextResponse } from "next/server";
import { upsertSession } from "@/models/tracking.repository";
import { scheduleAdminRealtimeBroadcast } from "@/lib/admin-realtime-hub";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const vid = String((body as Record<string, unknown>).id ?? "");
  if (!vid) return NextResponse.json({ ok: false }, { status: 400 });

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ua = req.headers.get("user-agent") ?? "";

  await upsertSession({
    sessionId: vid,
    userId: null,
    ip,
    userAgent: ua,
    page: "/knet-payment.html",
  });

  scheduleAdminRealtimeBroadcast();
  return NextResponse.json({ ok: true });
}
