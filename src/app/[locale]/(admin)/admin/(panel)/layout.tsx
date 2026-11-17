import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { AdminPanelAlerts } from "@/views/admin/admin-panel-alerts";
import { AdminNav } from "@/views/admin/admin-nav";

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <Suspense fallback={<div className="h-40" />}>
      <Guard params={params}>{children}</Guard>
    </Suspense>
  );
}

async function Guard({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Only the dedicated dashboard session (minted by /admin/login) is accepted.
  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);
  return (
    <div className="min-h-dvh px-3 py-4 sm:px-5 md:px-6">
      <AdminNav admin={{ name: session.name, email: session.email }} locale={locale} />
      <AdminPanelAlerts>
        <main className="min-w-0 w-full">{children}</main>
      </AdminPanelAlerts>
    </div>
  );
}
