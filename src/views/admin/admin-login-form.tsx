"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/codes";
import { adminLoginAction } from "@/server/admin-actions";

export function AdminLoginForm({ locale }: { locale: string }) {
  const [state, formAction, pending] = useActionState(adminLoginAction, null as ActionResult | null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) {
      router.replace(`/${locale}/admin/approvals`);
      router.refresh();
    }
  }, [state, router, locale]);

  return (
    <div
      className="flex min-h-dvh w-full items-center justify-center px-4"
      style={{ fontFamily: "'Tajawal', sans-serif", background: "#f4f6f9" }}
    >
      <div
        className="w-full"
        style={{
          maxWidth: 420,
          background: "#fff",
          borderRadius: 24,
          padding: "48px 32px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1D252D", marginBottom: 6, textAlign: "center" }}>
          لوحة التحكم
        </h1>
        <p style={{ fontSize: 15, color: "#6b7280", textAlign: "center", marginBottom: 28 }}>
          أدخل كلمة المرور للدخول
        </p>

        {state && !state.ok ? (
          <div
            style={{
              background: "#fef2f2",
              color: "#dc2626",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            كلمة المرور غير صحيحة
          </div>
        ) : null}

        <form action={formAction}>
          <div
            style={{
              height: 56,
              borderRadius: 12,
              border: "1.5px solid #d0d5dd",
              display: "flex",
              alignItems: "center",
              paddingInline: 16,
              marginBottom: 20,
              transition: "border-color 0.2s",
            }}
          >
            <input
              type="password"
              name="password"
              placeholder="كلمة المرور"
              autoComplete="current-password"
              required
              autoFocus
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: "'Tajawal', sans-serif",
                fontSize: 16,
                color: "#1D252D",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            style={{
              width: "100%",
              height: 56,
              borderRadius: 999,
              border: "none",
              background: "#e4312a",
              color: "#fff",
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "'Tajawal', sans-serif",
              cursor: pending ? "wait" : "pointer",
              opacity: pending ? 0.7 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {pending ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
