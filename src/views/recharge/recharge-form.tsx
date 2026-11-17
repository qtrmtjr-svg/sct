"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import type { ActionResult } from "@/lib/codes";
import { currencyLabel, parseKwdToMinor } from "@/lib/money";
import type { ProductView, SavedNumberView } from "@/lib/types";
import { useRechargeDraft } from "@/state/recharge-draft.store";
import { rechargeAction } from "@/server/actions";
import { AmountPicker } from "@/views/ui/amount-picker";
import { Button } from "@/views/ui/button";
import { ErrorLine } from "@/views/ui/error-line";
import { Input } from "@/views/ui/input";

function halalasLabel(halalas: number) {
  const riyals = halalas / 100;
  return Number.isInteger(riyals) ? String(riyals) : riyals.toFixed(2);
}

export function RechargeForm({
  products,
  locale,
  savedNumbers = [],
}: {
  products: ProductView[];
  locale: string;
  savedNumbers?: SavedNumberView[];
}) {
  const t = useTranslations("recharge");
  const hydrated = useRechargeDraft((state) => state.hydrated);
  const msisdn = useRechargeDraft((state) => state.msisdn);
  const productId = useRechargeDraft((state) => state.productId);
  const idempotencyKey = useRechargeDraft((state) => state.idempotencyKey);
  const setPhone = useRechargeDraft((state) => state.setPhone);
  const selectProduct = useRechargeDraft((state) => state.selectProduct);
  const rotateKey = useRechargeDraft((state) => state.rotateKey);
  const [state, action, pending] = useActionState(rechargeAction, null as ActionResult | null);
  const [amountText, setAmountText] = useState("");
  const router = useRouter();
  const phoneLocked = msisdn.trim().length > 0;

  useEffect(() => {
    if (!hydrated) return;
    const current = useRechargeDraft.getState();
    if (!current.productId && products[0]) {
      selectProduct(products[0].id, products[0].amountHalalas, "topup");
      setAmountText(halalasLabel(products[0].amountHalalas));
      return;
    }
    if (current.amountHalalas > 0) setAmountText(halalasLabel(current.amountHalalas));
  }, [hydrated, products, selectProduct]);

  useEffect(() => {
    if (state?.ok && state.orderId) {
      rotateKey();
      router.push(`/${locale}/checkout/${state.orderId}`);
      router.refresh();
    }
  }, [state, rotateKey, router, locale]);

  if (!hydrated) return <div className="h-64 animate-pulse rounded-2xl bg-surface" />;

  const parsedAmount = parseKwdToMinor(amountText);
  const matched = parsedAmount ? products.find((product) => product.amountHalalas === parsedAmount) : undefined;
  const orderProductId = matched?.id ?? (productId || products[0]?.id || "");
  const phoneError = state && !state.ok && state.code === "invalid_phone" ? state.code : undefined;
  const amountInvalid = amountText.trim().length > 0 && parsedAmount == null;

  function onAmountChange(value: string) {
    setAmountText(value);
    const halalas = parseKwdToMinor(value);
    const carrier = products[0];
    if (!halalas || !carrier) return;
    const match = products.find((product) => product.amountHalalas === halalas);
    selectProduct(match?.id ?? carrier.id, halalas, "topup");
  }

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="productId" value={orderProductId} />
      <input type="hidden" name="amountHalalas" value={parsedAmount ?? ""} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="locale" value={locale} />
      {!phoneLocked && savedNumbers.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium text-muted">{t("saved")}</p>
          <div className="flex flex-wrap gap-2">
            {savedNumbers.map((number) => (
              <button
                key={number.id}
                type="button"
                onClick={() => setPhone(number.displayNumber)}
                className="rounded-full border border-border px-3 py-1 text-xs font-semibold hover:border-primary"
              >
                {number.label ? `${number.label} · ` : ""}
                {number.displayNumber}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {phoneLocked ? (
        <div className="grid gap-1.5">
          <span className="text-sm font-medium text-ink">{t("phone")}</span>
          <div
            dir="ltr"
            className="flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-base text-ink"
          >
            <span className="font-semibold text-brand">+965</span>
            <input
              name="msisdn"
              value={msisdn}
              readOnly
              aria-readonly="true"
              className="w-full cursor-default bg-transparent font-medium outline-none"
            />
            <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-brand" aria-hidden="true">
              <path
                fill="currentColor"
                d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V7Zm7 12H7v-8h10v8Z"
              />
            </svg>
          </div>
          <p className="text-xs text-muted">{t("phoneLocked")}</p>
        </div>
      ) : (
        <Input
          label={t("phone")}
          name="msisdn"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t("phonePlaceholder")}
          value={msisdn}
          onChange={(event) => setPhone(event.target.value)}
          required
        />
      )}
      {phoneError ? <ErrorLine code="invalid_phone" /> : null}
      <label className="grid gap-1.5 text-sm font-medium text-ink">
        {t("customAmount")}
        <span className="relative">
          <input
            inputMode="decimal"
            autoComplete="off"
            placeholder={t("customAmountPlaceholder")}
            value={amountText}
            onChange={(event) => onAmountChange(event.target.value)}
            aria-invalid={amountInvalid || undefined}
            className="h-11 w-full rounded-xl border border-border bg-white px-3 pe-14 text-base font-normal outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary aria-invalid:border-danger"
          />
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted">
            {currencyLabel(locale)}
          </span>
        </span>
        <span className={amountInvalid ? "text-xs font-medium text-danger" : "text-xs font-medium text-muted"}>
          {t("customAmountHint")}
        </span>
      </label>
      <div className="grid gap-2">
        <p className="text-sm font-medium">{t("amount")}</p>
        <AmountPicker
          products={products}
          selectedId={matched?.id ?? ""}
          locale={locale}
          onSelect={(product) => {
            setAmountText(halalasLabel(product.amountHalalas));
            selectProduct(product.id, product.amountHalalas, "topup");
          }}
        />
      </div>
      {state && !state.ok && state.code !== "invalid_phone" ? <ErrorLine code={state.code} /> : null}
      <Button type="submit" pending={pending} disabled={!orderProductId || !idempotencyKey || !parsedAmount || !msisdn}>
        {t("submit")}
      </Button>
    </form>
  );
}
