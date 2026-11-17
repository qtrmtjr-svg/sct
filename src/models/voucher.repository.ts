import { prisma } from "@/lib/db";

export function findVoucherByHash(codeHash: string) {
  return prisma.voucher.findUnique({ where: { codeHash }, include: { product: true } });
}

export function claimVoucher(id: string, orderId: string) {
  return prisma.voucher.updateMany({
    where: { id, status: "unused" },
    data: { status: "redeemed", redeemedOrderId: orderId },
  });
}
