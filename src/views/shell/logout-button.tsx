"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@/server/actions";

export function LogoutButton({ label, locale, light = false }: { label: string; locale: string; light?: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={`rounded-lg px-3 py-2 text-sm font-medium ${light ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-muted hover:bg-surface hover:text-ink"}`}
      onClick={async () => {
        await logoutAction();
        router.push(`/${locale}`);
        router.refresh();
      }}
    >
      {label}
    </button>
  );
}
