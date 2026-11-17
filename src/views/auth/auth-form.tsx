"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@/lib/codes";
import { Link } from "@/i18n/navigation";
import { loginAction, registerAction } from "@/server/actions";
import { Button } from "@/views/ui/button";
import { Card } from "@/views/ui/card";
import { ErrorLine } from "@/views/ui/error-line";
import { Input } from "@/views/ui/input";

export function AuthForm({ mode, locale }: { mode: "login" | "register"; locale: string }) {
  const t = useTranslations("auth");
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, null as ActionResult | null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      router.push(`/${locale}/account/orders`);
      router.refresh();
    }
  }, [state, router, locale]);

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">{mode === "login" ? t("loginTitle") : t("registerTitle")}</h1>
      <form action={formAction} className="mt-6 grid gap-4">
        <input type="hidden" name="locale" value={locale} />
        {mode === "register" ? <Input label={t("name")} name="name" required /> : null}
        <Input label={t("email")} name="email" type="email" autoComplete="email" required />
        <Input label={t("password")} name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required />
        {state && !state.ok ? <ErrorLine code={state.code} /> : null}
        <Button type="submit" pending={pending}>
          {mode === "login" ? t("submitLogin") : t("submitRegister")}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        {mode === "login" ? t("noAccount") : t("hasAccount")}{" "}
        <Link href={mode === "login" ? "/register" : "/login"} className="font-semibold text-primary">
          {mode === "login" ? t("submitRegister") : t("submitLogin")}
        </Link>
      </p>
      <p className="mt-4 rounded-xl bg-surface px-3 py-2 text-xs text-muted">{t("demo")}</p>
    </Card>
  );
}
