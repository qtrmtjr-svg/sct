"use client";

import { useEffect } from "react";
import { useRechargeDraft } from "@/state/recharge-draft.store";

export function DraftHydrator() {
  useEffect(() => {
    void (async () => {
      await useRechargeDraft.persist.rehydrate();
      const current = useRechargeDraft.getState();
      if (!current.idempotencyKey) current.rotateKey();
      current.setHydrated(true);
    })();
  }, []);
  return null;
}
