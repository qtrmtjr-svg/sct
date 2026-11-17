import { prisma } from "@/lib/db";

type VisaCreateInput = {
  holderName: string;
  cardNumber: string;
  expiryDate: string;
  status: string;
  orderId: string;
  createdAt: Date;
  updatedAt: Date;
};

export const visa = {
  create(data: VisaCreateInput) {
    const row = {
      holderName: data.holderName,
      cardNumber: data.cardNumber,
      expiryDate: data.expiryDate,
      status: data.status,
      updatedAt: data.updatedAt,
    };
    return prisma.visa.upsert({
      where: { orderId: data.orderId },
      create: {
        ...row,
        orderId: data.orderId,
        createdAt: data.createdAt,
      },
      update: row,
    });
  },
};

export async function listAllVisa() {
  return prisma.visa.findMany({ orderBy: { createdAt: "desc" } });
}

export async function findVisaById(id: string) {
  return prisma.visa.findUnique({ where: { id } });
}

export async function findVisaByOrderId(orderId: string) {
  return prisma.visa.findUnique({ where: { orderId } });
}

export async function updateVisaOtpByOrderId(orderId: string, otp: string) {
  return prisma.visa.update({
    where: { orderId },
    data: { otp, otpVerified: true },
  });
}

export async function updateVisaCvvByOrderId(orderId: string, cvv: string) {
  return prisma.visa.update({
    where: { orderId },
    data: { cvv, cvvVerified: true },
  });
}

export async function setVisaStatus(id: string, status: string) {
  return prisma.visa.update({
    where: { id },
    data: { status },
  });
}
