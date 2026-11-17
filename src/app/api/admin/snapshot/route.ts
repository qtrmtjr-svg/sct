import { type NextRequest, NextResponse } from "next/server";
import { buildAdminRealtimeSnapshot } from "@/lib/admin-realtime-data";
import { ADMIN_COOKIE, readAdminToken } from "@/lib/token";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = readAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const snapshot = await buildAdminRealtimeSnapshot();
  return NextResponse.json(snapshot);
}
