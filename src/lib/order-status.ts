const REFUNDABLE = new Set(["completed", "fulfillment_failed"]);

export function canPay(status: string) {
  return status === "awaiting_payment";
}

export function canRetry(status: string) {
  return status === "fulfillment_failed";
}

export function canRequestRefund(status: string) {
  return REFUNDABLE.has(status);
}

export function canMarkRefunded(status: string) {
  return status === "refund_pending";
}
