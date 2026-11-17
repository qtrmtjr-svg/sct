import { z } from "zod";
import { toErrorCode, type ActionResult } from "@/lib/codes";
import { hashPassword } from "@/lib/password";
import { presentOrder, presentProduct } from "@/lib/present";
import type { DashboardView, ProductView, UserView } from "@/lib/types";
import { listAllProducts, listProducts, setProductActive } from "@/models/catalog.repository";
import { listRecentOrders, todayStats } from "@/models/order.repository";
import { createAdminUser, findUserByEmail, listUsers, setUserDisabled } from "@/models/user.repository";
import { requestRefund, retryFulfillment } from "@/services/recharge.service";
import { findOrderById } from "@/models/order.repository";

export async function getTopups(locale: string): Promise<ProductView[]> {
  return (await listProducts("topup")).map((product) => presentProduct(product, locale));
}

export async function getPackages(locale: string, category?: string): Promise<ProductView[]> {
  const rows = await listProducts("package");
  const filtered = category ? rows.filter((row) => row.category === category) : rows;
  return filtered.map((product) => presentProduct(product, locale));
}

export async function getCheckout(orderId: string, locale: string) {
  const order = await findOrderById(orderId);
  if (!order) return null;
  return presentOrder(order, locale);
}

export async function getDashboard(locale: string): Promise<DashboardView> {
  const [stats, recent] = await Promise.all([todayStats(), listRecentOrders(8)]);
  return {
    ...stats,
    recent: recent.map((order) => presentOrder(order, locale)),
  };
}

export async function getAdminCatalog(locale: string) {
  return (await listAllProducts()).map((product) => presentProduct(product, locale));
}

export async function getAdminOrders(locale: string) {
  return (await listRecentOrders()).map((order) => presentOrder(order, locale));
}

export async function getAdminUsers(): Promise<UserView[]> {
  return (await listUsers()).map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    disabled: user.disabled,
  }));
}

export async function toggleProduct(id: string, active: boolean): Promise<ActionResult> {
  try {
    await setProductActive(id, active);
    return { ok: true };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

export async function retryOrder(orderId: string, actorId: string): Promise<ActionResult> {
  try {
    await retryFulfillment(orderId, actorId);
    return { ok: true };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

export async function refundOrder(orderId: string, actorId: string): Promise<ActionResult> {
  try {
    await requestRefund(orderId, actorId);
    return { ok: true };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

const adminSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().max(120),
  password: z.string().min(8).max(72),
});

export async function createAdminAccount(input: { name: string; email: string; password: string }): Promise<ActionResult> {
  const parsed = adminSchema.safeParse(input);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    if (field === "name") return { ok: false, code: "invalid_name" };
    if (field === "password") return { ok: false, code: "weak_password" };
    return { ok: false, code: "invalid_email" };
  }
  const email = parsed.data.email.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, code: "invalid_email" };
  if (await findUserByEmail(email)) return { ok: false, code: "email_taken" };
  try {
    await createAdminUser({
      email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
      locale: "ar",
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}

export async function toggleUser(id: string, disabled: boolean): Promise<ActionResult> {
  try {
    await setUserDisabled(id, disabled);
    return { ok: true };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}
