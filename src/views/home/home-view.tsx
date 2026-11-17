import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ProductView, SavedNumberView } from "@/lib/types";
import { QuickPayCard } from "@/views/home/quick-pay";

const channels = [
  { key: "channelQuickPay", desc: "channelQuickPayDesc", href: "/quick-pay", cta: "payNow", icon: "quick-pay" },
  { key: "channelBills", desc: "channelBillsDesc", href: "/bills", cta: "payNow", icon: "bills" },
  { key: "channelRecharge", desc: "channelRechargeDesc", href: "/recharge", cta: "payNow", icon: "recharge" },
  { key: "channelApp", desc: "channelAppDesc", href: "/support", cta: "downloadApp", icon: "app" },
  { key: "channelKnet", desc: "channelKnetDesc", href: "/quick-pay", cta: "payNow", icon: "knet" },
  { key: "channelPackages", desc: "channelPackagesDesc", href: "/packages", cta: "learnMore", icon: "packages" },
  { key: "channelVoucher", desc: "channelVoucherDesc", href: "/voucher", cta: "payNow", icon: "voucher" },
  { key: "channelBranches", desc: "channelBranchesDesc", href: "/support", cta: "learnMore", icon: "branches" },
  { key: "channelSupport", desc: "channelSupportDesc", href: "/support", cta: "learnMore", icon: "support" },
] as const;

const channelIcons: Record<string, React.ReactNode> = {
  "quick-pay": (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="22" stroke="#4F008C" strokeWidth="1.5" fill="none" />
      <path d="M16 20h16M16 24h12M16 28h8" stroke="#4F008C" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 28l4-4-4-4" stroke="#FF375E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bills: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="12" y="8" width="24" height="32" rx="3" stroke="#4F008C" strokeWidth="1.5" fill="none" />
      <path d="M18 16h12M18 21h12M18 26h8" stroke="#4F008C" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 32h4" stroke="#FF375E" strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="32" r="4" stroke="#FF375E" strokeWidth="1.5" fill="none" />
      <path d="M32 30v4M30 32h4" stroke="#FF375E" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  recharge: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="14" y="10" width="20" height="28" rx="3" stroke="#4F008C" strokeWidth="1.5" fill="none" />
      <path d="M20 14h8" stroke="#4F008C" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="26" r="6" stroke="#FF375E" strokeWidth="1.5" fill="none" />
      <path d="M24 23v6M21 26h6" stroke="#FF375E" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  app: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="14" y="8" width="20" height="32" rx="4" stroke="#4F008C" strokeWidth="1.5" fill="none" />
      <path d="M21 12h6" stroke="#4F008C" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="36" r="1.5" fill="#4F008C" />
      <path d="M20 22l4 4 4-4" stroke="#FF375E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 18v8" stroke="#FF375E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  knet: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="8" y="14" width="32" height="20" rx="3" stroke="#4F008C" strokeWidth="1.5" fill="none" />
      <path d="M8 20h32" stroke="#4F008C" strokeWidth="1.5" />
      <path d="M14 28h6" stroke="#FF375E" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 28h4" stroke="#4F008C" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  packages: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="10" y="12" width="28" height="24" rx="3" stroke="#4F008C" strokeWidth="1.5" fill="none" />
      <path d="M10 18h28" stroke="#4F008C" strokeWidth="1.5" />
      <circle cx="24" cy="28" r="5" stroke="#FF375E" strokeWidth="1.5" fill="none" />
      <path d="M24 25.5v5M21.5 28h5" stroke="#FF375E" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  voucher: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M10 16h28v4a4 4 0 0 0 0 8v4H10v-4a4 4 0 0 0 0-8z" stroke="#4F008C" strokeWidth="1.5" fill="none" />
      <path d="M22 16v16" stroke="#4F008C" strokeWidth="1.5" strokeDasharray="2 2" />
      <path d="M28 22l2 2-2 2" stroke="#FF375E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  branches: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 10c-6.627 0-12 5.373-12 12 0 9 12 18 12 18s12-9 12-18c0-6.627-5.373-12-12-12z" stroke="#4F008C" strokeWidth="1.5" fill="none" />
      <circle cx="24" cy="22" r="4" stroke="#FF375E" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  support: (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M14 26v-6a10 10 0 0 1 20 0v6" stroke="#4F008C" strokeWidth="1.5" fill="none" />
      <rect x="10" y="24" width="6" height="10" rx="2" stroke="#4F008C" strokeWidth="1.5" fill="none" />
      <rect x="32" y="24" width="6" height="10" rx="2" stroke="#4F008C" strokeWidth="1.5" fill="none" />
      <path d="M34 34c0 3-4.5 5-10 5" stroke="#FF375E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  ),
};

export async function HomeView({
  locale,
  packages: _packages,
  savedNumbers: _savedNumbers,
}: {
  locale: string;
  topups?: ProductView[];
  packages: ProductView[];
  savedNumbers: SavedNumberView[];
}) {
  const t = await getTranslations("home");
  const isRtl = locale === "ar";

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-[#f3f3f1]">
        <div className="mx-auto flex max-w-[1350px] flex-col items-center gap-8 px-5 py-10 md:py-16 lg:flex-row lg:gap-12 lg:py-20">
          <div className={`flex-1 ${isRtl ? "text-right" : "text-left"}`}>
            <h1 className="text-3xl font-medium leading-tight text-ink md:text-[42px] md:leading-[52px] lg:text-[48px] lg:leading-[58px]">
              {t("payChannelsHeroTitle")}
            </h1>
            <p className="mt-4 text-base leading-7 text-[#575f63] md:text-lg md:leading-8">
              {t("payChannelsHeroText")}
            </p>
            <ul className="mt-6 flex flex-col gap-4">
              {(["payChannelsHeroFeature1", "payChannelsHeroFeature2", "payChannelsHeroFeature3"] as const).map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-sm leading-6 text-ink md:text-base">{t(key)}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/quick-pay"
              className="press mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 md:text-base"
            >
              {t("payNow")}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={isRtl ? "rotate-180" : ""} aria-hidden="true">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
          <div className="flex-1">
            <img
              src="/home/hero-phone.jpg"
              alt=""
              className="mx-auto w-full max-w-[520px] rounded-2xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* Quick Pay Embed */}
      <section className="mx-auto max-w-[1350px] px-5 py-10 md:py-14">
        <div className="mx-auto max-w-md lg:max-w-lg">
          <div className="rise-in">
            <QuickPayCard />
          </div>
        </div>
      </section>

      {/* Payment Channels Title */}
      <section className="mx-auto max-w-[1350px] px-5">
        <h2 className="text-2xl font-medium text-ink md:text-[38px] md:leading-[48px]">
          {t("payChannelsTitle")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#575f63] md:text-lg md:leading-8">
          {t("payChannelsSubtitle")}
        </p>
      </section>

      {/* Payment Channels Grid */}
      <section className="mx-auto max-w-[1350px] px-5 pb-12 pt-6 md:pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <Link
              key={channel.key}
              href={channel.href}
              className="lift group flex h-[340px] flex-col rounded-2xl bg-[#f3f3f1] p-6 sm:h-[380px] sm:p-8"
            >
              <span className="text-brand">
                {channelIcons[channel.icon]}
              </span>
              <h3 className="mt-8 text-xl font-medium text-ink sm:mt-10 sm:text-2xl">
                {t(channel.key)}
              </h3>
              <p className="mt-4 flex-1 text-sm leading-6 text-[#575f63] sm:text-base sm:leading-7">
                {t(channel.desc)}
              </p>
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-brand group-hover:text-primary">
                {t(channel.cta)}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={isRtl ? "rotate-180" : ""} aria-hidden="true">
                  <path d="M5 2.5l4.5 4.5L5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Help Section */}
      <section className="bg-[#f3f3f1]">
        <div className="mx-auto max-w-[1350px] px-5 py-12 md:py-20">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:gap-12">
            <div className="flex-1">
              <h2 className="text-2xl font-medium text-ink md:text-[38px] md:leading-[48px]">
                {t("helpTitle")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#575f63] md:text-lg md:leading-8">
                {t("helpText")}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
                <Link
                  href="/support"
                  className="lift flex items-center justify-center gap-2 rounded-xl border border-[#e6e6e6] bg-white px-5 py-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 12.5l-2 3.5 3.5-1.2A7 7 0 1 0 5 12.5z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                  {t("chat")}
                </Link>
                <Link
                  href="/support"
                  className="lift flex items-center justify-center gap-2 rounded-xl border border-[#e6e6e6] bg-white px-5 py-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 8v-2a5 5 0 0 1 10 0v2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <rect x="2" y="8" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <rect x="14" y="8" width="4" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                  {t("call")}
                </Link>
                <Link
                  href="/support"
                  className="lift flex items-center justify-center gap-2 rounded-xl border border-[#e6e6e6] bg-white px-5 py-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 3c-3.5 0-6.5 3-6.5 6.5S10 17 10 17s6.5-4.5 6.5-7.5S13.5 3 10 3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <circle cx="10" cy="9.5" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                  {t("locate")}
                </Link>
                <Link
                  href="/support"
                  className="lift flex items-center justify-center gap-2 rounded-xl border border-[#e6e6e6] bg-white px-5 py-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    <path d="M10 7v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  </svg>
                  {t("helpCenter")}
                </Link>
              </div>
            </div>
            <div className="hidden flex-1 md:block">
              <img
                src="/home/watches-banner.jpg"
                alt=""
                className="w-full max-w-[480px] rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
