"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Briefcase, Wallet, User, Smartphone } from "lucide-react";
import { ReliabilityBadge } from "../ui/domain-displays";

export function WorkerMobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeNav = pathname.startsWith("/worker/notifications")
    ? "NOTIFICATIONS"
    : pathname.startsWith("/worker/wallet")
      ? "WALLET"
      : pathname.startsWith("/worker/profile")
        ? "PROFILE"
        : "ACTIVE";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between max-w-md mx-auto border-x border-border shadow-2xl relative pb-20 selection:bg-indigo-500 selection:text-white">
      <header className="p-4 bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">کارآن (کارجو)</h1>
            <p className="text-[10px] text-emerald-400 font-medium">موقعیت آنلاین فعال</p>
          </div>
        </div>
        <ReliabilityBadge score={98.5} />
      </header>

      <main className="p-4 flex-1">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card/90 backdrop-blur-lg border-t border-border p-2 flex items-center justify-around z-50">
        <Link
          href="/worker"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors ${
            activeNav === "ACTIVE" ? "text-indigo-400" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span>شیفت فعال</span>
        </Link>
        <Link
          href="/worker/notifications"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors ${
            activeNav === "NOTIFICATIONS" ? "text-indigo-400" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>اعلان‌ها</span>
        </Link>
        <Link
          href="/worker/wallet"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors ${
            activeNav === "WALLET" ? "text-indigo-400" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span>کیف پول</span>
        </Link>
        <button
          type="button"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors ${
            activeNav === "PROFILE" ? "text-indigo-400" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="w-5 h-5" />
          <span>پروفایل</span>
        </button>
      </nav>
    </div>
  );
}
