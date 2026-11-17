import { prisma } from "@/lib/db";
import { QUICK_PAY_TOPUP_PRODUCT_ID } from "@/lib/quick-pay";

export function listProducts(kind?: string) {
  return prisma.product.findMany({
    where: kind ? { kind, active: true } : undefined,
    orderBy: { amountHalalas: "asc" },
  });
}

export function listAllProducts() {
  return prisma.product.findMany({ orderBy: [{ kind: "asc" }, { amountHalalas: "asc" }] });
}

export function findProduct(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

/** Ensures quick pay can create orders even when full seed was not run. */
export async function ensureQuickPayTopupProduct() {
  return prisma.product.upsert({
    where: { id: QUICK_PAY_TOPUP_PRODUCT_ID },
    create: {
      id: QUICK_PAY_TOPUP_PRODUCT_ID,
      kind: "topup",
      nameAr: "شحن سريع",
      nameEn: "Quick pay top-up",
      descriptionAr: "مبلغ يختاره العميل في الدفع السريع",
      descriptionEn: "Customer-selected quick pay amount",
      amountHalalas: 100,
      providerSku: "QUICK-PAY",
      active: true,
    },
    update: { kind: "topup", active: true },
  });
}

export function setProductActive(id: string, active: boolean) {
  return prisma.product.update({ where: { id }, data: { active } });
}
