import { describe, expect, it } from "vitest";
import { displayMsisdn, normalizeKuwaitMsisdn, normalizeMsisdn } from "@/lib/phone";

describe("phone numbers", () => {
  it("accepts Saudi mobile formats", () => {
    expect(normalizeMsisdn("0551234567")).toBe("966551234567");
    expect(normalizeMsisdn("551234567")).toBe("966551234567");
    expect(normalizeMsisdn("+966 55 123 4567")).toBe("966551234567");
  });

  it("rejects other numbers", () => {
    expect(normalizeMsisdn("050123")).toBeNull();
    expect(normalizeMsisdn("0112345678")).toBeNull();
  });

  it("shows the local format", () => {
    expect(displayMsisdn("966551234567")).toBe("0551234567");
    expect(displayMsisdn("96551234567")).toBe("51234567");
  });

  it("accepts Kuwait mobile formats", () => {
    expect(normalizeKuwaitMsisdn("51234567")).toBe("96551234567");
    expect(normalizeKuwaitMsisdn("61234567")).toBe("96561234567");
    expect(normalizeKuwaitMsisdn("+965 9 123 4567")).toBe("96591234567");
    expect(normalizeMsisdn("51234567")).toBe("96551234567");
    expect(normalizeKuwaitMsisdn("0551234567")).toBeNull();
  });
});
