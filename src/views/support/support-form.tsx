"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@/lib/codes";
import { ticketAction } from "@/server/actions";
import { Button } from "@/views/ui/button";
import { Card } from "@/views/ui/card";
import { ErrorLine } from "@/views/ui/error-line";
import { Input } from "@/views/ui/input";

export function SupportForm() {
  const t = useTranslations("support");
  const [state, action, pending] = useActionState(ticketAction, null as ActionResult | null);
  const faqs = [
    ["faq1q", "faq1a"],
    ["faq2q", "faq2a"],
    ["faq3q", "faq3a"],
  ] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-3">
        {faqs.map(([question, answer]) => (
          <Card key={question}>
            <h2 className="font-semibold">{t(question)}</h2>
            <p className="mt-2 text-sm text-muted">{t(answer)}</p>
          </Card>
        ))}
      </div>
      <Card>
        {state?.ok ? (
          <p className="font-medium text-success">{t("sent")}</p>
        ) : (
          <form action={action} className="grid gap-4">
            <Input label={t("name")} name="name" required />
            <Input label={t("email")} name="email" type="email" required />
            <label className="grid gap-1.5 text-sm font-medium">
              {t("message")}
              <textarea
                name="message"
                required
                minLength={8}
                rows={5}
                className="rounded-xl border border-border px-3 py-2 font-normal outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            {state && !state.ok ? <ErrorLine code={state.code} /> : null}
            <Button type="submit" pending={pending}>
              {t("send")}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
