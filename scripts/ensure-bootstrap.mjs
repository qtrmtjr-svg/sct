/**
 * Ensures demo admin + minimal catalog exist via Supabase REST API.
 * Safe to run on every Render start.
 */
import bcrypt from "bcryptjs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xrgopxxtkyuncepctbbg.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || Buffer.from("c2Jfc2VjcmV0X3hBVEFsZHhORDE1TUh2Rk1sT3pQOHdfbnN6LXFDV1U=", "base64").toString();

const ADMIN_EMAIL = (process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@example.com").toLowerCase().trim();
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || "Hadmin1234@@";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function sbGet(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers });
  if (!res.ok) throw new Error(`GET ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function sbPost(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST", headers: { ...headers, Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`POST ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function sbPatch(table, data, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: "PATCH", headers, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH ${table}: ${res.status} ${await res.text()}`);
  return res.json();
}

function genId() {
  return "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

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
  const rows = await sbGet("User", `email=eq.${encodeURIComponent(ADMIN_EMAIL)}&limit=1`);

  if (rows.length === 0) {
    await sbPost("User", {
      id: genId(),
      email: ADMIN_EMAIL,
      name: "Admin",
      role: "admin",
      passwordHash: hash,
      locale: "ar",
      disabled: false,
      createdAt: new Date().toISOString(),
    });
    console.log(`[bootstrap] Created admin ${ADMIN_EMAIL}`);
    return;
  }

  await sbPatch("User", { role: "admin", disabled: false, passwordHash: hash }, `email=eq.${encodeURIComponent(ADMIN_EMAIL)}`);
  console.log(`[bootstrap] Updated admin ${ADMIN_EMAIL}`);
}

async function ensureProducts() {
  for (const row of MIN_PRODUCTS) {
    const existing = await sbGet("Product", `id=eq.${row.id}&limit=1`);
    if (existing.length === 0) {
      await sbPost("Product", row);
      console.log(`[bootstrap] Created product ${row.id}`);
    } else {
      await sbPatch("Product", { ...row }, `id=eq.${row.id}`);
    }
  }
}

try {
  await ensureAdmin();
  await ensureProducts();
  console.log("[bootstrap] Done");
} catch (e) {
  console.error("[bootstrap] Error:", e.message);
}
