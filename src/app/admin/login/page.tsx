"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  Sparkles,
  Home,
  CheckCircle2,
  LogIn,
} from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setError("لطفاً رمز عبور مدیریت سامانه را وارد فرمایید.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "رمز عبور وارد شده نادرست است.");
      }

      // Successful login -> route to dashboard
      router.push("/admin");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در ارتباط با سرور";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefaultPassword = () => {
    setPassword("KarAan@Admin2026!");
    setError(null);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden transition-colors duration-200 selection:bg-indigo-500 selection:text-white"
    >
      {/* Dynamic Background Mesh / Ambient Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent" />
      </div>

      {/* Top Bar with Theme Toggle & Home Link */}
      <header className="absolute top-4 inset-x-4 max-w-5xl mx-auto flex items-center justify-between z-20">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs"
        >
          <Home className="h-3.5 w-3.5 text-indigo-500" />
          <span>بازگشت به صفحه اصلی</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs"
          >
            <LogIn className="h-3.5 w-3.5 text-emerald-500" />
            <span>ورود کاربران عادی</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Login Card */}
      <div className="relative w-full max-w-md z-10 pt-8 sm:pt-4">
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-3">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/20 dark:border-indigo-500/30 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-500/25">
            <ShieldCheck className="h-8 w-8" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white font-bold ring-2 ring-white dark:ring-slate-950">
              ✓
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold mb-1.5">
              <span>سامانه امنیتی احراز هویت کاروین</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              ورود به داشبورد مدیریت کاروین
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              مرکز عملیات، مانیتورینگ کاربران، پایش ورود با جیمیل و وضعیت اپ موبایل
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/85 p-6 sm:p-7 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/50 backdrop-blur-xl transition-all">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3.5 text-xs font-semibold text-red-600 dark:text-red-300 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <span className="font-bold text-sm">✕</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  رمز عبور اختصاصی مدیر ارشد
                </label>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  احراز هویت سشن امن
                </span>
              </div>

              <div className="relative flex items-center">
                <div className="pointer-events-none absolute right-3.5 text-slate-400 dark:text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور پنل را وارد نمایید..."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950/80 py-3.5 pr-10 pl-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-indigo-500/15"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  title={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>در حال بررسی اعتبارسنجی امنیتی...</span>
                </span>
              ) : (
                <>
                  <span>ورود امن به پنل مدیریت</span>
                  <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Auto-fill Helper for Evaluation & Vercel Preview */}
          <div className="mt-5 border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>رمز عبور پیش‌فرض تست:</span>
              <code className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                KarAan@Admin2026!
              </code>
            </div>

            <button
              type="button"
              onClick={handleUseDefaultPassword}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 py-2.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-500" />
              <span>جایگذاری خودکار رمز پیش‌فرض ادمین (یک‌کلیک)</span>
            </button>
          </div>
        </div>

        {/* Security and Cloud Verification Footer */}
        <div className="mt-6 flex flex-col items-center justify-center gap-1.5 text-center text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>سازگار با Vercel Serverless و سشن ایمن HTTP-Only</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>سامانه کارآن | پشتیبانی از تم تاریک و تم روشن در کلیه صفحات</span>
          </div>
        </div>
      </div>
    </div>
  );
}
