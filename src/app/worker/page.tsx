"use client";

import React, { useState } from "react";
import Link from "next/link";
import { WorkerMobileLayout } from "@/components/layout/worker-mobile-layout";
import { RatingStars, ReliabilityBadge, CurrencyDisplay, StatusBadge } from "@/components/ui/domain-displays";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Clock, Wallet, AlertCircle, ArrowUpRight, Play, Pause, Square } from "lucide-react";
import { useLocation } from "@/hooks/use-location";

export default function WorkerMobileDashboard() {
  const { latitude, longitude, loading, error: locationError } = useLocation();
  const [gpsActive, setGpsActive] = useState(true);
  const [activeShiftState, setActiveShiftState] = useState<"NONE" | "CHECKED_IN" | "ON_BREAK">("NONE");

  return (
    <WorkerMobileLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-lg mx-auto selection:bg-indigo-500 selection:text-white">
        {/* Worker Top Stats Header Card */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RatingStars score={4.9} />
              <ReliabilityBadge score={98.5} />
            </div>

            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-400">آماده دریافت شیفت</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="bg-background/60 p-3 rounded-2xl border border-border/50">
              <span className="text-[10px] text-muted-foreground block">مجموع شیفت‌های موفق</span>
              <span className="text-base font-extrabold text-foreground">۴۸ شیفت</span>
            </div>

            <div className="bg-background/60 p-3 rounded-2xl border border-border/50">
              <span className="text-[10px] text-muted-foreground block">درآمد کل این ماه</span>
              <span className="text-base font-extrabold text-emerald-400">
                <CurrencyDisplay amountRials={BigInt(72000000)} />
              </span>
            </div>
          </div>
        </div>

        {/* Live Active Shift Controls (if checked in) */}
        {activeShiftState !== "NONE" && (
          <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>شیفت فعال در حال انجام</span>
              </h3>
              <StatusBadge status={activeShiftState === "ON_BREAK" ? "ON_BREAK" : "CHECKED_IN"} />
            </div>

            <p className="text-xs text-foreground font-semibold">
              انبارداری فروشگاه زنجیره‌ای آریا (شعبه انقلاب)
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {activeShiftState === "CHECKED_IN" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveShiftState("ON_BREAK")}
                >
                  <Pause className="w-4 h-4 ml-1 text-amber-400" />
                  ثبت استراحت
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveShiftState("CHECKED_IN")}
                >
                  <Play className="w-4 h-4 ml-1 text-emerald-400" />
                  پایان استراحت
                </Button>
              )}

              <Button
                size="sm"
                variant="destructive"
                onClick={() => setActiveShiftState("NONE")}
              >
                <Square className="w-4 h-4 ml-1" />
                ثبت خروج شیفت
              </Button>
            </div>
          </div>
        )}

        {/* Live GPS & Nearby Radar Banner */}
        <div className="bg-card border border-border rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Navigation className="w-4 h-4 text-indigo-400" />
              <span>موقعیت زنده GPS (رادار ساعتی)</span>
            </div>

            <button
              onClick={() => setGpsActive(!gpsActive)}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
            >
              GPS روشن
            </button>
          </div>

          {loading ? (
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
          )}
        </div>

        {/* Available Nearby Shifts Stream */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">شیفت‌های کاری پیشنهادی نزدیک</h3>
            <span className="text-xs text-indigo-400 font-semibold">شعاع ۱۵ کیلومتر</span>
          </div>

          <div className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                  انبارداری و بسته‌بندی
                </span>
                <h4 className="text-base font-bold text-foreground mt-1">انباردار و دسته‌بندی کالا</h4>
                <p className="text-xs text-muted-foreground">فروشگاه‌های زنجیره‌ای آریا (شعبه انقلاب)</p>
              </div>

              <span className="text-sm font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                <CurrencyDisplay amountRials={BigInt(1500000)} /> / ساعت
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                فاصله ۲.۴ کیلومتر
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />۴ ساعت (امروز ۱۶:۰۰ تا ۲۰:۰۰)
              </span>
            </div>

            <Button
              className="w-full text-xs font-bold py-3"
              onClick={() => setActiveShiftState("CHECKED_IN")}
            >
              قبول شیفت و اعلام آمادگی
              <ArrowUpRight className="w-4 h-4 mr-1" />
            </Button>
          </div>
        </div>

        {/* Quick Links & Wallet Access */}
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
              <span className="text-xs font-bold text-foreground">تسویه آنی</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">آماده</span>
          </div>
        </div>
      </div>
    </WorkerMobileLayout>
  );
}
