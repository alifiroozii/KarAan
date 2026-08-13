"use client";

import React from "react";
import Link from "next/link";
import { Building2, PlusCircle, Users, Clock } from "lucide-react";
import { CurrencyDisplay } from "../ui/domain-displays";

export function EmployerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500 selection:text-white">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/employer" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">کارآن | پنل کارفرما</h1>
              <p className="text-xs text-muted-foreground">خدمات فروشگاهی آریا</p>
            </div>
          </Link>

          <div className="bg-background border border-border rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] text-muted-foreground block">موجودی کیف پول</span>
            <span className="text-sm font-bold text-emerald-400">
              <CurrencyDisplay amountRials={BigInt(250000000)} />
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 space-y-2">
          <nav className="space-y-1.5 bg-card p-3 border border-border rounded-3xl">
            <Link
              href="/employer"
              className="w-full p-3 rounded-2xl text-xs font-bold flex items-center gap-3 bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ایجاد شیفت جدید</span>
            </Link>
            <Link
              href="/employer"
              className="w-full p-3 rounded-2xl text-xs font-bold flex items-center gap-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <Users className="w-4 h-4" />
              <span>رادار و مانیتورینگ شیفت‌ها</span>
            </Link>
            <Link
              href="/employer"
              className="w-full p-3 rounded-2xl text-xs font-bold flex items-center gap-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <Clock className="w-4 h-4" />
              <span>تایید تایم‌شیت‌ها</span>
            </Link>
          </nav>
        </aside>

        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  );
}
