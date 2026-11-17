import { z } from "zod";
import { type ActionResult, isErrorCode, toErrorCode } from "@/lib/codes";
import { createAdminSession, createSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createUser, findUserByEmail } from "@/models/user.repository";

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function login(input: { email: string; password: string }): Promise<ActionResult> {
  const email = input.email.toLowerCase().trim();
  if (!emailOk(email)) return { ok: false, code: "invalid_email" };
  const user = await findUserByEmail(email);
  if (!user) return { ok: false, code: "invalid_login" };
  if (user.disabled) return { ok: false, code: "disabled_account" };
  const matches = await verifyPassword(input.password, user.passwordHash);
  if (!matches) return { ok: false, code: "invalid_login" };
  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  return { ok: true };
}

// Used to keep response time similar when the email does not exist.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword("timing-equaliser-not-a-password"));

/** Dashboard login — accepts enabled admin accounts only, with a generic error for everything else. */
export async function adminLogin(input: { email: string; password: string }): Promise<ActionResult> {
  const email = input.email.toLowerCase().trim();
  if (!emailOk(email) || !input.password) return { ok: false, code: "invalid_login" };
  const user = await findUserByEmail(email);
  const matches = await verifyPassword(input.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !matches || user.role !== "admin" || user.disabled) {
    return { ok: false, code: "invalid_login" };
  }
  await createAdminSession({ id: user.id, email: user.email, name: user.name, role: user.role });
  return { ok: true };
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().max(120),
  password: z.string().min(8).max(72),
});

export async function register(input: unknown, locale: string): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    if (field === "name") return { ok: false, code: "invalid_name" };
    if (field === "password") return { ok: false, code: "weak_password" };
    return { ok: false, code: "invalid_email" };
  }
  const email = parsed.data.email.toLowerCase();
  if (!emailOk(email)) return { ok: false, code: "invalid_email" };
  if (await findUserByEmail(email)) return { ok: false, code: "email_taken" };
  try {
    const user = await createUser({
      email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
      locale: locale === "en" ? "en" : "ar",
    });
    await createSession({ id: user.id, email: user.email, name: user.name, role: user.role });
    return { ok: true };
  } catch (error) {
    const code = toErrorCode(error);
    return { ok: false, code: isErrorCode(code) ? code : "generic" };
  }
}
