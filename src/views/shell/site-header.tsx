"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { LogoutButton } from "@/views/shell/logout-button";

const mainLinks = [
  { href: "/", key: "shop" },
  { href: "/packages", key: "packages" },
  { href: "/packages", key: "devices" },
  { href: "/recharge", key: "services" },
  { href: "/voucher", key: "entertainment" },
  { href: "/packages?category=data", key: "fiveG" },
] as const;

export function SiteHeader({
  user,
  locale,
}: {
  user: { email: string; name: string; role: string } | null;
  locale: string;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white">
      <div className="hidden bg-brand text-white lg:block">
        <div className="mx-auto flex h-9 max-w-[1200px] items-center gap-4 overflow-x-auto px-4 text-[11px] whitespace-nowrap sm:text-xs">
          <Link href="/" className="border-b-2 border-primary pb-0.5 font-semibold">
            {t("personal")}
          </Link>
          <Link href="/packages" className="opacity-80 hover:opacity-100">
            {t("business")}
          </Link>
          <Link href="/support" className="opacity-80 hover:opacity-100">
            {t("investors")}
          </Link>
          <Link href="/support" className="opacity-80 hover:opacity-100">
            {t("sustainability")}
          </Link>
          <div className="ms-auto flex items-center gap-4">
            <Link href="/support" className="hidden sm:inline">
              {t("helpCenter")}
            </Link>
            <Link href="/account/orders" className="hidden md:inline">
              {t("track")}
            </Link>
            <Link href="/account/orders" className="hidden lg:inline">
              {t("civil")}
            </Link>
            <Link href={pathname} locale={locale === "ar" ? "en" : "ar"} className="font-semibold">
              {locale === "ar" ? "English" : "عربي"}
            </Link>
          </div>
        </div>
      </div>
      <div className="border-b border-[#f0f0f0]">
        <div className="mx-auto flex h-14 max-w-[1200px] items-stretch lg:h-[72px] lg:items-center lg:gap-5 lg:px-4">
          <button
            type="button"
            className="grid w-14 shrink-0 place-items-center border-e border-[#ededed] text-brand lg:hidden"
            aria-expanded={open}
            aria-label={open ? t("closeMenu") : t("openMenu")}
            onClick={() => setOpen((value) => !value)}
          >
            <MenuToggleIcon open={open} />
          </button>
          <Link href="/" className="flex items-center px-3 lg:px-0">
            <img src="/icons/logo-purple.svg" alt="stc" className="h-7 w-auto lg:h-8" />
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-semibold lg:flex">
            {mainLinks.map((link) => (
              <Link key={link.key} href={link.href} className="inline-flex items-center gap-1 hover:text-brand">
                {t(link.key)}
                {link.key === "fiveG" ? (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">{t("badgeNew")}</span>
                ) : null}
              </Link>
            ))}
          </nav>
          <div className="ms-auto flex items-stretch lg:items-center lg:gap-3">
            <button
              type="button"
              aria-label={t("search")}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((value) => !value)}
              className="grid w-12 place-items-center border-s border-[#ededed] hover:bg-[#f6f4f8] lg:h-10 lg:w-10 lg:rounded-full lg:border-0"
            >
              <img src="/icons/search.svg" alt="" className="h-[18px] w-[18px]" />
            </button>
            <Link
              href={user ? "/account/orders" : "/login"}
              aria-label={t("cart")}
              className="grid w-12 place-items-center border-s border-[#ededed] hover:bg-[#f6f4f8] lg:h-10 lg:w-10 lg:rounded-full lg:border-0"
            >
              <img src="/icons/cart.svg" alt="" className="h-[18px] w-[18px]" />
            </Link>
            <Link
              href={user ? "/account/orders" : "/login"}
              aria-label={user ? t("account") : t("login")}
              className="grid w-12 place-items-center border-s border-[#ededed] text-primary hover:bg-[#f6f4f8] lg:hidden"
            >
              <UserIcon />
            </Link>
            <Link
              href="/bills"
              className="press hidden items-center gap-1 rounded-full border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white lg:inline-flex"
            >
              {t("epay")}
            </Link>
            <Link
              href={user ? "/account/orders" : "/login"}
              className="press hidden items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary/90 lg:inline-flex"
            >
              <UserIcon />
              <span>{user ? t("account") : t("login")}</span>
            </Link>
          </div>
        </div>
        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${searchOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <form
            inert={!searchOpen}
            className="overflow-hidden border-t border-[#f3f3f3] bg-white"
            onSubmit={(event) => {
              event.preventDefault();
              setSearchOpen(false);
              router.push(query.trim() ? "/packages" : "/recharge");
            }}
          >
            <div className="mx-auto flex max-w-[1200px] items-center gap-2 px-4 py-3">
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("search")}
                className="h-11 flex-1 rounded-full border border-[#e6e6e6] px-4 text-sm outline-none focus:border-primary"
              />
              <button type="submit" className="press rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                {t("search")}
              </button>
            </div>
          </form>
        </div>
        <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out lg:hidden ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <nav inert={!open} className="overflow-hidden border-t border-[#f3f3f3] bg-white">
            <div className="mx-auto grid max-w-[1200px] px-2 py-2">
              {mainLinks.map((link) => (
                <Link key={link.key} href={link.href} className="rounded-xl px-3 py-3 text-base font-semibold hover:bg-[#f6f4f8] hover:text-brand">
                  {t(link.key)}
                </Link>
              ))}
              <Link href="/bills" className="rounded-xl px-3 py-3 text-base font-semibold hover:bg-[#f6f4f8] hover:text-brand">
                {t("epay")}
              </Link>
              <Link href="/support" className="rounded-xl px-3 py-3 text-base font-semibold hover:bg-[#f6f4f8] hover:text-brand">
                {t("support")}
              </Link>
              {user?.role === "admin" ? (
                <Link href="/admin" className="rounded-xl px-3 py-3 text-base font-semibold hover:bg-[#f6f4f8] hover:text-brand">
                  {t("admin")}
                </Link>
              ) : null}
              {user ? (
                <LogoutButton label={t("logout")} locale={locale} />
              ) : (
                <Link href="/register" className="rounded-xl px-3 py-3 text-base font-semibold hover:bg-[#f6f4f8] hover:text-brand">
                  {t("register")}
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
      <Link
        href="/support"
        aria-label={t("support")}
        className="press fixed bottom-5 end-5 z-30 grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 hover:shadow-xl lg:bg-primary"
      >
        <ChatIcon />
      </Link>
    </header>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M18.579 12C21.02 12 23 13.79 23 16v4c0 2.21-1.98 4-4.421 4H2v-8c0-2.21 1.98-4 4.421-4zm.154 2H6.267C5.015 14 4 14.895 4 16v6h14.733C19.985 22 21 21.105 21 20v-4c0-1.105-1.015-2-2.267-2M12.5 0a5.5 5.5 0 1 1 0 11 5.5 5.5 0 1 1 0-11m0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7"
      />
    </svg>
  );
}

function MenuToggleIcon({ open }: { open: boolean }) {
  return (
    <svg width="24" height="21" viewBox="0 0 24 21" aria-hidden="true" className="h-[21px] w-6 overflow-visible">
      <rect
        width="24"
        height="2"
        y="0.5"
        fill="#4F008C"
        className="transition-transform duration-300 ease-in-out motion-reduce:transition-none"
        style={{
          transformBox: "view-box",
          transformOrigin: "12px 1.5px",
          transform: open ? "translateY(9px) rotate(45deg)" : "translateY(0px) rotate(0deg)",
        }}
      />
      <rect
        width="24"
        height="2"
        y="9.5"
        fill="#4F008C"
        className="transition-[opacity,transform] duration-200 ease-in-out motion-reduce:transition-none"
        style={{
          transformBox: "view-box",
          transformOrigin: "12px 10.5px",
          opacity: open ? 0 : 1,
          transform: open ? "scaleX(0)" : "scaleX(1)",
        }}
      />
      <rect
        width="16"
        height="2"
        y="18.5"
        fill="#4F008C"
        className="transition-transform duration-300 ease-in-out motion-reduce:transition-none"
        style={{
          transformBox: "view-box",
          transformOrigin: "0px 19.5px",
          transform: open
            ? "translate(3.515px, -0.515px) rotate(-45deg) scaleX(1.5)"
            : "translate(0px, 0px) rotate(0deg) scaleX(1)",
        }}
      />
      <rect
        x="19"
        width="2"
        height="2"
        y="18.5"
        fill="#4F008C"
        className="transition-opacity duration-150 ease-out motion-reduce:transition-none"
        style={{ opacity: open ? 0 : 1 }}
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 16.5 4 20l4.2-1.4A8 8 0 1 0 6 16.5z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
