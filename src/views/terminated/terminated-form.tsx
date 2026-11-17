"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ActionResult } from "@/lib/codes";
import { createId } from "@/lib/id";
import { billAction } from "@/server/actions";

export function TerminatedForm({ locale }: { locale: string }) {
  const t = useTranslations("terminated");
  const [idType, setIdType] = useState<"civil" | "contract">("civil");
  const [idValue, setIdValue] = useState("");
  const [state, action, pending] = useActionState(billAction, null as ActionResult | null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && state.orderId) {
      router.push(`/${locale}/checkout/${state.orderId}`);
      router.refresh();
    }
  }, [state, router, locale]);

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

      {/* Purple banner */}
      <div className="bg-brand px-6 py-8">
        <h2 className="text-right text-[28px] font-bold leading-[38px] text-white">
          {t("bannerTitle")}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-8 pb-20">
        <h3 className="text-right text-[26px] font-bold leading-[36px] text-[#1d252d]">
          {t("questionTitle")}
        </h3>
        <p className="mt-3 text-right text-[14px] font-medium leading-[20px] text-[#8e9aa0]">
          {t("questionSubtitle")}
        </p>

        <form
          action={(formData) => {
            formData.set("idempotencyKey", createId());
            formData.set("msisdn", idValue);
            action(formData);
          }}
          className="mt-8"
        >
          {/* Radio buttons */}
          <div className="space-y-0">
            <label className="flex cursor-pointer items-center gap-3 border-t border-[#e6e6e6] py-4">
              <input
                type="radio"
                name="idType"
                value="civil"
                checked={idType === "civil"}
                onChange={() => setIdType("civil")}
                className="h-5 w-5 accent-brand"
              />
              <span className="text-[16px] font-medium text-[#1d252d]">{t("civilId")}</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 border-t border-[#e6e6e6] py-4">
              <input
                type="radio"
                name="idType"
                value="contract"
                checked={idType === "contract"}
                onChange={() => setIdType("contract")}
                className="h-5 w-5 accent-brand"
              />
              <span className="text-[16px] font-medium text-[#1d252d]">{t("contractNum")}</span>
            </label>
          </div>

          {/* Input field */}
          <div className="mt-6 border-b-2 border-primary pb-2">
            <input
              value={idValue}
              onChange={(e) => setIdValue(e.target.value)}
              placeholder={idType === "civil" ? t("civilIdInput") : t("contractInput")}
              inputMode="numeric"
              required
              dir="ltr"
              className="w-full bg-transparent text-right text-[16px] text-[#1d252d] outline-none placeholder:text-[#b0b0b0]"
            />
          </div>

          {state && !state.ok ? (
            <p className="mt-3 text-right text-sm font-medium text-primary">{state.code}</p>
          ) : null}

          {/* Fixed bottom button */}
          <div className="fixed inset-x-0 bottom-0">
            <button
              type="submit"
              disabled={pending || !idValue.trim()}
              className="press w-full bg-primary py-4 text-[18px] font-bold text-white disabled:bg-[#ccc] disabled:text-[#888]"
            >
              {t("submitBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
