import { headers } from "next/headers";
import { z } from "zod";
import { type ActionResult, toErrorCode } from "@/lib/codes";
import { MAX_TOPUP_HALALAS, MIN_TOPUP_HALALAS } from "@/lib/money";
import { normalizeMsisdn } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { createPendingOrder } from "@/services/recharge.service";

const schema = z.object({
  msisdn: z.string().trim().min(8).max(20),
  productId: z.string().trim().min(1).max(64),
  idempotencyKey: z.string().trim().regex(/^[0-9a-f-]{36}$/i),
  amountHalalas: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().int().min(MIN_TOPUP_HALALAS).max(MAX_TOPUP_HALALAS).optional(),
  ),
});

async function limited(msisdn: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return rateLimit(`order:${ip}:${msisdn}`);
}

export async function createProductOrder(
  input: unknown,
  userId: string | null,
  kind: "topup" | "package",
): Promise<ActionResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_amount" };
  const msisdn = normalizeMsisdn(parsed.data.msisdn);
  if (!msisdn) return { ok: false, code: "invalid_phone" };
  if (!(await limited(msisdn))) return { ok: false, code: "rate_limited" };
  if (kind === "topup" && !parsed.data.amountHalalas) return { ok: false, code: "invalid_amount" };
  try {
    const order = await createPendingOrder({
      msisdn,
      productId: parsed.data.productId,
      userId,
      idempotencyKey: parsed.data.idempotencyKey,
      kind,
      amountHalalas: kind === "topup" ? parsed.data.amountHalalas : undefined,
    });
    return { ok: true, orderId: order.id };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}
