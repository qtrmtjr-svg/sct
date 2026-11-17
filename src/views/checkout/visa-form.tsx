"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@/lib/codes";
import { visaAction } from "@/server/actions";
import { Button } from "@/views/ui/button";
import { ErrorLine } from "@/views/ui/error-line";
import { Input } from "@/views/ui/input";

// ─── Card brand helpers ──────────────────────────────────────────────────────

type CardBrand = "visa" | "mastercard" | "unknown";

function detectBrand(digits: string): CardBrand {
  if (!digits) return "unknown";
  // Visa: starts with 4
  if (/^4/.test(digits)) return "visa";
  // Mastercard: 51-55 or 2221-2720
  if (/^5[1-5]/.test(digits)) return "mastercard";
  if (/^2[2-7]/.test(digits)) {
    const num = parseInt(digits.slice(0, 4), 10);
    if (num >= 2221 && num <= 2720) return "mastercard";
  }
  return "unknown";
}

// ─── Expiry validation ───────────────────────────────────────────────────────

function isExpiryValid(value: string): boolean {
  // value must be in MM/YY form and fully entered
  if (!/^\d{2}\/\d{2}$/.test(value)) return false;
  const [mm, yy] = value.split("/").map(Number);
  if (mm < 1 || mm > 12) return false;
  const now = new Date();
  const cardYear = 2000 + yy;
  const cardMonth = mm; // 1-indexed
  // valid if card's month/year is >= current month/year
  if (cardYear > now.getFullYear()) return true;
  if (cardYear === now.getFullYear() && cardMonth >= now.getMonth() + 1) return true;
  return false;
}

// ─── Brand badge ─────────────────────────────────────────────────────────────

function CardBadge({ brand }: { brand: CardBrand }) {
  if (brand === "visa") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A1F71",
          color: "#fff",
          fontWeight: 800,
          fontSize: "0.7rem",
          letterSpacing: "0.06em",
          borderRadius: "6px",
          padding: "3px 8px",
          fontStyle: "italic",
          transition: "opacity 0.2s",
        }}
      >
        VISA
      </span>
    );
  }
  if (brand === "mastercard") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "2px",
          background: "#252525",
          borderRadius: "6px",
          padding: "3px 7px",
          transition: "opacity 0.2s",
        }}
      >
        {/* Two overlapping circles */}
        <svg width="28" height="18" viewBox="0 0 28 18" fill="none">
          <circle cx="10" cy="9" r="8" fill="#EB001B" />
          <circle cx="18" cy="9" r="8" fill="#F79E1B" fillOpacity="0.9" />
          <path
            d="M14 3.2a8 8 0 0 1 0 11.6A8 8 0 0 1 14 3.2z"
            fill="#FF5F00"
          />
        </svg>
        <span
          style={{
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.58rem",
            letterSpacing: "0.04em",
          }}
        >
          MC
        </span>
      </span>
    );
  }
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VisaForm({ orderId, locale }: { orderId: string; locale: string }) {
  const t = useTranslations("checkout");
  const tErr = useTranslations("errors");
  const router = useRouter();

  const [holderName, setHolderName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  // Inline error states
  const [numberError, setNumberError] = useState("");
  const [expiryError, setExpiryError] = useState("");

  const brand = detectBrand(number.replace(/\s/g, ""));

  const [state, action, pending] = useActionState(async (prev: ActionResult | null, formData: FormData) => {
    const result = await visaAction(prev, formData);
    if (result.ok && result.orderId) router.push(`/${locale}/checkout/${result.orderId}/otp`);
    return result;
  }, null as ActionResult | null);

  // Validate card number brand on blur
  function handleNumberBlur() {
    const digits = number.replace(/\s/g, "");
    if (digits.length === 16 && brand === "unknown") {
      setNumberError(tErr("invalid_card_brand"));
    } else {
      setNumberError("");
    }
  }

  // Validate expiry on blur
  function handleExpiryBlur() {
    if (expiry.length > 0 && !isExpiryValid(expiry)) {
      setExpiryError(tErr("invalid_expiry"));
    } else {
      setExpiryError("");
    }
  }

  // Also clear errors as user types
  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = groupCard(e.target.value);
    setNumber(formatted);
    if (numberError) setNumberError("");
  }

  function handleExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = groupExpiry(e.target.value);
    setExpiry(formatted);
    if (expiryError) setExpiryError("");
  }

  return (
    <form action={action} className="mt-6 grid gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="locale" value={locale} />

      {/* Header row with dynamic badge */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{t("visaTitle")}</p>
        <CardBadge brand={brand} />
      </div>

      <Input
        label={t("holder")}
        name="name"
        autoComplete="cc-name"
        value={holderName}
        onChange={(e) => setHolderName(e.target.value)}
        required
      />

      <Input
        label={t("cardNumber")}
        name="number"
        inputMode="numeric"
        autoComplete="cc-number"
        dir="ltr"
        className="text-left tracking-wide"
        placeholder="4242 4242 4242 4242"
        value={number}
        onChange={handleNumberChange}
        onBlur={handleNumberBlur}
        maxLength={19}
        error={numberError}
        required
      />

      <Input
        label={t("expiry")}
        name="expiry"
        inputMode="numeric"
        autoComplete="cc-exp"
        dir="ltr"
        className="text-left"
        placeholder="MM/YY"
        value={expiry}
        onChange={handleExpiryChange}
        onBlur={handleExpiryBlur}
        maxLength={5}
        error={expiryError}
        required
      />

      <p className="text-xs text-muted">{t("visaHint")}</p>
      {state && !state.ok ? <ErrorLine code={state.code} /> : null}
      <Button type="submit" pending={pending}>
        {t("visaSubmit")}
      </Button>
    </form>
  );
}

// ─── Formatters ──────────────────────────────────────────────────────────────

function groupCard(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function groupExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
