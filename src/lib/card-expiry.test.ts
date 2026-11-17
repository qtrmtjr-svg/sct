import { describe, expect, it } from "vitest";
import { isValidCardExpiryMmYy, normalizeExpiryMonthInput } from "@/lib/card-expiry";

describe("card expiry", () => {
  const now = new Date(2026, 9, 27); // Oct 27, 2026

  it("accepts a valid future month", () => {
    expect(isValidCardExpiryMmYy("12", "28", now)).toBe(true);
  });

  it("rejects month 00 and 13", () => {
    expect(isValidCardExpiryMmYy("00", "28", now)).toBe(false);
    expect(isValidCardExpiryMmYy("13", "28", now)).toBe(false);
  });

  it("rejects expired dates", () => {
    expect(isValidCardExpiryMmYy("09", "26", now)).toBe(false);
  });

  it("normalizes month while typing", () => {
    expect(normalizeExpiryMonthInput("9")).toBe("09");
    expect(normalizeExpiryMonthInput("15")).toBe("12");
  });
});
