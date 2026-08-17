"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Scale, ShieldCheck } from "lucide-react";

interface DisputeItem {
  id: string;
  assignmentId: string;
  timesheetId: string;
  shiftTitle: string;
  raisedByUserId: string;
  reasonCode: string;
  description: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  timesheetStatus: string;
  resolutionNotes: string | null;
  createdAt: string;
}

interface DisputePageData {
  items: DisputeItem[];
  canManage: boolean;
}

const statusLabel: Record<DisputeItem["status"], string> = {
  OPEN: "باز",
  UNDER_REVIEW: "در حال بررسی",
  RESOLVED: "پذیرفته‌شده",
  REJECTED: "ردشده",
};

export function DisputeCenter() {
  const [data, setData] = useState<DisputePageData>({ items: [], canManage: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/disputes", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body?.error?.message ?? "دریافت اختلافات ناموفق بود.");
      setData(body.data as DisputePageData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "دریافت اختلافات ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function post(path: string, body?: unknown) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload?.error?.message ?? "عملیات ناموفق بود.");
      setSelected(null);
      setNotes("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "عملیات ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section dir="rtl" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><Scale className="h-6 w-6 text-indigo-400" /><h2 className="text-2xl font-black">مرکز اختلافات</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">پرونده‌های تایم‌شیت با Audit، وضعیت بررسی و رأی نهایی</p>
        </div>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted"><RefreshCw className="h-4 w-4" />بازخوانی</button>
      </div>

      {data.canManage && <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-300"><ShieldCheck className="h-4 w-4" />این حساب مجوز بررسی و صدور رأی اختلاف را دارد.</div>}
      {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
      {loading && <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">در حال دریافت پرونده‌ها…</div>}
      {!loading && data.items.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">پرونده اختلافی برای این حساب وجود ندارد.</div>}

      <div className="space-y-3">
        {data.items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="font-bold">{item.shiftTitle}</h3><p className="mt-1 text-xs text-muted-foreground">پرونده {item.id.slice(-8)} · {new Date(item.createdAt).toLocaleString("fa-IR")}</p></div>
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold">{statusLabel[item.status]}</span>
            </div>
            <div className="mt-4 rounded-xl bg-muted/50 p-4"><p className="text-xs font-bold text-indigo-400">{item.reasonCode}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p></div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground"><span className="rounded-lg bg-muted px-2 py-1">Timesheet: {item.timesheetStatus}</span><span className="rounded-lg bg-muted px-2 py-1">Assignment: {item.assignmentId.slice(-8)}</span></div>
            {item.resolutionNotes && <div className="mt-3 rounded-xl border border-border p-3 text-sm"><span className="font-bold">یادداشت رأی: </span>{item.resolutionNotes}</div>}

            {data.canManage && (item.status === "OPEN" || item.status === "UNDER_REVIEW") && (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                {item.status === "OPEN" && <button disabled={saving} onClick={() => void post(`/api/disputes/${item.id}/review`)} className="rounded-xl border border-indigo-500/30 px-3 py-2 text-xs font-bold text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-50">شروع بررسی</button>}
                <button onClick={() => setSelected(selected === item.id ? null : item.id)} className="mr-2 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted">صدور رأی</button>
                {selected === item.id && (
                  <div className="space-y-2 rounded-xl bg-muted/40 p-3">
                    <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="دلیل و توضیح رأی (حداقل ۵ کاراکتر)" className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-indigo-500" />
                    <div className="flex flex-wrap gap-2">
                      <button disabled={saving || notes.trim().length < 5} onClick={() => void post(`/api/disputes/${item.id}/resolve`, { action: "REQUIRE_ADJUSTMENT", notes })} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">پذیرش و بازگشت برای اصلاح</button>
                      <button disabled={saving || notes.trim().length < 5} onClick={() => void post(`/api/disputes/${item.id}/resolve`, { action: "REJECT_DISPUTE", notes })} className="rounded-xl bg-slate-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">رد اختلاف</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
