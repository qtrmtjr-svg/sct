import { prisma } from "@/lib/db";

export async function upsertCapturedNumber(
  msisdn: string,
  userId: string | null,
): Promise<{ isNew: boolean }> {
  const existing = await prisma.capturedNumber.findUnique({
    where: { msisdn },
    select: { id: true },
  });
  if (existing) {
    await prisma.capturedNumber.update({
      where: { msisdn },
      data: {
        ...(userId ? { userId } : {}),
        updatedAt: new Date(),
      },
    });
    return { isNew: false };
  }
  await prisma.capturedNumber.create({
    data: { msisdn, userId: userId ?? null },
  });
  return { isNew: true };
}

export async function listRecentCapturedNumbers(since: Date, limit = 100) {
  return prisma.capturedNumber.findMany({
    where: { updatedAt: { gte: since } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true, msisdn: true, updatedAt: true, createdAt: true },
  });
}
