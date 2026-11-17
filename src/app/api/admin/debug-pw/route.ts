import { NextResponse } from "next/server";
import { findAdminUsers } from "@/models/user.repository";
import { verifyPassword, hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

export async function GET() {
  const admins = await findAdminUsers();
  const testPw = "Hadmin1234@@";
  const results = [];

  for (const user of admins) {
    const matches = await verifyPassword(testPw, user.passwordHash);
    const freshHash = await hashPassword(testPw);
    const matchesFresh = await verifyPassword(testPw, freshHash);
    results.push({
      email: user.email,
      role: user.role,
      disabled: user.disabled,
      hashPrefix: user.passwordHash.slice(0, 20),
      matches,
      freshHashWorks: matchesFresh,
    });
  }

  return NextResponse.json({ adminCount: admins.length, results });
}
