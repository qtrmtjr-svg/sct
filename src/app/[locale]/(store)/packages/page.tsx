import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getPackages } from "@/controllers/admin.controller";
import { PackageCard, PackagePhone } from "@/views/packages/package-catalog";
import { LoadingBlock, PageShell } from "@/views/ui/page-shell";

const categories = ["all", "data", "voice", "social", "roaming"] as const;

export default function PackagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Content params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const { category } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("packages");
  const selected = categories.includes(category as (typeof categories)[number]) ? category : undefined;
  const products = await getPackages(locale, selected && selected !== "all" ? selected : undefined);

  return (
    <PageShell title={t("title")} subtitle={t("subtitle")}>
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((item) => {
          const active = (selected ?? "all") === item;
          return (
            <Link
              key={item}
              href={item === "all" ? "/packages" : `/packages?category=${item}`}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${active ? "bg-primary text-white" : "bg-white text-ink"}`}
            >
              {t(item)}
            </Link>
          );
        })}
      </div>
      <PackagePhone />
      {products.length === 0 ? <p className="mt-6 text-sm text-muted">{t("empty")}</p> : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <PackageCard key={product.id} product={product} locale={locale} />
        ))}
      </div>
    </PageShell>
  );
}
