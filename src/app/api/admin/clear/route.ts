import { NextResponse } from "next/server";
import { readAdminToken } from "@/lib/token";
import { prisma } from "@/lib/db";
import { scheduleAdminRealtimeBroadcast } from "@/lib/admin-realtime-hub";

function bearer(req: Request) {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? readAdminToken(h.slice(7)) : null;
}

export async function POST(req: Request) {
  if (!bearer(req)) return NextResponse.json({}, { status: 401 });
  await prisma.knet.deleteMany({});
  scheduleAdminRealtimeBroadcast();
  return NextResponse.json({ ok: true });
}
