"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorkerMobileLayout } from "@/components/layout/worker-mobile-layout";
import { RatingStars, ReliabilityBadge } from "@/components/ui/domain-displays";
import { CurrentShiftCard } from "@/components/worker/current-shift-card";
import { WorkerCancellationPanel } from "@/components/worker/worker-cancellation-panel";
import { WorkerShiftOffers } from "@/components/worker/shift-offers";
import { AlertCircle, ArrowUpRight, Navigation, Wallet } from "lucide-react";
import { useLocation } from "@/hooks/use-location";

export default function WorkerMobileDashboard() {
  const { latitude, longitude, loading, error: locationError } = useLocation();
  const [gpsActive, setGpsActive] = useState(true);

  return (
    <WorkerMobileLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-lg mx-auto selection:bg-indigo-500 selection:text-white">
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RatingStars score={4.9} />
              <ReliabilityBadge score={98.5} />
            </div>

            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-emerald-400">سامانه موقعیت فعال</span>
            </div>
          </div>

          <p className="text-xs leading-6 text-muted-foreground border-t border-border pt-3">
            وضعیت شیفت جاری، مسیر و زمان تقریبی رسیدن از سرور دریافت می‌شود و دیگر با state مصنوعی مرورگر شبیه‌سازی نمی‌شود.
          </p>
        </div>

        <WorkerShiftOffers />
        <CurrentShiftCard />
        <WorkerCancellationPanel />

        <div className="bg-card border border-border rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Navigation className="w-4 h-4 text-indigo-400" />
              <span>موقعیت زنده GPS</span>
            </div>

            <button
              type="button"
              onClick={() => setGpsActive((value) => !value)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                gpsActive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {gpsActive ? "GPS روشن" : "GPS پنهان"}
            </button>
          </div>

          {gpsActive &&
            (loading ? (
              <p className="text-xs text-muted-foreground">در حال دریافت موقعیت مکانی GPS...</p>
            ) : locationError ? (
              <p className="text-xs text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{locationError}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                موقعیت فعلی شما: {latitude?.toFixed(4)}° N, {longitude?.toFixed(4)}° E
              </p>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/worker/profile" className="block">
            <div className="bg-card border border-border p-4 rounded-3xl flex items-center justify-between hover:bg-muted transition-colors">
              <span className="text-xs font-bold text-foreground">پروفایل و مدارک</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>

          <div className="bg-card border border-border p-4 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-foreground">کیف پول</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-bold">مرحله مالی</span>
          </div>
        </div>
      </div>
    </WorkerMobileLayout>
  );
}
