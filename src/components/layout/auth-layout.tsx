"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Home } from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden transition-colors duration-200 selection:bg-indigo-500 selection:text-white"
    >
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="absolute top-4 inset-x-4 max-w-5xl mx-auto flex items-center justify-between z-20">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs"
        >
          <Home className="h-3.5 w-3.5 text-indigo-500" />
          <span>صفحه اصلی</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Auth Card Container */}
      <div className="relative w-full max-w-md z-10 pt-8 sm:pt-4">
        <div className="w-full bg-white/90 dark:bg-slate-900/85 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/50 backdrop-blur-xl space-y-6 transition-all">
          <div className="text-center space-y-2">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-600/25">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">ورود و احراز هویت کارآن</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">سامانه هوشمند اعزام و اشتغال نیروی کار ساعتی</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
