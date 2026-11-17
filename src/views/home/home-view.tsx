import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatKwd } from "@/lib/money";
import type { ProductView, SavedNumberView } from "@/lib/types";
import { DeviceShelf } from "@/views/home/device-shelf";
import { HomeHero } from "@/views/home/home-hero";
import { QuickPayCard } from "@/views/home/quick-pay";
import { VoucherShelf } from "@/views/home/voucher-shelf";

const promoOffers = [
  { eyebrow: "offer1Eyebrow", title: "offer1Title", text: "offer1Text", cta: "buy", href: "/packages", image: "/home/watch.jpg" },
  { eyebrow: "offer2Eyebrow", title: "offer2Title", text: "offer2Text", cta: "buy", href: "/packages", image: "/home/fold-phone.jpg" },
  { eyebrow: "offer3Eyebrow", title: "offer3Title", text: "offer3Text", cta: "add", href: "/packages", image: "/home/band.jpg" },
  { eyebrow: "offer4Eyebrow", title: "offer4Title", text: "offer4Text", cta: "viewAll", href: "/recharge", image: "/home/offers.jpg" },
] as const;

const categories = [
  { href: "/packages", key: "catDevices", sub: "catDevicesSub", className: "bg-brand", image: "/home/phone.jpg" },
  { href: "/bills", key: "catPostpaid", sub: "catPostpaidSub", className: "bg-[#6d28d9]", image: "/home/fold-phone.jpg" },
  { href: "/recharge", key: "catPrepaid", sub: "catPrepaidSub", className: "bg-[#7c3aed]", image: "/home/voucher-stc.jpg" },
  { href: "/packages?category=data", key: "catInternet", sub: "catInternetSub", className: "bg-[#1d4e89]", image: "/home/router.jpg" },
  { href: "/packages?category=data", key: "catOutdoor", sub: "catOutdoorSub", className: "bg-[#0f3a5f]", image: "/home/router.jpg" },
  { href: "/packages?category=data", key: "catFiber", sub: "catFiberSub", className: "bg-[#0e7490]", image: "/home/fiber.jpg" },
  { href: "/packages?category=social", key: "catYouth", sub: "catYouthSub", className: "bg-primary", image: "/home/buds.jpg" },
  { href: "/voucher", key: "catNumbers", sub: "catNumbersSub", className: "bg-[#1d252d]", image: "/home/offers.jpg" },
] as const;

const networks = [
  { href: "/packages?category=data", title: "netFiber", text: "netFiberText", image: "/home/fiber.jpg" },
  { href: "/packages?category=data", title: "netFive", text: "netFiveText", image: "/home/router.jpg" },
  { href: "/packages?category=roaming", title: "netOut", text: "netOutText", image: "/home/router.jpg" },
] as const;

const planImages: Record<string, string> = {
  data: "/home/router.jpg",
  social: "/home/buds.jpg",
  voice: "/home/phone.jpg",
  roaming: "/home/fold-phone.jpg",
};

export async function HomeView({
  locale,
  packages,
  savedNumbers,
}: {
  locale: string;
  topups?: ProductView[];
  packages: ProductView[];
  savedNumbers: SavedNumberView[];
}) {
  const t = await getTranslations("home");
  const nav = await getTranslations("nav");
  const slides = [
    { kicker: t("s1kicker"), title: t("s1title"), cta: t("s1cta"), href: "/recharge", image: "/home/hero-phone.jpg" },
    { kicker: t("s2kicker"), title: t("s2title"), cta: t("s2cta"), href: "/packages", image: "/home/fold-phone.jpg" },
    { kicker: t("s3kicker"), title: t("s3title"), cta: t("s3cta"), href: "/packages?category=data", image: "/home/router.jpg" },
    { kicker: t("s4kicker"), title: t("s4title"), cta: t("s4cta"), href: "/packages", image: "/home/watch.jpg" },
  ];
  const banners = [
    { href: "/packages", image: "/home/banners/02-iphone-series.avif", label: "iPhone 18 Pro" },
    { href: "/packages", image: "/home/banners/01-iphone-pro.avif", label: "iPhone Duo" },
    { href: "/packages", image: "/home/banners/03-watch.avif", label: "Watch" },
    { href: "/packages", image: "/home/banners/04-airpods.avif", label: "AirPods" },
    { href: "/packages?category=data", image: "/home/banners/05-baity.avif", label: "Baity 5G" },
    { href: "/voucher", image: "/home/banners/06-tod.avif", label: "TOD" },
    { href: "/packages", image: "/home/banners/07-samsung.avif", label: "Galaxy" },
    { href: "/voucher", image: "/home/banners/08-taly.avif", label: "Taly" },
    { href: "/packages", image: "/home/banners/09-qitaf.avif", label: "Qitaf" },
    { href: "/packages", image: "/home/banners/10-always.avif", label: "stc" },
    { href: "/packages", image: "/home/banners/11-offers.avif", label: "Offers" },
    { href: "/packages", image: "/home/banners/12-youth.avif", label: "Youth" },
  ];
  const shortcuts = [
    { href: "/packages", label: t("lineTitle"), icon: "/icons/sim.svg" },
    { href: "/packages", label: t("switchTitle"), icon: "/icons/switch.svg" },
    { href: "/support", label: nav("civil"), icon: "/icons/civil.svg" },
    { href: "/packages", label: t("eStore"), icon: "/icons/store.svg" },
  ] as const;

  return (
    <div className="bg-white">
      <section className="mx-auto grid max-w-[1200px] gap-4 px-4 py-4 sm:py-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-stretch">
        <div className="order-1 min-w-0 lg:order-2">
          <HomeHero slides={slides} banners={banners} />
        </div>
        <div className="order-2 grid grid-cols-4 gap-2 lg:hidden">
          {shortcuts.map((item) => (
            <Link key={item.label} href={item.href} className="flex flex-col items-center gap-2 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-[#00c48c]">
                <img src={item.icon} alt="" className="h-6 w-6" />
              </span>
              <span className="text-[11px] font-semibold leading-4 text-ink">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="order-3 grid content-start gap-3 lg:order-1">
          <div className="rise-in">
            <QuickPayCard />
          </div>
          {savedNumbers.length > 0 ? (
            <p className="px-1 text-xs text-muted">{savedNumbers.map((number) => number.displayNumber).join(" · ")}</p>
          ) : null}
          <Link href="/packages" className="rise-in delay-1 lift group hidden rounded-2xl border border-[#ededed] bg-white p-4 shadow-[0_8px_24px_rgba(29,37,45,0.06)] lg:block">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("switchTitle")}</h2>
              <SimIcon />
            </div>
            <p className="mt-2 text-sm text-muted">{t("switchText")}</p>
            <span className="mt-4 flex w-full items-center justify-center rounded-lg border border-primary py-2.5 text-sm font-semibold text-primary group-hover:bg-primary group-hover:text-white">
              {t("switchCta")}
            </span>
          </Link>
          <Link href="/packages" className="rise-in delay-2 lift group hidden rounded-2xl bg-brand p-4 text-white shadow-[0_8px_24px_rgba(79,0,140,0.18)] lg:block">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t("lineTitle")}</h2>
              <span className="h-10 w-14 rounded-md bg-gradient-to-br from-[#ffe08a] to-[#f5a623]" />
            </div>
            <p className="mt-2 text-sm text-white/80">{t("lineText")}</p>
            <span className="mt-4 flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-white">
              {t("lineCta")}
            </span>
          </Link>
        </div>
      </section>

      <section className="reveal mx-auto max-w-[1200px] px-4 py-8">
        <h2 className="text-center text-2xl font-bold sm:text-3xl lg:text-start">{t("offers")}</h2>
        <div className="mt-5 flex flex-col gap-3 lg:grid lg:grid-cols-4">
          {promoOffers.map((offer) => (
            <Link
              key={offer.title}
              href={offer.href}
              className="lift group flex items-center gap-4 rounded-3xl bg-brand p-4 text-white lg:min-h-[300px] lg:flex-col lg:items-stretch lg:p-5"
            >
              <div className="min-w-0 flex-1 lg:flex-none">
                <p className="text-xs text-white/70">{t(offer.eyebrow)}</p>
                <p className="mt-2 text-xl font-bold leading-tight lg:text-2xl">{t(offer.title)}</p>
                <p className="mt-2 text-sm text-white/75">{t(offer.text)}</p>
                <span className="mt-4 inline-flex w-fit rounded-lg bg-primary px-4 py-2 text-sm font-semibold">{t(offer.cta)}</span>
              </div>
              <img src={offer.image} alt="" className="h-24 w-24 shrink-0 rounded-xl bg-white object-contain lg:mt-auto lg:h-32 lg:w-full lg:rounded-2xl" />
            </Link>
          ))}
        </div>
      </section>

      <DeviceShelf locale={locale} />

      <section className="reveal lg:mx-auto lg:max-w-[1200px] lg:px-4 lg:py-8">
        <div className="lg:grid lg:items-center lg:gap-6 lg:overflow-hidden lg:rounded-[28px] lg:bg-[#f6f6f7] lg:px-6 lg:py-8 lg:grid-cols-2">
          <img src="/home/watches-banner.jpg" alt="" className="h-64 w-full object-cover sm:h-80 lg:h-64 lg:rounded-2xl lg:transition lg:duration-700 lg:ease-out lg:hover:scale-[1.03]" />
          <div className="px-4 py-6 text-center lg:px-0 lg:py-0 lg:text-start">
            <p className="hidden text-sm font-semibold text-muted lg:block">{t("bannerKicker")}</p>
            <h2 className="text-3xl font-bold leading-snug">{t("bannerTitle")}</h2>
            <Link href="/packages" className="press mt-5 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
              {t("buy")}
            </Link>
          </div>
        </div>
      </section>

      <section className="reveal mx-auto hidden max-w-[1200px] px-4 py-4 lg:block">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("plansReady")}</h2>
          <Link href="/packages" className="text-sm font-semibold text-brand">
            {t("seeAll")}
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {packages.map((plan) => (
            <Link key={plan.id} href={`/packages?category=${plan.category ?? "data"}`} className="lift group overflow-hidden rounded-2xl border border-[#ededed] bg-white">
              <img src={planImages[plan.category ?? ""] ?? "/home/phone.jpg"} alt="" className="h-32 w-full bg-[#f6f6f7] object-contain transition duration-500 ease-out group-hover:scale-105" />
              <div className="p-4">
                <p className="text-xs font-semibold uppercase text-primary">{plan.category}</p>
                <p className="mt-2 text-lg font-bold">{plan.name}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{plan.description}</p>
                <p className="mt-3 font-semibold">{formatKwd(plan.amountHalalas, locale)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <VoucherShelf />

      <section className="reveal pb-8 lg:mx-auto lg:max-w-[1200px] lg:px-4">
        <Link href="/packages?category=data" className="relative mx-4 block overflow-hidden rounded-2xl bg-[#f4f0f8] lg:hidden">
          <img src="/home/router.jpg" alt="" className="h-64 w-full object-contain" />
          <div className="px-4 pb-6 text-center">
            <h2 className="text-xl font-bold">{t("internetQ")}</h2>
            <span className="press mt-4 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white">{t("knowMore")}</span>
          </div>
        </Link>
        <div className="hidden rounded-[28px] border border-[#ededed] px-6 py-8 lg:block">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="text-xl font-bold sm:text-2xl">{t("internetQ")}</h2>
            <Link href="/packages?category=data" className="press rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
              {t("knowMore")}
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {networks.map((item) => (
              <Link key={item.title} href={item.href} className="lift group overflow-hidden rounded-2xl bg-[#f6f6f7]">
                <img src={item.image} alt="" className="h-28 w-full object-contain transition duration-500 ease-out group-hover:scale-105" />
                <div className="p-4">
                  <p className="text-lg font-bold">{t(item.title)}</p>
                  <p className="mt-1 text-sm text-muted">{t(item.text)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="reveal mx-auto max-w-[1200px] px-4 py-6">
        <h2 className="text-center text-2xl font-bold sm:text-3xl lg:text-start">{t("byCategory")}</h2>
        <div className="mt-4 flex snap-x gap-3 overflow-x-auto scroll-smooth pb-2">
          {categories.map((category) => (
            <Link
              key={category.key}
              href={category.href}
              className={`lift group relative flex h-44 w-40 shrink-0 snap-start flex-col justify-end overflow-hidden rounded-2xl p-4 text-white lg:justify-end ${category.className}`}
            >
              <img
                src={category.image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105 lg:static lg:mb-auto lg:h-16 lg:rounded-xl lg:bg-white lg:object-contain"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent lg:hidden" />
              <span className="relative z-10 text-base font-bold">{t(category.key)}</span>
              <span className="relative z-10 mt-1 text-xs text-white/75">{t(category.sub)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="reveal">
        <div className="bg-primary px-4 py-10 text-center text-white lg:hidden">
          <h2 className="text-2xl font-bold">{t("helpTitle")}</h2>
          <p className="mt-2 text-sm text-white/90">{t("helpText")}</p>
          <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-3">
            <Link href="/support" className="flex items-center justify-center gap-2 rounded-full bg-white px-3 py-3 text-sm font-semibold text-ink">
              <img src="/icons/help-call.svg" alt="" className="h-5 w-5" />
              {t("call")}
            </Link>
            <Link href="/support" className="flex items-center justify-center gap-2 rounded-full bg-white px-3 py-3 text-sm font-semibold text-ink">
              <img src="/icons/help-chat.svg" alt="" className="h-5 w-5" />
              {t("chat")}
            </Link>
            <Link href="/support" className="flex items-center justify-center gap-2 rounded-full bg-white px-3 py-3 text-sm font-semibold text-ink">
              <img src="/icons/help-support.svg" alt="" className="h-5 w-5" />
              {t("helpCenter")}
            </Link>
            <Link href="/support" className="flex items-center justify-center gap-2 rounded-full bg-white px-3 py-3 text-sm font-semibold text-ink">
              <img src="/icons/help-pin.svg" alt="" className="h-5 w-5" />
              {t("locate")}
            </Link>
          </div>
        </div>
        <div className="mx-auto hidden max-w-[1200px] px-4 py-10 lg:block">
          <h2 className="text-2xl font-bold">{t("helpTitle")}</h2>
          <p className="mt-2 text-sm text-muted">{t("helpText")}</p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["chat", "chat"],
                ["call", "call"],
                ["locate", "locate"],
                ["helpCenter", "helpCenter"],
              ] as const
            ).map(([key]) => (
              <Link key={key} href="/support" className="lift rounded-2xl border border-[#ededed] px-4 py-5 text-center text-sm font-semibold hover:border-brand hover:text-brand">
                {t(key)}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-brand">
            <Link href="/support">{t("live")}</Link>
            <Link href="/support">{t("rate")}</Link>
            <Link href="/support">{t("whatsapp")}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function SimIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-brand">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.6" />
      <rect x="8" y="11" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

