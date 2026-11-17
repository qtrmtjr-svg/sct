export const MIN_TOPUP_HALALAS = 100;
export const MAX_TOPUP_HALALAS = 50_000;

export function currencyLabel(locale: string) {
  return locale === "ar" ? "د.ك." : "KWD";
}

export function parseKwdToMinor(text: string): number | null {
  const mapped = text
    .trim()
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(mapped)) return null;
  const halalas = Math.round(Number(mapped) * 100);
  if (halalas < MIN_TOPUP_HALALAS || halalas > MAX_TOPUP_HALALAS) return null;
  return halalas;
}

export function formatKwd(halalas: number, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-KW" : "en-KW", {
    style: "currency",
    currency: "KWD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(halalas / 100);
}

export function formatWhen(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
