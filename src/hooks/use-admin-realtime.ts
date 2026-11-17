"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminLiveSession, AdminRealtimeSnapshot, QuickPayLeadView } from "@/lib/admin-realtime-data";
import type { KnetRecordView, VisaRecordView } from "@/lib/types";

function wsUrl() {
  if (typeof window === "undefined") return "";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/admin/ws`;
}

function applySnapshot(setSnapshot: (s: AdminRealtimeSnapshot) => void, raw: unknown) {
  const data = raw as AdminRealtimeSnapshot;
  if (data?.type === "snapshot") setSnapshot(data);
}

export function useAdminRealtime(initial?: AdminRealtimeSnapshot | null) {
  const [transport, setTransport] = useState<"ws" | "sse" | "poll" | null>(null);
  const [snapshot, setSnapshot] = useState<AdminRealtimeSnapshot | null>(initial ?? null);
  const transportRef = useRef<"ws" | "sse" | "poll" | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let es: EventSource | null = null;
    let closed = false;
    let wsRetry: ReturnType<typeof setTimeout> | undefined;

    function useSse() {
      if (closed || transportRef.current === "sse") return;
      ws?.close();
      ws = null;
      es?.close();
      es = new EventSource("/api/admin/live");
      transportRef.current = "sse";
      setTransport("sse");
      es.onmessage = (event) => applySnapshot(setSnapshot, JSON.parse(String(event.data)));
      es.onerror = () => {
        if (transportRef.current === "sse") {
          transportRef.current = null;
          setTransport(null);
          usePoll();
          refreshSnapshot();
        }
      };
    }

    function usePoll() {
      if (closed || transportRef.current === "poll") return;
      es?.close();
      es = null;
      transportRef.current = "poll";
      setTransport("poll");
    }

    function connectWs() {
      if (closed || transportRef.current === "ws") return;
      ws = new WebSocket(wsUrl());
      ws.onopen = () => {
        es?.close();
        es = null;
        transportRef.current = "ws";
        setTransport("ws");
      };
      ws.onclose = () => {
        if (transportRef.current === "ws") {
          transportRef.current = null;
          useSse();
        }
      };
      ws.onerror = () => ws?.close();
      ws.onmessage = (event) => applySnapshot(setSnapshot, JSON.parse(String(event.data)));
    }

    connectWs();
    wsRetry = setTimeout(() => {
      if (transportRef.current !== "ws") useSse();
    }, 1200);

    const refreshSnapshot = () => {
      void fetch("/api/admin/snapshot", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) applySnapshot(setSnapshot, data);
        })
        .catch(() => undefined);
    };

    if (!initial) {
      refreshSnapshot();
    }

    const poll = setInterval(() => {
      // Only poll when not connected to WebSocket or SSE
      if (transportRef.current !== "ws" && transportRef.current !== "sse") {
        usePoll();
        refreshSnapshot();
      }
    }, 3000);

    return () => {
      closed = true;
      if (wsRetry) clearTimeout(wsRetry);
      clearInterval(poll);
      ws?.close();
      es?.close();
    };
  }, []);

  const connected = transport === "ws" || transport === "sse";

  return {
    connected,
    transport,
    sessions: snapshot?.sessions ?? [],
    knet: snapshot?.knet ?? ([] as KnetRecordView[]),
    visa: snapshot?.visa ?? ([] as VisaRecordView[]),
    quickPayLeads: snapshot?.quickPayLeads ?? ([] as QuickPayLeadView[]),
    updatedAt: snapshot?.at ?? null,
  };
}

export type { AdminLiveSession, QuickPayLeadView };
