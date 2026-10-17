"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Eye, EyeOff, ArrowLeft, KeyRound, Sparkles } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password.trim()) {
      setError("لطفاً رمز عبور مدیریت را وارد فرمایید.");
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
        throw new Error(data.error || "رمز عبور اشتباه است.");
      }

      // Success -> navigate to dashboard
      router.push("/admin");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در برقراری ارتباط";
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
    <div dir="rtl" className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 selection:bg-indigo-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-600/20 text-indigo-400 shadow-lg shadow-indigo-600/20">
            <ShieldCheck className="h-8 w-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">ورود به پنل مدیریت کاروین</h1>
            <p className="mt-1.5 text-xs text-slate-400">مرکز عملیات و مانیتورینگ متمرکز کاربران و درخواست‌ها</p>
          </div>
        </div>

        {/* Login Box */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs font-semibold text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">رمز عبور امن مدیر ارشد</label>
              <div className="relative flex items-center">
                <div className="pointer-events-none absolute right-3.5 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور پنل را وارد کنید..."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 py-3.5 pr-10 pl-11 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 text-slate-400 hover:text-slate-200 transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                "در حال بررسی اعتبارسنجی..."
              ) : (
                <>
                  <span>ورود امن به داشبورد</span>
                  <ArrowLeft className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Preset helper for easy evaluation & Vercel testing */}
          <div className="mt-6 border-t border-slate-800/80 pt-5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
              <span>رمز پیش‌فرض سیستم:</span>
              <code className="rounded bg-slate-800 px-2 py-0.5 text-indigo-300 font-mono text-[10px]">KarAan@Admin2026!</code>
            </div>
            <button
              type="button"
              onClick={handleUseDefaultPassword}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-950 py-2.5 text-[11px] font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-400" />
              <span>جایگذاری خودکار رمز پیش‌فرض ادمین</span>
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>حفاظت شده با استاندارد امنیتی احراز هویت کاروین (Vercel & Cloud Ready)</span>
        </div>
      </div>
    </div>
  );
}
