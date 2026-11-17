import { prisma } from "@/lib/db";

export function createNotification(data: { orderId: string; channel: string; body: string }) {
  return prisma.notification.create({ data });
}

export function createAudit(data: { actorId: string; action: string; orderId?: string }) {
  return prisma.auditLog.create({ data });
}

export function createTicket(data: { name: string; email: string; message: string }) {
  return prisma.ticket.create({ data });
}
