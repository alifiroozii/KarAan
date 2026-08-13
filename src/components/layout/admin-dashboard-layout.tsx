"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Users, Briefcase, FileText } from "lucide-react";

export function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500 selection:text-white">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">کارآن | پنل مدیریت ارشد (Admin)</h1>
              <p className="text-xs text-muted-foreground">نظارت کل سیستم و دفتر کل مالی</p>
            </div>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 space-y-2">
          <nav className="space-y-1.5 bg-card p-3 border border-border rounded-3xl">
            <Link
              href="/admin"
              className="w-full p-3 rounded-2xl text-xs font-bold flex items-center gap-3 bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
            >
              <Users className="w-4 h-4" />
              <span>کاربران و اعتبارسنجی</span>
            </Link>
            <Link
              href="/admin"
              className="w-full p-3 rounded-2xl text-xs font-bold flex items-center gap-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <Briefcase className="w-4 h-4" />
              <span>شیفت‌های فعال</span>
            </Link>
            <Link
              href="/admin"
              className="w-full p-3 rounded-2xl text-xs font-bold flex items-center gap-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>دفتر کل حسابداری (Audit)</span>
            </Link>
          </nav>
        </aside>

        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  );
}
