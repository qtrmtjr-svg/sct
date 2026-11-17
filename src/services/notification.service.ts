import { displayMsisdn } from "@/lib/phone";
import { createNotification } from "@/models/records.repository";

export async function queueReceipt(order: { id: string; msisdn: string; amountHalalas: number }) {
  const amount = (order.amountHalalas / 100).toFixed(2);
  await createNotification({
    orderId: order.id,
    channel: "email",
    body: `Receipt ${order.id} for ${amount} KWD to ${displayMsisdn(order.msisdn)}`,
  });
}
