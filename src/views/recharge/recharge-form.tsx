"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Link } from "@/i18n/navigation";
import type { ActionResult } from "@/lib/codes";
import { currencyLabel, parseKwdToMinor } from "@/lib/money";
import type { ProductView, SavedNumberView } from "@/lib/types";
import { useRechargeDraft } from "@/state/recharge-draft.store";
import { rechargeAction } from "@/server/actions";
import { AmountPicker } from "@/views/ui/amount-picker";
import { Button } from "@/views/ui/button";
import { ErrorLine } from "@/views/ui/error-line";

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
  const [step, setStep] = useState<"phone" | "amount">("phone");
  const router = useRouter();

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

  if (!hydrated) return <div className="flex min-h-screen items-center justify-center"><div className="shimmer h-8 w-32 rounded-lg" /></div>;

  const parsedAmount = parseKwdToMinor(amountText);
  const matched = parsedAmount ? products.find((p) => p.amountHalalas === parsedAmount) : undefined;
  const orderProductId = matched?.id ?? (productId || products[0]?.id || "");
  const phoneError = state && !state.ok && state.code === "invalid_phone" ? state.code : undefined;
  const amountInvalid = amountText.trim().length > 0 && parsedAmount == null;

  function onAmountChange(value: string) {
    setAmountText(value);
    const halalas = parseKwdToMinor(value);
    const carrier = products[0];
    if (!halalas || !carrier) return;
    const match = products.find((p) => p.amountHalalas === halalas);
    selectProduct(match?.id ?? carrier.id, halalas, "topup");
  }

  if (step === "phone") {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-white">
        {/* Top bar */}
        <div className="flex items-center border-b border-[#f0f0f0] px-4 py-4">
          <Link href="/" className="text-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <h1 className="flex-1 text-center text-[17px] font-bold text-[#1d252d]">
            {t("headerTitle")}
          </h1>
          <div className="w-6" />
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pt-10">
          <h2 className="text-right text-[32px] font-bold leading-[42px] text-[#1d252d]">
            {t("questionTitle")}
          </h2>
          <p className="mt-2 text-right text-[16px] text-[#575f63]">
            {t("questionSubtitle")}
          </p>

          <div className="mt-10 flex items-center gap-3 border-b border-primary pb-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#1d252d]">
              <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <line x1="9" y1="19" x2="15" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="shrink-0 text-[16px] font-medium text-[#1d252d]">{t("numberLabel")}</span>
            <input
              value={msisdn}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              dir="ltr"
              className="w-full bg-transparent text-[16px] text-[#1d252d] outline-none placeholder:text-[#b0b0b0]"
            />
          </div>
        </div>

        {/* Fixed bottom button */}
        <div className="fixed inset-x-0 bottom-0">
          <button
            type="button"
            onClick={() => {
              if (msisdn.trim()) setStep("amount");
            }}
            className="press w-full bg-primary py-4 text-[18px] font-bold text-white"
          >
            {t("submitBtn")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center border-b border-[#f0f0f0] px-4 py-4">
        <button type="button" onClick={() => setStep("phone")} className="text-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-[17px] font-bold text-[#1d252d]">
          {t("headerTitle")}
        </h1>
        <div className="w-6" />
      </div>

      <div className="flex-1 px-6 pt-6 pb-20">
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#e6e6e6] bg-[#f8f8f8] px-3 py-2.5">
          <span dir="ltr" className="font-semibold text-brand">+965</span>
          <span dir="ltr" className="font-medium text-[#1d252d]">{msisdn}</span>
          <button type="button" onClick={() => setStep("phone")} className="ms-auto text-xs text-primary">{t("phone")}</button>
        </div>

        <form action={action} className="grid gap-4">
          <input type="hidden" name="msisdn" value={msisdn} />
          <input type="hidden" name="productId" value={orderProductId} />
          <input type="hidden" name="amountHalalas" value={parsedAmount ?? ""} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <input type="hidden" name="locale" value={locale} />

          <label className="grid gap-1.5 text-sm font-medium text-[#1d252d]">
            {t("customAmount")}
            <span className="relative">
              <input
                inputMode="decimal"
                autoComplete="off"
                placeholder={t("customAmountPlaceholder")}
                value={amountText}
                onChange={(e) => onAmountChange(e.target.value)}
                aria-invalid={amountInvalid || undefined}
                className="h-11 w-full rounded-xl border border-[#e6e6e6] bg-white px-3 pe-14 text-base outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary aria-invalid:border-danger"
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-[#575f63]">
                {currencyLabel(locale)}
              </span>
            </span>
            <span className={amountInvalid ? "text-xs text-danger" : "text-xs text-[#575f63]"}>
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

          {phoneError ? <ErrorLine code="invalid_phone" /> : null}
          {state && !state.ok && state.code !== "invalid_phone" ? <ErrorLine code={state.code} /> : null}

          <Button type="submit" pending={pending} disabled={!orderProductId || !idempotencyKey || !parsedAmount || !msisdn}>
            {t("submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
