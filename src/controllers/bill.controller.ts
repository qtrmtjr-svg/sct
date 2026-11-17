import { headers } from "next/headers";
import { z } from "zod";
import { type ActionResult, toErrorCode } from "@/lib/codes";
import { normalizeMsisdn } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { findProduct } from "@/models/catalog.repository";
import { createPendingOrder } from "@/services/recharge.service";

const schema = z.object({
  msisdn: z.string().trim().min(8).max(20),
  idempotencyKey: z.string().trim().regex(/^[0-9a-f-]{36}$/i),
});

const BILL_DUE = 15000;

export async function payBill(input: unknown, userId: string | null): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_phone" };
  const msisdn = normalizeMsisdn(parsed.data.msisdn);
  if (!msisdn) return { ok: false, code: "invalid_phone" };
  if (!msisdn.endsWith("1111")) return { ok: false, code: "no_bill" };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`bill:${ip}:${msisdn}`)) return { ok: false, code: "rate_limited" };

  const product = await findProduct("bill-postpaid");
  if (!product) return { ok: false, code: "generic" };
  try {
    const order = await createPendingOrder({
      msisdn,
      productId: product.id,
      userId,
      idempotencyKey: parsed.data.idempotencyKey,
      kind: "bill",
      amountHalalas: BILL_DUE,
    });
    return { ok: true, orderId: order.id };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}
