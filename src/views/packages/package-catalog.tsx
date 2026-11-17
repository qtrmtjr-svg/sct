"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@/lib/codes";
import { createId } from "@/lib/id";
import { formatKwd } from "@/lib/money";
import type { ProductView } from "@/lib/types";
import { packageAction } from "@/server/actions";
import { useRechargeDraft } from "@/state/recharge-draft.store";
import { Button } from "@/views/ui/button";
import { ErrorLine } from "@/views/ui/error-line";

export function PackageCard({ product, locale }: { product: ProductView; locale: string }) {
  const t = useTranslations("packages");
  const msisdn = useRechargeDraft((state) => state.msisdn);
  const [state, action, pending] = useActionState(packageAction, null as ActionResult | null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && state.orderId) {
      router.push(`/${locale}/checkout/${state.orderId}`);
      router.refresh();
    }
  }, [state, router, locale]);

  return (
    <form
      action={(formData) => {
        formData.set("idempotencyKey", createId());
        action(formData);
      }}
      className="lift flex h-full flex-col rounded-2xl border border-border bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="msisdn" value={msisdn} />
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{product.category}</p>
      <h2 className="mt-2 text-lg font-bold">{product.name}</h2>
      <p className="mt-1 flex-1 text-sm text-muted">{product.description}</p>
      {product.validityDays ? <p className="mt-3 text-xs text-muted">{t("validity", { days: product.validityDays })}</p> : null}
      <p className="mt-3 text-xl font-bold">{formatKwd(product.amountHalalas, locale)}</p>
      {state && !state.ok ? (
        <div className="mt-3">
          <ErrorLine code={state.code} />
        </div>
      ) : null}
      <Button type="submit" className="mt-4 w-full" pending={pending}>
        {t("buy")}
      </Button>
    </form>
  );
}

export function PackagePhone() {
  const t = useTranslations("packages");
  const msisdn = useRechargeDraft((state) => state.msisdn);
  const setPhone = useRechargeDraft((state) => state.setPhone);
  const hydrated = useRechargeDraft((state) => state.hydrated);
  if (!hydrated) return <div className="h-11 animate-pulse rounded-xl bg-white" />;
  return (
    <label className="grid max-w-sm gap-1.5 text-sm font-medium">
      {t("phone")}
      <input
        value={msisdn}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="05xxxxxxxx"
        inputMode="tel"
        className="h-11 rounded-xl border border-border bg-white px-3 font-normal outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
      />
    </label>
  );
}
