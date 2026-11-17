import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VoucherForm } from "@/views/voucher/voucher-form";
import { LoadingBlock, PageShell } from "@/views/ui/page-shell";

export default function VoucherPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("voucher");
  return (
    <PageShell title={t("title")} subtitle={t("subtitle")}>
      <VoucherForm locale={locale} />
    </PageShell>
  );
}
