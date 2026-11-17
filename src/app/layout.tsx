import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "STC Recharge",
  description: "Demo portal for Saudi mobile recharge, packages, bills, and vouchers.",
};

/** Prevent mobile browsers from zooming when focusing inputs (site-wide). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const localeHeader = (await headers()).get("x-next-intl-locale");
  const locale = localeHeader === "en" ? "en" : "ar";

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`${plex.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/scrollbar.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" />
      </head>
      <body className="flex min-h-full flex-col bg-surface font-sans text-ink antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
