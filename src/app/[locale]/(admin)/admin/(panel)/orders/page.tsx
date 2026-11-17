import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getAdminOrders } from "@/controllers/admin.controller";
import { ensureAdmin } from "@/lib/auth";
import { OrdersAdminView } from "@/views/admin/orders-view";
import { LoadingBlock } from "@/views/ui/page-shell";

export default function AdminOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await ensureAdmin(locale);
  const orders = await getAdminOrders(locale);
  return <OrdersAdminView orders={orders} locale={locale} />;
}
