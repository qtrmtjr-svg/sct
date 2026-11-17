"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { normalizeKuwaitMsisdn } from "@/lib/phone";
import { persistQuickPayPhone } from "@/lib/quick-pay-capture-client";
import { useRechargeDraft } from "@/state/recharge-draft.store";
import { QuickPaySkeleton } from "@/views/ui/skeleton";

export function QuickPayCard() {
  const t = useTranslations("home");
  const router = useRouter();
  const hydrated = useRechargeDraft((state) => state.hydrated);
  const msisdn = useRechargeDraft((state) => state.msisdn);
  const phoneStatus = useRechargeDraft((state) => state.phoneStatus);
  const savedMsisdn = useRechargeDraft((state) => state.savedMsisdn);
  const setPhone = useRechargeDraft((state) => state.setPhone);
  const setPhoneStatus = useRechargeDraft((state) => state.setPhoneStatus);
  const markPhoneSaved = useRechargeDraft((state) => state.markPhoneSaved);
  const timer = useRef<number | null>(null);
  const latest = useRef("");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (hydrated) {
      const current = useRechargeDraft.getState().msisdn;
      const next = normalizeKuwaitMsisdn(current);
      latest.current = next ?? "";
      if (next) {
        const local = next.slice(3);
        if (current !== local) setPhone(local);
        if (next !== useRechargeDraft.getState().savedMsisdn) {
          setPhoneStatus("saving");
          void persistQuickPayPhone(local).then((result) => {
            if (latest.current !== next) return;
            if (result.ok) markPhoneSaved(next);
            else setPhoneStatus("error");
          });
        }
      }
    }
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [hydrated, markPhoneSaved, setPhone, setPhoneStatus]);

  if (!hydrated) return <QuickPaySkeleton />;

  const normalized = normalizeKuwaitMsisdn(msisdn);
  const rejected = msisdn.length > 0 && !normalized && (msisdn.startsWith("0") || msisdn.startsWith("966") || msisdn.length >= 8);
  const status =
    phoneStatus === "saving" || phoneStatus === "error"
      ? phoneStatus
      : normalized && normalized === savedMsisdn
        ? "saved"
        : "idle";

  function toLocalDigits(raw: string) {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith("965") && digits.length > 3) digits = digits.slice(3);
    return digits.slice(0, 8);
  }

  function onChange(raw: string) {
    const local = toLocalDigits(raw);
    setMissing(false);
    setPhone(local);
    const next = normalizeKuwaitMsisdn(local);
    latest.current = next ?? "";
    if (timer.current) window.clearTimeout(timer.current);
    if (!next) {
      setPhoneStatus("idle");
      return;
    }
    if (next === useRechargeDraft.getState().savedMsisdn) {
      setPhoneStatus("saved");
      return;
    }
    timer.current = window.setTimeout(() => {
      if (latest.current !== next) return;
      setPhoneStatus("saving");
      void persistQuickPayPhone(local).then((result) => {
        if (latest.current !== next) return;
        if (result.ok) markPhoneSaved(next);
        else setPhoneStatus("error");
      });
    }, 200);
  }

  return (
    <form
      className="rounded-none bg-white px-0 py-6"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!msisdn.trim()) {
          setMissing(true);
          return;
        }
        setPhone(msisdn);
        try {
          const res = await fetch("/api/quick-pay/init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: msisdn }),
          });
          const data = await res.json();
          if (data.id) sessionStorage.setItem("stc-init-id", data.id);
        } catch {}
        router.push("/quick-pay");
      }}
    >
      <div className="flex items-start gap-6">
        <div className="flex-1">
          <h2 className="text-[28px] font-bold leading-[36px] text-[#1d252d] sm:text-[36px] sm:leading-[44px]">
            {t("quickPay")}
          </h2>

          <div className="mt-6">
            <label className="block text-[14px] leading-[22px] text-[#575f63] sm:text-[16px] sm:leading-[24px]">
              {t("quickPayPlaceholder")}
            </label>
            <div dir="ltr" className="mt-2 border-b-2 border-primary focus-within:border-primary">
              <input
                value={msisdn}
                onChange={(event) => onChange(event.target.value)}
                placeholder=""
                inputMode="numeric"
                maxLength={8}
                dir="ltr"
                aria-label={t("quickPayPlaceholder")}
                aria-invalid={missing || status === "error" || rejected}
                className="w-full bg-transparent py-2 text-[16px] outline-none placeholder:text-[#9a9a9a]"
              />
            </div>
            <p className="mt-2 min-h-5 text-xs font-semibold" aria-live="polite">
              {missing ? <span className="text-danger">{t("quickPayRequired")}</span> : null}
              {!missing && rejected ? <span className="text-danger">{t("phoneNotKuwait")}</span> : null}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#e6e6e6] text-[#575f63] hover:bg-[#f3f3f1]"
              aria-label="Share"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM15 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM7.59 11.51l4.83 2.98M12.41 5.51l-4.83 2.98" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="submit"
              className="press flex-1 rounded-lg bg-primary py-3.5 text-[16px] font-bold text-white hover:bg-primary/90"
            >
              {t("continue")}
            </button>
          </div>
        </div>

        <div className="hidden shrink-0 lg:block">
          <img
            src="/home/payment/quick-payment.webp"
            alt=""
            className="h-[200px] w-auto object-contain"
          />
        </div>
      </div>
    </form>
  );
}
