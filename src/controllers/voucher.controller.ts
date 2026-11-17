import { z } from "zod";
import { type ActionResult, toErrorCode } from "@/lib/codes";
import { normalizeMsisdn } from "@/lib/phone";
import { hashVoucher } from "@/lib/voucher";
import { claimVoucher, findVoucherByHash } from "@/models/voucher.repository";
import { createPendingOrder, payAndFulfill } from "@/services/recharge.service";

const schema = z.object({
  msisdn: z.string().trim().min(8).max(20),
  code: z.string().trim().min(6).max(32),
  idempotencyKey: z.string().trim().regex(/^[0-9a-f-]{36}$/i),
});

export async function redeemVoucher(input: unknown, userId: string | null): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "voucher_invalid" };
  const msisdn = normalizeMsisdn(parsed.data.msisdn);
  if (!msisdn) return { ok: false, code: "invalid_phone" };

  const voucher = await findVoucherByHash(hashVoucher(parsed.data.code));
  if (!voucher || !voucher.product.active) return { ok: false, code: "voucher_invalid" };
  if (voucher.status !== "unused") return { ok: false, code: "voucher_used" };

  try {
    const order = await createPendingOrder({
      msisdn,
      productId: voucher.productId,
      userId,
      idempotencyKey: parsed.data.idempotencyKey,
      kind: "voucher",
    });
    const claimed = await claimVoucher(voucher.id, order.id);
    if (claimed.count === 0) return { ok: false, code: "voucher_used" };
    await payAndFulfill(order.id, {
      gateway: "voucher",
      gatewayRef: voucher.id,
      rawEvent: JSON.stringify({ event: "voucher.redeemed", orderId: order.id }),
    });
    return { ok: true, orderId: order.id };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}
