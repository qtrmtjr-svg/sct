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
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "'Tajawal', system-ui, -apple-system, sans-serif",
        background: "#f4f6f9",
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e6e8ed",
          borderRadius: 16,
          padding: "34px 26px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 10px 30px rgba(28,33,48,.06)",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>لوحة التحكم</h1>
        <p style={{ color: "#6b7280", fontSize: 15, marginBottom: 22 }}>أدخل كلمة المرور للدخول</p>

        <form action={formAction}>
          <div
            style={{
              color: "#e4312a",
              fontSize: 14,
              fontWeight: 700,
              minHeight: 20,
              marginBottom: 10,
            }}
          >
            {state && !state.ok ? "كلمة المرور غير صحيحة" : ""}
          </div>
          <div
            style={{
              border: "1.4px solid #dfe2e8",
              borderRadius: 12,
              height: 56,
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              marginBottom: 14,
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
                border: "none",
                outline: "none",
                width: "100%",
                fontFamily: "inherit",
                fontSize: 16,
                background: "none",
                textAlign: "right",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            style={{
              width: "100%",
              height: 56,
              border: "none",
              borderRadius: 999,
              fontFamily: "inherit",
              fontWeight: 800,
              fontSize: 17,
              color: "#fff",
              background: "#e4312a",
              cursor: pending ? "wait" : "pointer",
              transition: ".15s",
              opacity: pending ? 0.7 : 1,
            }}
          >
            {pending ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>

      <style>{`
        @media (min-width: 700px) {
          div[style*="max-width: 380px"] {
            max-width: 460px !important;
            padding: 48px 40px !important;
          }
          div[style*="max-width: 380px"] h1 { font-size: 30px !important; }
          div[style*="max-width: 380px"] p { font-size: 17px !important; }
        }
      `}</style>
    </div>
  );
}
