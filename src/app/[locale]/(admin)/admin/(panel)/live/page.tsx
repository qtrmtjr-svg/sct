import { ensureAdmin } from "@/lib/auth";
import { LiveDashboard } from "@/views/admin/live-dashboard";

export default async function LivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await ensureAdmin(locale);
  return <LiveDashboard />;
}
