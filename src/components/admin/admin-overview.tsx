"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BriefcaseBusiness, FileText, ShieldBan, Users, UserRound, Building2 } from "lucide-react";

interface Overview {
  totalUsers: number;
  workers: number;
  employers: number;
  blockedUsers: number;
  activeShifts: number;
  openDisputes: number;
  auditEvents24h: number;
  generatedAt: string;
}

async function fetchOverview(): Promise<Overview> {
  const response = await fetch("/api/admin/overview", { cache: "no-store" });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body?.error?.message ?? "دریافت داشبورد ناموفق بود.");
  return body.data as Overview;
}

export function AdminOverview() {
  const query = useQuery({ queryKey: ["admin", "overview"], queryFn: fetchOverview, refetchInterval: 60_000 });
  if (query.isLoading) return <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400">در حال دریافت آمار واقعی…</div>;
  if (query.isError) return <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">{query.error.message}</div>;
  const data = query.data!;
  const cards = [
    ["کل کاربران", data.totalUsers, Users],
    ["کارجویان", data.workers, UserRound],
    ["کارفرمایان", data.employers, Building2],
    ["حساب‌های مسدود", data.blockedUsers, ShieldBan],
    ["شیفت‌های فعال", data.activeShifts, BriefcaseBusiness],
    ["اختلافات باز", data.openDisputes, AlertTriangle],
    ["رویداد Audit در ۲۴ ساعت", data.auditEvents24h, FileText],
  ] as const;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-black">داشبورد عملیاتی</h2>
        <p className="mt-1 text-sm text-slate-400">تمام شاخص‌ها مستقیماً از دیتابیس محاسبه می‌شوند.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value, Icon]) => (
          <article key={label} className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-center justify-between text-xs text-slate-400"><span>{label}</span><Icon className="h-4 w-4 text-indigo-400" /></div>
            <strong className="mt-4 block text-3xl font-black text-white">{value.toLocaleString("fa-IR")}</strong>
          </article>
        ))}
      </div>
      <p className="text-[10px] text-slate-600">آخرین محاسبه: {new Date(data.generatedAt).toLocaleString("fa-IR")}</p>
    </section>
  );
}
