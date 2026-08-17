"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";

interface ShiftRow {
  id: string;
  title: string;
  locationName: string;
  startAt: string;
  endAt: string;
  status: string;
  hourlyPayRials: string;
}

async function fetchShifts(): Promise<ShiftRow[]> {
  const response = await fetch("/api/shifts", { cache: "no-store" });
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message ?? "دریافت شیفت‌ها ناموفق بود.");
  }
  return body.data ?? [];
}

export default function EmployerShiftsPage() {
  const query = useQuery({
    queryKey: ["employer", "shifts"],
    queryFn: fetchShifts,
  });
  const items = query.data ?? [];
  const error = query.error instanceof Error ? query.error.message : null;

  return (
    <section dir="rtl" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">شیفت‌ها</h2>
          <p className="mt-1 text-sm text-muted-foreground">فهرست واقعی شیفت‌های قابل مشاهده برای حساب شما</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
            بازخوانی
          </button>
          <Link href="/employer/shifts/new" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500">
            <Plus className="h-4 w-4" />شیفت جدید
          </Link>
        </div>
      </div>

      {query.isLoading && <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">در حال دریافت شیفت‌ها…</div>}
      {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">{error}</div>}
      {!query.isLoading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-bold">هنوز شیفتی ثبت نشده است.</p>
          <Link href="/employer/shifts/new" className="mt-3 inline-block text-sm font-bold text-indigo-400">اولین شیفت را ایجاد کنید</Link>
        </div>
      )}

      <div className="grid gap-3">
        {items.map((shift) => (
          <Link key={shift.id} href={`/employer/shifts/${shift.id}`} className="rounded-2xl border border-border bg-card p-5 transition hover:border-indigo-500/40">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="font-bold">{shift.title}</h3><p className="mt-1 text-xs text-muted-foreground">{shift.locationName}</p></div>
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold">{shift.status}</span>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <span>{new Date(shift.startAt).toLocaleString("fa-IR")}</span>
              <span>تا {new Date(shift.endAt).toLocaleString("fa-IR")}</span>
              <span>{Number(shift.hourlyPayRials).toLocaleString("fa-IR")} ریال/ساعت</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
