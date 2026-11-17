import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BillForm } from "@/views/bills/bill-form";
import { LoadingBlock, PageShell } from "@/views/ui/page-shell";

export default function BillsPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bills");
  return (
    <PageShell title={t("title")} subtitle={t("subtitle")}>
      <BillForm locale={locale} />
    </PageShell>
  );
}
