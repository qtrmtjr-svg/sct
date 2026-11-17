export function statusClass(status: string) {
  switch (status) {
    case "completed":
    case "paid":
      return "bg-emerald-50 text-success";
    case "awaiting_payment":
    case "fulfilling":
    case "refund_pending":
      return "bg-amber-50 text-warning";
    case "payment_failed":
    case "fulfillment_failed":
      return "bg-red-50 text-danger";
    case "refunded":
      return "bg-surface text-muted";
    default:
      return "bg-surface text-muted";
  }
}
