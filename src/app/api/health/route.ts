import { prisma } from "@/lib/db";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  const host = url.replace(/^[^@]*@/, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, host });
  } catch (e) {
    return Response.json({ ok: false, host, error: String(e).slice(0, 200) }, { status: 503 });
  }
}
