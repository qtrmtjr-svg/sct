"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@/lib/codes";
import { formatKwd, formatWhen } from "@/lib/money";
import type { OrderView, SavedNumberView } from "@/lib/types";
import { claimAction, saveNumberAction } from "@/server/actions";
import { useUiStore } from "@/state/ui.store";
import { Badge } from "@/views/ui/badge";
import { Button } from "@/views/ui/button";
import { Card } from "@/views/ui/card";
import { ErrorLine } from "@/views/ui/error-line";
import { Input } from "@/views/ui/input";
import { Link } from "@/i18n/navigation";

export function AccountView({
  locale,
  orders,
  saved,
}: {
  locale: string;
  orders: OrderView[];
  saved: SavedNumberView[];
}) {
  const t = useTranslations("account");
  const table = useTranslations("table");
  const status = useTranslations("status");
  const pushToast = useUiStore((state) => state.pushToast);
  const [saveState, saveAction, savePending] = useActionState(saveNumberAction, null as ActionResult | null);
  const [claimState, claimFormAction, claimPending] = useActionState(claimAction, null as ActionResult | null);
  const router = useRouter();

  useEffect(() => {
    if (saveState?.ok) {
      pushToast(t("savedOk"));
      router.refresh();
    }
  }, [saveState, pushToast, t, router]);

  useEffect(() => {
    if (claimState?.ok) {
      pushToast(t("claimed"));
      router.refresh();
    }
  }, [claimState, pushToast, t, router]);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card>
        <h2 className="font-semibold">{t("saved")}</h2>
        <ul className="mt-3 grid gap-2 text-sm">
          {saved.map((number) => (
            <li key={number.id} className="rounded-xl bg-surface px-3 py-2">
              <span className="font-medium">{number.displayNumber}</span>
              {number.label ? <span className="mt-0.5 block text-muted">{number.label}</span> : null}
            </li>
          ))}
        </ul>
        <form action={saveAction} className="mt-4 grid gap-3">
          <Input label={t("phone")} name="msisdn" placeholder="05xxxxxxxx" required />
          <Input label={t("label")} name="label" />
          {saveState && !saveState.ok ? <ErrorLine code={saveState.code} /> : null}
          <Button type="submit" pending={savePending}>
            {t("add")}
          </Button>
        </form>
        <form action={claimFormAction} className="mt-3">
          <Button type="submit" variant="secondary" pending={claimPending} className="w-full">
            {t("claim")}
          </Button>
        </form>
      </Card>
      <Card className="overflow-x-auto">
        {orders.length === 0 ? (
          <p className="text-sm text-muted">{t("empty")}</p>
        ) : (
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead className="text-muted">
              <tr>
                <th className="px-2 py-2 font-medium">{table("product")}</th>
                <th className="px-2 py-2 font-medium">{table("phone")}</th>
                <th className="px-2 py-2 font-medium">{table("amount")}</th>
                <th className="px-2 py-2 font-medium">{table("status")}</th>
                <th className="px-2 py-2 font-medium">{table("when")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-2 py-3">
                    <Link href={`/checkout/${order.id}`} className="font-medium text-primary">
                      {order.productName}
                    </Link>
                  </td>
                  <td className="px-2 py-3">{order.displayNumber}</td>
                  <td className="px-2 py-3">{formatKwd(order.amountHalalas, locale)}</td>
                  <td className="px-2 py-3">
                    <Badge status={order.status} label={status(order.status as "completed")} />
                  </td>
                  <td className="px-2 py-3 text-muted">{formatWhen(order.createdAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
