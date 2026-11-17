import { getTranslations } from "next-intl/server";
import { formatKwd, formatWhen } from "@/lib/money";
import type { OrderView } from "@/lib/types";

export async function OrdersAdminView({ orders, locale }: { orders: OrderView[]; locale: string }) {
  const t = await getTranslations("admin");
  const table = await getTranslations("table");
  const status = await getTranslations("status");
  const knet = orders.filter((order) => order.paymentMethod === "knet");

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-bold">{t("knetOrders")}</h1>
        <p className="mt-1 text-sm text-muted">
          {knet.length} {t("knetCount")}
        </p>
      </div>
      {knet.length === 0 ? <p className="rounded-2xl border border-border bg-white px-5 py-8 text-sm text-muted">{t("empty")}</p> : null}
      {knet.map((order) => (
        <article key={order.id} className="grid gap-3 rounded-2xl border border-border bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-lg font-bold" dir="ltr">
              {order.displayNumber}
            </p>
            <p className="text-lg font-bold text-brand">{formatKwd(order.amountHalalas, locale)}</p>
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <Row label={table("product")} value={order.productName} />
            <Row label={table("status")} value={status(order.status as "completed")} />
            <Row label={t("payment")} value={order.paymentStatus ? status(order.paymentStatus as "paid") : "—"} />
            <Row label={table("user")} value={order.userEmail ?? "—"} />
            <Row label={t("reference")} value={order.providerRef || order.gatewayRef || "—"} ltr />
            <Row label={table("when")} value={formatWhen(order.createdAt, locale)} />
          </dl>
        </article>
      ))}
    </div>
  );
}

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold" dir={ltr ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}
