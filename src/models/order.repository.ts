import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const orderInclude = {
  product: true,
  payment: true,
  fulfillment: true,
  user: true,
} satisfies Prisma.OrderInclude;

export function findOrderById(id: string) {
  return prisma.order.findUnique({ where: { id }, include: orderInclude });
}

export function findOrderByKey(idempotencyKey: string) {
  return prisma.order.findUnique({ where: { idempotencyKey }, include: orderInclude });
}

export function createOrder(data: {
  userId: string | null;
  productId: string;
  msisdn: string;
  amountHalalas: number;
  idempotencyKey: string;
}) {
  return prisma.order.create({
    data: {
      userId: data.userId,
      productId: data.productId,
      msisdn: data.msisdn,
      amountHalalas: data.amountHalalas,
      status: "awaiting_payment",
      idempotencyKey: data.idempotencyKey,
    },
    include: orderInclude,
  });
}

export function updateOrderStatus(id: string, status: string) {
  return prisma.order.update({ where: { id }, data: { status } });
}

export function listOrdersForUser(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
}

export function listRecentOrders(take = 50) {
  return prisma.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function claimGuestOrders(userId: string, msisdns: string[]) {
  if (msisdns.length === 0) return Promise.resolve({ count: 0 });
  return prisma.order.updateMany({
    where: { userId: null, msisdn: { in: msisdns } },
    data: { userId },
  });
}

export async function todayStats() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [completed, failed, revenue] = await Promise.all([
    prisma.order.count({ where: { status: "completed", createdAt: { gte: start } } }),
    prisma.order.count({
      where: { status: { in: ["fulfillment_failed", "payment_failed"] }, createdAt: { gte: start } },
    }),
    prisma.order.aggregate({
      _sum: { amountHalalas: true },
      where: { status: "completed", createdAt: { gte: start } },
    }),
  ]);
  return { completed, failed, revenueHalalas: revenue._sum.amountHalalas ?? 0 };
}

export function upsertPayment(data: {
  orderId: string;
  gateway: string;
  gatewayRef: string;
  status: string;
  rawEvent: string;
}) {
  return prisma.payment.upsert({
    where: { orderId: data.orderId },
    create: data,
    update: {
      gateway: data.gateway,
      gatewayRef: data.gatewayRef,
      status: data.status,
      rawEvent: data.rawEvent,
    },
  });
}

export function markPaymentStatus(orderId: string, status: string) {
  return prisma.payment.update({ where: { orderId }, data: { status } });
}

export function upsertFulfillment(data: {
  orderId: string;
  provider: string;
  providerRef: string | null;
  status: string;
  attempts: number;
  lastError: string;
}) {
  return prisma.fulfillment.upsert({
    where: { orderId: data.orderId },
    create: data,
    update: {
      provider: data.provider,
      providerRef: data.providerRef,
      status: data.status,
      attempts: data.attempts,
      lastError: data.lastError,
    },
  });
}
