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
  const session = await getAdminSession();
  if (!session) redirect(`/${locale}/admin/login`);
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#f4f6f9",
        fontFamily: "'Tajawal', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "24px 16px 80px",
        }}
      >
        <AdminNav admin={{ name: session.name, email: session.email }} locale={locale} />
        <AdminPanelAlerts>
          <main className="min-w-0 w-full">{children}</main>
        </AdminPanelAlerts>
      </div>
    </div>
  );
}
