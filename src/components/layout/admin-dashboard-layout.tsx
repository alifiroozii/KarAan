"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, FileSearch, Scale, Users, LogOut, ShieldCheck, Home } from "lucide-react";
import { ThemeToggle } from "../common/theme-toggle";

function navClass(active: boolean) {
  return active
    ? "flex items-center gap-3 rounded-2xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition"
    : "flex items-center gap-3 rounded-2xl px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white";
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
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-indigo-500 selection:text-white"
    >
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-bold text-lg shadow-sm group-hover:scale-105 transition">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-slate-900 dark:text-white">
                  کاروین | مدیریت سامانه
                </h1>
                <span className="hidden md:inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  نسخه مدیریت ۲.۴
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                مرکز عملیات و مانیتورینگ متمرکز (کارجو، کارفرما، جیمیل و موبایل)
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Home className="h-3.5 w-3.5 text-indigo-500" />
              <span>مشاهده سایت</span>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              سیستم مانیتورینگ فعال
            </span>

            {/* Theme Toggle (Light / Dark) */}
            <ThemeToggle />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 shadow-xs cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3.5 space-y-4 shadow-sm">
          <nav className="space-y-1">
            <Link href="/admin" className={navClass(pathname === "/admin")}>
              <Activity className="h-4 w-4" />
              <span>داشبورد و لاگین‌ها</span>
            </Link>
            <Link href="/admin/users" className={navClass(pathname.startsWith("/admin/users"))}>
              <Users className="h-4 w-4" />
              <span>کاربران و جیمیل</span>
            </Link>
            <Link href="/admin/audit" className={navClass(pathname.startsWith("/admin/audit"))}>
              <FileSearch className="h-4 w-4" />
              <span>Audit Log</span>
            </Link>
            <Link href="/admin/disputes" className={navClass(pathname.startsWith("/admin/disputes"))}>
              <Scale className="h-4 w-4" />
              <span>اختلافات</span>
            </Link>
          </nav>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/60 p-3 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
            <div className="font-bold text-slate-800 dark:text-slate-200">وضعیت اتصال سیستم:</div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>هماهنگ با اپ موبایل</span>
            </div>
            <div className="text-[10px] text-slate-500">پورت سرویس: ۳۰۰۰ (Next.js)</div>
            <div className="text-[10px] text-slate-500 font-mono">Vercel: آماده استقرار</div>
          </div>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
