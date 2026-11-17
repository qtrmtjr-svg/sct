import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/views/auth/auth-form";
import { LoadingBlock } from "@/views/ui/page-shell";

export default function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="px-4 py-10">
      <AuthForm mode="register" locale={locale} />
    </div>
  );
}
