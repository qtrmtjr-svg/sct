import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getAccount } from "@/controllers/account.controller";
import { getTopups } from "@/controllers/admin.controller";
import { getSession } from "@/lib/auth";
import { RechargeForm } from "@/views/recharge/recharge-form";

export default function RechargePage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="shimmer h-8 w-32 rounded-lg" /></div>}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  const [products, account] = await Promise.all([
    getTopups(locale),
    session ? getAccount(session.id, locale) : Promise.resolve({ saved: [], orders: [] }),
  ]);
  return <RechargeForm products={products} locale={locale} savedNumbers={account.saved} />;
}
