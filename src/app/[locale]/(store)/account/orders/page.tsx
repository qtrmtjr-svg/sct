import { Suspense } from "react";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getAccount } from "@/controllers/account.controller";
import { getSession } from "@/lib/auth";
import { AccountView } from "@/views/account/account-view";
import { LoadingBlock, PageShell } from "@/views/ui/page-shell";
import { getTranslations } from "next-intl/server";

export default function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const t = await getTranslations("account");
  const account = await getAccount(session.id, locale);
  return (
    <PageShell title={t("title")} subtitle={t("subtitle")}>
      <AccountView locale={locale} orders={account.orders} saved={account.saved} />
    </PageShell>
  );
}
