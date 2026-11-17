/**
 * Local dev only: Next + WebSocket on one port.
 * Production (Render): use `next start` — admin realtime uses SSE `/api/admin/live`.
 */
import { createServer } from "node:http";
import { parse } from "node:url";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME ?? "localhost";
const port = Number(process.env.PORT ?? 3000);

async function main() {
  const next = (await import("next")).default;
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const { WebSocketServer } = await import("ws");
  const { attachAdminWebSocket } = await import("./src/lib/admin-realtime-hub");

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true);
    void handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });
  attachAdminWebSocket(wss);

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url ?? "", true);
    if (pathname === "/api/admin/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
      return;
    }
    socket.destroy();
  });

  server.listen(port, hostname, () => {
    console.log(`> Dev server http://${hostname}:${port}`);
    console.log(`> Admin WebSocket ws://${hostname}:${port}/api/admin/ws`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
