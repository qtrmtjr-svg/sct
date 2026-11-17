"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCheckoutStore } from "@/state/checkout.store";

export function CheckoutPoller({ status }: { status: string }) {
  const router = useRouter();
  const setWaiting = useCheckoutStore((state) => state.setWaiting);
  const touch = useCheckoutStore((state) => state.touch);

  useEffect(() => {
    const active = status === "awaiting_payment" || status === "fulfilling";
    setWaiting(active);
    if (!active) return;
    const timer = setInterval(() => {
      touch();
      router.refresh();
    }, 4000);
    return () => clearInterval(timer);
  }, [status, router, setWaiting, touch]);

  return null;
}

export function WaitingDot() {
  const waiting = useCheckoutStore((state) => state.waiting);
  if (!waiting) return null;
  return <span className="ms-2 inline-block h-2 w-2 animate-pulse rounded-full bg-warning" />;
}
