import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  ADMIN_TTL_MS,
  readAdminToken,
  readToken,
  type SessionUser,
  signAdminSession,
  signSession,
  USER_COOKIE,
  USER_TTL_MS,
} from "@/lib/token";

export { readAdminToken, readToken, signAdminSession, signSession, ADMIN_COOKIE, USER_COOKIE };
export type { SessionUser };

// ── Store (customer) session ─────────────────────────────────────

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  if (!token) return null;
  return readToken(token);
}

export async function createSession(user: SessionUser) {
  (await cookies()).set(USER_COOKIE, signSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: USER_TTL_MS / 1000,
  });
}

export async function clearSession() {
  (await cookies()).delete(USER_COOKIE);
}

export async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error("invalid_login");
  return session;
}

// ── Dashboard (admin) session ────────────────────────────────────
// Completely separate from the store session: only the admin login
// page (email + password) can mint this cookie.

export async function getAdminSession(): Promise<SessionUser | null> {
  return readAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

export async function createAdminSession(user: SessionUser) {
  (await cookies()).set(ADMIN_COOKIE, signAdminSession(user), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_TTL_MS / 1000,
  });
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error("invalid_login");
  return session;
}

export async function ensureAdmin(locale: string) {
  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);
  return session;
}
