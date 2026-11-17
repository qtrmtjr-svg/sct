import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { getAccount } from "@/controllers/account.controller";
import { getPackages } from "@/controllers/admin.controller";
import { getSession } from "@/lib/auth";
import { HomeView } from "@/views/home/home-view";
import { HomeSkeleton } from "@/views/ui/skeleton";

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent params={params} />
    </Suspense>
  );
}

async function HomeContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  const [packages, account] = await Promise.all([
    getPackages(locale),
    session ? getAccount(session.id, locale) : Promise.resolve({ saved: [], orders: [] }),
  ]);
  return <HomeView locale={locale} packages={packages.slice(0, 4)} savedNumbers={account.saved} />;
}
