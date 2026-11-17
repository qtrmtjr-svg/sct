"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ActionResult } from "@/lib/codes";
import { createId } from "@/lib/id";
import { billAction } from "@/server/actions";
import { useRechargeDraft } from "@/state/recharge-draft.store";

export function BillForm({ locale }: { locale: string }) {
  const t = useTranslations("bills");
  const msisdn = useRechargeDraft((state) => state.msisdn);
  const setPhone = useRechargeDraft((state) => state.setPhone);
  const hydrated = useRechargeDraft((state) => state.hydrated);
  const [state, action, pending] = useActionState(billAction, null as ActionResult | null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && state.orderId) {
      router.push(`/${locale}/checkout/${state.orderId}`);
      router.refresh();
    }
  }, [state, router, locale]);

  if (!hydrated) return <div className="flex min-h-screen items-center justify-center"><div className="shimmer h-8 w-32 rounded-lg" /></div>;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      {/* Top bar */}
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

      {/* Content */}
      <div className="flex-1 px-6 pt-10">
        <h2 className="text-right text-[32px] font-bold leading-[42px] text-[#1d252d]">
          {t("questionTitle")}
        </h2>
        <p className="mt-2 text-right text-[16px] text-[#575f63]">
          {t("questionSubtitle")}
        </p>

        <form
          action={(formData) => {
            formData.set("idempotencyKey", createId());
            action(formData);
          }}
          className="mt-10"
        >
          <div className="flex items-center gap-3 border-b border-[#c4c4c4] pb-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#1d252d]">
              <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <line x1="9" y1="19" x2="15" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="shrink-0 text-[16px] font-medium text-[#1d252d]">{t("numberLabel")}</span>
            <input
              name="msisdn"
              value={msisdn}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              required
              dir="ltr"
              className="w-full bg-transparent text-[16px] text-[#1d252d] outline-none placeholder:text-[#b0b0b0]"
            />
          </div>

          {state && !state.ok ? (
            <p className="mt-3 text-right text-sm font-medium text-primary">{state.code}</p>
          ) : null}

          {/* Fixed bottom button */}
          <div className="fixed inset-x-0 bottom-0">
            <button
              type="submit"
              disabled={pending}
              className="press w-full bg-primary py-4 text-[18px] font-bold text-white disabled:opacity-60"
            >
              {t("submitBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
