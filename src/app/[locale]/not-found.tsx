import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("common");
  return <div className="mx-auto max-w-lg px-4 py-16 text-center text-lg font-semibold">{t("notFound")}</div>;
}
