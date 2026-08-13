"use client";

import React from "react";
import Link from "next/link";
import { Briefcase, Building2, Smartphone, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                کارآن
              </h1>
              <p className="text-[10px] text-indigo-400 font-medium">پلتفرم مدیریت نیروی کار ساعتی</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="تغییر تم"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              href="/worker"
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all flex items-center gap-1.5"
            >
              <Smartphone className="w-4 h-4" />
              <span>کارجو (PWA)</span>
            </Link>
            <Link
              href="/employer"
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4" />
              <span>کارفرما</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>© ۱۴۰۵ - سامانه کارآن | تمامی حقوق محفوظ است.</p>
      </footer>
    </div>
  );
}
