"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  LogOut,
  Sparkles,
  Users,
  Smartphone,
  Mail,
  Home,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "../common/theme-toggle";

export function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [adminUser, setAdminUser] = useState<string>("admin@karaan.ir");

  useEffect(() => {
    // Check if admin is authenticated
    fetch("/api/admin/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.data?.authenticated) {
          router.replace("/admin/login");
        } else if (data?.data?.username) {
          setAdminUser(data.data.username);
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
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-indigo-500 selection:text-white flex flex-col"
    >
      {/* Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Logo & Admin Branding */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/20 dark:border-indigo-500/30 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 dark:text-white">
                  کاروین | پنل اختصاصی مدیریت کاربران
                </h1>
                <span className="hidden sm:inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                  مرکز مانیتورینگ و تله‌متری
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                پایش لحظه‌ای کاربران، نصب‌های اپلیکیشن، درخواست‌های ثبت‌شده و احراز هویت جیمیل
              </p>
            </div>
          </div>

          {/* Controls & Status Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              اتصال زنده (Live Sync)
            </span>

            <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
              <span>{adminUser}</span>
            </div>

            <ThemeToggle />

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:border-red-500/40 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 shadow-xs cursor-pointer"
              title="خروج از پنل مدیریت"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Width Content Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-3 text-center text-[11px] text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-950/50">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>سامانه متمرکز مدیریت کاربران کارآن | نسخه ۲.۴ تولید و استقرار</span>
          </div>
          <div className="text-[10px] text-slate-400">
            امنیت ارتباطات TLS / HTTP-Only Cookies / همگام با دیتابیس Drizzle ORM
          </div>
        </div>
      </footer>
    </div>
  );
}
