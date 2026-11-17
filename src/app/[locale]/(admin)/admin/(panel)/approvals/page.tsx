import { setRequestLocale } from "next-intl/server";
import { buildAdminRealtimeSnapshot } from "@/lib/admin-realtime-data";
import { ApprovalsRealtimeView } from "@/views/admin/approvals-realtime-view";

export default async function AdminApprovalsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  let initialSnapshot;
  try {
    initialSnapshot = await buildAdminRealtimeSnapshot();
  } catch (error) {
    console.error("[admin/approvals] snapshot failed:", error);
    initialSnapshot = {
      type: "snapshot" as const,
      at: new Date().toISOString(),
      sessions: [],
      knet: [],
      visa: [],
      quickPayLeads: [],
    };
  }
  return <ApprovalsRealtimeView initialSnapshot={initialSnapshot} />;
}
