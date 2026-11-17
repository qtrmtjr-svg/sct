import type { IncomingMessage } from "node:http";
import type { WebSocket, WebSocketServer } from "ws";
import { buildAdminRealtimeSnapshot } from "@/lib/admin-realtime-data";
import { readCookieHeader } from "@/lib/cookie-header";
import { ADMIN_COOKIE, readAdminToken } from "@/lib/token";

const clients = new Set<WebSocket>();
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let pollTimer: ReturnType<typeof setInterval> | undefined;

async function sendSnapshot(ws: WebSocket) {
  if (ws.readyState !== ws.OPEN) return;
  const payload = await buildAdminRealtimeSnapshot();
  ws.send(JSON.stringify(payload));
}

export async function broadcastAdminRealtime() {
  if (clients.size === 0) return;
  const payload = await buildAdminRealtimeSnapshot();
  const body = JSON.stringify(payload);
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) ws.send(body);
  }
}

export function scheduleAdminRealtimeBroadcast() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void broadcastAdminRealtime();
  }, 120);
}

export function attachAdminWebSocket(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const token = readCookieHeader(req.headers.cookie, ADMIN_COOKIE);
    if (!readAdminToken(token)) {
      ws.close(4401, "Unauthorized");
      return;
    }
    clients.add(ws);
    void sendSnapshot(ws);
    ws.on("close", () => clients.delete(ws));
  });

  if (!pollTimer) {
    pollTimer = setInterval(() => {
      void broadcastAdminRealtime();
    }, 3000);
  }
}
