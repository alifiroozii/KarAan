"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, RefreshCw } from "lucide-react";

interface BranchRow {
  id: string;
  name: string;
  businessName: string;
  address: string;
  phone: string | null;
  managerUserId: string | null;
}

async function fetchBranches(): Promise<BranchRow[]> {
  const response = await fetch("/api/branches", { cache: "no-store" });
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message ?? "دریافت شعب ناموفق بود.");
  }
  return body.data ?? [];
}

export default function EmployerBranchesPage() {
  const query = useQuery({
    queryKey: ["employer", "branches"],
    queryFn: fetchBranches,
  });
  const items = query.data ?? [];
  const error = query.error instanceof Error ? query.error.message : null;

  return (
    <section dir="rtl" className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">شعب و محل‌های کاری</h2>
          <p className="mt-1 text-sm text-muted-foreground">شعبی که حساب شما مجاز به مشاهده آن‌هاست</p>
        </div>
        <button
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />بازخوانی
        </button>
      </div>

      {query.isLoading && <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">در حال دریافت شعب…</div>}
      {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">{error}</div>}
      {!query.isLoading && !error && items.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">برای این حساب هنوز شعبه‌ای ثبت نشده است.</div>}

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((branch) => (
          <article key={branch.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-400"><MapPin className="h-5 w-5" /></div>
              <div><h3 className="font-bold">{branch.name}</h3><p className="text-xs text-muted-foreground">{branch.businessName}</p></div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{branch.address}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              {branch.phone && <span className="rounded-lg bg-muted px-2 py-1">{branch.phone}</span>}
              <span className="rounded-lg bg-muted px-2 py-1">{branch.managerUserId ? "مدیر شعبه تعیین شده" : "بدون مدیر شعبه"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
