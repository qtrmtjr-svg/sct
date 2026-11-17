"use client";

import { useEffect, useState } from "react";

type Event = {
  id: string;
  type: string;
  page: string;
  element: string | null;
  value: string | null;
  createdAt: string;
  sessionId: string;
};

type SessionInfo = {
  id: string;
  ip: string;
  userAgent: string;
  page: string;
  lastSeen: string;
  createdAt: string;
  _count: { events: number };
};

type UserData = {
  user: { id: string; name: string; email: string; role: string; disabled: boolean; createdAt: string };
  sessions: SessionInfo[];
  activity: Event[];
};

function eventIcon(type: string) {
  switch (type) {
    case "page_view": return "📄";
    case "click": return "🖱️";
    case "input": return "✏️";
    case "form_submit": return "📋";
    default: return "•";
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

export function UserProfileView({ userId }: { userId: string }) {
  const [data, setData] = useState<UserData | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"activity" | "sessions">("activity");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Failed to load"));
  }, [userId]);

  if (error) return <p style={{ color: "#ef4444", padding: "20px" }}>{error}</p>;
  if (!data) return <p style={{ color: "#94a3b8", padding: "20px" }}>Loading…</p>;

  const { user, sessions, activity } = data;

  const filtered = activity.filter((ev) => {
    if (!search) return true;
    return (
      ev.page.includes(search) ||
      ev.type.includes(search) ||
      (ev.element ?? "").includes(search) ||
      (ev.value ?? "").includes(search)
    );
  });

  function exportCSV() {
    const rows = [["Time", "Type", "Page", "Element", "Value"]];
    for (const ev of activity) {
      rows.push([formatTime(ev.createdAt), ev.type, ev.page, ev.element ?? "", ev.value ?? ""]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `user-${userId}-activity.csv`;
    a.click();
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      {/* User header card */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          borderRadius: "16px",
          padding: "20px 24px",
          color: "#e0e7ff",
          display: "flex",
          gap: "16px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #a855f7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.4rem",
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: "1.1rem", margin: 0 }}>{user.name}</p>
          <p style={{ color: "#a5b4fc", margin: "2px 0 0", fontSize: "0.85rem" }}>{user.email}</p>
          <div style={{ display: "flex", gap: "8px", marginTop: 6, flexWrap: "wrap" }}>
            <Chip color="#6366f1">{user.role}</Chip>
            <Chip color={user.disabled ? "#ef4444" : "#22c55e"}>
              {user.disabled ? "Disabled" : "Active"}
            </Chip>
            <Chip color="#94a3b8">Joined {formatDate(user.createdAt)}</Chip>
            <Chip color="#f59e0b">{sessions.length} sessions</Chip>
            <Chip color="#10b981">{activity.length} events tracked</Chip>
          </div>
        </div>
        <button
          onClick={exportCSV}
          style={{
            background: "#ffffff22",
            border: "1px solid #ffffff44",
            borderRadius: "10px",
            color: "#e0e7ff",
            padding: "8px 16px",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ⬇ Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "#f1f5f9", borderRadius: "12px", padding: "4px", width: "fit-content" }}>
        {(["activity", "sessions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? "#fff" : "transparent",
              border: "none",
              borderRadius: "9px",
              padding: "7px 18px",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: tab === t ? "#1e293b" : "#64748b",
              cursor: "pointer",
              boxShadow: tab === t ? "0 1px 3px #0001" : "none",
              transition: "all 0.15s",
            }}
          >
            {t === "activity" ? "📋 Activity Timeline" : "🔗 Sessions"}
          </button>
        ))}
      </div>

      {tab === "activity" && (
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          {/* Search */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
            <input
              type="search"
              placeholder="Search events…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "7px 12px",
                fontSize: "0.82rem",
                outline: "none",
                color: "#1e293b",
              }}
            />
          </div>
          <div style={{ maxHeight: 460, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <p style={{ padding: "20px 16px", color: "#94a3b8", fontSize: "0.85rem" }}>
                {search ? "No matching events" : "No activity recorded yet"}
              </p>
            ) : (
              filtered.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    display: "flex",
                    gap: "10px",
                    padding: "9px 16px",
                    borderBottom: "1px solid #f8fafc",
                    fontSize: "0.78rem",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ fontSize: "0.9rem", flexShrink: 0, marginTop: 1 }}>{eventIcon(ev.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        background: typeColor(ev.type) + "22",
                        color: typeColor(ev.type),
                        borderRadius: 4,
                        padding: "1px 6px",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        marginInlineEnd: 6,
                      }}
                    >
                      {ev.type.replace("_", " ")}
                    </span>
                    <span style={{ color: "#6366f1" }}>{ev.page}</span>
                    {ev.element && <span style={{ color: "#64748b" }}> · {ev.element}</span>}
                    {ev.value && (
                      <span style={{ color: "#059669", display: "block", marginTop: 2, fontFamily: "monospace" }}>
                        → "{ev.value.slice(0, 80)}"
                      </span>
                    )}
                  </div>
                  <span style={{ color: "#94a3b8", flexShrink: 0, fontFamily: "monospace" }}>
                    {formatTime(ev.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "sessions" && (
        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          {sessions.length === 0 ? (
            <p style={{ padding: "20px 16px", color: "#94a3b8", fontSize: "0.85rem" }}>
              No sessions recorded
            </p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#6366f1" }}>
                    {s.id.slice(0, 12)}…
                  </span>
                  <Chip color="#10b981">{s._count.events} events</Chip>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {s.ip} · Last page: {s.page}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  Started: {formatDate(s.createdAt)} · Last seen: {new Date(s.lastSeen).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function typeColor(type: string): string {
  switch (type) {
    case "page_view": return "#6366f1";
    case "click": return "#f59e0b";
    case "input": return "#10b981";
    case "form_submit": return "#3b82f6";
    default: return "#6b7280";
  }
}

function Chip({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        background: color + "22",
        color,
        borderRadius: 6,
        padding: "2px 8px",
        fontSize: "0.7rem",
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}
