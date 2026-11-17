import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { ProductView, SavedNumberView } from "@/lib/types";
import { QuickPayCard } from "@/views/home/quick-pay";

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

  const cards = [
    {
      title: t("channelBillsTitle"),
      desc: t("channelBillsDesc"),
      cta: t("channelBillsCta"),
      href: "/bills",
      icon: "/icons/stc-pay-bills.svg",
    },
    {
      title: t("channelRechargeTitle"),
      desc: t("channelRechargeDesc"),
      cta: t("channelRechargeCta"),
      href: "/recharge",
      icon: "/icons/stc-recharge.svg",
    },
    {
      title: t("channelTerminatedTitle"),
      desc: t("channelTerminatedDesc"),
      cta: t("channelTerminatedCta"),
      href: "/terminated",
      icon: "/icons/stc-terminate.svg",
    },
  ];

  return (
    <div className="bg-white">
      {/* ——— Hero: title + image ——— */}
      <section className="mx-auto max-w-[1350px] px-5 pt-8 md:pt-12">
        <h1 className="text-[30px] font-bold leading-[40px] text-[#1d252d] md:text-[48px] md:leading-[58px]">
          {t("payChannelsHeroTitle")}
        </h1>
      </section>

      <section className="mx-auto max-w-[1350px] px-5 pt-8 pb-6 md:pt-12 md:pb-10">
        <img
          src="/home/payment/payment-hero.webp"
          alt=""
          className="w-full rounded-[15px] object-cover"
        />
      </section>

      {/* ——— Quick Pay ——— */}
      <section className="mx-auto max-w-[1350px] px-5 pb-10 md:pb-14">
        <div className="mx-auto max-w-[700px]">
          <QuickPayCard />
        </div>
      </section>

      {/* ——— Info Cards ——— */}
      <section className="mx-auto max-w-[1350px] px-5 pb-12 md:pb-20">
        <div className="grid gap-5 md:grid-cols-1 lg:grid-cols-3 lg:gap-7">
          {cards.map((card) => (
            <div
              key={card.title}
              className="relative flex h-[380px] flex-col bg-[#f3f3f1] px-[30px] pt-[30px] pb-[46px]"
            >
              <div className="flex justify-start">
                <img src={card.icon} alt="" className="h-12 w-12 object-contain" />
              </div>
              <h3 className="mt-10 text-[24px] font-medium leading-[32px] text-[#1d252d]">
                {card.title}
              </h3>
              <p className="mt-5 flex-1 text-[19px] font-normal leading-[30px] text-[#1d252d]">
                {card.desc}
              </p>
              <div className="absolute bottom-5 start-[30px]">
                <Link
                  href={card.href}
                  className="press inline-flex items-center justify-center rounded-md bg-primary px-8 py-3.5 text-[16px] font-bold text-white hover:bg-primary/90"
                >
                  {card.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ——— Need Help (pink/red gradient) ——— */}
      <section className="bg-primary px-5 py-12 text-center text-white md:py-16">
        <div className="mx-auto max-w-[1350px]">
          <h2 className="text-[24px] font-bold leading-[32px] md:text-[38px] md:leading-[48px]">
            {t("helpTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[16px] leading-[26px] text-white/90 md:text-[19px] md:leading-[30px]">
            {t("helpText")}
          </p>
          <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 md:gap-4">
            <Link
              href="/support"
              className="press flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3.5 text-[14px] font-bold text-[#1d252d] md:px-6 md:py-4 md:text-[16px]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M15 11.5v-2a5 5 0 0 0-10 0v2" stroke="#1d252d" strokeWidth="1.5" fill="none" />
                <rect x="2" y="10.5" width="4" height="5" rx="1.5" stroke="#1d252d" strokeWidth="1.5" fill="none" />
                <rect x="14" y="10.5" width="4" height="5" rx="1.5" stroke="#1d252d" strokeWidth="1.5" fill="none" />
              </svg>
              {t("call")}
            </Link>
            <Link
              href="/support"
              className="press flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3.5 text-[14px] font-bold text-[#1d252d] md:px-6 md:py-4 md:text-[16px]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 12.5l-2 3.5 3.5-1.2A7 7 0 1 0 5 12.5z" stroke="#1d252d" strokeWidth="1.5" fill="none" />
              </svg>
              {t("chat")}
            </Link>
            <Link
              href="/support"
              className="press flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3.5 text-[14px] font-bold text-[#1d252d] md:px-6 md:py-4 md:text-[16px]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M7 8v-2a3 3 0 0 1 6 0v2" stroke="#1d252d" strokeWidth="1.5" fill="none" />
                <rect x="3" y="8" width="14" height="10" rx="2" stroke="#1d252d" strokeWidth="1.5" fill="none" />
                <circle cx="10" cy="13" r="1.5" fill="#1d252d" />
              </svg>
              {t("helpCenter")}
            </Link>
            <Link
              href="/support"
              className="press flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3.5 text-[14px] font-bold text-[#1d252d] md:px-6 md:py-4 md:text-[16px]"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 2C6.5 2 3.5 5 3.5 8.5S10 18 10 18s6.5-6.5 6.5-9.5S13.5 2 10 2z" stroke="#1d252d" strokeWidth="1.5" fill="none" />
                <circle cx="10" cy="8.5" r="2" stroke="#1d252d" strokeWidth="1.5" fill="none" />
              </svg>
              {t("locate")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
