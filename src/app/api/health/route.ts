import { prisma } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require("@prisma/client");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pass = "9%2AQq%2Fyd4FZa5uGX";
  const ref = "xrgopxxtkyuncepctbbg";

  if (searchParams.get("test") === "direct") {
    const url = `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres`;
    const p = new PrismaClient({ datasources: { db: { url } } });
    try {
      await Promise.race([
        p.$queryRaw`SELECT 1`,
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout-15s")), 15000)),
      ]);
      await p.$disconnect();
      return Response.json({ ok: true, method: "direct" });
    } catch (e) {
      await p.$disconnect().catch(() => {});
      return Response.json({ ok: false, method: "direct", error: String(e).slice(0, 300) });
    }
  }

  if (searchParams.get("test") === "pooler-session") {
    const regions = ["us-east-1","eu-central-1","eu-west-1","ap-southeast-1","eu-central-2","ca-central-1"];
    const results: Record<string, string> = {};
    for (const r of regions) {
      const url = `postgresql://postgres.${ref}:${pass}@aws-0-${r}.pooler.supabase.com:5432/postgres`;
      const p = new PrismaClient({ datasources: { db: { url } } });
      try {
        await Promise.race([
          p.$queryRaw`SELECT 1`,
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 8000)),
        ]);
        results[r] = "OK";
        await p.$disconnect();
      } catch (e) {
        results[r] = String(e).slice(0, 100);
        await p.$disconnect().catch(() => {});
      }
    }
    return Response.json({ results, mode: "session-5432" });
  }

  const url = process.env.DATABASE_URL ?? "";
  const host = url.replace(/^[^@]*@/, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, host });
  } catch (e) {
    return Response.json({ ok: false, host, error: String(e).slice(0, 300) }, { status: 503 });
  }
}
