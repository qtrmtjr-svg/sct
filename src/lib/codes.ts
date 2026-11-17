export const ERROR_CODES = [
  "invalid_phone",
  "invalid_amount",
  "rate_limited",
  "not_found",
  "voucher_invalid",
  "voucher_used",
  "no_bill",
  "invalid_login",
  "email_taken",
  "disabled_account",
  "generic",
  "invalid_email",
  "weak_password",
  "invalid_name",
  "invalid_message",
  "invalid_card",
  "invalid_otp",
  "noProduct",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export function isErrorCode(value: string): value is ErrorCode {
  return (ERROR_CODES as readonly string[]).includes(value);
}

export function toErrorCode(error: unknown): ErrorCode {
  if (error instanceof Error && isErrorCode(error.message)) return error.message;
  return "generic";
}

export type ActionResult =
  | { ok: true; orderId?: string }
  | { ok: false; code: ErrorCode };
