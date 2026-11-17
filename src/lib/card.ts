import { isValidCardExpiryMmYy } from "@/lib/card-expiry";

export const DEMO_VISA_OTP = "482913";

export type SavedCard = {
  holderName: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
};

function inspectVisaCore(
  input: { holderName: string; number: string; expiry: string },
  now = new Date(),
): SavedCard | null {
  const holderName = input.holderName.trim().replace(/\s+/g, " ");
  if (!/^[\p{L}][\p{L} .'-]{1,59}$/u.test(holderName)) return null;

  const digits = input.number.replace(/\D/g, "");
  if (!/^4\d{15}$/.test(digits) || !passesLuhn(digits)) return null;

  const match = /^(\d{2})\/(\d{2})$/.exec(input.expiry.trim());
  if (!match || !isValidCardExpiryMmYy(match[1], match[2], now)) return null;
  const expiryMonth = Number(match[1]);
  const expiryYear = 2000 + Number(match[2]);

  return { holderName, last4: digits.slice(-4), expiryMonth, expiryYear };
}

/** Step 1: card holder, number, expiry — no CVV yet. */
export function inspectVisaStep1(
  input: { holderName: string; number: string; expiry: string },
  now = new Date(),
): SavedCard | null {
  return inspectVisaCore(input, now);
}

export function inspectVisa(
  input: { holderName: string; number: string; expiry: string; cvv: string },
  now = new Date(),
): SavedCard | null {
  const card = inspectVisaCore(input, now);
  if (!card) return null;
  if (!/^\d{3}$/.test(input.cvv.trim())) return null;
  return card;
}

export function readSavedCard(raw: string | null | undefined): SavedCard | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<SavedCard>;
    if (typeof value.holderName !== "string" || !value.holderName) return null;
    if (typeof value.last4 !== "string" || !/^\d{4}$/.test(value.last4)) return null;
    if (typeof value.expiryMonth !== "number" || typeof value.expiryYear !== "number") return null;
    return {
      holderName: value.holderName,
      last4: value.last4,
      expiryMonth: value.expiryMonth,
      expiryYear: value.expiryYear,
    };
  } catch {
    return null;
  }
}

function passesLuhn(digits: string) {
  let sum = 0;
  let doubleDigit = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let current = digits.charCodeAt(index) - 48;
    if (doubleDigit) {
      current *= 2;
      if (current > 9) current -= 9;
    }
    sum += current;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}
