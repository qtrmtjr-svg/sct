"use client";

import { useEffect, useRef } from "react";
import { playVisitorChime } from "@/lib/visitor-chime";
import { useAdminRealtime } from "@/hooks/use-admin-realtime";

/**
 * Plays a chime when a new online visitor session appears (after the first snapshot).
 * Optionally POSTs to /api/admin/notify-visitor so the server can email the admin.
 */
export function useNewVisitorAlert() {
  const { sessions } = useAdminRealtime();
  const readyRef = useRef(false);
  const knownOnlineRef = useRef<Set<string>>(new Set());
  const emailedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onlineIds = sessions.filter((s) => s.online).map((s) => s.id);

    if (!readyRef.current) {
      onlineIds.forEach((id) => knownOnlineRef.current.add(id));
      if (sessions.length > 0) readyRef.current = true;
      return;
    }

    for (const id of onlineIds) {
      if (knownOnlineRef.current.has(id)) continue;
      knownOnlineRef.current.add(id);
      playVisitorChime();

      if (emailedRef.current.has(id)) continue;
      emailedRef.current.add(id);
      const session = sessions.find((s) => s.id === id);
      void fetch("/api/admin/notify-visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          page: session?.page ?? "",
          msisdn: session?.msisdn ?? null,
          orderId: session?.orderId ?? null,
        }),
      }).catch(() => undefined);
    }

    for (const id of [...knownOnlineRef.current]) {
      if (!onlineIds.includes(id)) knownOnlineRef.current.delete(id);
    }
  }, [sessions]);
}
