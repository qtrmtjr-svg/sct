import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, engine: "supabase-rest" });
  } catch (e) {
    return Response.json({ ok: false, engine: "supabase-rest", error: String(e).slice(0, 200) }, { status: 503 });
  }
}
