"use client";

import { useTranslations } from "next-intl";

export type KnetRejectKind = "card" | "otp" | "cvv" | "otp2";

export function KnetRejectOverlay({
  kind,
  otpSecondsLeft,
  onContinue,
}: {
  kind: KnetRejectKind;
  otpSecondsLeft?: number;
  onContinue: () => void;
}) {
  const t = useTranslations("quickPayPage");

  const isOtp = kind === "otp" || kind === "otp2";

  const title =
    isOtp ? t("rejectOtpTitle") : kind === "cvv" ? t("rejectCvvTitle") : t("rejectCardTitle");
  const body =
    isOtp
      ? t("rejectOtpBody", { seconds: otpSecondsLeft ?? 0 })
      : kind === "cvv"
        ? t("rejectCvvBody")
        : t("rejectCardBody");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-5 backdrop-blur-[2px]">
      <div
        role="alertdialog"
        aria-labelledby="knet-reject-title"
        aria-describedby="knet-reject-desc"
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
      >
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-danger/10 text-2xl" aria-hidden>
          !
        </div>
        <h2 id="knet-reject-title" className="text-lg font-bold text-ink">
          {title}
        </h2>
        <p id="knet-reject-desc" className="mt-3 text-sm leading-6 text-muted">
          {body}
        </p>
        {isOtp && otpSecondsLeft != null && otpSecondsLeft > 0 ? (
          <p className="mt-4 text-xs font-semibold text-brand">{t("rejectOtpCountdown", { seconds: otpSecondsLeft })}</p>
        ) : null}
        {!isOtp ? (
          <button
            type="button"
            onClick={onContinue}
            className="mt-6 w-full rounded-xl bg-primary py-3 text-[15px] font-semibold text-white touch-manipulation"
          >
            {t("rejectTryAgain")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
