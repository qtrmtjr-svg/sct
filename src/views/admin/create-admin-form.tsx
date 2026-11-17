"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@/lib/codes";
import { createAdminAction } from "@/server/admin-actions";
import { Button } from "@/views/ui/button";
import { ErrorLine } from "@/views/ui/error-line";
import { Input } from "@/views/ui/input";

export function CreateAdminForm() {
  const t = useTranslations("admin");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createAdminAction, null as ActionResult | null);

  useEffect(() => {
    if (!state?.ok) return;
    formRef.current?.reset();
    router.refresh();
  }, [state, router]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 rounded-2xl border border-border bg-white p-5">
      <div>
        <h2 className="text-lg font-bold">{t("addAdmin")}</h2>
        <p className="mt-1 text-sm text-muted">{t("addAdminHint")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Input label={t("adminName")} name="name" autoComplete="name" required />
        <Input label={t("adminEmail")} name="email" type="email" dir="ltr" autoComplete="off" required />
        <Input label={t("adminPassword")} name="password" type="password" dir="ltr" autoComplete="new-password" required minLength={8} />
      </div>
      {state?.ok ? <p className="text-sm font-medium text-success">{t("adminAdded")}</p> : <ErrorLine code={state?.code} />}
      <div>
        <Button type="submit" pending={pending}>
          {t("saveAdmin")}
        </Button>
      </div>
    </form>
  );
}
