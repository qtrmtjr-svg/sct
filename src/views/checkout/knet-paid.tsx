"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { OrderView } from "@/lib/types";

export function KnetPaid({ order }: { order: OrderView }) {
  const t = useTranslations("checkout");
  const amount = order.amountHalalas / 100;
  const amountLabel = Number.isInteger(amount) ? `${amount} KD` : `${amount.toFixed(3)} KD`;
  const date = new Date(order.createdAt);
  const hours24 = date.getHours();
  const when = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ${hours24 % 12 || 12}:${String(date.getMinutes()).padStart(2, "0")} ${hours24 >= 12 ? "PM" : "AM"}`;
  const rows = [
    [t("paidNumber"), order.displayNumber],
    [t("paidAmount"), amountLabel],
    [t("paidMethod"), "KNET"],
    [t("paidReference"), order.providerRef ?? order.id.slice(0, 12)],
    [t("paidWhen"), when],
  ];

  return (
    <div className="bg-[#4f008c] text-white">
      <div className="mx-auto min-h-[70vh] max-w-lg px-6 pt-10 pb-12 text-center">
        <div className="mx-auto grid size-[92px] place-items-center rounded-full border-[3px] border-white">
          <svg viewBox="0 0 24 24" className="size-12" aria-hidden="true">
            <path fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-6 text-[24px] font-bold">{t("paidTitle")}</h1>
        <p className="mt-4 text-[16px] leading-7">{t("paidText")}</p>
        <div className="mt-8 rounded-[4px] bg-white px-4 py-1 text-start text-[#1d252d] shadow-[0_8px_24px_rgba(0,0,0,0.18)]" dir="rtl">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 border-b border-[#eceff1] py-3 text-[14px] last:border-b-0">
              <span>{label}:</span>
              <span dir="ltr" className="font-medium">{value}</span>
            </div>
          ))}
        </div>
        <Link href="/" className="mx-auto mt-8 flex h-10 w-full max-w-[220px] items-center justify-center rounded-[2px] border border-white text-[16px] font-medium text-white">
          {t("paidDone")}
        </Link>
      </div>
    </div>
  );
}
