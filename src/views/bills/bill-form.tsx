"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRechargeDraft } from "@/state/recharge-draft.store";

function demoBillAmount(msisdn: string) {
  if (msisdn.endsWith("1111")) return 150;
  return 10;
}

export function BillForm({ locale }: { locale: string }) {
  const t = useTranslations("bills");
  const msisdn = useRechargeDraft((state) => state.msisdn);
  const setPhone = useRechargeDraft((state) => state.setPhone);
  const hydrated = useRechargeDraft((state) => state.hydrated);
  const selectProduct = useRechargeDraft((state) => state.selectProduct);
  const rotateKey = useRechargeDraft((state) => state.rotateKey);
  const [step, setStep] = useState<"phone" | "summary">("phone");
  const router = useRouter();

  if (!hydrated) return <div className="flex min-h-screen items-center justify-center"><div className="shimmer h-8 w-32 rounded-lg" /></div>;

  const billAmount = demoBillAmount(msisdn);

  /* ——— Step 1: Enter number ——— */
  if (step === "phone") {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-white">
        <div className="flex items-center border-b border-[#f0f0f0] px-4 py-4">
          <Link href="/" className="text-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

          <div className="mt-10 flex items-center gap-3 border-b border-[#c4c4c4] pb-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#1d252d]">
              <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <line x1="9" y1="19" x2="15" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="shrink-0 text-[16px] font-medium text-[#1d252d]">{t("numberLabel")}</span>
            <input
              value={msisdn}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              required
              dir="ltr"
              className="w-full bg-transparent text-[16px] text-[#1d252d] outline-none placeholder:text-[#b0b0b0]"
            />
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0">
          <button
            type="button"
            disabled={!msisdn.trim()}
            onClick={() => setStep("summary")}
            className="press w-full bg-primary py-4 text-[18px] font-bold text-white disabled:bg-[#ccc] disabled:text-[#888]"
          >
            {t("submitBtn")}
          </button>
        </div>
      </div>
    );
  }

  /* ——— Step 2: Bill summary ——— */
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#1d252d]" aria-hidden="true">
          <circle cx="6" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="18" cy="6" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <line x1="7.8" y1="11" x2="16.2" y2="7" stroke="currentColor" strokeWidth="1.5" />
          <line x1="7.8" y1="13" x2="16.2" y2="17" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Gray header */}
      <div className="bg-[#f3f3f1] px-6 py-8">
        <h2 className="text-center text-[28px] font-bold leading-[38px] text-[#1d252d]">
          {t("summaryQuestion")}
        </h2>
      </div>

      {/* Bill card — STC PaymentEntryListItem style */}
      <div className="flex-1 bg-[#f3f3f1] pb-36">
        <div className="flex items-start gap-3 bg-[#f3f3f1] px-5 pt-4">
          {/* White card */}
          <div className="flex-1 rounded-sm bg-white p-4 shadow-[0_1px_5px_rgba(0,0,0,0.2)]">
            {/* Row 1: number | postpaid */}
            <p className="text-[15px] font-normal text-[#1d252d]">
              {msisdn} <span className="text-[#8e9aa0]">|</span> {t("postpaid")}
            </p>

            {/* Row 2: specifiedAmount label + change link */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[14px] font-medium text-[#1d252d]">{t("specifiedAmount")}</span>
              <button type="button" className="text-[13px] font-semibold text-primary">
                {t("changes")}
              </button>
            </div>

            {/* Row 3: total amount in bordered box */}
            <div className="mt-3 flex items-center justify-between rounded border border-[#e0e0e0] px-3 py-3">
              <span className="text-[14px] font-medium text-[#1d252d]">{t("totalAmount")}</span>
              <div className="flex items-baseline gap-1" dir="ltr">
                <span className="text-[16px] font-medium text-[#1d252d]">{billAmount}</span>
                <span className="text-[13px] text-[#1d252d]">{locale === "ar" ? "د.ك" : "KD"}</span>
              </div>
            </div>
          </div>

          {/* Trash icon */}
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="mt-2 shrink-0 text-brand"
            aria-label="Delete"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
        </div>

        {/* Additional numbers */}
        <div className="mt-6 px-5">
          <h3 className="text-[16px] font-bold text-[#1d252d]">{t("additionalNumbers")}</h3>
          <div className="mt-3 border-t border-[#e6e6e6]">
            <button
              type="button"
              className="flex w-full items-center justify-between py-4 text-primary"
            >
              <span className="text-[15px] font-semibold">{t("addAnother")}</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Fixed bottom: total amount bar (STC totalAmountWrapper) + continue */}
      <div className="fixed inset-x-0 bottom-0">
        <div className="flex h-[50px] items-center justify-between bg-[#f3f3f1] px-5 text-[16px]">
          <span className="text-[14px] font-medium text-[#1d252d]">{t("totalDue")}</span>
          <div className="flex items-baseline gap-1 font-medium text-[#000]" dir="ltr">
            <span className="text-[20px] font-bold">{billAmount}.000</span>
            <span className="text-[13px]">{locale === "ar" ? "د.ك" : "KD"}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            selectProduct("bill-postpaid", billAmount * 100, "bill");
            rotateKey();
            router.push(`/${locale}/quick-pay?step=pay&source=bill`);
          }}
          className="press w-full bg-primary py-4 text-[18px] font-bold text-white"
        >
          {t("continueBtn")}
        </button>
      </div>
    </div>
  );
}
