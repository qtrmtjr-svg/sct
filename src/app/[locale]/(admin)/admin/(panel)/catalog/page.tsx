import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getAdminCatalog } from "@/controllers/admin.controller";
import { ensureAdmin } from "@/lib/auth";
import { CatalogView } from "@/views/admin/catalog-view";
import { LoadingBlock } from "@/views/ui/page-shell";

export default function AdminCatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await ensureAdmin(locale);
  const products = await getAdminCatalog(locale);
  return <CatalogView products={products} />;
}
