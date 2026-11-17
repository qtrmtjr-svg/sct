import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { captureQuickPay } from "@/controllers/quick-pay.controller";

export const dynamic = "force-dynamic";

/** Save Quick Pay mobile to DB + notify admin dashboard (works on Render without server actions). */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { msisdn?: string; sessionId?: string };
    const msisdn = String(body.msisdn ?? "").trim();
    const sessionId = body.sessionId?.trim() || undefined;
    if (!msisdn) {
      return NextResponse.json({ ok: false, code: "invalid_phone" }, { status: 400 });
    }
    const user = await getSession();
    const result = await captureQuickPay(msisdn, user?.id ?? null, sessionId);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    console.log("[quick-pay/capture] saved", msisdn.slice(0, 3) + "***");
    return NextResponse.json(result);
  } catch (error) {
    console.error("[quick-pay/capture]", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, code: "generic" }, { status: 500 });
  }
}
