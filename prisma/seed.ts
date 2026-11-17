import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";
import { hashVoucher } from "../src/lib/voucher";

const prisma = new PrismaClient();

const products = [
  { id: "topup-200", kind: "topup", category: null, nameAr: "شحن 2 دينار", nameEn: "Recharge 2 KWD", descriptionAr: "رصيد مسبق الدفع", descriptionEn: "Prepaid balance", amountHalalas: 200, validityDays: 10, providerSku: "TOPUP-2" },
  { id: "topup-300", kind: "topup", category: null, nameAr: "شحن 3 دينار", nameEn: "Recharge 3 KWD", descriptionAr: "رصيد مسبق الدفع", descriptionEn: "Prepaid balance", amountHalalas: 300, validityDays: 15, providerSku: "TOPUP-3" },
  { id: "topup-500", kind: "topup", category: null, nameAr: "شحن 5 دينار", nameEn: "Recharge 5 KWD", descriptionAr: "رصيد مسبق الدفع", descriptionEn: "Prepaid balance", amountHalalas: 500, validityDays: 30, providerSku: "TOPUP-5" },
  { id: "topup-1000", kind: "topup", category: null, nameAr: "شحن 10 دينار", nameEn: "Recharge 10 KWD", descriptionAr: "رصيد مسبق الدفع", descriptionEn: "Prepaid balance", amountHalalas: 1000, validityDays: 90, providerSku: "TOPUP-10" },
  { id: "topup-2000", kind: "topup", category: null, nameAr: "شحن 20 دينار", nameEn: "Recharge 20 KWD", descriptionAr: "رصيد مسبق الدفع", descriptionEn: "Prepaid balance", amountHalalas: 2000, validityDays: 180, providerSku: "TOPUP-20" },
  { id: "topup-2500", kind: "topup", category: null, nameAr: "شحن 25 دينار", nameEn: "Recharge 25 KWD", descriptionAr: "رصيد مسبق الدفع", descriptionEn: "Prepaid balance", amountHalalas: 2500, validityDays: 365, providerSku: "TOPUP-25" },
  { id: "pkg-data", kind: "package", category: "data", nameAr: "بيانات 10 جيجا", nameEn: "10 GB data", descriptionAr: "باقة بيانات لمدة 30 يومًا", descriptionEn: "Data bundle for 30 days", amountHalalas: 7900, validityDays: 30, providerSku: "DATA-10" },
  { id: "pkg-social", kind: "package", category: "social", nameAr: "تواصل اجتماعي", nameEn: "Social pass", descriptionAr: "تطبيقات التواصل لمدة 7 أيام", descriptionEn: "Social apps for 7 days", amountHalalas: 3000, validityDays: 7, providerSku: "SOCIAL-7" },
  { id: "pkg-voice", kind: "package", category: "voice", nameAr: "500 دقيقة", nameEn: "500 minutes", descriptionAr: "دقائق محلية لمدة 30 يومًا", descriptionEn: "Local minutes for 30 days", amountHalalas: 4500, validityDays: 30, providerSku: "VOICE-500" },
  { id: "pkg-roam", kind: "package", category: "roaming", nameAr: "تجوال الخليج", nameEn: "GCC roaming", descriptionAr: "1 جيجا تجوال لمدة 7 أيام", descriptionEn: "1 GB roaming for 7 days", amountHalalas: 9900, validityDays: 7, providerSku: "ROAM-GCC" },
  { id: "bill-postpaid", kind: "bill", category: null, nameAr: "فاتورة مفوتر", nameEn: "Postpaid bill", descriptionAr: "سداد فاتورة", descriptionEn: "Bill payment", amountHalalas: 0, validityDays: null, providerSku: "BILL" },
  { id: "voucher-50", kind: "voucher", category: null, nameAr: "قسيمة 50 دينار", nameEn: "Voucher 50 KWD", descriptionAr: "رصيد من قسيمة", descriptionEn: "Balance from a voucher", amountHalalas: 5000, validityDays: null, providerSku: "VOUCHER-50" },
];

async function main() {
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.fulfillment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.order.deleteMany();
  await prisma.savedNumber.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      {
        email: "admin@example.com",
        name: "Admin",
        role: "admin",
        passwordHash: await hashPassword("Hadmin1234@@"),
        locale: "ar",
      },
      {
        email: "customer@example.com",
        name: "Customer",
        role: "customer",
        passwordHash: await hashPassword("Customer12345"),
        locale: "ar",
      },
    ],
  });

  await prisma.product.createMany({ data: products });
  await prisma.voucher.create({
    data: {
      codeHash: hashVoucher("STC-DEMO-5000"),
      productId: "voucher-50",
      status: "unused",
    },
  });
}

main()
  .then(() => {
    console.log("Seeded demo users, catalog, and voucher STC-DEMO-5000");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
