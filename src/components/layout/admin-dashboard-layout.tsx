"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileSearch, Scale, ShieldCheck, Users } from "lucide-react";
import { ThemeToggle } from "../common/theme-toggle";

function navClass(active: boolean) {
  return active
    ? "flex items-center gap-3 rounded-2xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-sm"
    : "flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold text-slate-400 transition hover:bg-slate-900 hover:text-white";
}

export function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-600/20 text-indigo-400 font-bold text-lg shadow-sm">
              ک
            </div>
            <div>
              <h1 className="text-sm font-black">کاروین | مدیریت سامانه</h1>
              <p className="text-[10px] text-slate-400">مرکز عملیات و مانیتورینگ جامع</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-300">سیستم مانیتورینگ فعال</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-3xl border border-slate-800 bg-slate-900/60 p-3">
          <nav className="space-y-1">
            <Link href="/admin" className={navClass(pathname === "/admin")}><Activity className="h-4 w-4" />داشبورد</Link>
            <Link href="/admin/users" className={navClass(pathname.startsWith("/admin/users"))}><Users className="h-4 w-4" />کاربران</Link>
            <Link href="/admin/audit" className={navClass(pathname.startsWith("/admin/audit"))}><FileSearch className="h-4 w-4" />Audit Log</Link>
            <Link href="/admin/disputes" className={navClass(pathname.startsWith("/admin/disputes"))}><Scale className="h-4 w-4" />اختلافات</Link>
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
