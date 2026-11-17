import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCheckout } from "@/controllers/admin.controller";
import { canPay } from "@/lib/order-status";
import { CvvForm } from "@/views/checkout/cvv-form";
import { Card } from "@/views/ui/card";
import { LoadingBlock, PageShell } from "@/views/ui/page-shell";

export default function CvvPage({ params }: { params: Promise<{ locale: string; orderId: string }> }) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ locale: string; orderId: string }> }) {
  const { locale, orderId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");
  const order = await getCheckout(orderId, locale);
  if (!order) notFound();
  if (order.paymentStatus !== "cvv_pending" || !canPay(order.status)) {
    redirect(`/${locale}/checkout/${orderId}`);
  }
  return (
    <PageShell title={t("cvvTitle")}>
      <Card className="max-w-xl">
        <CvvForm orderId={order.id} locale={locale} />
      </Card>
    </PageShell>
  );
}
