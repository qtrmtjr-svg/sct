import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { BillForm } from "@/views/bills/bill-form";

export default function BillsPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="shimmer h-8 w-32 rounded-lg" /></div>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <BillForm locale={locale} />;
}
