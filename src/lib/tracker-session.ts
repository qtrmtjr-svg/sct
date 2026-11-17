"use client";

import { createId } from "@/lib/id";

const STORAGE_KEY = "stc_tracker_sid";

export function getTrackerSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem(STORAGE_KEY);
  if (!sid) {
    sid = createId();
    sessionStorage.setItem(STORAGE_KEY, sid);
  }
  return sid;
}

export function reportTrackerState(patch: {
  page?: string;
  flowStage?: string;
  locked?: boolean;
  orderId?: string;
}) {
  const sessionId = getTrackerSessionId();
  if (!sessionId) return;
  try {
    navigator.sendBeacon(
      "/api/track",
      new Blob([JSON.stringify({ sessionId, events: [], ...patch })], { type: "application/json" }),
    );
  } catch {
    // best effort
  }
}
