"use client";

import { useTranslations } from "next-intl";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-lg font-semibold">{t("generic")}</p>
      <button type="button" className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white" onClick={reset}>
        OK
      </button>
    </div>
  );
}
