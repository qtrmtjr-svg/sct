import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCheckout } from "@/controllers/admin.controller";
import { CheckoutView } from "@/views/checkout/checkout-view";
import { KnetPaid } from "@/views/checkout/knet-paid";
import { LoadingBlock, PageShell } from "@/views/ui/page-shell";

export default function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; orderId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; orderId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { locale, orderId } = await params;
  const { from } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  const order = await getCheckout(orderId, locale);
  if (!order) notFound();
  if (from === "knet" && (order.paymentStatus === "paid" || order.status === "completed" || order.status === "fulfilling")) {
    return <KnetPaid order={order} />;
  }
  return (
    <PageShell title={t("title")}>
      <CheckoutView order={order} locale={locale} canMockPay={process.env.PAYMENT_MODE !== "live"} />
    </PageShell>
  );
}
