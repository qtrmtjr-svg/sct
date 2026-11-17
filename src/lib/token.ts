import { createHmac, timingSafeEqual } from "node:crypto";

/** Customer/store session cookie. */
export const USER_COOKIE = "stc_session";
/** Dashboard-only session cookie. Issued exclusively by the admin email/password login. */
export const ADMIN_COOKIE = "stc_admin";

export const USER_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const ADMIN_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type Scope = "user" | "admin";
type Payload = SessionUser & { exp: number; scope?: Scope };

function secret() {
  return process.env.AUTH_SECRET || "dev-secret-change-me-please-32b";
}

function sign(payload: Payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token: string): Payload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const actualBuffer = Buffer.from(sig);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    if (!payload.id || !payload.email || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

function toUser(payload: Payload): SessionUser {
  return { id: payload.id, email: payload.email, name: payload.name ?? "", role: payload.role };
}

export function signSession(user: SessionUser) {
  return sign({ ...user, exp: Date.now() + USER_TTL_MS, scope: "user" });
}

export function signAdminSession(user: SessionUser) {
  return sign({ ...user, exp: Date.now() + ADMIN_TTL_MS, scope: "admin" });
}

/** Reads a store session token. Admin-scoped tokens are not accepted here. */
export function readToken(token: string): SessionUser | null {
  const payload = verify(token);
  if (!payload || payload.scope === "admin") return null;
  return toUser(payload);
}

/** Reads a dashboard token. Only tokens minted by the admin login (scope=admin, role=admin) pass. */
export function readAdminToken(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  const payload = verify(token);
  if (!payload || payload.scope !== "admin" || payload.role !== "admin") return null;
  return toUser(payload);
}
