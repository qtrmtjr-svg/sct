import { type NextRequest } from "next/server";
import { buildAdminRealtimeSnapshot } from "@/lib/admin-realtime-data";
import { ADMIN_COOKIE, readAdminToken } from "@/lib/token";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = readAdminToken(req.cookies.get(ADMIN_COOKIE)?.value);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      async function push() {
        try {
          const snapshot = await buildAdminRealtimeSnapshot();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`));
        } catch (error) {
          console.error("[admin/live] snapshot push failed:", error);
        }
      }

      await push();
      const interval = setInterval(push, 2500);
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
