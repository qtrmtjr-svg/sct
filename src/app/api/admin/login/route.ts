import { NextResponse } from "next/server";
import { findAdminUsers } from "@/models/user.repository";
import { verifyPassword } from "@/lib/password";
import { signAdminSession } from "@/lib/token";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = String((body as Record<string, unknown>).password ?? "");
  if (!password) return NextResponse.json({ error: "missing" }, { status: 400 });

  const admins = await findAdminUsers();
  for (const user of admins) {
    const matches = await verifyPassword(password, user.passwordHash);
    if (matches) {
      const token = signAdminSession({ id: user.id, email: user.email, name: user.name, role: user.role });
      return NextResponse.json({ token });
    }
  }
  return NextResponse.json({ error: "invalid" }, { status: 401 });
}
