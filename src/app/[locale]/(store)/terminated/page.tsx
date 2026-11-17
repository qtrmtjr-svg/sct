import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { TerminatedForm } from "@/views/terminated/terminated-form";

export default function TerminatedPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="shimmer h-8 w-32 rounded-lg" /></div>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TerminatedForm locale={locale} />;
}
