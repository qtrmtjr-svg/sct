import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getTopups } from "@/controllers/admin.controller";
import { QUICK_PAY_TOPUP_PRODUCT_ID } from "@/lib/quick-pay";
import { ensureQuickPayTopupProduct } from "@/models/catalog.repository";
import { QuickPayAmount } from "@/views/home/quick-pay-amount";

export default function QuickPayPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse bg-white" />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await ensureQuickPayTopupProduct();
  const products = await getTopups(locale);
  const productId =
    products.find((product) => product.id === QUICK_PAY_TOPUP_PRODUCT_ID)?.id ??
    products[0]?.id ??
    QUICK_PAY_TOPUP_PRODUCT_ID;
  return <QuickPayAmount locale={locale} productId={productId} />;
}
