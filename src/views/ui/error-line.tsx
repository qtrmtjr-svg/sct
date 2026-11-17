"use client";

import { isErrorCode } from "@/lib/codes";
import { useTranslations } from "next-intl";

export function ErrorLine({ code }: { code?: string }) {
  const t = useTranslations("errors");
  if (!code) return null;
  return <p className="text-sm font-medium text-danger">{isErrorCode(code) ? t(code) : t("generic")}</p>;
}
