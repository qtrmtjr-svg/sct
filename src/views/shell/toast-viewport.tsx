"use client";

import { useEffect } from "react";
import { useUiStore } from "@/state/ui.store";

export function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts);
  const dismiss = useUiStore((state) => state.dismiss);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => dismiss(toasts[0].id), 3200);
    return () => clearTimeout(timer);
  }, [toasts, dismiss]);

  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 start-4 z-50 grid gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismiss(toast.id)}
          className="toast-in rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          {toast.message}
        </button>
      ))}
    </div>
  );
}
