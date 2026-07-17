import React, { useState, useEffect } from "react";
import {
  Truck, LogOut, Plus, Pencil, Trash2, Search, CalendarDays,
  CheckCircle2, XCircle, Clock, PackageSearch, Users, ClipboardList,
  LayoutDashboard, ShieldCheck, X, AlertTriangle, HardHat, ChevronRight
} from "lucide-react";

/* ============================================================
   HEAVYRENT — terhubung ke backend Laravel + MySQL lewat fetch API
   Tema visual: "plat unit alat berat" — industrial, safety-yellow
   ============================================================ */

const CSRF_TOKEN =
  document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-TOKEN": CSRF_TOKEN,
      ...(options.headers || {}),
    },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      body.message ||
      (body.errors && Object.values(body.errors)[0]?.[0]) ||
      "Terjadi kesalahan. Coba lagi.";
    throw new Error(message);
  }
  return body;
}

function idr(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}
function daysBetween(a, b) {
  const d = (new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.round(d) + 1);
}

/* ---------------- shared UI atoms ---------------- */

const STATUS_MAP = {
  available: { label: "Tersedia", tone: "green" },
  rented: { label: "Disewa", tone: "amber" },
  assigned: { label: "Bertugas", tone: "amber" },
  maintenance: { label: "Perawatan", tone: "red" },
  pending: { label: "Menunggu Persetujuan", tone: "amber" },
  approved: { label: "Disetujui", tone: "blue" },
  on_progress: { label: "Sedang Berjalan", tone: "blue" },
  completed: { label: "Selesai", tone: "green" },
  rejected: { label: "Ditolak", tone: "red" },
};
const TONE_STYLES = {
  green: { bg: "#E4F3E6", fg: "#256029" },
  amber: { bg: "#FCEFD1", fg: "#96650A" },
  red: { bg: "#FBE4E4", fg: "#B02A2A" },
  blue: { bg: "#E2ECFB", fg: "#2452A6" },
};

function Badge({ status }) {
  const meta = STATUS_MAP[status] || { label: status, tone: "amber" };
  const c = TONE_STYLES[meta.tone];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold tracking-wide uppercase"
      style={{ background: c.bg, color: c.fg, fontFamily: "var(--font-mono)" }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.fg }} />
      {meta.label}
    </span>
  );
}

function Plate({ children, className = "", accent = "var(--hr-yellow)" }) {
  return (
    <div
      className={`relative bg-white rounded-md border border-[var(--hr-line)] overflow-hidden ${className}`}
      style={{ boxShadow: "0 1px 2px rgba(20,20,20,0.06)" }}
    >
      <div className="h-1.5 w-full" style={{ background: accent }} />
      <span className="absolute top-2.5 left-2 w-1.5 h-1.5 rounded-full bg-[var(--hr-steel)] opacity-40" />
      <span className="absolute top-2.5 right-2 w-1.5 h-1.5 rounded-full bg-[var(--hr-steel)] opacity-40" />
      {children}
    </div>
  );
}

function SerialTag({ id }) {
  return (
    <span
      className="text-[10px] tracking-widest px-1.5 py-0.5 rounded"
      style={{ fontFamily: "var(--font-mono)", background: "var(--hr-charcoal)", color: "var(--hr-yellow)" }}
    >
      #{String(id).padStart(6, "0")}
    </span>
  );
}

function PrimaryBtn({ children, onClick, type = "button", className = "", disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{ background: "var(--hr-orange)", color: "#fff" }}
    >
      {children}
    </button>
  );
}
function GhostBtn({ children, onClick, type = "button", className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded font-semibold text-sm border transition ${className}`}
      style={{ borderColor: "var(--hr-line)", color: "var(--hr-charcoal)" }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--hr-steel)", fontFamily: "var(--font-mono)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
const inputCls = "w-full px-3 py-2 rounded border text-sm outline-none focus:ring-2 transition";
const inputStyle = { borderColor: "var(--hr-line)" };

function Modal({ title, onClose, children, width = "max-w-md" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(17,19,23,0.55)" }}>
      <div className={`bg-white rounded-lg w-full ${width} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--hr-line)" }}>
          <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/5"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, note }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <Icon size={30} style={{ color: "var(--hr-steel)" }} />
      <p className="mt-3 font-bold" style={{ fontFamily: "var(--font-display)" }}>{title}</p>
      {note && <p className="text-sm mt-1" style={{ color: "var(--hr-steel)" }}>{note}</p>}
    </div>
  );
}

/* ---------------- Auth screen ---------------- */

function AuthScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await onLogin(form.email.trim(), form.password);
      } else {
        if (!form.name || !form.email || !form.password) throw new Error("Semua kolom wajib diisi.");
        await onRegister({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--hr-charcoal)" }}>
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-lg overflow-hidden shadow-2xl">
        <div className="hidden md:flex flex-col justify-between p-8" style={{ background: "linear-gradient(160deg, var(--hr-charcoal-2), var(--hr-charcoal))" }}>
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded" style={{ background: "var(--hr-yellow)" }}>
                <Truck size={20} color="var(--hr-charcoal)" />
              </div>
              <span className="font-black tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>HEAVYRENT</span>
            </div>
            <p className="text-sm mt-6 leading-relaxed" style={{ color: "#B8BFC9" }}>
              Platform penyewaan excavator &amp; operator bersertifikat. Cek ketersediaan unit real-time,
              pesan operator kompeten, dan pantau status sewa dari satu dasbor.
            </p>
          </div>
          <div className="space-y-2 text-xs" style={{ color: "#8891A0", fontFamily: "var(--font-mono)" }}>
            <p>UNIT TERDAFTAR · OPERATOR BERSERTIFIKASI SIO</p>
          </div>
        </div>

        <div className="bg-white p-8">
          <div className="flex gap-2 mb-6">
            <button onClick={() => { setMode("login"); setError(""); }}
              className="flex-1 py-2 rounded text-sm font-bold uppercase tracking-wide"
              style={mode === "login" ? { background: "var(--hr-charcoal)", color: "#fff" } : { background: "#F1F1EF", color: "var(--hr-steel)" }}>
              Masuk
            </button>
            <button onClick={() => { setMode("register"); setError(""); }}
              className="flex-1 py-2 rounded text-sm font-bold uppercase tracking-wide"
              style={mode === "register" ? { background: "var(--hr-charcoal)", color: "#fff" } : { background: "#F1F1EF", color: "var(--hr-steel)" }}>
              Daftar
            </button>
          </div>

          <form onSubmit={submit}>
            {mode === "register" && (
              <Field label="Nama Lengkap">
                <input className={inputCls} style={inputStyle} value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama Anda" />
              </Field>
            )}
            <Field label="Email">
              <input type="email" className={inputCls} style={inputStyle} value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" />
            </Field>
            <Field label="Password">
              <input type="password" className={inputCls} style={inputStyle} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </Field>
            {mode === "register" && (
              <Field label="Daftar sebagai">
                <div className="grid grid-cols-2 gap-2">
                  {["customer", "admin"].map((r) => (
                    <button type="button" key={r} onClick={() => setForm({ ...form, role: r })}
                      className="py-2 rounded border text-sm font-semibold capitalize"
                      style={form.role === r ? { background: "var(--hr-yellow)", borderColor: "var(--hr-yellow)" } : { borderColor: "var(--hr-line)" }}>
                      {r === "customer" ? "Pelanggan" : "Admin"}
                    </button>
                  ))}
                </div>
              </Field>
            )}
            {error && (
              <p className="text-sm mb-3 flex items-center gap-1.5" style={{ color: "#B02A2A" }}>
                <AlertTriangle size={14} /> {error}
              </p>
            )}
            <PrimaryBtn type="submit" className="w-full py-2.5" disabled={busy}>
              {busy ? "Memproses..." : mode === "login" ? "Masuk" : "Buat Akun"}
            </PrimaryBtn>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Layout ---------------- */

function Sidebar({ role, view, setView, user, onLogout }) {
  const customerNav = [
    { id: "catalog", label: "Katalog", icon: PackageSearch },
    { id: "booking", label: "Sewa Baru", icon: CalendarDays },
    { id: "history", label: "Riwayat Pesanan", icon: ClipboardList },
  ];
  const adminNav = [
    { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
    { id: "excavators", label: "Kelola Alat", icon: Truck },
    { id: "operators", label: "Kelola Operator", icon: HardHat },
    { id: "orders", label: "Pesanan Masuk", icon: ClipboardList },
  ];
  const nav = role === "admin" ? adminNav : customerNav;

  return (
    <div className="w-full md:w-60 shrink-0 flex md:flex-col" style={{ background: "var(--hr-charcoal)" }}>
      <div className="hidden md:flex items-center gap-2 px-5 py-5">
        <div className="p-1.5 rounded" style={{ background: "var(--hr-yellow)" }}><Truck size={18} color="var(--hr-charcoal)" /></div>
        <span className="font-black tracking-widest text-white text-sm" style={{ fontFamily: "var(--font-display)" }}>HEAVYRENT</span>
      </div>
      <div className="flex md:flex-col gap-1 px-2 md:px-3 py-2 md:py-0 overflow-x-auto flex-1">
        {nav.map((n) => {
          const Icon = n.icon;
          const active = view === n.id;
          return (
            <button key={n.id} onClick={() => setView(n.id)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded text-sm font-semibold whitespace-nowrap shrink-0"
              style={active ? { background: "var(--hr-yellow)", color: "var(--hr-charcoal)" } : { color: "#C7CDD6" }}>
              <Icon size={16} />{n.label}
            </button>
          );
        })}
      </div>
      <div className="hidden md:block px-3 py-4 border-t" style={{ borderColor: "#31363F" }}>
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--hr-steel)", color: "#fff" }}>
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user.name}</p>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: "var(--hr-yellow)" }}>{role}</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 px-2 py-2 rounded text-xs font-semibold w-full" style={{ color: "#C7CDD6" }}>
          <LogOut size={14} /> Keluar
        </button>
      </div>
    </div>
  );
}

/* ---------------- Customer: Catalog ---------------- */

function CatalogView({ excavators, operators, goToBooking }) {
  const [q, setQ] = useState("");
  const filtered = excavators.filter((e) => (e.model_name + e.type).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-display)" }}>Katalog Excavator</h2>
          <p className="text-sm" style={{ color: "var(--hr-steel)" }}>{filtered.length} unit ditemukan</p>
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--hr-steel)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari model atau tipe..." className={inputCls + " pl-9 w-64"} style={inputStyle} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ex) => (
          <Plate key={ex.id}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <Truck size={20} style={{ color: "var(--hr-orange)" }} />
                <SerialTag id={ex.id} />
              </div>
              <h3 className="font-bold" style={{ fontFamily: "var(--font-display)" }}>{ex.model_name}</h3>
              <p className="text-xs mb-2" style={{ color: "var(--hr-steel)" }}>{ex.type} · {ex.capacity}</p>
              <div className="flex items-center justify-between mb-3">
                <Badge status={ex.status} />
                <span className="font-bold text-sm" style={{ fontFamily: "var(--font-mono)" }}>{idr(ex.price_per_day)}/hari</span>
              </div>
              <PrimaryBtn className="w-full" disabled={ex.status !== "available"} onClick={() => goToBooking(ex.id)}>
                {ex.status === "available" ? "Pilih & Sewa" : "Tidak Tersedia"} <ChevronRight size={14} />
              </PrimaryBtn>
            </div>
          </Plate>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full"><EmptyState icon={PackageSearch} title="Unit tidak ditemukan" note="Coba kata kunci pencarian lain." /></div>
        )}
      </div>

      <h2 className="text-lg font-black mt-8 mb-3" style={{ fontFamily: "var(--font-display)" }}>Operator Siap Bertugas</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {operators.map((op) => (
          <Plate key={op.id} accent="var(--hr-steel)">
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <HardHat size={20} style={{ color: "var(--hr-charcoal)" }} />
                <SerialTag id={op.id} />
              </div>
              <h3 className="font-bold" style={{ fontFamily: "var(--font-display)" }}>{op.name}</h3>
              <p className="text-xs mb-2" style={{ color: "var(--hr-steel)" }}>{op.certification}</p>
              <div className="flex items-center justify-between">
                <Badge status={op.status} />
                <span className="font-bold text-sm" style={{ fontFamily: "var(--font-mono)" }}>{idr(op.price_per_day)}/hari</span>
              </div>
            </div>
          </Plate>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Customer: Booking ---------------- */

function BookingView({ excavators, operators, presetExcavator, onCreateBooking, setView }) {
  const availableEx = excavators.filter((e) => e.status === "available");
  const availableOp = operators.filter((o) => o.status === "available");
  const [exId, setExId] = useState(presetExcavator || availableEx[0]?.id || "");
  const [opId, setOpId] = useState(availableOp[0]?.id || "");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const ex = excavators.find((e) => e.id === Number(exId));
  const op = operators.find((o) => o.id === Number(opId));
  const days = start && end ? daysBetween(start, end) : 0;
  const total = ex && op && days ? (Number(ex.price_per_day) + Number(op.price_per_day)) * days : 0;
  const valid = ex && op && start && end && days > 0 && new Date(end) >= new Date(start);

  const submit = async () => {
    if (!valid) return;
    setError(""); setBusy(true);
    try {
      await onCreateBooking({ excavator_id: ex.id, operator_id: op.id, start_date: start, end_date: end });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <CheckCircle2 size={40} style={{ color: "#256029" }} className="mx-auto mb-3" />
        <h2 className="text-xl font-black mb-1" style={{ fontFamily: "var(--font-display)" }}>Pesanan Terkirim</h2>
        <p className="text-sm mb-6" style={{ color: "var(--hr-steel)" }}>Pesanan Anda menunggu persetujuan Admin. Pantau statusnya di Riwayat Pesanan.</p>
        <PrimaryBtn onClick={() => setView("history")}>Lihat Riwayat Pesanan</PrimaryBtn>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-black mb-1" style={{ fontFamily: "var(--font-display)" }}>Sewa Excavator &amp; Operator</h2>
      <p className="text-sm mb-5" style={{ color: "var(--hr-steel)" }}>Total biaya dihitung otomatis berdasarkan durasi sewa.</p>

      <Plate className="p-5 mb-4" accent="var(--hr-orange)">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Pilih Excavator">
            <select className={inputCls} style={inputStyle} value={exId} onChange={(e) => setExId(e.target.value)}>
              {availableEx.length === 0 && <option value="">Tidak ada unit tersedia</option>}
              {availableEx.map((e) => (<option key={e.id} value={e.id}>{e.model_name} — {idr(e.price_per_day)}/hari</option>))}
            </select>
          </Field>
          <Field label="Pilih Operator">
            <select className={inputCls} style={inputStyle} value={opId} onChange={(e) => setOpId(e.target.value)}>
              {availableOp.length === 0 && <option value="">Tidak ada operator tersedia</option>}
              {availableOp.map((o) => (<option key={o.id} value={o.id}>{o.name} — {idr(o.price_per_day)}/hari</option>))}
            </select>
          </Field>
          <Field label="Tanggal Mulai"><input type="date" className={inputCls} style={inputStyle} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label="Tanggal Selesai"><input type="date" className={inputCls} style={inputStyle} value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        </div>
      </Plate>

      <Plate className="p-5" accent="var(--hr-charcoal)">
        <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--hr-steel)", fontFamily: "var(--font-mono)" }}>Rincian Biaya</h3>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span>Excavator ({ex ? ex.model_name : "-"})</span><span style={{ fontFamily: "var(--font-mono)" }}>{ex ? idr(ex.price_per_day) : "-"}/hari</span></div>
          <div className="flex justify-between"><span>Operator ({op ? op.name : "-"})</span><span style={{ fontFamily: "var(--font-mono)" }}>{op ? idr(op.price_per_day) : "-"}/hari</span></div>
          <div className="flex justify-between"><span>Durasi</span><span style={{ fontFamily: "var(--font-mono)" }}>{days || 0} hari</span></div>
        </div>
        <div className="flex justify-between items-center mt-4 pt-3 border-t" style={{ borderColor: "var(--hr-line)" }}>
          <span className="font-bold">Total Biaya</span>
          <span className="font-black text-lg" style={{ fontFamily: "var(--font-mono)", color: "var(--hr-orange)" }}>{idr(total)}</span>
        </div>
        {error && <p className="text-sm mt-3" style={{ color: "#B02A2A" }}>{error}</p>}
        <PrimaryBtn className="w-full mt-4" disabled={!valid || busy} onClick={submit}>{busy ? "Memproses..." : "Checkout Pemesanan"}</PrimaryBtn>
        {!valid && (start || end) && <p className="text-xs mt-2" style={{ color: "#B02A2A" }}>Periksa kembali tanggal sewa Anda.</p>}
      </Plate>
    </div>
  );
}

/* ---------------- Customer: History ---------------- */

function HistoryView({ bookings, excavators, operators, user }) {
  const mine = bookings.filter((b) => b.user_id === user.id);
  const [invoiceFor, setInvoiceFor] = useState(null);

  return (
    <div>
      <h2 className="text-xl font-black mb-4" style={{ fontFamily: "var(--font-display)" }}>Riwayat Pesanan</h2>
      {mine.length === 0 && <EmptyState icon={ClipboardList} title="Belum ada pesanan" note="Pesanan Anda akan muncul di sini." />}
      <div className="space-y-3">
        {mine.map((b) => {
          const ex = excavators.find((e) => e.id === b.excavator_id);
          const op = operators.find((o) => o.id === b.operator_id);
          return (
            <Plate key={b.id} className="p-4" accent="var(--hr-steel)">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1"><SerialTag id={b.id} /><Badge status={b.status} /></div>
                  <p className="font-bold" style={{ fontFamily: "var(--font-display)" }}>{ex ? ex.model_name : "Unit dihapus"} + {op ? op.name : "Operator dihapus"}</p>
                  <p className="text-xs" style={{ color: "var(--hr-steel)" }}>{b.start_date} s/d {b.end_date}</p>
                </div>
                <div className="text-right">
                  <p className="font-black" style={{ fontFamily: "var(--font-mono)" }}>{idr(b.total_price)}</p>
                  <button onClick={() => setInvoiceFor(b)} className="text-xs font-semibold underline mt-1" style={{ color: "var(--hr-orange)" }}>Lihat Bukti Sewa</button>
                </div>
              </div>
            </Plate>
          );
        })}
      </div>
      {invoiceFor && <InvoiceModal booking={invoiceFor} excavators={excavators} operators={operators} onClose={() => setInvoiceFor(null)} />}
    </div>
  );
}

function InvoiceModal({ booking, excavators, operators, onClose }) {
  const ex = excavators.find((e) => e.id === booking.excavator_id);
  const op = operators.find((o) => o.id === booking.operator_id);
  return (
    <Modal title="Bukti Sewa" onClose={onClose}>
      <div className="border rounded p-4" style={{ borderColor: "var(--hr-line)" }}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="font-black" style={{ fontFamily: "var(--font-display)" }}>HEAVYRENT</p>
            <p className="text-xs" style={{ color: "var(--hr-steel)" }}>Bukti Sewa Digital</p>
          </div>
          <Badge status={booking.status} />
        </div>
        <div className="text-sm space-y-1 mb-3" style={{ fontFamily: "var(--font-mono)" }}>
          <p>No. Pesanan: #{String(booking.id).padStart(6, "0")}</p>
          <p>Periode: {booking.start_date} s/d {booking.end_date}</p>
        </div>
        <div className="text-sm border-t pt-3 space-y-1" style={{ borderColor: "var(--hr-line)" }}>
          <div className="flex justify-between"><span>Unit</span><span>{ex ? ex.model_name : "-"}</span></div>
          <div className="flex justify-between"><span>Operator</span><span>{op ? op.name : "-"}</span></div>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t font-black" style={{ borderColor: "var(--hr-line)" }}>
          <span>Total</span><span style={{ fontFamily: "var(--font-mono)", color: "var(--hr-orange)" }}>{idr(booking.total_price)}</span>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Admin ---------------- */

function StatCard({ icon: Icon, label, value }) {
  return (
    <Plate className="p-4" accent="var(--hr-yellow)">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--hr-steel)", fontFamily: "var(--font-mono)" }}>{label}</p>
          <p className="text-2xl font-black mt-1" style={{ fontFamily: "var(--font-display)" }}>{value}</p>
        </div>
        <Icon size={22} style={{ color: "var(--hr-orange)" }} />
      </div>
    </Plate>
  );
}

function AdminOverview({ excavators, operators, bookings }) {
  const pending = bookings.filter((b) => b.status === "pending").length;
  const available = excavators.filter((e) => e.status === "available").length;
  return (
    <div>
      <h2 className="text-xl font-black mb-4" style={{ fontFamily: "var(--font-display)" }}>Ringkasan Operasional</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Truck} label="Total Unit" value={excavators.length} />
        <StatCard icon={ShieldCheck} label="Unit Tersedia" value={available} />
        <StatCard icon={Users} label="Total Operator" value={operators.length} />
        <StatCard icon={Clock} label="Pesanan Menunggu" value={pending} />
      </div>
      <h3 className="font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>Aktivitas Pesanan Terbaru</h3>
      <div className="space-y-2">
        {bookings.slice(0, 5).map((b) => (
          <div key={b.id} className="flex items-center justify-between p-3 rounded border" style={{ borderColor: "var(--hr-line)" }}>
            <span className="text-sm font-semibold">Pesanan #{String(b.id).padStart(6, "0")}</span>
            <Badge status={b.status} />
          </div>
        ))}
        {bookings.length === 0 && <p className="text-sm" style={{ color: "var(--hr-steel)" }}>Belum ada aktivitas pesanan.</p>}
      </div>
    </div>
  );
}

function ExcavatorAdmin({ excavators, onCreate, onUpdate, onDelete }) {
  const [modal, setModal] = useState(null);
  const blank = { model_name: "", type: "", capacity: "", price_per_day: "", status: "available" };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");

  const openAdd = () => { setForm(blank); setError(""); setModal("add"); };
  const openEdit = (item) => { setForm(item); setError(""); setModal("edit"); };

  const save = async () => {
    try {
      if (modal === "add") await onCreate(form);
      else await onUpdate(form.id, form);
      setModal(null);
    } catch (err) { setError(err.message); }
  };
  const remove = async (id) => {
    if (!window.confirm("Hapus unit ini?")) return;
    await onDelete(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-display)" }}>Kelola Alat</h2>
        <PrimaryBtn onClick={openAdd}><Plus size={15} /> Tambah Unit</PrimaryBtn>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {excavators.map((ex) => (
          <Plate key={ex.id} className="p-4">
            <div className="flex items-start justify-between mb-2"><Truck size={18} style={{ color: "var(--hr-orange)" }} /><SerialTag id={ex.id} /></div>
            <h3 className="font-bold" style={{ fontFamily: "var(--font-display)" }}>{ex.model_name}</h3>
            <p className="text-xs mb-2" style={{ color: "var(--hr-steel)" }}>{ex.type} · {ex.capacity}</p>
            <div className="flex items-center justify-between mb-3">
              <Badge status={ex.status} />
              <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)" }}>{idr(ex.price_per_day)}</span>
            </div>
            <div className="flex gap-2">
              <GhostBtn className="flex-1" onClick={() => openEdit(ex)}><Pencil size={13} /> Ubah</GhostBtn>
              <GhostBtn onClick={() => remove(ex.id)} className="text-red-600"><Trash2 size={13} /></GhostBtn>
            </div>
          </Plate>
        ))}
      </div>

      {modal && (
        <Modal title={modal === "add" ? "Tambah Unit Excavator" : "Ubah Unit Excavator"} onClose={() => setModal(null)}>
          <Field label="Nama Model"><input className={inputCls} style={inputStyle} value={form.model_name} onChange={(e) => setForm({ ...form, model_name: e.target.value })} /></Field>
          <Field label="Tipe"><input className={inputCls} style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></Field>
          <Field label="Kapasitas"><input className={inputCls} style={inputStyle} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field>
          <Field label="Tarif per Hari (Rp)"><input type="number" className={inputCls} style={inputStyle} value={form.price_per_day} onChange={(e) => setForm({ ...form, price_per_day: e.target.value })} /></Field>
          <Field label="Status">
            <select className={inputCls} style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="available">Tersedia</option><option value="rented">Disewa</option><option value="maintenance">Perawatan</option>
            </select>
          </Field>
          {error && <p className="text-sm mb-2" style={{ color: "#B02A2A" }}>{error}</p>}
          <PrimaryBtn className="w-full mt-2" onClick={save}>Simpan</PrimaryBtn>
        </Modal>
      )}
    </div>
  );
}

function OperatorAdmin({ operators, onCreate, onUpdate, onDelete }) {
  const [modal, setModal] = useState(null);
  const blank = { name: "", phone: "", certification: "", price_per_day: "", status: "available" };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");

  const openAdd = () => { setForm(blank); setError(""); setModal("add"); };
  const openEdit = (item) => { setForm(item); setError(""); setModal("edit"); };

  const save = async () => {
    try {
      if (modal === "add") await onCreate(form);
      else await onUpdate(form.id, form);
      setModal(null);
    } catch (err) { setError(err.message); }
  };
  const remove = async (id) => {
    if (!window.confirm("Hapus operator ini?")) return;
    await onDelete(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-display)" }}>Kelola Operator</h2>
        <PrimaryBtn onClick={openAdd}><Plus size={15} /> Tambah Operator</PrimaryBtn>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {operators.map((op) => (
          <Plate key={op.id} className="p-4" accent="var(--hr-steel)">
            <div className="flex items-start justify-between mb-2"><HardHat size={18} /><SerialTag id={op.id} /></div>
            <h3 className="font-bold" style={{ fontFamily: "var(--font-display)" }}>{op.name}</h3>
            <p className="text-xs mb-2" style={{ color: "var(--hr-steel)" }}>{op.certification} · {op.phone}</p>
            <div className="flex items-center justify-between mb-3">
              <Badge status={op.status} />
              <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)" }}>{idr(op.price_per_day)}</span>
            </div>
            <div className="flex gap-2">
              <GhostBtn className="flex-1" onClick={() => openEdit(op)}><Pencil size={13} /> Ubah</GhostBtn>
              <GhostBtn onClick={() => remove(op.id)} className="text-red-600"><Trash2 size={13} /></GhostBtn>
            </div>
          </Plate>
        ))}
      </div>

      {modal && (
        <Modal title={modal === "add" ? "Tambah Operator" : "Ubah Operator"} onClose={() => setModal(null)}>
          <Field label="Nama"><input className={inputCls} style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="No. Telepon"><input className={inputCls} style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Sertifikasi / Keahlian"><input className={inputCls} style={inputStyle} value={form.certification} onChange={(e) => setForm({ ...form, certification: e.target.value })} /></Field>
          <Field label="Tarif per Hari (Rp)"><input type="number" className={inputCls} style={inputStyle} value={form.price_per_day} onChange={(e) => setForm({ ...form, price_per_day: e.target.value })} /></Field>
          <Field label="Status">
            <select className={inputCls} style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="available">Tersedia</option><option value="assigned">Bertugas</option>
            </select>
          </Field>
          {error && <p className="text-sm mb-2" style={{ color: "#B02A2A" }}>{error}</p>}
          <PrimaryBtn className="w-full mt-2" onClick={save}>Simpan</PrimaryBtn>
        </Modal>
      )}
    </div>
  );
}

const NEXT_STATUS = {
  pending: ["approved", "rejected"],
  approved: ["on_progress"],
  on_progress: ["completed"],
  completed: [],
  rejected: [],
};

function OrdersAdmin({ bookings, excavators, operators, onUpdateStatus }) {
  return (
    <div>
      <h2 className="text-xl font-black mb-4" style={{ fontFamily: "var(--font-display)" }}>Pesanan Masuk</h2>
      {bookings.length === 0 && <EmptyState icon={ClipboardList} title="Belum ada pesanan masuk" />}
      <div className="space-y-3">
        {bookings.map((b) => {
          const ex = excavators.find((e) => e.id === b.excavator_id);
          const op = operators.find((o) => o.id === b.operator_id);
          const options = NEXT_STATUS[b.status] || [];
          return (
            <Plate key={b.id} className="p-4" accent="var(--hr-orange)">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1"><SerialTag id={b.id} /><Badge status={b.status} /></div>
                  <p className="font-bold" style={{ fontFamily: "var(--font-display)" }}>Pesanan #{String(b.id).padStart(6, "0")}</p>
                  <p className="text-xs" style={{ color: "var(--hr-steel)" }}>{ex ? ex.model_name : "-"} + {op ? op.name : "-"} · {b.start_date} s/d {b.end_date}</p>
                </div>
                <div className="text-right">
                  <p className="font-black mb-2" style={{ fontFamily: "var(--font-mono)" }}>{idr(b.total_price)}</p>
                  {options.length > 0 ? (
                    <div className="flex gap-2 justify-end">
                      {options.map((s) => (
                        <button key={s} onClick={() => onUpdateStatus(b.id, s)}
                          className="px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1"
                          style={s === "rejected" ? { background: "#FBE4E4", color: "#B02A2A" } : { background: "var(--hr-yellow)", color: "var(--hr-charcoal)" }}>
                          {s === "rejected" ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                          {STATUS_MAP[s].label}
                        </button>
                      ))}
                    </div>
                  ) : (<span className="text-xs" style={{ color: "var(--hr-steel)" }}>Tidak ada aksi lanjutan</span>)}
                </div>
              </div>
            </Plate>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Root App ---------------- */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [excavators, setExcavators] = useState([]);
  const [operators, setOperators] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [view, setView] = useState("catalog");
  const [presetExcavator, setPresetExcavator] = useState(null);
  const [fatalError, setFatalError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [me, ex, op] = await Promise.all([
          apiFetch("/me"),
          apiFetch("/excavators"),
          apiFetch("/operators"),
        ]);
        setExcavators(ex);
        setOperators(op);
        if (me.user) {
          setCurrentUser(me.user);
          const bk = await apiFetch("/bookings");
          setBookings(bk);
          setView(me.user.role === "admin" ? "overview" : "catalog");
        }
      } catch (e) {
        setFatalError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const doLogin = async (email, password) => {
    const { user } = await apiFetch("/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setCurrentUser(user);
    const bk = await apiFetch("/bookings");
    setBookings(bk);
    setView(user.role === "admin" ? "overview" : "catalog");
  };
  const doRegister = async (payload) => {
    const { user } = await apiFetch("/register", { method: "POST", body: JSON.stringify(payload) });
    setCurrentUser(user);
    setBookings([]);
    setView(user.role === "admin" ? "overview" : "catalog");
  };
  const handleLogout = async () => {
    await apiFetch("/logout", { method: "POST" });
    setCurrentUser(null);
    setBookings([]);
  };

  const goToBooking = (exId) => { setPresetExcavator(exId); setView("booking"); };

  const createBooking = async (payload) => {
    const created = await apiFetch("/bookings", { method: "POST", body: JSON.stringify(payload) });
    setBookings((prev) => [created, ...prev]);
    return created;
  };

  const createExcavator = async (payload) => {
    const created = await apiFetch("/excavators", { method: "POST", body: JSON.stringify(payload) });
    setExcavators((prev) => [...prev, created]);
  };
  const updateExcavator = async (id, payload) => {
    const updated = await apiFetch(`/excavators/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    setExcavators((prev) => prev.map((e) => (e.id === id ? updated : e)));
  };
  const deleteExcavator = async (id) => {
    await apiFetch(`/excavators/${id}`, { method: "DELETE" });
    setExcavators((prev) => prev.filter((e) => e.id !== id));
  };

  const createOperator = async (payload) => {
    const created = await apiFetch("/operators", { method: "POST", body: JSON.stringify(payload) });
    setOperators((prev) => [...prev, created]);
  };
  const updateOperator = async (id, payload) => {
    const updated = await apiFetch(`/operators/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    setOperators((prev) => prev.map((o) => (o.id === id ? updated : o)));
  };
  const deleteOperator = async (id) => {
    await apiFetch(`/operators/${id}`, { method: "DELETE" });
    setOperators((prev) => prev.filter((o) => o.id !== id));
  };

  const updateBookingStatus = async (id, status) => {
    const updated = await apiFetch(`/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
    const [ex, op] = await Promise.all([apiFetch("/excavators"), apiFetch("/operators")]);
    setExcavators(ex);
    setOperators(op);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--hr-charcoal)" }}>
        <RootStyles />
        <p className="text-white text-sm font-mono animate-pulse">Memuat HeavyRent…</p>
      </div>
    );
  }

  if (fatalError && !currentUser && excavators.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--hr-charcoal)" }}>
        <RootStyles />
        <p className="text-red-300 text-sm max-w-md text-center">Gagal memuat data: {fatalError}. Pastikan backend Laravel &amp; database sudah berjalan.</p>
      </div>
    );
  }

  if (!currentUser) {
    return (<><RootStyles /><AuthScreen onLogin={doLogin} onRegister={doRegister} /></>);
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "var(--hr-bg)" }}>
      <RootStyles />
      <Sidebar role={currentUser.role} view={view} setView={setView} user={currentUser} onLogout={handleLogout} />
      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        {currentUser.role === "customer" && (
          <>
            {view === "catalog" && <CatalogView excavators={excavators} operators={operators} goToBooking={goToBooking} />}
            {view === "booking" && (
              <BookingView excavators={excavators} operators={operators} presetExcavator={presetExcavator} onCreateBooking={createBooking} setView={setView} />
            )}
            {view === "history" && <HistoryView bookings={bookings} excavators={excavators} operators={operators} user={currentUser} />}
          </>
        )}
        {currentUser.role === "admin" && (
          <>
            {view === "overview" && <AdminOverview excavators={excavators} operators={operators} bookings={bookings} />}
            {view === "excavators" && <ExcavatorAdmin excavators={excavators} onCreate={createExcavator} onUpdate={updateExcavator} onDelete={deleteExcavator} />}
            {view === "operators" && <OperatorAdmin operators={operators} onCreate={createOperator} onUpdate={updateOperator} onDelete={deleteOperator} />}
            {view === "orders" && <OrdersAdmin bookings={bookings} excavators={excavators} operators={operators} onUpdateStatus={updateBookingStatus} />}
          </>
        )}
      </div>
    </div>
  );
}

function RootStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
      :root {
        --hr-charcoal: #1B1E23;
        --hr-charcoal-2: #262B33;
        --hr-steel: #6B7280;
        --hr-yellow: #F5B700;
        --hr-orange: #E8590C;
        --hr-bg: #F7F6F2;
        --hr-line: #E7E5DF;
        --font-display: 'Oswald', sans-serif;
        --font-mono: 'IBM Plex Mono', monospace;
      }
      * { font-family: 'Inter', sans-serif; }
      h1,h2,h3,button { font-family: var(--font-display); letter-spacing: 0.01em; }
      input, select { font-family: 'Inter', sans-serif; }
      input:focus, select:focus { border-color: var(--hr-yellow) !important; box-shadow: 0 0 0 3px rgba(245,183,0,0.25); }
    `}</style>
  );
}
