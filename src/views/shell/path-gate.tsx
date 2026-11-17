"use client";

import { usePathname } from "@/i18n/navigation";

export function PathGate({ hide, children }: { hide: string | string[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const prefixes = Array.isArray(hide) ? hide : [hide];
  if (prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return null;
  return children;
}
