"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Building2, Clock, PlusCircle, Users, WalletCards } from "lucide-react";
import { CurrencyDisplay } from "../ui/domain-displays";
import { useRealtimeRoom } from "@/hooks/use-realtime-room";

interface HeaderWallet {
  userId: string;
  availableRials: string;
}

async function fetchHeaderWallet(): Promise<HeaderWallet> {
  const response = await fetch("/api/wallet", { cache: "no-store" });
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message ?? "دریافت موجودی ناموفق بود.");
  }
  return body.data as HeaderWallet;
}

function navClass(active: boolean): string {
  return active
    ? "w-full p-3 rounded-2xl text-xs font-bold flex items-center gap-3 bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
    : "w-full p-3 rounded-2xl text-xs font-bold flex items-center gap-3 text-muted-foreground hover:bg-muted hover:text-foreground transition-all";
}

export function EmployerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const walletQuery = useQuery({
    queryKey: ["employer", "wallet"],
    queryFn: fetchHeaderWallet,
  });
  useRealtimeRoom("user", walletQuery.data?.userId);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-indigo-500 selection:text-white">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/employer" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">کارآن | پنل کارفرما</h1>
              <p className="text-xs text-muted-foreground">خدمات فروشگاهی آریا</p>
            </div>
          </Link>

          <Link
            href="/employer/wallet"
            className="bg-background border border-border rounded-xl px-4 py-2 text-right hover:border-indigo-500/40 transition-colors"
          >
            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <WalletCards className="h-3.5 w-3.5" /> موجودی کیف پول
            </span>
            <span className="mt-1 block text-sm font-bold text-emerald-400">
              {walletQuery.isLoading ? (
                "..."
              ) : walletQuery.data ? (
                <CurrencyDisplay amountRials={BigInt(walletQuery.data.availableRials)} />
              ) : (
                "—"
              )}
            </span>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="md:col-span-1 space-y-2">
          <nav className="space-y-1.5 bg-card p-3 border border-border rounded-3xl">
            <Link href="/employer" className={navClass(pathname === "/employer")}>
              <PlusCircle className="w-4 h-4" />
              <span>ایجاد شیفت جدید</span>
            </Link>
            <Link href="/employer" className={navClass(false)}>
              <Users className="w-4 h-4" />
              <span>رادار و مانیتورینگ شیفت‌ها</span>
            </Link>
            <Link href="/employer" className={navClass(false)}>
              <Clock className="w-4 h-4" />
              <span>تایید تایم‌شیت‌ها</span>
            </Link>
            <Link
              href="/employer/wallet"
              className={navClass(pathname.startsWith("/employer/wallet") || pathname.startsWith("/employer/payments"))}
            >
              <WalletCards className="w-4 h-4" />
              <span>کیف پول و پرداخت‌ها</span>
            </Link>
          </nav>
        </aside>

        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  );
}
