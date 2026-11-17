import type { Product } from "@prisma/client";
import { readSavedCard } from "@/lib/card";
import { displayMsisdn } from "@/lib/phone";
import type { OrderView, ProductView } from "@/lib/types";
import type { orderInclude } from "@/models/order.repository";
import type { Prisma } from "@prisma/client";

type OrderDetail = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function topupLabel(arabic: boolean, halalas: number) {
  const riyals = halalas / 100;
  const amount = Number.isInteger(riyals) ? String(riyals) : riyals.toFixed(2);
  return arabic ? `شحن ${amount} دينار` : `Recharge ${amount} KWD`;
}

export function presentProduct(product: Product, locale: string): ProductView {
  const arabic = locale === "ar";
  return {
    id: product.id,
    kind: product.kind,
    category: product.category,
    name: arabic ? product.nameAr : product.nameEn,
    description: arabic ? product.descriptionAr : product.descriptionEn,
    amountHalalas: product.amountHalalas,
    validityDays: product.validityDays,
    active: product.active,
  };
}

function paymentMethodOf(gateway: string | null | undefined, raw: string | null | undefined) {
  if (!gateway) return null;
  if (gateway === "visa" || gateway === "voucher") return gateway;
  try {
    const source = raw ? (JSON.parse(raw) as { source?: string }).source : undefined;
    if (source === "knet" || source === "gpay") return source;
  } catch {
    // Older rows keep the gateway label below.
  }
  return gateway === "mock" ? null : gateway;
}

export function presentOrder(order: OrderDetail, locale: string): OrderView {
  const arabic = locale === "ar";
  const card = readSavedCard(order.payment?.rawEvent);
  return {
    id: order.id,
    msisdn: order.msisdn,
    displayNumber: displayMsisdn(order.msisdn),
    amountHalalas: order.amountHalalas,
    status: order.status,
    productName:
      order.product.kind === "topup" && order.amountHalalas !== order.product.amountHalalas
        ? topupLabel(arabic, order.amountHalalas)
        : arabic
          ? order.product.nameAr
          : order.product.nameEn,
    createdAt: order.createdAt.toISOString(),
    providerRef: order.fulfillment?.providerRef ?? null,
    lastError: order.fulfillment?.lastError || null,
    userEmail: order.user?.email ?? null,
    paymentStatus: order.payment?.status ?? null,
    paymentMethod: paymentMethodOf(order.payment?.gateway, order.payment?.rawEvent),
    gatewayRef: order.payment?.gatewayRef ?? null,
    cardHolder: card?.holderName ?? null,
    cardLast4: card?.last4 ?? null,
    cardExpiry: card ? `${String(card.expiryMonth).padStart(2, "0")}/${String(card.expiryYear).slice(-2)}` : null,
  };
}
