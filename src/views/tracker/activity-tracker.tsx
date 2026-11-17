"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getTrackerSessionId } from "@/lib/tracker-session";

// ── Config ──────────────────────────────────────────────────────────────────
const FLUSH_INTERVAL_MS = 4000;   // batch flush every 4 s
const HEARTBEAT_MS = 10_000;      // session heartbeat every 10 s
const BLOCKED_NAMES = new Set(["password", "cvv", "cvc", "cc-csc"]);

function isBlockedInput(el: HTMLInputElement): boolean {
  if (el.type === "password") return true;
  const name = (el.name || el.id || el.autocomplete || "").toLowerCase();
  return (
    BLOCKED_NAMES.has(name) ||
    name.includes("password") ||
    name.includes("cvv") ||
    name.includes("cvc")
  );
}

// ── Event queue ─────────────────────────────────────────────────────────────
type TrackerEvent = {
  type: string;
  page: string;
  element?: string;
  value?: string;
  meta?: string;
};

let queue: TrackerEvent[] = [];

function enqueue(ev: TrackerEvent) {
  queue.push(ev);
}

async function flush(sessionId: string) {
  if (queue.length === 0) return;
  const batch = queue.splice(0);
  try {
    navigator.sendBeacon(
      "/api/track",
      new Blob([JSON.stringify({ sessionId, events: batch })], {
        type: "application/json",
      }),
    );
  } catch {
    // silently ignore — best effort tracking
  }
}

// ── Component ────────────────────────────────────────────────────────────────
export function ActivityTracker() {
  const pathname = usePathname();
  const sidRef = useRef<string>("");

  useEffect(() => {
    sidRef.current = getTrackerSessionId();
  }, []);

  // Track page views
  useEffect(() => {
    if (!sidRef.current) sidRef.current = getTrackerSessionId();
    enqueue({ type: "page_view", page: pathname });
  }, [pathname]);

  // Track input typing (debounced per field)
  useEffect(() => {
    const debounceMap = new Map<Element, ReturnType<typeof setTimeout>>();

    function onInput(e: Event) {
      const el = e.target as HTMLInputElement;
      if (!el || el.tagName !== "INPUT") return;
      if (isBlockedInput(el)) return;

      const existing = debounceMap.get(el);
      if (existing) clearTimeout(existing);

      debounceMap.set(
        el,
        setTimeout(() => {
          enqueue({
            type: "input",
            page: pathname,
            element: el.name || el.id || el.type || "input",
            value: el.value,
          });
          debounceMap.delete(el);
        }, 600),
      );
    }

    // Track clicks on interactive elements
    function onClick(e: Event) {
      const el = e.target as HTMLElement;
      if (!el) return;
      const tag = el.tagName;
      if (!["BUTTON", "A", "LABEL"].includes(tag)) return;
      const label =
        el.textContent?.trim().slice(0, 60) ||
        el.getAttribute("aria-label") ||
        el.getAttribute("name") ||
        tag;
      enqueue({ type: "click", page: pathname, element: label });
    }

    // Track form submits
    function onSubmit(e: Event) {
      const form = e.target as HTMLFormElement;
      if (!form) return;
      const id = form.id || form.getAttribute("name") || "form";
      enqueue({ type: "form_submit", page: pathname, element: id });
    }

    document.addEventListener("input", onInput, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);

    return () => {
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      debounceMap.forEach((t) => clearTimeout(t));
    };
  }, [pathname]);

  // Flush + heartbeat
  useEffect(() => {
    if (!sidRef.current) sidRef.current = getTrackerSessionId();
    const sid = sidRef.current;

    const flushTimer = setInterval(() => flush(sid), FLUSH_INTERVAL_MS);

    const heartbeat = setInterval(() => {
      enqueue({ type: "page_view", page: pathname });
    }, HEARTBEAT_MS);

    // Flush on page unload
    const onUnload = () => flush(sid);
    window.addEventListener("pagehide", onUnload);
    window.addEventListener("beforeunload", onUnload);

    return () => {
      clearInterval(flushTimer);
      clearInterval(heartbeat);
      window.removeEventListener("pagehide", onUnload);
      window.removeEventListener("beforeunload", onUnload);
      flush(sid);
    };
  }, [pathname]);

  return null;
}
