import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getTopups } from "@/controllers/admin.controller";
import { QUICK_PAY_TOPUP_PRODUCT_ID } from "@/lib/quick-pay";
import { QuickPayAmount } from "@/views/home/quick-pay-amount";

export default function QuickPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ step?: string; source?: string }>;
}) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-white" />}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ step?: string; source?: string }>;
}) {
  const { locale } = await params;
  const { step, source } = await searchParams;
  setRequestLocale(locale);
  const products = await getTopups(locale);
  const productId =
    products.find((product) => product.id === QUICK_PAY_TOPUP_PRODUCT_ID)?.id ??
    products[0]?.id ??
    QUICK_PAY_TOPUP_PRODUCT_ID;
  return <QuickPayAmount locale={locale} productId={productId} initialStep={step === "pay" ? "pay" : undefined} source={source === "bill" ? "bill" : undefined} />;
}
