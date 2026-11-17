"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@/lib/codes";
import { createId } from "@/lib/id";
import { voucherAction } from "@/server/actions";
import { useRechargeDraft } from "@/state/recharge-draft.store";
import { Button } from "@/views/ui/button";
import { Card } from "@/views/ui/card";
import { ErrorLine } from "@/views/ui/error-line";
import { Input } from "@/views/ui/input";

export function VoucherForm({ locale }: { locale: string }) {
  const t = useTranslations("voucher");
  const msisdn = useRechargeDraft((state) => state.msisdn);
  const setPhone = useRechargeDraft((state) => state.setPhone);
  const hydrated = useRechargeDraft((state) => state.hydrated);
  const [state, action, pending] = useActionState(voucherAction, null as ActionResult | null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && state.orderId) {
      router.push(`/${locale}/checkout/${state.orderId}`);
      router.refresh();
    }
  }, [state, router, locale]);

  if (!hydrated) return <div className="h-48 animate-pulse rounded-2xl bg-white" />;

  return (
    <Card className="max-w-lg">
      <form
        action={(formData) => {
          formData.set("idempotencyKey", createId());
          action(formData);
        }}
        className="grid gap-4"
      >
        <Input label={t("code")} name="code" placeholder="STC-DEMO-5000" required />
        <Input
          label={t("phone")}
          name="msisdn"
          value={msisdn}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="05xxxxxxxx"
          inputMode="tel"
          required
        />
        <p className="text-sm text-muted">{t("demo")}</p>
        {state && !state.ok ? <ErrorLine code={state.code} /> : null}
        <Button type="submit" pending={pending}>
          {t("submit")}
        </Button>
      </form>
    </Card>
  );
}
