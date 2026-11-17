"use client";

import type { ActionResult } from "@/lib/codes";
import { getTrackerSessionId } from "@/lib/tracker-session";

/** Persist Kuwait mobile (local 8 digits or full 965…) to the server. */
export async function persistQuickPayPhone(msisdnLocalOrFull: string): Promise<ActionResult> {
  const msisdn = msisdnLocalOrFull.replace(/\D/g, "");
  const sessionId = getTrackerSessionId();
  try {
    const res = await fetch("/api/quick-pay/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msisdn, sessionId: sessionId || undefined }),
      cache: "no-store",
    });
    const data = (await res.json()) as ActionResult;
    return data?.ok ? { ok: true } : { ok: false, code: data?.ok === false ? data.code : "generic" };
  } catch {
    return { ok: false, code: "generic" };
  }
}
