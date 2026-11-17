"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatKwd } from "@/lib/money";

const filters = ["filterSmart", "filterTablets", "filterRouters", "filterGaming", "filterAccessories"] as const;

const items = [
  { id: "phone", filter: "filterSmart", name: "devPhone", price: 24900, badge: "new", image: "/home/phone.jpg" },
  { id: "watch", filter: "filterSmart", name: "devWatch", price: 8900, badge: "preorder", image: "/home/watch.jpg" },
  { id: "buds", filter: "filterSmart", name: "devBuds", price: 1900, badge: "new", image: "/home/buds.jpg" },
  { id: "band", filter: "filterSmart", name: "devBand", price: 1200, badge: "new", image: "/home/band.jpg" },
  { id: "tablet", filter: "filterTablets", name: "devTablet", price: 15900, badge: "new", image: "/home/tablet.jpg" },
  { id: "mini", filter: "filterTablets", name: "devTabletMini", price: 9900, badge: "preorder", image: "/home/tablet.jpg" },
  { id: "router", filter: "filterRouters", name: "devRouter", price: 4500, badge: "new", image: "/home/router.jpg" },
  { id: "fiber", filter: "filterRouters", name: "devFiberBox", price: 0, badge: "new", image: "/home/fiber.jpg" },
  { id: "hand", filter: "filterGaming", name: "devHandheld", price: 12900, badge: "preorder", image: "/home/handheld.jpg" },
  { id: "headset", filter: "filterGaming", name: "devHeadset", price: 2400, badge: "new", image: "/home/headset.jpg" },
  { id: "case", filter: "filterAccessories", name: "devCase", price: 400, badge: "new", image: "/home/case.jpg" },
  { id: "charger", filter: "filterAccessories", name: "devCharger", price: 700, badge: "new", image: "/home/charger.jpg" },
] as const;

export function DeviceShelf({ locale }: { locale: string }) {
  const t = useTranslations("home");
  const [active, setActive] = useState<(typeof filters)[number]>("filterSmart");
  const [page, setPage] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const visible = items.filter((item) => item.filter === active);

  useEffect(() => {
    setPage(0);
    scroller.current?.scrollTo({ left: 0 });
  }, [active]);

  function syncPage() {
    const el = scroller.current;
    if (!el || visible.length <= 1) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 0) return;
    const ratio = Math.min(1, Math.abs(el.scrollLeft) / max);
    setPage(Math.round(ratio * (visible.length - 1)));
  }

  function goTo(index: number) {
    const child = scroller.current?.children[index] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setPage(index);
  }

  return (
    <section className="reveal mx-auto max-w-[1200px] px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold sm:text-3xl">{t("devices")}</h2>
        <Link href="/packages" className="hidden text-sm font-semibold text-brand lg:inline">
          {t("seeAll")}
        </Link>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto scroll-smooth pb-1">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActive(filter)}
            className={`pill shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${
              active === filter ? "bg-brand text-white" : "border border-[#e6e6e6] bg-white text-ink hover:border-brand"
            }`}
          >
            {t(filter)}
          </button>
        ))}
      </div>
      <div
        key={active}
        ref={scroller}
        onScroll={syncPage}
        className="shelf-in mt-4 flex snap-x gap-3 overflow-x-auto scroll-smooth pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible"
      >
        {visible.map((item) => (
          <Link key={item.id} href="/packages" className="lift group w-[68%] shrink-0 snap-start rounded-2xl border border-[#ededed] bg-white p-3 sm:w-[46%] lg:w-auto">
            <span className="relative block">
              <img src={item.image} alt="" className="h-36 w-full rounded-xl bg-[#f6f6f7] object-contain transition duration-500 ease-out group-hover:scale-[1.04]" />
              <span
                className={`absolute top-2 start-2 inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold ${
                  item.badge === "preorder" ? "bg-[#efe6ff] text-brand" : "bg-[#00c48c] text-white"
                }`}
              >
                {item.badge === "preorder" ? t("preorder") : t("newBadge")}
              </span>
            </span>
            <span className="mt-3 block text-sm font-bold">{t(item.name)}</span>
            <span className="mt-1 block text-sm text-muted">
              {item.price === 0 ? t("knowMore") : `${t("from")} ${formatKwd(item.price, locale)}`}
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5 lg:hidden">
        {visible.map((item, dot) => (
          <button
            key={item.id}
            type="button"
            aria-label={t(item.name)}
            aria-current={dot === page ? "true" : undefined}
            onClick={() => goTo(dot)}
            className={`h-2 rounded-full ${dot === page ? "w-2 bg-brand" : "w-2 bg-[#d0d0d0]"}`}
          />
        ))}
      </div>
      <p className="mt-4 text-sm leading-6 text-muted lg:hidden">{t("devicesHint")}</p>
      <Link href="/packages" className="mt-2 inline-block text-sm font-semibold text-brand lg:hidden">
        {t("seeAll")}
      </Link>
    </section>
  );
}
