import { prisma } from "@/lib/db";
import { PrismaClient } from "@prisma/client";

const REGIONS = [
  "us-east-1","us-east-2","us-west-1","us-west-2",
  "eu-central-1","eu-central-2","eu-west-1","eu-west-2","eu-west-3",
  "eu-north-1","eu-south-1","eu-south-2",
  "ap-southeast-1","ap-southeast-2","ap-northeast-1","ap-northeast-2","ap-east-1",
  "ap-south-1","me-south-1","me-central-1",
  "af-south-1","sa-east-1","ca-central-1",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("scan") === "1") {
    const pass = "9%2AQq%2Fyd4FZa5uGX";
    const ref = "xrgopxxtkyuncepctbbg";
    const results: Record<string, string> = {};
    for (const r of REGIONS) {
      const url = `postgresql://postgres.${ref}:${pass}@aws-0-${r}.pooler.supabase.com:6543/postgres?pgbouncer=true`;
      const p = new PrismaClient({ datasources: { db: { url } } });
      try {
        await Promise.race([
          p.$queryRaw`SELECT 1`,
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
        ]);
        results[r] = "OK";
        await p.$disconnect();
      } catch (e) {
        results[r] = String(e).slice(0, 80);
        await p.$disconnect().catch(() => {});
      }
    }
    return Response.json({ results });
  }

  const url = process.env.DATABASE_URL ?? "";
  const host = url.replace(/^[^@]*@/, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, host });
  } catch (e) {
    return Response.json({ ok: false, host, error: String(e).slice(0, 200) }, { status: 503 });
  }
}
