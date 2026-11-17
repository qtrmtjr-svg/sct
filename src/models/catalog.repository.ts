import { prisma } from "@/lib/db";

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

export function setProductActive(id: string, active: boolean) {
  return prisma.product.update({ where: { id }, data: { active } });
}
