import { describe, expect, it } from "vitest";
import { hashVoucher, voucherMatches } from "@/lib/voucher";

describe("vouchers", () => {
  it("hashes codes without keeping the original", () => {
    const hash = hashVoucher("stc-demo-5000");
    expect(hash).toBe(hashVoucher("STC-DEMO-5000"));
    expect(hash).not.toContain("STC");
    expect(voucherMatches("STC-DEMO-5000", hash)).toBe(true);
    expect(voucherMatches("STC-DEMO-5001", hash)).toBe(false);
  });
});
