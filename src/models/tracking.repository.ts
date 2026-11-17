import { prisma } from "@/lib/db";

/** Create or refresh a session. Returns the session id. */
export async function upsertSession(opts: {
  sessionId: string;
  userId?: string | null;
  ip: string;
  userAgent: string;
  page: string;
  flowStage?: string;
  locked?: boolean;
  orderId?: string | null;
}) {
  const { sessionId, userId, ip, userAgent, page, flowStage, locked, orderId } = opts;
  await prisma.userSession.upsert({
    where: { id: sessionId },
    create: {
      id: sessionId,
      userId: userId ?? null,
      ip,
      userAgent,
      page,
      flowStage: flowStage ?? "browse",
      locked: locked ?? false,
      orderId: orderId ?? null,
    },
    update: {
      lastSeen: new Date(),
      page,
      userId: userId ?? undefined,
      ...(flowStage !== undefined ? { flowStage } : {}),
      ...(locked !== undefined ? { locked } : {}),
      ...(orderId !== undefined ? { orderId } : {}),
    },
  });
  return sessionId;
}

export async function setSessionMsisdn(sessionId: string | null | undefined, msisdn: string) {
  if (!sessionId?.trim() || !msisdn.trim()) return null;
  const id = sessionId.trim();
  const existing = await prisma.userSession.findUnique({
    where: { id },
    select: { msisdn: true },
  });
  await prisma.userSession.upsert({
    where: { id },
    create: {
      id,
      msisdn,
      page: "/",
      flowStage: "quick_pay",
    },
    update: { msisdn, lastSeen: new Date(), flowStage: "quick_pay" },
  });
  return existing?.msisdn ?? null;
}

export async function lockVisitorSession(
  sessionId: string | null | undefined,
  data: { orderId: string; flowStage: "knet" | "visa" | "awaiting_admin"; page?: string },
) {
  if (!sessionId?.trim()) return;
  await prisma.userSession.updateMany({
    where: { id: sessionId.trim() },
    data: {
      locked: true,
      orderId: data.orderId,
      flowStage: data.flowStage,
      ...(data.page ? { page: data.page } : {}),
      lastSeen: new Date(),
    },
  });
}

const ONLINE_MS = 45_000;
const SESSION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // Preserve tracking history for 30 days
let lastPrunedAt = 0;
const PRUNE_INTERVAL_MS = 60 * 60 * 1000; // Run at most once per hour

/**
 * Retains tracking history and cumulative events.
 * Only cleans up sessions older than the retention window (30 days) on a throttled schedule.
 */
export async function pruneOfflineBrowseSessions() {
  const now = Date.now();
  if (now - lastPrunedAt < PRUNE_INTERVAL_MS) return;
  lastPrunedAt = now;

  try {
    const expireBefore = new Date(now - SESSION_RETENTION_MS);
    await prisma.userSession.deleteMany({
      where: {
        locked: false,
        lastSeen: { lt: expireBefore },
      },
    });
  } catch (error) {
    console.error("[tracking] pruneOfflineBrowseSessions failed:", error);
  }
}

/** Record an activity event. */
export async function recordEvent(opts: {
  sessionId: string;
  userId?: string | null;
  type: string;
  page: string;
  element?: string | null;
  value?: string | null;
  meta?: string | null;
}) {
  return prisma.activityEvent.create({ data: { ...opts, userId: opts.userId ?? null } });
}

/** Sessions active in the last N seconds. */
export async function getActiveSessions(withinSeconds = 30) {
  const since = new Date(Date.now() - withinSeconds * 1000);
  return prisma.userSession.findMany({
    where: { lastSeen: { gte: since } },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      _count: { select: { events: true } },
    },
    orderBy: { lastSeen: "desc" },
  });
}

/** Last N events across all sessions. */
export async function getRecentEvents(limit = 50) {
  return prisma.activityEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      session: { select: { id: true, userAgent: true, ip: true } },
    },
  });
}

/** All sessions for a specific user. */
export async function getUserSessions(userId: string) {
  return prisma.userSession.findMany({
    where: { userId },
    orderBy: { lastSeen: "desc" },
    include: { _count: { select: { events: true } } },
  });
}

/** Full activity timeline for a user. */
export async function getUserActivity(userId: string, limit = 200) {
  return prisma.activityEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      page: true,
      element: true,
      value: true,
      createdAt: true,
      sessionId: true,
    },
  });
}

/** Full timeline for a session. */
export async function getSessionActivity(sessionId: string) {
  return prisma.activityEvent.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
}

const PRESENCE_WINDOW_MS = 45_000;
const AWAY_WINDOW_MS = 12 * 60 * 60 * 1000;

/** Live dashboard rows: online visitors + locked sessions (started KNET/card). */
export async function getPresenceSessions() {
  await pruneOfflineBrowseSessions();
  const onlineSince = new Date(Date.now() - ONLINE_MS);
  const lockedSince = new Date(Date.now() - AWAY_WINDOW_MS);
  return prisma.userSession.findMany({
    where: {
      OR: [
        { lastSeen: { gte: onlineSince } },
        { locked: true, lastSeen: { gte: lockedSince } },
      ],
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { lastSeen: "desc" },
    take: 100,
  });
}

export async function getPresenceCounts() {
  const onlineSince = new Date(Date.now() - PRESENCE_WINDOW_MS);
  const awaySince = new Date(Date.now() - AWAY_WINDOW_MS);
  const [online, away] = await Promise.all([
    prisma.userSession.count({ where: { lastSeen: { gte: onlineSince } } }),
    prisma.userSession.count({ where: { lastSeen: { lt: onlineSince, gte: awaySince } } }),
  ]);
  return { online, away };
}

/** Aggregate stats: online now, top pages today. */
export async function getTrackingStats() {
  const thirtySecondsAgo = new Date(Date.now() - 30_000);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [onlineNow, topPages] = await Promise.all([
    prisma.userSession.count({ where: { lastSeen: { gte: thirtySecondsAgo } } }),
    prisma.activityEvent.groupBy({
      by: ["page"],
      where: { type: "page_view", createdAt: { gte: startOfDay } },
      _count: { page: true },
      orderBy: { _count: { page: "desc" } },
      take: 5,
    }),
  ]);

  return { onlineNow, topPages };
}
