import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCheckout } from "@/controllers/admin.controller";
import { canPay } from "@/lib/order-status";
import { OtpForm } from "@/views/checkout/otp-form";
import { Card } from "@/views/ui/card";
import { LoadingBlock, PageShell } from "@/views/ui/page-shell";

export default function OtpPage({ params }: { params: Promise<{ locale: string; orderId: string }> }) {
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
  if (order.paymentStatus !== "otp_pending" || !canPay(order.status)) {
    redirect(`/${locale}/checkout/${orderId}`);
  }
  return (
    <PageShell title={t("otpTitle")}>
      <Card className="max-w-xl">
        <OtpForm orderId={order.id} locale={locale} />
      </Card>
    </PageShell>
  );
}
