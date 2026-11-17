import { type NextRequest, NextResponse } from "next/server";
import { getUserActivity, getUserSessions } from "@/models/tracking.repository";
import { findUserById } from "@/models/user.repository";
import { ADMIN_COOKIE, readAdminToken } from "@/lib/token";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = readAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [user, sessions, activity] = await Promise.all([
    findUserById(id),
    getUserSessions(id),
    getUserActivity(id, 300),
  ]);

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ user, sessions, activity });
}
