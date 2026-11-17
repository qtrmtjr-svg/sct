import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { ActivityTracker } from "@/views/tracker/activity-tracker";
import { DraftHydrator } from "@/views/shell/draft-hydrator";
import { PathGate } from "@/views/shell/path-gate";
import { SiteFooter } from "@/views/shell/site-footer";
import { SiteHeader } from "@/views/shell/site-header";
import { ToastViewport } from "@/views/shell/toast-viewport";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ActivityTracker />
      <DraftHydrator />
      <PathGate hide={["/quick-pay", "/admin"]}>
        <Suspense fallback={<div className="h-16 border-b border-border bg-white" />}>
          <HeaderSlot locale={locale} />
        </Suspense>
      </PathGate>
      <main className="flex-1">{children}</main>
      <PathGate hide={["/quick-pay", "/admin"]}>
        <SiteFooter />
      </PathGate>
      <ToastViewport />
    </NextIntlClientProvider>
  );
}

async function HeaderSlot({ locale }: { locale: string }) {
  const session = await getSession();
  return <SiteHeader locale={locale} user={session} />;
}
