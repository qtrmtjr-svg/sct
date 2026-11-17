/**
 * Render: prepare database and start Next.js.
 * Force-reads .env to override Render dashboard env vars.
 */
import { readFileSync, mkdirSync } from "node:fs";
import { execSync, spawn } from "node:child_process";

// Force-read .env and override process.env (so .env always wins over Render dashboard)
try {
  const envContent = readFileSync(".env", "utf8");
  for (const line of envContent.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?(.*?)"?\s*$/);
    if (m && m[1]) process.env[m[1]] = m[2];
  }
  console.log("[render] Loaded .env overrides");
} catch { /* .env not found, use existing env vars */ }

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./prisma/stc.db";
  console.log("[render] DATABASE_URL not set, using default");
}

const url = process.env.DATABASE_URL;

if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
  console.log("[render] Using PostgreSQL (Supabase)");
} else if (url.startsWith("file:/var/data") || url.includes("/var/data/")) {
  mkdirSync("/var/data", { recursive: true });
  console.log("[render] Using persistent SQLite:", url);
} else {
  console.log("[render] Using SQLite:", url);
}

try {
  execSync("npx prisma db push --skip-generate", { stdio: "inherit", env: process.env });
} catch (e) {
  console.warn("[render] prisma db push failed (tables may already exist):", e.message);
}
try {
  execSync("node scripts/ensure-bootstrap.mjs", { stdio: "inherit", env: process.env });
} catch (e) {
  console.warn("[render] ensure-bootstrap failed:", e.message);
}

// Start Next.js with the correct env (inherits overridden DATABASE_URL)
const child = spawn("npx", ["next", "start"], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
