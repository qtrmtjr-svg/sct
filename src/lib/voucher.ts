import { createHash, timingSafeEqual } from "node:crypto";

export function hashVoucher(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export function voucherMatches(code: string, hash: string) {
  const actual = Buffer.from(hashVoucher(code), "utf8");
  const expected = Buffer.from(hash, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
