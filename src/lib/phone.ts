export function normalizeKuwaitMsisdn(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^965[569]\d{7}$/.test(digits)) return digits;
  if (/^[569]\d{7}$/.test(digits)) return `965${digits}`;
  return null;
}

export function normalizeMsisdn(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^05\d{8}$/.test(digits)) return `966${digits.slice(1)}`;
  if (/^5\d{8}$/.test(digits)) return `966${digits}`;
  if (/^9665\d{8}$/.test(digits)) return digits;
  return normalizeKuwaitMsisdn(input);
}

export function displayMsisdn(msisdn: string) {
  if (/^9665\d{8}$/.test(msisdn)) return `0${msisdn.slice(3)}`;
  if (/^965[569]\d{7}$/.test(msisdn)) return msisdn.slice(3);
  return msisdn;
}
