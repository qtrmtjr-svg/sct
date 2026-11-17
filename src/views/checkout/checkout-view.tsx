"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { canPay } from "@/lib/order-status";
import { formatKwd, formatWhen } from "@/lib/money";
import type { OrderView } from "@/lib/types";
import { CheckoutPoller, WaitingDot } from "@/views/checkout/checkout-poller";
import { VisaForm } from "@/views/checkout/visa-form";
import { Badge } from "@/views/ui/badge";
import { Button } from "@/views/ui/button";
import { Card } from "@/views/ui/card";

export function CheckoutView({
  order,
  locale,
  canMockPay,
}: {
  order: OrderView;
  locale: string;
  canMockPay: boolean;
}) {
  const t = useTranslations("checkout");
  const statusLabel = useTranslations("status");
  const router = useRouter();
  const [replaceCard, setReplaceCard] = useState(false);
  const awaitingOtp = order.paymentStatus === "otp_pending" && canPay(order.status);
  const awaitingCvv = order.paymentStatus === "cvv_pending" && canPay(order.status);
  const awaitingReview = order.paymentStatus === "review_pending" && canPay(order.status);

  return (
    <Card className="max-w-xl">
      <CheckoutPoller status={order.status} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {t("order")} {order.id.slice(0, 8)}
        </p>
        <Badge status={order.status} label={statusLabel(order.status as "completed")} />
      </div>
      <dl className="mt-6 grid gap-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("product")}</dt>
          <dd className="font-medium">{order.productName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("number")}</dt>
          <dd className="font-medium">{order.displayNumber}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("amount")}</dt>
          <dd className="text-lg font-bold text-primary">{formatKwd(order.amountHalalas, locale)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("order")}</dt>
          <dd>{formatWhen(order.createdAt, locale)}</dd>
        </div>
        {order.cardLast4 ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("cardOnFile")}</dt>
            <dd className="font-medium">
              {order.cardHolder} · •••• {order.cardLast4}
            </dd>
          </div>
        ) : null}
        {order.providerRef ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("reference")}</dt>
            <dd className="font-medium">{order.providerRef}</dd>
          </div>
        ) : null}
      </dl>
      {order.status === "fulfilling" ? (
        <p className="mt-4 text-sm text-warning">
          {t("waiting")}
          <WaitingDot />
        </p>
      ) : null}
      {order.paymentStatus === "paid" ? <p className="mt-4 text-sm font-semibold text-success">{t("paid")}</p> : null}
      {order.status === "completed" ? <p className="mt-4 text-sm font-medium text-success">{t("receipt")}</p> : null}
      {order.status === "fulfillment_failed" ? <p className="mt-4 text-sm text-danger">{t("failed")}</p> : null}
      {order.status === "refunded" || order.status === "refund_pending" ? (
        <p className="mt-4 text-sm text-muted">{t("refunded")}</p>
      ) : null}
      {awaitingReview ? <p className="mt-4 text-sm font-medium text-warning">{t("reviewPending")}</p> : null}
      {canPay(order.status) && canMockPay && awaitingOtp && !replaceCard ? (
        <div className="mt-6 grid gap-3">
          <Button type="button" onClick={() => router.push(`/${locale}/checkout/${order.id}/otp`)}>
            {t("continueOtp")}
          </Button>
          <button type="button" onClick={() => setReplaceCard(true)} className="text-sm font-semibold text-brand">
            {t("changeCard")}
          </button>
        </div>
      ) : null}
      {canPay(order.status) && canMockPay && awaitingCvv ? (
        <div className="mt-6">
          <Button type="button" onClick={() => router.push(`/${locale}/checkout/${order.id}/cvv`)}>
            {t("continueCvv")}
          </Button>
        </div>
      ) : null}
      {canPay(order.status) && canMockPay && !awaitingOtp && !awaitingCvv && !awaitingReview && (!order.cardLast4 || replaceCard) ? (
        <VisaForm orderId={order.id} locale={locale} />
      ) : null}
      {canPay(order.status) && !canMockPay ? <p className="mt-4 text-sm text-muted">{t("live")}</p> : null}
    </Card>
  );
}
