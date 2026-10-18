"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  Sparkles,
  Home,
  CheckCircle2,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.documentElement.style.colorScheme = "light";
  }, []);

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
        body: JSON.stringify({
          username: username.trim() || "admin@karaan.ir",
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "نام کاربری یا رمز عبور اشتباه است.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در ارتباط با سرور";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefaultCredentials = () => {
    setUsername("admin@karaan.ir");
    setPassword("KarAan@Admin2026!");
    setError(null);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden transition-colors duration-200 selection:bg-indigo-500 selection:text-white font-sans"
    >
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="absolute top-4 inset-x-4 max-w-5xl mx-auto flex items-center justify-between z-20">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white/90 backdrop-blur text-xs font-semibold text-slate-600 transition hover:bg-slate-100 shadow-xs"
        >
          <Home className="h-3.5 w-3.5 text-indigo-500" />
          <span>صفحه اصلی</span>
        </Link>
      </header>

      {/* Main Login Box */}
      <div className="relative w-full max-w-md z-10 pt-8 sm:pt-4">
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-2.5">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/20 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-500/25">
            <ShieldCheck className="h-8 w-8" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white font-bold ring-2 ring-white">
              ✓
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-[11px] font-bold mb-1.5">
              <span>سامانه اختصاصی مدیریت و مانیتورینگ کاربران</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              ورود به پنل مدیریت کاربران کاروین
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              پایش لحظه‌ای نصب‌های اپلیکیشن، درخواست‌های کاربران و احراز هویت
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 sm:p-7 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-50 p-3.5 text-xs font-semibold text-red-600 flex items-start gap-2">
                <span className="font-bold text-sm">✕</span>
                <span>{error}</span>
              </div>
            )}

            {/* Username / Email field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                نام کاربری یا ایمیل مدیریت
              </label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute right-3.5 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  dir="ltr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@karaan.ir"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pr-10 pl-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 font-mono"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  رمز عبور مدیریت ارشد
                </label>
                <span className="text-[10px] text-indigo-600 font-medium">
                  HTTP-Only Session
                </span>
              </div>

              <div className="relative flex items-center">
                <div className="pointer-events-none absolute right-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور را وارد کنید..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pr-10 pl-11 text-xs sm:text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
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
                  <span>در حال بررسی اعتبارسنجی...</span>
                </span>
              ) : (
                <>
                  <span>ورود به داشبورد مدیریت کاربران</span>
                  <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Auto-Fill Helper */}
          <div className="mt-5 border-t border-slate-100 pt-4 space-y-2.5">
            <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-slate-600">
                <span>نام کاربری پیش‌فرض:</span>
                <code className="text-indigo-600 font-mono font-bold">admin@karaan.ir</code>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>رمز عبور پیش‌فرض:</span>
                <code className="text-indigo-600 font-mono font-bold">KarAan@Admin2026!</code>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUseDefaultCredentials}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-2.5 text-[11px] font-bold text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600 shadow-xs cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-500" />
              <span>جایگذاری خودکار نام کاربری و رمز عبور (تست سریع)</span>
            </button>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 flex flex-col items-center justify-center gap-1 text-center text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>پلتفرم متمرکز کاروین | استقرار روی ورسل و کلود</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>اختصاصی مدیریت و پایش کاربران کارآن</span>
          </div>
        </div>
      </div>
    </div>
  );
}
