import { NextResponse } from "next/server";
import { readAdminToken } from "@/lib/token";
import { updateKnetStatus } from "@/controllers/knet.controller";
import { scheduleAdminRealtimeBroadcast } from "@/lib/admin-realtime-hub";

function bearer(req: Request) {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? readAdminToken(h.slice(7)) : null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!bearer(req)) return NextResponse.json({}, { status: 401 });
  const { id } = await params;
  const result = await updateKnetStatus(id, "rejected");
  if (result.ok) scheduleAdminRealtimeBroadcast();
  return NextResponse.json(result);
}
