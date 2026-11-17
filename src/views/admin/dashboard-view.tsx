import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** Lightweight overview (optional route). Main entry is /admin/approvals. */
export async function AdminDashboard({ online, pendingKnet }: { online: number; pendingKnet: number }) {
  const t = await getTranslations("admin");

  const tiles = [
    {
      href: "/admin/approvals",
      title: t("approvals"),
      value: String(pendingKnet),
      hint: t("approvalsHintShort"),
      primary: true,
    },
    {
      href: "/admin/live",
      title: t("visitors"),
      value: String(online),
      hint: t("liveTableHint"),
      primary: false,
    },
  ] as const;

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
        <p className="mt-1 text-sm text-muted">{t("homeHintShort")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className={`rounded-2xl border p-6 transition-shadow hover:shadow-md ${tile.primary ? "border-brand bg-brand/5" : "border-border bg-white"}`}
          >
            <p className="text-sm font-semibold text-muted">{tile.title}</p>
            <p className="mt-2 text-4xl font-bold text-brand">{tile.value}</p>
            <p className="mt-2 text-sm text-ink">{tile.hint}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
