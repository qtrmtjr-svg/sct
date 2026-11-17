# STC Recharge Website — Implementation Plan

MVC-style Next.js app for a telecom customer portal: quick recharge, packages, bill pay, vouchers, and order history.

This is a product you own. It follows the same customer journeys as stc (Sawa recharge, data packs, postpaid bills). It does not copy stc branding, trademarks, or private APIs. Payments go through a licensed Saudi gateway. Airtime is fulfilled through a licensed aggregator or a mocked provider until a real contract exists.

## 1. Goal

A bilingual (Arabic RTL + English) website where a customer can:

1. Recharge a Saudi mobile number (prepaid).
2. Buy a data, voice, social, or roaming package.
3. Pay a postpaid bill.
4. Redeem a voucher.
5. See receipts and recharge history.
6. Manage the catalog and orders from an admin area.

## 2. Why MVC on Next.js

Next.js does not ship classic MVC. We keep the App Router thin and put each concern in its own layer so the recharge rules stay testable.

| MVC piece | Folder | Responsibility |
| --- | --- | --- |
| Model | `src/models` | Entities, Prisma access, repository interfaces |
| View | `src/views` | Presentational React components. Tailwind only. No database calls |
| Controller | `src/controllers` | Validate input, call services, return a result the route can render |
| Service | `src/services` | Recharge, payment, catalog, notifications |
| State | `src/state` | Client UI state only (Zustand). Never the source of truth for money |
| Route | `src/app` | URL, layout, auth gate. Calls one controller, renders one view |

Rule: a route file does not talk to Prisma. A view does not talk to a payment gateway. A Zustand store does not talk to either.

```
Browser
  -> app/(store)/recharge/page.tsx
    -> controllers/recharge.controller.ts
      -> services/recharge.service.ts
        -> models/order.repository.ts
        -> services/payment.gateway.ts
        -> services/providers/airtime.provider.ts
```

## 3. Stack

| Concern | Choice |
| --- | --- |
| App | Next.js (App Router) + TypeScript |
| Styles | Tailwind CSS only. Design tokens in `globals.css`. No CSS modules |
| Client state | Zustand for UI drafts. Server Components for orders, catalog, and user |
| Form state | `useActionState` + `useFormStatus` on Server Actions |
| i18n | `next-intl` — `ar` default, `en` secondary |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod, shared by forms and controllers |
| Auth | Auth.js — email/password for customers, role flag for admins |
| Payments | Moyasar or HyperPay hosted checkout (Mada, Visa, Mastercard, Apple Pay) |
| Cache / locks | Redis — idempotency and rate limits |
| Jobs | Background worker for provider retries and receipt email |
| Tests | Vitest for services; Playwright for recharge happy path |

No card numbers are stored. The gateway hosts the card form and sends a signed webhook.

## 4. State management

Money and identity stay on the server. The client store only remembers what the user is doing on screen.

| Kind | Where it lives | Examples |
| --- | --- | --- |
| Server state | PostgreSQL, read in Server Components through controllers | Products, orders, payments, user, saved numbers |
| URL state | Path and search params | Locale (`/ar`, `/en`), package filter, admin status filter, page |
| Client state | Zustand in `src/state` | Recharge draft, open menus, toasts, checkout spinner |
| Form state | `useActionState` | Field errors and pending flag for recharge, bill, voucher, login |

Rules:

- Order status is authoritative only in the database. Checkout replaces whatever the screen shows when the server responds.
- Stores are `"use client"` modules. Controllers, services, and repositories never import them.
- One store per concern. There is no single global store.
- A refresh must not lose a half-filled recharge. The draft is written to `sessionStorage`.
- Submitting a payment amount does not read the amount from the store. The server loads the order and charges that amount.

### Stores

| Store | Fields | Persistence |
| --- | --- | --- |
| `useRechargeDraft` | `msisdn`, `productId`, `amountHalalas`, `kind` | `sessionStorage` |
| `useUiStore` | mobile nav open, locale mirror, toast queue | memory |
| `useCheckoutStore` | `waiting` spinner, last refresh time | memory |

`useCheckoutStore` does not keep a copy of `Order.status`. The checkout view receives status as a prop from the server.

Shared draft: the home quick-recharge box and `/recharge` both read and write `useRechargeDraft`, so moving between those pages keeps the number and the selected amount.

### How a recharge submit uses state

1. The view reads the draft from Zustand and renders the Tailwind form.
2. Submit calls the Server Action. `useFormStatus` disables the button while it runs.
3. The controller validates with Zod and creates the order. It returns field errors or `{ orderId, checkoutUrl }`.
4. On success the action clears the draft and redirects to `/checkout/[orderId]`.
5. The checkout page loads the order on the server. A small client island sets `waiting` and calls `router.refresh()` until status leaves `awaiting_payment`.

Polling is a UI detail. It does not decide that the payment succeeded. The webhook does.

### Folder

```
src/state/
  recharge-draft.store.ts
  ui.store.ts
  checkout.store.ts
```

Later, only if a widget must poll without navigation: add TanStack Query around the order-status endpoint. v1 does not add it.

## 5. Styles (Tailwind)

Tailwind is the only styling system. Components do not use CSS modules, styled-components, or a separate UI kit.

### Setup

- Tailwind v4, imported once in `src/app/globals.css` with `@import "tailwindcss"`.
- Design tokens live in that file under `@theme`, not as scattered hex values in components.
- `dir="rtl"` or `dir="ltr"` is set on `<html>` from the locale. Components use logical utilities (`ps-`, `pe-`, `ms-`, `me-`, `text-start`, `rounded-s-`) so Arabic flips without a second stylesheet.
- `cn()` in `src/lib/cn.ts` (`clsx` + `tailwind-merge`) merges variant classes.
- Fonts: IBM Plex Sans Arabic for Arabic, a matching Latin face for English, loaded in the root layout.

### Tokens

| Token | Use |
| --- | --- |
| `primary`, `primary-foreground` | Main actions: recharge, pay |
| `surface`, `muted`, `border` | Page background, cards, dividers |
| `success` | `completed`, paid |
| `warning` | `awaiting_payment`, `fulfilling` |
| `danger` | `payment_failed`, `fulfillment_failed` |

Status pills go through one helper, `statusClass(status)`, so every screen colors an order the same way.

### UI primitives

All in `src/views/ui`, built only from Tailwind classes:

- `Button` — primary, secondary, ghost; disabled and pending styles
- `Input`, `PhoneField` — error border from action state
- `Card` — package and order summary
- `Badge` — order status
- `AmountPicker` — 20, 30, 50, 100, 200 SAR choices
- `Toast` — reads `useUiStore`

### Layout

Mobile first. The recharge form is one column. From `lg`, the summary sits beside the form. Admin tables scroll horizontally under `md` and use a real table from `md` up. Focus rings use `focus-visible:ring-2 focus-visible:ring-primary`. Spacing uses the default Tailwind scale only (`4`, `6`, `8`), not arbitrary values, unless a third-party embed forces it.

Dark mode is out of v1. Tokens are the place to add `dark:` later.

## 6. Product areas

### Customer

- Home: quick recharge box (number + amount) and featured packages.
- Recharge: operator detect is optional; v1 assumes Saudi mobile (`05xxxxxxxx` / `+9665xxxxxxxx`).
- Packages: filter by data, voice, social, roaming. Price in SAR.
- Bills: account or mobile number + amount due (mocked inquiry in v1).
- Voucher: 14–16 digit PIN, single redemption.
- Checkout: order summary, hosted payment, return URL.
- Account: profile, saved numbers, order history, receipt.
- Support: static FAQ and a contact form that stores a ticket.

### Admin

- Dashboard: today’s successful recharges, failed orders, revenue.
- Catalog: amounts (20, 30, 50, 100, 200 SAR) and packages.
- Orders: status, provider reference, manual retry, refund request.
- Users: disable account, view history.
- Providers: switch airtime adapter between `mock` and `live`.

## 7. Folder layout

```
src/
  app/
    [locale]/
      (store)/
        page.tsx
        recharge/page.tsx
        packages/page.tsx
        bills/page.tsx
        voucher/page.tsx
        checkout/[orderId]/page.tsx
        account/orders/page.tsx
      (auth)/
        login/page.tsx
        register/page.tsx
      (admin)/
        admin/page.tsx
        admin/orders/page.tsx
        admin/catalog/page.tsx
    api/
      payments/webhook/route.ts
      health/route.ts
  controllers/
    recharge.controller.ts
    package.controller.ts
    bill.controller.ts
    voucher.controller.ts
    payment.controller.ts
    account.controller.ts
    admin.controller.ts
  models/
    entities.ts
    order.repository.ts
    catalog.repository.ts
    user.repository.ts
    payment.repository.ts
  services/
    recharge.service.ts
    payment.service.ts
    catalog.service.ts
    notification.service.ts
    providers/
      airtime.provider.ts
      mock.airtime.provider.ts
      live.airtime.provider.ts
    gateways/
      payment.gateway.ts
      moyasar.gateway.ts
  views/
    home/
    recharge/
    packages/
    checkout/
    account/
    admin/
    ui/                      # Tailwind primitives: Button, Input, Card, Badge
  state/
    recharge-draft.store.ts
    ui.store.ts
    checkout.store.ts
  lib/
    auth.ts
    db.ts
    cn.ts
    money.ts
    phone.ts
    idempotency.ts
    status-class.ts
prisma/
  schema.prisma
messages/
  ar.json
  en.json
```

## 8. Domain model

Money is stored as integer halalas (`1 SAR = 100`). Display converts at the view edge.

```
User
  id, email, passwordHash, name, role (customer | admin), locale

SavedNumber
  id, userId, msisdn, label

Product
  id, kind (topup | package | bill | voucher)
  nameAr, nameEn, amountHalalas, validityDays
  providerSku, active

Order
  id, userId nullable, productId
  msisdn, amountHalalas, status
  idempotencyKey unique
  createdAt

Payment
  id, orderId, gateway, gatewayRef
  status (pending | paid | failed | refunded)
  rawEvent jsonb   // webhook payload, no PAN

Fulfillment
  id, orderId, provider, providerRef
  status (queued | success | failed)
  attempts, lastError

Voucher
  id, codeHash, productId, status (unused | redeemed)
  redeemedOrderId
```

### Order status

`draft` → `awaiting_payment` → `paid` → `fulfilling` → `completed`

Side paths: `payment_failed`, `fulfillment_failed`, `refund_pending`, `refunded`.

A paid order that fails at the provider is never left silent. The worker retries, then an admin can refund.

## 9. Main flow — quick recharge

1. Customer enters `05xxxxxxxx` and picks an amount.
2. Controller validates the number and amount with Zod.
3. Service creates an `Order` in `awaiting_payment` with a new idempotency key.
4. Payment service opens a hosted checkout session for that order id and amount.
5. Customer pays on the gateway page and returns to `/checkout/[orderId]`.
6. Webhook `payment.paid` (signature checked) is the source of truth, not the return URL.
7. Payment controller marks the order `paid` and enqueues fulfillment. Duplicate webhooks no-op because of the idempotency key.
8. Airtime provider tops up the MSISDN. Success → `completed` + SMS/email receipt. Failure → `fulfillment_failed` + retry.

Guest checkout is allowed in v1. Login is required for history and saved numbers.

## 10. MVC example (recharge)

Controller (shape only):

```ts
// controllers/recharge.controller.ts
export async function createRecharge(input: unknown) {
  const data = rechargeSchema.parse(input);          // validate
  const order = await rechargeService.start(data);   // business rule
  const checkout = await paymentService.session(order);
  return { orderId: order.id, checkoutUrl: checkout.url };
}
```

Route stays thin:

```tsx
// app/[locale]/(store)/recharge/actions.ts
"use server";
export async function rechargeAction(formData: FormData) {
  return createRecharge(Object.fromEntries(formData));
}
```

View receives props and renders the form with Tailwind primitives. It does not import Prisma or the gateway. It reads `useRechargeDraft` for the in-progress number and amount, and `useActionState` for server errors.

## 11. Integrations

### Payments

- Create a payment for an exact order amount. The client never sends the amount the server should charge without a server-side lookup.
- Verify webhook HMAC before changing status.
- Store gateway reference only.

### Airtime provider

Interface:

```ts
interface AirtimeProvider {
  topup(input: { msisdn: string; sku: string; orderId: string }): Promise<{ ref: string }>;
  query(orderId: string): Promise<"success" | "failed" | "pending">;
}
```

`MockAirtimeProvider` succeeds unless the number ends in `0000` (forced failure for QA). `LiveAirtimeProvider` is a stub until credentials exist.

### Notifications

Receipt email after `completed`. SMS is behind the same notification service so the provider can be swapped.

## 12. Security

- Zod on every controller input.
- Server-only secrets (`PAYMENT_SECRET_KEY`, `DATABASE_URL`, `PROVIDER_API_KEY`).
- Rate limit recharge creation by IP and MSISDN.
- Idempotency key on order create and on webhook handling.
- Admin routes check `role === admin`.
- Voucher codes stored as hashes. Compare with a timing-safe hash.
- CSRF: Server Actions same-origin. Webhook uses signature, not a session.
- Audit log for admin retry and refund.

## 13. Pages (v1)

| Route | Who | Purpose |
| --- | --- | --- |
| `/` | Public | Home + quick recharge |
| `/recharge` | Public | Full recharge form |
| `/packages` | Public | Package catalog |
| `/bills` | Public | Bill pay |
| `/voucher` | Public | PIN redeem |
| `/checkout/[orderId]` | Public | Status + pay |
| `/login`, `/register` | Public | Auth |
| `/account/orders` | Customer | History |
| `/admin` | Admin | Dashboard |
| `/admin/catalog` | Admin | Products |
| `/admin/orders` | Admin | Ops |

Locale prefix: `/ar/...` and `/en/...`. Root redirects to `/ar`.

## 14. Build phases

### Phase 0 — Skeleton (1–2 days)

- `create-next-app` with TypeScript, Tailwind, App Router, `src/`.
- Tailwind tokens in `globals.css`, `cn()`, and `Button` / `Input` / `Card` primitives.
- Zustand stores: empty recharge draft, UI store, checkout store.
- Folders from section 7, ESLint, Prisma, PostgreSQL via Docker Compose.
- `[locale]` layout, Arabic default, RTL, empty home view.
- Health route and a seed script.

### Phase 1 — Catalog and quick recharge UI (2–3 days)

- Product model, seed amounts and three packages.
- Home and `/recharge` views, styled only with Tailwind primitives.
- Both pages share `useRechargeDraft`. Submit uses `useActionState` and clears the draft on success.
- `createRecharge` writes `awaiting_payment` orders.
- Checkout page shows status. Payment is still a “mark as paid” dev button behind `PAYMENT_MODE=mock`.

### Phase 2 — Mock fulfillment (2 days)

- Order state machine in `recharge.service`.
- Mock airtime provider.
- Receipt page and guest lookup by order id + phone.
- Unit tests: happy path, bad phone, duplicate idempotency key, provider failure.

### Phase 3 — Real payment (2–3 days)

- Moyasar (or HyperPay) hosted checkout.
- Signed webhook, idempotent update.
- Remove the dev “mark as paid” button when `PAYMENT_MODE=live`.

### Phase 4 — Accounts (2 days)

- Register, login, saved numbers, order history.
- Guest orders can be claimed by matching phone after login.

### Phase 5 — Packages, bills, vouchers (3 days)

- Same order pipeline. Only the product kind and provider method change.
- Bill inquiry uses a mock that returns a fixed amount for numbers ending in `1111`.
- Voucher hash + single redeem.

### Phase 6 — Admin (2–3 days)

- Dashboard counts, catalog CRUD, order list, retry, refund flag.
- Role guard.

### Phase 7 — Hardening (2 days)

- Rate limits, Arabic/English copy pass, receipt email, Playwright: recharge → mock pay → completed.
- Error and empty states on every money page.

Later (not v1): eSIM, international recharge, wallet balance, STC Pay-style wallet, live aggregator, SMS OTP login.

## 15. Environment

```
DATABASE_URL=
REDIS_URL=
AUTH_SECRET=
PAYMENT_MODE=mock          # mock | live
PAYMENT_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=
AIRTIME_MODE=mock          # mock | live
AIRTIME_API_KEY=
APP_URL=http://localhost:3000
```

## 16. Done when

- Arabic home lets a guest recharge `05xxxxxxxx` for a fixed SAR amount.
- Webhook (or mock pay) moves the order to `completed` exactly once.
- A failed provider call stays `fulfillment_failed` and is visible in admin.
- Customer can open history after login.
- Admin can disable a product and it disappears from the catalog.
- No card data in the database or logs.
- Recharge screens use Tailwind tokens and primitives only.
- The number and amount survive navigation from home to `/recharge` via the Zustand draft, and the paid status still comes from the server.

## 17. First implementation slice

When implementation starts, build only Phase 0 and Phase 1:

1. Next.js app, Tailwind tokens, Prisma, Docker Compose Postgres.
2. MVC folders, Zustand draft store, and one vertical: quick recharge with mock payment.
3. Arabic RTL home, styled with Tailwind, that posts to `createRecharge`.

Everything else waits until that order can be created, paid in mock mode, and shown on the checkout page.
