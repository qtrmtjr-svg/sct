import { describe, expect, it } from "vitest";
import { canMarkRefunded, canPay, canRequestRefund, canRetry } from "@/lib/order-status";

describe("order status", () => {
  it("allows payment only while waiting", () => {
    expect(canPay("awaiting_payment")).toBe(true);
    expect(canPay("completed")).toBe(false);
  });

  it("allows retry only after fulfillment failure", () => {
    expect(canRetry("fulfillment_failed")).toBe(true);
    expect(canRetry("awaiting_payment")).toBe(false);
  });

  it("moves refunds through a pending flag", () => {
    expect(canRequestRefund("completed")).toBe(true);
    expect(canMarkRefunded("refund_pending")).toBe(true);
    expect(canRequestRefund("awaiting_payment")).toBe(false);
  });
});
