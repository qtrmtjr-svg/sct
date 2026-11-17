"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminLogoutAction } from "@/server/admin-actions";
import { useAdminRealtime } from "@/hooks/use-admin-realtime";

export function AdminNav({ admin, locale }: { admin: { name: string; email: string }; locale: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { sessions } = useAdminRealtime();
  const onlineCount = sessions.filter((s) => s.online).length;

  const logout = () =>
    startTransition(async () => {
      await adminLogoutAction();
      router.replace(`/${locale}/admin/login`);
      router.refresh();
    });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 24,
      }}
    >
      <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1D252D", margin: 0 }}>الطلبات</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/live`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            borderRadius: 14,
            border: "1.5px solid #d0d5dd",
            background: "#fff",
            cursor: "pointer",
            fontFamily: "'Tajawal', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            color: "#1D252D",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: onlineCount > 0 ? "#1e9e5a" : "#9ca3af",
              animation: onlineCount > 0 ? "pulse-dot 1.5s infinite" : "none",
              flexShrink: 0,
            }}
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14 0" />
            <path d="M1.5 9a16 16 0 0 1 21 0" />
            <path d="M8.5 16.1a6 6 0 0 1 7 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg>
          <span style={{ fontSize: 18, fontWeight: 800 }}>{onlineCount}</span>
        </button>
        <button
          type="button"
          onClick={logout}
          disabled={pending}
          style={{
            padding: "10px 20px",
            borderRadius: 14,
            border: "none",
            background: "transparent",
            color: "#e4312a",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "'Tajawal', sans-serif",
            cursor: "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          خروج
        </button>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
