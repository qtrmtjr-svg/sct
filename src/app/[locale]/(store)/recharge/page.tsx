import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAccount } from "@/controllers/account.controller";
import { getTopups } from "@/controllers/admin.controller";
import { getSession } from "@/lib/auth";
import { RechargeForm } from "@/views/recharge/recharge-form";
import { Card } from "@/views/ui/card";
import { LoadingBlock, PageShell } from "@/views/ui/page-shell";

export default function RechargePage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("recharge");
  const session = await getSession();
  const [products, account] = await Promise.all([
    getTopups(locale),
    session ? getAccount(session.id, locale) : Promise.resolve({ saved: [], orders: [] }),
  ]);
  return (
    <PageShell title={t("title")} subtitle={t("subtitle")}>
      <Card className="max-w-xl">
        <RechargeForm products={products} locale={locale} savedNumbers={account.saved} />
      </Card>
    </PageShell>
  );
}
