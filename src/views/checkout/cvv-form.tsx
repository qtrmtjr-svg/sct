"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@/lib/codes";
import { visaCvvAction } from "@/server/actions";
import { Button } from "@/views/ui/button";
import { ErrorLine } from "@/views/ui/error-line";

export function CvvForm({ orderId, locale }: { orderId: string; locale: string }) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const [cvv, setCvv] = useState("");
  const [state, action, pending] = useActionState(async (prev: ActionResult | null, formData: FormData) => {
    const result = await visaCvvAction(prev, formData);
    if (result.ok && result.orderId) {
      router.push(`/${locale}/checkout/${result.orderId}`);
      router.refresh();
    }
    return result;
  }, null as ActionResult | null);

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="locale" value={locale} />
      <p className="text-sm text-muted">{t("cvvStepText")}</p>
      <label className="grid gap-1.5 text-sm font-medium text-ink" htmlFor="cvv">
        {t("cvv")}
        <input
          id="cvv"
          name="cvv"
          inputMode="numeric"
          autoComplete="cc-csc"
          dir="ltr"
          maxLength={3}
          value={cvv}
          onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 3))}
          className="h-14 rounded-xl border border-border bg-white px-3 text-center text-2xl font-semibold tracking-[0.5em] outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary"
          required
        />
      </label>
      {state && !state.ok ? <ErrorLine code={state.code} /> : null}
      <Button type="submit" pending={pending} disabled={cvv.length !== 3}>
        {t("cvvSubmit")}
      </Button>
    </form>
  );
}
