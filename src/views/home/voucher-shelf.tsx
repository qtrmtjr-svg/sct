"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const filters = ["filterAll", "filterGames", "filterFun", "filterShop", "filterOther"] as const;

const cards = [
  { id: "g1", group: "filterGames", title: "vGame1", text: "vGame1Text", image: "/home/voucher-games.jpg" },
  { id: "g2", group: "filterGames", title: "vGame2", text: "vGame2Text", image: "/home/handheld.jpg" },
  { id: "f1", group: "filterFun", title: "vFun1", text: "vFun1Text", image: "/home/voucher-fun.jpg" },
  { id: "f2", group: "filterFun", title: "vFun2", text: "vFun2Text", image: "/home/buds.jpg" },
  { id: "s1", group: "filterShop", title: "vShop1", text: "vShop1Text", image: "/home/voucher-shop.jpg" },
  { id: "s2", group: "filterShop", title: "vShop2", text: "vShop2Text", image: "/home/offers.jpg" },
  { id: "o1", group: "filterOther", title: "voucherCard", text: "voucherCardText", image: "/home/voucher-stc.jpg" },
] as const;

export function VoucherShelf() {
  const t = useTranslations("home");
  const [active, setActive] = useState<(typeof filters)[number]>("filterAll");
  const visible = active === "filterAll" ? cards : cards.filter((card) => card.group === active);

  return (
    <section className="reveal mx-auto max-w-[1200px] px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-2xl font-bold sm:text-3xl">{t("vouchers")}</h2>
        <Link href="/voucher" className="text-sm font-semibold text-brand">
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
              active === filter ? "bg-brand text-white" : "bg-[#f3f3f3] text-ink hover:bg-[#e9e4f0]"
            }`}
          >
            {t(filter)}
          </button>
        ))}
      </div>
      <div key={active} className="shelf-in mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((card) => (
          <Link key={card.id} href="/voucher" className="lift group overflow-hidden rounded-2xl border border-[#ededed] bg-white shadow-sm">
            <img src={card.image} alt="" className="h-36 w-full object-cover transition duration-500 ease-out group-hover:scale-105" />
            <span className="block px-4 py-3">
              <span className="block font-bold">{t(card.title)}</span>
              <span className="mt-1 block text-sm text-muted">{t(card.text)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
