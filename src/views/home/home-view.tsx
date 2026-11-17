import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ProductView, SavedNumberView } from "@/lib/types";
import { QuickPayCard } from "@/views/home/quick-pay";

const channels = [
  { key: "channelQuickPay", desc: "channelQuickPayDesc", href: "/quick-pay", cta: "payNow", icon: "/icons/stc-recharge.svg" },
  { key: "channelBills", desc: "channelBillsDesc", href: "/bills", cta: "payNow", icon: "/icons/stc-pay-bills.svg" },
  { key: "channelRecharge", desc: "channelRechargeDesc", href: "/recharge", cta: "payNow", icon: "/icons/stc-card.svg" },
  { key: "channelApp", desc: "channelAppDesc", href: "/support", cta: "downloadApp", icon: "/icons/stc-technology.svg" },
  { key: "channelKnet", desc: "channelKnetDesc", href: "/quick-pay", cta: "payNow", icon: "/icons/stc-cart.svg" },
  { key: "channelPackages", desc: "channelPackagesDesc", href: "/packages", cta: "learnMore", icon: "/icons/stc-track.svg" },
  { key: "channelVoucher", desc: "channelVoucherDesc", href: "/voucher", cta: "payNow", icon: "/icons/stc-terminate.svg" },
  { key: "channelBranches", desc: "channelBranchesDesc", href: "/support", cta: "learnMore", icon: "/icons/stc-location.svg" },
  { key: "channelSupport", desc: "channelSupportDesc", href: "/support", cta: "learnMore", icon: "/icons/stc-headphones.svg" },
] as const;

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
      {/* ——— Hero Section (StcHeaderHero style) ——— */}
      <section className="mx-auto w-full max-w-[1350px] px-5 pt-10 pb-12 md:pt-12 md:pb-20 lg:px-5">
        <div className={`flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 ${isRtl ? "" : ""}`}>
          <div className="w-full lg:w-1/2">
            <h1
              className="text-[30px] font-medium leading-[36px] text-[#1d252d] lg:text-[48px] lg:leading-[56px]"
              style={{ fontFamily: "var(--font-plex), sans-serif" }}
            >
              {t("payChannelsHeroTitle")}
            </h1>
            <ul className="mt-5 flex flex-col gap-4">
              {(["payChannelsHeroFeature1", "payChannelsHeroFeature2", "payChannelsHeroFeature3"] as const).map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="12" fill="#4F008C" />
                      <path d="M7 12l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-[14px] leading-[22px] tracking-[0.5px] text-[#575f63] md:text-[19px] md:leading-[30px]">
                    {t(key)}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/quick-pay"
              className="press mt-8 inline-flex items-center gap-2 rounded bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 md:text-base"
            >
              {t("payNow")}
            </Link>
          </div>
          <div className="w-full lg:w-1/2">
            <img
              src="/home/payment/payment-hero.webp"
              alt=""
              className="w-full rounded-[15px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* ——— Quick Pay Embed (StcEmbedQuickpay style) ——— */}
      <section className="bg-white py-10 md:py-12">
        <div className="mx-auto flex max-w-[1350px] flex-col items-center gap-8 px-5 lg:flex-row lg:gap-12">
          <div className="w-full max-w-md lg:w-1/2 lg:max-w-none">
            <div className="rise-in">
              <QuickPayCard />
            </div>
          </div>
          <div className="hidden lg:flex lg:w-1/2 lg:justify-center">
            <img
              src="/home/payment/quick-payment.webp"
              alt=""
              className="max-h-[280px] w-auto object-contain"
            />
          </div>
        </div>
      </section>

      {/* ——— Payment Channels Grid (StcGrid + StcInfoCard style) ——— */}
      <section className="pb-12 md:pb-24">
        <div className="mx-auto max-w-[1350px] px-5">
          <div className="mb-5 flex flex-col gap-1 md:gap-5">
            <h2 className="text-[24px] font-medium leading-[32px] text-[#1d252d] md:text-[38px] md:leading-[48px]">
              {t("payChannelsTitle")}
            </h2>
            <p className="text-[14px] leading-[22px] tracking-[0.5px] text-[#575f63] md:text-[19px] md:leading-[30px]">
              {t("payChannelsSubtitle")}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 lg:gap-8">
            {channels.map((channel) => (
              <Link
                key={channel.key}
                href={channel.href}
                className="lift group relative flex h-[340px] flex-col rounded-none bg-[#f3f3f1] px-[30px] pt-[30px] pb-5 sm:h-[380px]"
              >
                <img
                  src={channel.icon}
                  alt=""
                  className="h-12 w-12 object-contain"
                  style={{ color: "#4F008C" }}
                />
                <h3 className="mt-8 text-[24px] font-medium leading-[32px] text-[#1d252d] sm:mt-10">
                  {t(channel.key)}
                </h3>
                <p className="mt-4 text-[14px] leading-[22px] tracking-[0.5px] text-[#575f63] sm:text-[19px] sm:leading-[30px]">
                  {t(channel.desc)}
                </p>
                <span className="mt-auto inline-flex items-center gap-2 self-start text-[14px] font-bold tracking-[0.5px] text-brand group-hover:text-primary">
                  {t(channel.cta)}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={isRtl ? "rotate-180" : ""} aria-hidden="true">
                    <path d="M5 2.5l4.5 4.5L5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ——— Need Help Section ——— */}
      <section className="bg-[#f3f3f1]">
        <div className="mx-auto max-w-[1350px] px-5 py-12 md:py-20">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start lg:gap-16">
            <div className="hidden md:block md:w-2/5">
              <img
                src="/home/payment/need-help.webp"
                alt=""
                className="w-full max-w-[400px] rounded-[15px] object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-[24px] font-medium leading-[32px] text-[#1d252d] md:text-[38px] md:leading-[48px]">
                {t("helpTitle")}
              </h2>
              <p className="mt-3 text-[14px] leading-[22px] tracking-[0.5px] text-[#575f63] md:text-[19px] md:leading-[30px]">
                {t("helpText")}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap">
                <Link
                  href="/support"
                  className="lift flex items-center justify-center gap-2 rounded-none border border-[#e6e6e6] bg-white px-5 py-4 text-[14px] font-bold tracking-[0.5px] text-[#1d252d] hover:border-brand hover:text-brand sm:px-8"
                >
                  <img src="/icons/stc-message.svg" alt="" className="h-5 w-5" />
                  {t("chat")}
                </Link>
                <Link
                  href="/support"
                  className="lift flex items-center justify-center gap-2 rounded-none border border-[#e6e6e6] bg-white px-5 py-4 text-[14px] font-bold tracking-[0.5px] text-[#1d252d] hover:border-brand hover:text-brand sm:px-8"
                >
                  <img src="/icons/stc-headphones.svg" alt="" className="h-5 w-5" />
                  {t("call")}
                </Link>
                <Link
                  href="/support"
                  className="lift flex items-center justify-center gap-2 rounded-none border border-[#e6e6e6] bg-white px-5 py-4 text-[14px] font-bold tracking-[0.5px] text-[#1d252d] hover:border-brand hover:text-brand sm:px-8"
                >
                  <img src="/icons/stc-location.svg" alt="" className="h-5 w-5" />
                  {t("locate")}
                </Link>
                <Link
                  href="/support"
                  className="lift flex items-center justify-center gap-2 rounded-none border border-[#e6e6e6] bg-white px-5 py-4 text-[14px] font-bold tracking-[0.5px] text-[#1d252d] hover:border-brand hover:text-brand sm:px-8"
                >
                  <img src="/icons/stc-help-center.svg" alt="" className="h-5 w-5" />
                  {t("helpCenter")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— App Download Section ——— */}
      <section className="bg-brand py-12 text-white md:py-16">
        <div className="mx-auto max-w-[1350px] px-5 text-center">
          <h2 className="text-[24px] font-medium leading-[32px] md:text-[38px] md:leading-[48px]">
            {t("channelApp")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-[22px] text-white/80 md:text-[19px] md:leading-[30px]">
            {t("channelAppDesc")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <img src="/icons/appstore-ar.svg" alt="App Store" className="h-10 md:h-12" />
            <img src="/icons/googleplay-ar.svg" alt="Google Play" className="h-10 md:h-12" />
            <img src="/icons/huawei-ar.svg" alt="Huawei AppGallery" className="h-10 md:h-12" />
          </div>
        </div>
      </section>
    </div>
  );
}
