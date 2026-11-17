import { prisma } from "@/lib/db";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(data: { email: string; passwordHash: string; name: string; locale: string }) {
  return prisma.user.create({ data: { ...data, role: "customer" } });
}

export function createAdminUser(data: { email: string; passwordHash: string; name: string; locale: string }) {
  return prisma.user.create({ data: { ...data, role: "admin" } });
}

export function listUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
}

export function findAdminUsers() {
  return prisma.user.findMany({ where: { role: "admin", disabled: false } });
}

export function setUserDisabled(id: string, disabled: boolean) {
  return prisma.user.update({ where: { id }, data: { disabled } });
}

export function listSavedNumbers(userId: string) {
  return prisma.savedNumber.findMany({ where: { userId }, orderBy: { msisdn: "asc" } });
}

export function saveNumber(userId: string, msisdn: string, label: string) {
  return prisma.savedNumber.upsert({
    where: { userId_msisdn: { userId, msisdn } },
    create: { userId, msisdn, label: label || null },
    update: { label: label || null },
  });
}
