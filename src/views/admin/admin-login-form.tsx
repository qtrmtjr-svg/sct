"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@/lib/codes";
import { adminLoginAction } from "@/server/admin-actions";
import { Button } from "@/views/ui/button";
import { ErrorLine } from "@/views/ui/error-line";
import { Input } from "@/views/ui/input";

export function AdminLoginForm({ locale }: { locale: string }) {
  const t = useTranslations("adminLogin");
  const [state, formAction, pending] = useActionState(adminLoginAction, null as ActionResult | null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      router.replace(`/${locale}/admin/approvals`);
      router.refresh();
    }
  }, [state, router, locale]);

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-border bg-white shadow-xl">
      <div className="bg-gradient-to-br from-primary to-primary/70 px-6 py-8 text-white">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-sm text-white/80">{t("subtitle")}</p>
      </div>

      <form action={formAction} className="grid gap-4 px-6 py-6" autoComplete="on">
        <Input
          id="admin-email"
          label={t("email")}
          name="email"
          type="email"
          dir="ltr"
          autoComplete="username"
          required
          autoFocus
        />
        <div className="relative">
          <Input
            id="admin-password"
            label={t("password")}
            name="password"
            type={showPassword ? "text" : "password"}
            dir="ltr"
            autoComplete="current-password"
            required
            className="w-full pe-16"
          />
          <button
            type="button"
            id="admin-toggle-password"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute bottom-0 end-0 flex h-11 items-center px-3 text-xs font-semibold text-primary"
          >
            {showPassword ? t("hide") : t("show")}
          </button>
        </div>
        {state && !state.ok ? <ErrorLine code={state.code} /> : null}
        <Button id="admin-login-submit" type="submit" pending={pending} className="h-11">
          {pending ? t("signingIn") : t("submit")}
        </Button>
        <p className="text-center text-xs text-muted">{t("notice")}</p>
      </form>
    </div>
  );
}
