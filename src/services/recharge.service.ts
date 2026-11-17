import { Prisma } from "@prisma/client";
import { findProduct } from "@/models/catalog.repository";
import {
  createOrder,
  findOrderById,
  findOrderByKey,
  markPaymentStatus,
  updateOrderStatus,
  upsertFulfillment,
  upsertPayment,
} from "@/models/order.repository";
import { createAudit } from "@/models/records.repository";
import { canMarkRefunded, canRequestRefund, canRetry } from "@/lib/order-status";
import { getAirtimeProvider } from "@/services/providers/airtime.provider";
import { queueReceipt } from "@/services/notification.service";

type Kind = "topup" | "package" | "bill" | "voucher";

export async function createPendingOrder(input: {
  msisdn: string;
  productId: string;
  userId: string | null;
  idempotencyKey: string;
  kind: Kind;
  amountHalalas?: number;
}) {
  const existing = await findOrderByKey(input.idempotencyKey);
  if (existing) return existing;

  const product = await findProduct(input.productId);
  if (!product || !product.active || product.kind !== input.kind) {
    throw new Error("invalid_amount");
  }
  const amountHalalas = input.amountHalalas ?? product.amountHalalas;
  if (amountHalalas <= 0) throw new Error("invalid_amount");

  try {
    return await createOrder({
      userId: input.userId,
      productId: product.id,
      msisdn: input.msisdn,
      amountHalalas,
      idempotencyKey: input.idempotencyKey,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await findOrderByKey(input.idempotencyKey);
      if (raced) return raced;
    }
    throw error;
  }
}

export async function payAndFulfill(
  orderId: string,
  meta: { gateway: string; gatewayRef: string; rawEvent: string },
) {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("not_found");
  if (order.status === "completed" || order.status === "refunded" || order.status === "refund_pending") {
    return order;
  }
  if (order.status !== "awaiting_payment" && order.status !== "payment_failed") {
    return findOrderById(orderId);
  }

  await upsertPayment({
    orderId,
    gateway: meta.gateway,
    gatewayRef: meta.gatewayRef,
    status: "paid",
    rawEvent: meta.rawEvent,
  });
  await updateOrderStatus(orderId, "fulfilling");
  return fulfillOrder(orderId);
}

export async function fulfillOrder(orderId: string) {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("not_found");
  if (order.status === "completed") return order;

  const attempts = (order.fulfillment?.attempts ?? 0) + 1;
  const providerName = process.env.AIRTIME_MODE === "live" ? "live" : "mock";
  try {
    const result = await getAirtimeProvider().topup({
      msisdn: order.msisdn,
      sku: order.product.providerSku,
      orderId,
    });
    await upsertFulfillment({
      orderId,
      provider: providerName,
      providerRef: result.ref,
      status: "success",
      attempts,
      lastError: "",
    });
    await updateOrderStatus(orderId, "completed");
    await queueReceipt(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed";
    await upsertFulfillment({
      orderId,
      provider: providerName,
      providerRef: order.fulfillment?.providerRef ?? null,
      status: "failed",
      attempts,
      lastError: message,
    });
    await updateOrderStatus(orderId, "fulfillment_failed");
  }
  return findOrderById(orderId);
}

export async function retryFulfillment(orderId: string, actorId: string) {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("not_found");
  if (!canRetry(order.status)) throw new Error("generic");
  await updateOrderStatus(orderId, "fulfilling");
  await createAudit({ actorId, action: "retry", orderId });
  return fulfillOrder(orderId);
}

export async function requestRefund(orderId: string, actorId: string) {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("not_found");
  if (canMarkRefunded(order.status)) {
    await updateOrderStatus(orderId, "refunded");
    if (order.payment) await markPaymentStatus(orderId, "refunded");
    await createAudit({ actorId, action: "refunded", orderId });
    return findOrderById(orderId);
  }
  if (!canRequestRefund(order.status)) throw new Error("generic");
  await updateOrderStatus(orderId, "refund_pending");
  await createAudit({ actorId, action: "refund_pending", orderId });
  return findOrderById(orderId);
}

export async function mockPay(orderId: string, source: "knet" | "gpay" | "mock" = "mock") {
  if (process.env.PAYMENT_MODE === "live") throw new Error("generic");
  const order = await findOrderById(orderId);
  if (!order) throw new Error("not_found");
  if (order.status !== "awaiting_payment") return order;
  return payAndFulfill(orderId, {
    gateway: "mock",
    gatewayRef: `MOCKPAY-${orderId.slice(0, 8)}`,
    rawEvent: JSON.stringify({ event: "payment.paid", orderId, source }),
  });
}
