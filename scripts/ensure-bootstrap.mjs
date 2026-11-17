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
  {
    id: "topup-flex",
    kind: "topup",
    nameAr: "شحن سريع",
    nameEn: "Quick pay top-up",
    descriptionAr: "مبلغ يختاره العميل في الدفع السريع",
    descriptionEn: "Customer-selected quick pay amount",
    amountHalalas: 100,
    providerSku: "QUICK-PAY",
    active: true,
  },
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
  for (const row of MIN_PRODUCTS) {
    await prisma.product.upsert({
      where: { id: row.id },
      create: row,
      update: {
        kind: row.kind,
        nameAr: row.nameAr,
        nameEn: row.nameEn,
        amountHalalas: row.amountHalalas,
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
