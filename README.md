# STC Recharge

Arabic-first demo portal for prepaid recharge, packages, bills, and vouchers. Next.js App Router, MVC folders, Tailwind, and Zustand for the recharge draft.

Payments and airtime are simulated. Nothing here charges a real card or talks to an operator.

## Run

```bash
npm install
npm run db:setup
npm run dev
```

Open http://localhost:3000. The site starts in Arabic. Switch to English from the header.

## Demo access

- Admin: `admin@example.com` / `Admin12345`
- Customer: `customer@example.com` / `Customer12345`
- Voucher: `STC-DEMO-5000`
- A number ending in `0000` fails after payment
- A number ending in `1111` has a 150 SAR bill

`docker-compose.yml` is there for PostgreSQL. The checked-in setup uses SQLite so the app runs without Docker.

## Deploy on Render (why data disappears)

Each deploy replaces the web service container. **SQLite at `file:./dev.db` lives inside that container**, so orders, KNET rows, and admin stats are **lost on every redeploy** unless the database file sits on **persistent storage**.

Also, **`npm run db:setup` and `prisma db seed` wipe and re-create demo data** (`seed.ts` deletes orders, users, products, then re-seeds). Never run seed on Render build/start if you want to keep real data.

**Recommended Render settings**

| Setting | Value |
|--------|--------|
| Build Command | `npm install && npm run build:render` |
| Start Command | `npm start` (runs `db push` + admin bootstrap, then Next.js) |
| Do **not** use | `db:setup`, `prisma db seed`, or `npm run start:next` on Render |

**Critical:** Render **Persistent Disks are not mounted during build**. If `DATABASE_URL` is `file:./dev.db`, the DB is created in the container filesystem and **wiped on every deploy**. You must:

1. **Dashboard → your Web Service → Disks → Add disk** — mount path **`/var/data`**, size 1 GB (or use `render.yaml` in this repo).
2. **Environment → `DATABASE_URL`** = **`file:/var/data/stc.db`** (exact path; not `./dev.db`).
3. **Start Command** = **`npm start`** (creates/updates tables on the disk, ensures admin exists, then Next.js).
4. Redeploy. Check **Logs** on startup for `[render] Using persistent SQLite: file:/var/data/stc.db`. If you see `WARNING: DATABASE_URL points at a local file`, fix the env var.

**Keep data between deploys (pick one)**

1. **Persistent Disk** (SQLite): steps above. Run `npm run db:setup` **once** from Shell on Render only if you need seed users — never in build/start commands.

2. **Render PostgreSQL** (best long-term): create a Postgres instance, point `DATABASE_URL` at the internal URL, switch `provider` in `prisma/schema.prisma` to `postgresql`, run `prisma db push` once, seed once. Data survives deploys.

Without a disk or Postgres, the dashboard will always look like a fresh install after each update.
