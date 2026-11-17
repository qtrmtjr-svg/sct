/**
 * Render: prepare SQLite database before `next start`.
 */
import { mkdirSync } from "node:fs";
import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./prisma/stc.db";
  console.log("[render] DATABASE_URL not set, using default:", process.env.DATABASE_URL);
}

const url = process.env.DATABASE_URL;

if (url.startsWith("file:/var/data") || url.includes("/var/data/")) {
  mkdirSync("/var/data", { recursive: true });
  console.log("[render] Using persistent SQLite:", url);
} else {
  console.log("[render] Using SQLite:", url);
}

const env = { ...process.env, DATABASE_URL: url };
execSync("npx prisma db push --skip-generate", { stdio: "inherit", env });
execSync("node scripts/ensure-bootstrap.mjs", { stdio: "inherit", env });
