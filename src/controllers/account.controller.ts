import { z } from "zod";
import { type ActionResult, toErrorCode } from "@/lib/codes";
import { displayMsisdn, normalizeMsisdn } from "@/lib/phone";
import { presentOrder } from "@/lib/present";
import type { SavedNumberView } from "@/lib/types";
import { claimGuestOrders, listOrdersForUser } from "@/models/order.repository";
import { listSavedNumbers, saveNumber } from "@/models/user.repository";

export async function getAccount(userId: string, locale: string) {
  const [orders, numbers] = await Promise.all([listOrdersForUser(userId), listSavedNumbers(userId)]);
  const saved: SavedNumberView[] = numbers.map((number) => ({
    id: number.id,
    msisdn: number.msisdn,
    displayNumber: displayMsisdn(number.msisdn),
    label: number.label,
  }));
  return {
    orders: orders.map((order) => presentOrder(order, locale)),
    saved,
  };
}

const saveSchema = z.object({
  msisdn: z.string().trim().min(8).max(20),
  label: z.string().trim().max(40).optional(),
});

export async function addSavedNumber(userId: string, input: unknown): Promise<ActionResult> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_phone" };
  const msisdn = normalizeMsisdn(parsed.data.msisdn);
  if (!msisdn) return { ok: false, code: "invalid_phone" };
  try {
    await saveNumber(userId, msisdn, parsed.data.label ?? "");
    return { ok: true };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

export async function claimOrders(userId: string): Promise<ActionResult> {
  const numbers = await listSavedNumbers(userId);
  await claimGuestOrders(
    userId,
    numbers.map((number) => number.msisdn),
  );
  return { ok: true };
}
