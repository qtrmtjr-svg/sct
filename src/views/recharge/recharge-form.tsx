"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { parseKwdToMinor } from "@/lib/money";
import type { ProductView, SavedNumberView } from "@/lib/types";
import { useRechargeDraft } from "@/state/recharge-draft.store";

function halalasLabel(halalas: number) {
  const riyals = halalas / 100;
  return Number.isInteger(riyals) ? String(riyals) : riyals.toFixed(2);
}

function validityText(days: number | null, locale: string) {
  if (!days) return "";
  if (locale === "ar") return `صالح لغاية ${days} يوم`;
  return `Valid for ${days} days`;
}

function StcCard({ amount }: { amount: string }) {
  return (
    <div className="flex h-[70px] w-[110px] shrink-0 flex-col justify-between rounded-lg bg-brand p-2">
      <div className="flex items-start justify-between">
        <span className="text-[18px] font-bold leading-none text-white">{amount}</span>
        <span className="text-[11px] font-bold leading-none text-white">stc</span>
      </div>
      <div className="h-[5px] w-[60%] rounded-full bg-primary" />
    </div>
  );
}

export function RechargeForm({
  products,
  locale,
  savedNumbers: _savedNumbers = [],
}: {
  products: ProductView[];
  locale: string;
  savedNumbers?: SavedNumberView[];
}) {
  const t = useTranslations("recharge");
  const hydrated = useRechargeDraft((state) => state.hydrated);
  const msisdn = useRechargeDraft((state) => state.msisdn);
  const productId = useRechargeDraft((state) => state.productId);
  const setPhone = useRechargeDraft((state) => state.setPhone);
  const selectProduct = useRechargeDraft((state) => state.selectProduct);
  const rotateKey = useRechargeDraft((state) => state.rotateKey);
  const [amountText, setAmountText] = useState("");
  const [step, setStep] = useState<"phone" | "amount">("phone");
  const [selectedProductId, setSelectedProductId] = useState("");
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

  function goToPayment() {
    const amount = parsedAmount ?? (selectedProductId ? products.find(p => p.id === selectedProductId)?.amountHalalas : undefined);
    if (!amount || !orderProductId) return;
    selectProduct(orderProductId, amount, "topup");
    rotateKey();
    router.push(`/${locale}/quick-pay?step=pay`);
  }

  if (!hydrated) return <div className="flex min-h-screen items-center justify-center"><div className="shimmer h-8 w-32 rounded-lg" /></div>;

  const parsedAmount = parseKwdToMinor(amountText);
  const matched = parsedAmount ? products.find((p) => p.amountHalalas === parsedAmount) : undefined;
  const orderProductId = selectedProductId || matched?.id || (productId || products[0]?.id || "");

  /* ——— Step 1: Phone number ——— */
  if (step === "phone") {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-white">
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

        <div className="fixed inset-x-0 bottom-0">
          <button
            type="button"
            disabled={!msisdn.trim()}
            onClick={() => setStep("amount")}
            className="press w-full bg-primary py-4 text-[18px] font-bold text-white disabled:bg-[#ccc] disabled:text-[#888]"
          >
            {t("submitBtn")}
          </button>
        </div>
      </div>
    );
  }

  /* ——— Step 2: Amount selection (STC card style) ——— */
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
          {locale === "ar" ? "الدفع" : "Payment"}
        </h1>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#1d252d]" aria-hidden="true">
          <circle cx="6" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="18" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <line x1="7.8" y1="11" x2="16.2" y2="7" stroke="currentColor" strokeWidth="1.5" />
          <line x1="7.8" y1="13" x2="16.2" y2="17" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Gray header area — STC EmbedQuickpay style */}
      <div className="bg-[#f3f3f1] px-6 py-[45px]">
        <h2 className="text-center text-[26px] font-bold leading-[36px] text-[#1d252d]">
          {t("questionSubtitle")}
        </h2>
        <div className="mx-auto mt-6 max-w-md border-b border-primary pb-2">
          <div className="flex items-center justify-end gap-2">
            <input
              inputMode="decimal"
              autoComplete="off"
              value={amountText}
              onChange={(e) => {
                const val = e.target.value;
                setAmountText(val);
                const halalas = parseKwdToMinor(val);
                const carrier = products[0];
                if (!halalas || !carrier) return;
                const match = products.find((p) => p.amountHalalas === halalas);
                if (match) {
                  setSelectedProductId(match.id);
                  selectProduct(match.id, halalas, "topup");
                }
              }}
              dir="ltr"
              className="w-full bg-transparent text-left text-[19px] font-normal leading-[30px] text-[#1d252d] outline-none"
            />
            <span className="shrink-0 text-[16px] text-[#575f63]">
              {locale === "ar" ? "المبلغ د ك" : "Amount KWD"}
            </span>
          </div>
        </div>
      </div>

      {/* Product cards list */}
      <div className="flex-1 pb-20">
        <div className="divide-y divide-[#e6e6e6]">
          {products.map((product) => {
            const kwdAmount = halalasLabel(product.amountHalalas);
            const isSelected = product.id === orderProductId;
            return (
              <button
                key={product.id}
                type="button"
                dir="ltr"
                onClick={() => {
                  setSelectedProductId(product.id);
                  setAmountText(kwdAmount);
                  selectProduct(product.id, product.amountHalalas, "topup");
                }}
                className="flex w-full items-center gap-4 px-5 py-5 hover:bg-[#fafafa]"
              >
                <StcCard amount={kwdAmount} />
                <div className="flex-1" />
                <div className="flex flex-col items-end text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[16px] font-medium text-[#1d252d]">{locale === "ar" ? "د.ك" : "KD"}</span>
                    <span className="text-[32px] font-bold leading-none text-[#1d252d]">{kwdAmount}</span>
                  </div>
                  <p className="mt-1 text-[13px] font-medium text-[#8e9aa0]">
                    {validityText(product.validityDays, locale)}
                  </p>
                </div>
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-brand bg-brand" : "border-brand"
                  }`}
                >
                  {isSelected ? (
                    <div className="h-3 w-3 rounded-full bg-white" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {/* Fixed bottom button */}
        <div className="fixed inset-x-0 bottom-0">
          <button
            type="button"
            disabled={!orderProductId}
            onClick={goToPayment}
            className="press w-full bg-primary py-4 text-[18px] font-bold text-white disabled:bg-[#ccc] disabled:text-[#888]"
          >
            {t("submitBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
