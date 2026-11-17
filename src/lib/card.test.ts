import { describe, expect, it } from "vitest";
import { inspectVisa, readSavedCard } from "@/lib/card";

const now = new Date("2026-10-21T12:00:00Z");

describe("inspectVisa", () => {
  it("keeps only the name, last 4 digits, and expiry", () => {
    const saved = inspectVisa(
      {
        holderName: "  سارة   العلي ",
        number: "4242 4242 4242 4242",
        expiry: "12/28",
        cvv: "123",
      },
      now,
    );
    expect(saved).toEqual({
      holderName: "سارة العلي",
      last4: "4242",
      expiryMonth: 12,
      expiryYear: 2028,
    });
    expect(JSON.stringify(saved)).not.toContain("4242424242424242");
    expect(JSON.stringify(saved)).not.toContain("123");
  });

  it("rejects a non-visa number, a bad expiry, and a short code", () => {
    expect(
      inspectVisa({ holderName: "Sara Ali", number: "5555555555554444", expiry: "12/28", cvv: "123" }, now),
    ).toBeNull();
    expect(
      inspectVisa({ holderName: "Sara Ali", number: "4242424242424242", expiry: "09/26", cvv: "123" }, now),
    ).toBeNull();
    expect(
      inspectVisa({ holderName: "Sara Ali", number: "4242424242424242", expiry: "12/28", cvv: "12" }, now),
    ).toBeNull();
  });
});

describe("readSavedCard", () => {
  it("reads the stored payment summary", () => {
    expect(
      readSavedCard(JSON.stringify({ holderName: "Sara Ali", last4: "4242", expiryMonth: 12, expiryYear: 2028 })),
    ).toEqual({ holderName: "Sara Ali", last4: "4242", expiryMonth: 12, expiryYear: 2028 });
    expect(readSavedCard("{event:paid}")).toBeNull();
  });
});
