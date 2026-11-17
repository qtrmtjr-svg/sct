/** Validates MM/YY (month must be 01–12, not before current month). */
export function isValidCardExpiryMmYy(month: string, year: string, now = new Date()): boolean {
  if (!/^\d{2}$/.test(month) || !/^\d{2}$/.test(year)) return false;
  const expiryMonth = Number(month);
  const yy = Number(year);
  if (expiryMonth < 1 || expiryMonth > 12) return false;
  const expiryYear = 2000 + yy;
  const current = now.getFullYear() * 12 + now.getMonth();
  const given = expiryYear * 12 + (expiryMonth - 1);
  if (given < current) return false;
  if (expiryYear > now.getFullYear() + 25) return false;
  return true;
}

export function isValidCardExpiryString(expiry: string, now = new Date()): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry.trim());
  if (!match) return false;
  return isValidCardExpiryMmYy(match[1], match[2], now);
}

/** Clamp partial month digits while typing (e.g. 9 → 09, 15 → 12). */
export function normalizeExpiryMonthInput(raw: string): string {
  let mm = raw.replace(/\D/g, "").slice(0, 2);
  if (mm.length === 1 && Number(mm) > 1) mm = `0${mm}`;
  if (mm.length === 2) {
    const n = Number(mm);
    if (n === 0) return "01";
    if (n > 12) return "12";
  }
  return mm;
}
