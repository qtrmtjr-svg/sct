"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { adminLogoutAction } from "@/server/admin-actions";

const links = [
  { href: "/admin/approvals", key: "approvals" },
  { href: "/admin/live", key: "visitors" },
  { href: "/admin/orders", key: "knetOrders" },
  { href: "/admin/users", key: "admins" },
] as const;

export function AdminNav({ admin, locale }: { admin: { name: string; email: string }; locale: string }) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const logout = () =>
    startTransition(async () => {
      await adminLogoutAction();
      router.replace(`/${locale}/admin/login`);
      router.refresh();
    });

  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="rounded-xl bg-brand px-3 py-2 text-white">
          <p className="text-[10px] uppercase tracking-wide text-white/70">{t("title")}</p>
          <p className="truncate text-sm font-bold leading-tight">{admin.name || "Admin"}</p>
        </div>
        <p className="hidden truncate text-xs text-muted sm:block" dir="ltr">
          {admin.email}
        </p>
      </div>
      <nav className="flex flex-wrap items-center gap-2">
        {links.map((link) => {
          const active =
            link.href === "/admin/approvals"
              ? pathname === "/admin/approvals" || pathname === "/admin"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${active ? "bg-brand text-white" : "bg-surface text-ink"}`}
            >
              {t(link.key)}
            </Link>
          );
        })}
        <button
          id="admin-logout"
          type="button"
          onClick={logout}
          disabled={pending}
          className="rounded-xl bg-surface px-3 py-2 text-sm font-semibold text-danger disabled:opacity-60"
        >
          {t("logout")}
        </button>
      </nav>
    </header>
  );
}
