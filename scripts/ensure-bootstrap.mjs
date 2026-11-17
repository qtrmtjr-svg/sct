/**
 * Ensures demo admin + minimal catalog exist without wiping orders/KNET.
 * Safe to run on every Render start.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@example.com").toLowerCase().trim();
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || "Admin12345";
const RESET_PASSWORD = process.env.BOOTSTRAP_ADMIN_RESET === "true";

const MIN_PRODUCTS = [
  { id: "topup-200", kind: "topup", nameAr: "شحن 2 دينار", nameEn: "Recharge 2 KWD", descriptionAr: "رصيد مسبق الدفع", descriptionEn: "Prepaid balance", amountHalalas: 200, validityDays: 10, providerSku: "TOPUP-2", active: true },
  { id: "topup-300", kind: "topup", nameAr: "شحن 3 دينار", nameEn: "Recharge 3 KWD", descriptionAr: "رصيد مسبق الدفع", descriptionEn: "Prepaid balance", amountHalalas: 300, validityDays: 15, providerSku: "TOPUP-3", active: true },
  { id: "topup-500", kind: "topup", nameAr: "شحن 5 دينار", nameEn: "Recharge 5 KWD", descriptionAr: "رصيد مسبق الدفع", descriptionEn: "Prepaid balance", amountHalalas: 500, validityDays: 30, providerSku: "TOPUP-5", active: true },
  { id: "topup-1000", kind: "topup", nameAr: "شحن 10 دينار", nameEn: "Recharge 10 KWD", descriptionAr: "رصيد مسبق الدفع", descriptionEn: "Prepaid balance", amountHalalas: 1000, validityDays: 90, providerSku: "TOPUP-10", active: true },
  { id: "topup-2000", kind: "topup", nameAr: "شحن 20 دينار", nameEn: "Recharge 20 KWD", descriptionAr: "رصيد مسبق الدفع", descriptionEn: "Prepaid balance", amountHalalas: 2000, validityDays: 180, providerSku: "TOPUP-20", active: true },
  { id: "topup-2500", kind: "topup", nameAr: "شحن 25 دينار", nameEn: "Recharge 25 KWD", descriptionAr: "رصيد مسبق الدفع", descriptionEn: "Prepaid balance", amountHalalas: 2500, validityDays: 365, providerSku: "TOPUP-25", active: true },
];

async function ensureAdmin() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (!user) {
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: "Admin",
        role: "admin",
        passwordHash: hash,
        locale: "ar",
        disabled: false,
      },
    });
    console.log(`[bootstrap] Created admin ${ADMIN_EMAIL}`);
    return;
  }

  const updates = {};
  if (user.role !== "admin") updates.role = "admin";
  if (user.disabled) updates.disabled = false;
  if (RESET_PASSWORD) updates.passwordHash = hash;

  if (Object.keys(updates).length > 0) {
    await prisma.user.update({ where: { email: ADMIN_EMAIL }, data: updates });
    console.log(`[bootstrap] Updated admin ${ADMIN_EMAIL}`, Object.keys(updates).join(", "));
  } else {
    console.log(`[bootstrap] Admin OK ${ADMIN_EMAIL}`);
  }
}

async function ensureProducts() {
  const validIds = MIN_PRODUCTS.map((p) => p.id);

  // Remove old/wrong topup products not in the correct list
  await prisma.product.deleteMany({
    where: { kind: "topup", id: { notIn: validIds } },
  });

  for (const row of MIN_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: row.id },
      create: row,
      update: {
        kind: row.kind,
        nameAr: row.nameAr,
        nameEn: row.nameEn,
        amountHalalas: row.amountHalalas,
        validityDays: row.validityDays,
        providerSku: row.providerSku,
        active: true,
      },
    });
  }
}

try {
  await ensureAdmin();
  await ensureProducts();
} finally {
  await prisma.$disconnect();
}
