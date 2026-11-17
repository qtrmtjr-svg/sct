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
      className="rounded-2xl border border-[#e6e6e6] bg-white p-4 lg:shadow-[0_8px_24px_rgba(29,37,45,0.06)]"
      onSubmit={(event) => {
        event.preventDefault();
        if (!msisdn.trim()) {
          setMissing(true);
          return;
        }
        setPhone(msisdn);
        router.push("/quick-pay");
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{t("quickPay")}</h2>
        <img src="/icons/quick-pay.svg" alt="" className="h-6 w-6" />
      </div>
      <div dir="ltr" className="mt-4 flex items-center gap-2 border-b border-[#e4e4e4] focus-within:border-primary">
        <span className="hidden text-sm font-bold text-brand lg:inline" dir="ltr">
          +965
        </span>
        <input
          value={msisdn}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("quickPayPlaceholder")}
          inputMode="numeric"
          maxLength={8}
          dir="ltr"
          aria-label={t("quickPayPlaceholder")}
          aria-invalid={missing || status === "error" || rejected}
          className="w-full bg-transparent pb-2 text-center text-[13px] outline-none placeholder:text-[#9a9a9a] lg:text-start lg:text-sm"
        />
      </div>
      <p className="mt-2 min-h-4 text-xs font-semibold" aria-live="polite">
        {missing ? <span className="text-danger">{t("quickPayRequired")}</span> : null}
        {!missing && rejected ? <span className="text-danger">{t("phoneNotKuwait")}</span> : null}
        {!rejected && status === "saving" ? <span className="text-muted">{t("phoneSaving")}</span> : null}
        {!rejected && status === "saved" ? <span className="text-success">{t("phoneSaved")}</span> : null}
        {!rejected && status === "error" ? <span className="text-danger">{t("phoneError")}</span> : null}
      </p>
      <button
        type="submit"
        className="press mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
      >
        {t("continue")}
      </button>
      <p className="mt-3 hidden text-[11px] leading-5 text-muted lg:block">{t("demoNote")}</p>
    </form>
  );
}

