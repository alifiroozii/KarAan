"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, FileSearch, Scale, Users, LogOut, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "../common/theme-toggle";

function navClass(active: boolean) {
  return active
    ? "flex items-center gap-3 rounded-2xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-sm"
    : "flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold text-slate-400 transition hover:bg-slate-900 hover:text-white";
}

export function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Check if admin is authenticated
    fetch("/api/admin/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.data?.authenticated) {
          router.replace("/admin/login");
        }
      })
      .catch(() => {
        // network issue
      });
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.replace("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-600/20 text-indigo-400 font-bold text-lg shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-black">کاروین | مدیریت سامانه</h1>
              <p className="text-[10px] text-slate-400">مرکز عملیات و مانیتورینگ متمرکز (کارجو، کارفرما، جیمیل)</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              سیستم مانیتورینگ آنلاین
            </span>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-3xl border border-slate-800 bg-slate-900/60 p-3 space-y-4">
          <nav className="space-y-1">
            <Link href="/admin" className={navClass(pathname === "/admin")}><Activity className="h-4 w-4" />داشبورد و لاگین‌ها</Link>
            <Link href="/admin/users" className={navClass(pathname.startsWith("/admin/users"))}><Users className="h-4 w-4" />کاربران و جیمیل</Link>
            <Link href="/admin/audit" className={navClass(pathname.startsWith("/admin/audit"))}><FileSearch className="h-4 w-4" />Audit Log</Link>
            <Link href="/admin/disputes" className={navClass(pathname.startsWith("/admin/disputes"))}><Scale className="h-4 w-4" />اختلافات</Link>
          </nav>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3 text-[11px] text-slate-400 space-y-1.5">
            <div className="font-bold text-slate-300">حالت سامانه:</div>
            <div className="flex items-center gap-1 text-emerald-400">
              <span>●</span> آماده هماهنگی با موبایل
            </div>
            <div className="text-[10px] text-slate-500">پورت API: ۳۰۰۰ (Next.js)</div>
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
