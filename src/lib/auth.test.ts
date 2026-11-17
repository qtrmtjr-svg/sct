import { describe, expect, it } from "vitest";
import { readAdminToken, readToken, signAdminSession, signSession } from "@/lib/token";

describe("session token", () => {
  it("round-trips a signed session", () => {
    const token = signSession({ id: "u1", email: "a@example.com", name: "A", role: "customer" });
    expect(readToken(token)).toMatchObject({ id: "u1", role: "customer" });
    expect(readToken(`${token}x`)).toBeNull();
  });
});

describe("admin token", () => {
  const admin = { id: "a1", email: "admin@example.com", name: "Admin", role: "admin" };

  it("accepts tokens minted by the admin login", () => {
    expect(readAdminToken(signAdminSession(admin))).toMatchObject({ id: "a1", role: "admin" });
  });

  it("rejects a store session even when the user is an admin", () => {
    expect(readAdminToken(signSession(admin))).toBeNull();
  });

  it("rejects admin-scoped tokens for non-admin roles", () => {
    expect(readAdminToken(signAdminSession({ ...admin, role: "customer" }))).toBeNull();
  });

  it("does not accept admin tokens as store sessions", () => {
    expect(readToken(signAdminSession(admin))).toBeNull();
  });

  it("rejects tampered or missing tokens", () => {
    expect(readAdminToken(`${signAdminSession(admin)}x`)).toBeNull();
    expect(readAdminToken(undefined)).toBeNull();
  });
});
