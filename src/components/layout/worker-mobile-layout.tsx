"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Briefcase, MessageCircle, Wallet, User, Smartphone, Scale } from "lucide-react";
import { ReliabilityBadge } from "../ui/domain-displays";

export function WorkerMobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeNav = pathname.startsWith("/worker/messages")
    ? "MESSAGES"
    : pathname.startsWith("/worker/notifications")
      ? "NOTIFICATIONS"
      : pathname.startsWith("/worker/wallet")
        ? "WALLET"
        : pathname.startsWith("/worker/disputes")
          ? "DISPUTES"
          : pathname.startsWith("/worker/profile")
            ? "PROFILE"
            : "ACTIVE";

  const itemClass = (active: boolean) =>
    `flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-medium transition-colors ${
      active ? "text-indigo-400" : "text-muted-foreground hover:text-foreground"
    }`;

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
        <Link href="/worker" className={itemClass(activeNav === "ACTIVE")}>
          <Briefcase className="w-5 h-5" /><span>شیفت</span>
        </Link>
        <Link href="/worker/messages" className={itemClass(activeNav === "MESSAGES")}>
          <MessageCircle className="w-5 h-5" /><span>پیام</span>
        </Link>
        <Link href="/worker/notifications" className={itemClass(activeNav === "NOTIFICATIONS")}>
          <Bell className="w-5 h-5" /><span>اعلان</span>
        </Link>
        <Link href="/worker/disputes" className={itemClass(activeNav === "DISPUTES")}>
          <Scale className="w-5 h-5" /><span>اختلاف</span>
        </Link>
        <Link href="/worker/wallet" className={itemClass(activeNav === "WALLET")}>
          <Wallet className="w-5 h-5" /><span>کیف پول</span>
        </Link>
        <Link href="/worker/profile" className={itemClass(activeNav === "PROFILE")}>
          <User className="w-5 h-5" /><span>پروفایل</span>
        </Link>
      </nav>
    </div>
  );
}
