import { settleWebhook } from "@/controllers/payment.controller";

export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  if (!secret || secret !== process.env.PAYMENT_WEBHOOK_SECRET) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const body = (await request.json()) as { orderId?: string; event?: string; gatewayRef?: string };
  if (body.event !== "payment.paid" || !body.orderId) {
    return Response.json({ ok: true });
  }
  try {
    await settleWebhook(body.orderId, body.gatewayRef ?? "webhook", JSON.stringify(body));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 404 });
  }
}
