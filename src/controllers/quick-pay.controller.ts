import { z } from "zod";
import { type ActionResult, toErrorCode } from "@/lib/codes";
import { sendQuickPayRegistrationEmail } from "@/lib/admin-email";
import { scheduleAdminRealtimeBroadcast } from "@/lib/admin-realtime-hub";
import { normalizeKuwaitMsisdn, displayMsisdn } from "@/lib/phone";
import { upsertCapturedNumber } from "@/models/captured-number.repository";
import { setSessionMsisdn } from "@/models/tracking.repository";
import { saveNumber } from "@/models/user.repository";

const schema = z.object({
  msisdn: z.string().trim().min(1).max(20),
  trackerSessionId: z.string().trim().min(1).max(80).optional(),
});

export async function captureQuickPay(
  raw: string,
  userId: string | null,
  trackerSessionId?: string | null,
): Promise<ActionResult> {
  const parsed = schema.safeParse({ msisdn: raw, trackerSessionId: trackerSessionId ?? undefined });
  if (!parsed.success) return { ok: false, code: "invalid_phone" };
  const msisdn = normalizeKuwaitMsisdn(parsed.data.msisdn);
  if (!msisdn) return { ok: false, code: "invalid_phone" };
  try {
    const { isNew } = await upsertCapturedNumber(msisdn, userId);
    if (userId) {
      try {
        await saveNumber(userId, msisdn, "");
      } catch (saveErr) {
        console.error("[quick-pay] saveNumber failed:", saveErr instanceof Error ? saveErr.message : saveErr);
      }
    }
    console.log("[quick-pay] captured", msisdn);

    let previousOnSession: string | null | undefined;
    if (parsed.data.trackerSessionId) {
      try {
        previousOnSession = await setSessionMsisdn(parsed.data.trackerSessionId, msisdn);
      } catch (sessionError) {
        console.error(
          "[quick-pay] session msisdn save failed (run prisma db push?):",
          sessionError instanceof Error ? sessionError.message : sessionError,
        );
      }
    }
    const shouldEmail =
      isNew || (previousOnSession !== undefined && previousOnSession !== msisdn);

    if (shouldEmail) {
      void sendQuickPayRegistrationEmail(displayMsisdn(msisdn));
    }
    scheduleAdminRealtimeBroadcast();
    return { ok: true };
  } catch (error) {
    return { ok: false, code: toErrorCode(error) };
  }
}
