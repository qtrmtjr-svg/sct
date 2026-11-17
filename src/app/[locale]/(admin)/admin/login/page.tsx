import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getAdminSession } from "@/lib/auth";
import { AdminLoginForm } from "@/views/admin/admin-login-form";
import { LoadingBlock } from "@/views/ui/page-shell";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getAdminSession()) redirect(`/${locale}/admin/approvals`);
  return <AdminLoginForm locale={locale} />;
}
