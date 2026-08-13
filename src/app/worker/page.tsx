"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  Play,
  Pause,
  LogOut,
  Wallet,
  User,
  Star,
  Smartphone,
} from "lucide-react";
import { formatMoneyRials } from "@/lib/money";

export default function WorkerPWADashboard() {
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "AVAILABLE" | "WALLET" | "PROFILE">("ACTIVE");

  // Dynamic Shift State Machine Execution HUD
  const [shiftState, setShiftState] = useState<
    "MATCHED" | "ACCEPTED" | "RECONFIRMED" | "EN_ROUTE" | "ARRIVED" | "CHECKED_IN" | "WORKING" | "ON_BREAK" | "CHECKED_OUT" | "SETTLED"
  >("MATCHED");

  const [workSeconds, setWorkSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string>("مکان‌یابی آماده است (داخل محدوده ۵۰ متری)");

  // Active shift mock data
  const shift = {
    title: "انباردار و دسته‌بندی کالا",
    company: "فروشگاه بزرگ آریا",
    location: "تهران، میدان انقلاب، خیابان کارگر شمالی",
    hourlyPayRials: BigInt(1500000), // 150,000 Toman/hour
    geofenceRadiusMeters: 100,
    startTimeStr: "۱۸:۳۰",
    endTimeStr: "۲۲:۳۰",
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setWorkSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleNextState = (nextState: typeof shiftState) => {
    setShiftState(nextState);
    if (nextState === "CHECKED_IN" || nextState === "WORKING") {
      setIsTimerRunning(true);
    } else if (nextState === "ON_BREAK" || nextState === "CHECKED_OUT" || nextState === "SETTLED") {
      setIsTimerRunning(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Calculate live earnings
  const earnedRials = (shift.hourlyPayRials * BigInt(workSeconds)) / BigInt(3600);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto border-x border-slate-800 shadow-2xl relative pb-20 selection:bg-indigo-500 selection:text-white">
      {/* Top App Bar */}
      <header className="p-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100">کارآن (پنل کارجو)</h1>
            <p className="text-[10px] text-emerald-400 font-medium">موقعیت آنلاین فعال</p>
          </div>
        </div>

        {/* Reliability Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
          <span>امتیاز اعتبار: ۹۸.۵</span>
        </div>
      </header>

      {/* Main View Area */}
      <main className="p-4 space-y-6 flex-1">
        {activeTab === "ACTIVE" && (
          <div className="space-y-4">
            {/* Active Shift Card / Execution HUD */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                  {shiftState === "MATCHED" && "پیشنهاد شیفت جدید"}
                  {shiftState === "ACCEPTED" && "پذیرفته شده - منتظر تایید مجدد"}
                  {shiftState === "RECONFIRMED" && "تایید شده - آماده حرکت"}
                  {shiftState === "EN_ROUTE" && "در مسیر رسیدن به شیفت"}
                  {shiftState === "ARRIVED" && "رسیده به محل کار"}
                  {shiftState === "CHECKED_IN" && "حضور ثبت شد - مشغول به کار"}
                  {shiftState === "WORKING" && "در حال انجام کار"}
                  {shiftState === "ON_BREAK" && "زمان استراحت"}
                  {shiftState === "CHECKED_OUT" && "خروج ثبت شد - تایم‌شیت ارسالی"}
                  {shiftState === "SETTLED" && "تسویه حساب انجام شد"}
                </span>

                <div className="flex items-center gap-1 text-slate-400 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{shift.startTimeStr} تا {shift.endTimeStr}</span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-100 mb-1">{shift.title}</h2>
              <p className="text-xs text-slate-400 mb-4">{shift.company}</p>

              {/* Geofence Location Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2 mb-5">
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{shift.location}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                  <span>شعاع مجاز ورود: {shift.geofenceRadiusMeters} متر</span>
                  <span className="text-emerald-400 font-medium">{gpsStatus}</span>
                </div>
              </div>

              {/* Live Work Timer HUD */}
              {(shiftState === "CHECKED_IN" ||
                shiftState === "WORKING" ||
                shiftState === "ON_BREAK" ||
                shiftState === "CHECKED_OUT") && (
                <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 text-center space-y-3 mb-5 shadow-inner">
                  <span className="text-xs text-indigo-300 font-medium">مدت زمان کارکرد فعلی</span>
                  <div className="text-3xl font-mono font-bold tracking-widest text-white dir-ltr">
                    {formatTimer(workSeconds)}
                  </div>
                  <div className="text-xs font-semibold text-emerald-400">
                    کارکرد تا این لحظه: {formatMoneyRials(earnedRials)}
                  </div>
                </div>
              )}

              {/* Action Buttons for State Machine Transitions */}
              <div className="space-y-2.5">
                {shiftState === "MATCHED" && (
                  <button
                    onClick={() => handleNextState("ACCEPTED")}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>قبول شیفت و رزرو فرصت</span>
                  </button>
                )}

                {shiftState === "ACCEPTED" && (
                  <button
                    onClick={() => handleNextState("RECONFIRMED")}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>تایید نهایی حضور (۲ ساعت قبل شیفت)</span>
                  </button>
                )}

                {shiftState === "RECONFIRMED" && (
                  <button
                    onClick={() => handleNextState("EN_ROUTE")}
                    className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-5 h-5" />
                    <span>حرکت به سمت محل شیفت</span>
                  </button>
                )}

                {shiftState === "EN_ROUTE" && (
                  <button
                    onClick={() => handleNextState("ARRIVED")}
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>اعلام حضور در محل شیفت</span>
                  </button>
                )}

                {shiftState === "ARRIVED" && (
                  <button
                    onClick={() => handleNextState("CHECKED_IN")}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>ثبت ورود رسمی (بررسی مکانی GPS)</span>
                  </button>
                )}

                {(shiftState === "CHECKED_IN" || shiftState === "WORKING") && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleNextState("ON_BREAK")}
                      className="py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <Pause className="w-4 h-4" />
                      <span>ثبت استراحت</span>
                    </button>
                    <button
                      onClick={() => handleNextState("CHECKED_OUT")}
                      className="py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>ثبت خروج و ارسال تایم‌شیت</span>
                    </button>
                  </div>
                )}

                {shiftState === "ON_BREAK" && (
                  <button
                    onClick={() => handleNextState("WORKING")}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>پایان استراحت و ادامه کار</span>
                  </button>
                )}

                {shiftState === "CHECKED_OUT" && (
                  <button
                    onClick={() => handleNextState("SETTLED")}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    <span>دریافت تسویه حساب فوری</span>
                  </button>
                )}

                {shiftState === "SETTLED" && (
                  <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-center space-y-1">
                    <div className="text-emerald-400 font-bold text-sm flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>مبلغ به کیف پول شما واریز شد!</span>
                    </div>
                    <p className="text-xs text-slate-300">مبلغ واریزی: {formatMoneyRials(earnedRials || BigInt(6000000))}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "WALLET" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-center space-y-2">
              <span className="text-xs text-slate-400">موجودی کیف پول کارجو</span>
              <h2 className="text-3xl font-bold text-emerald-400">
                {formatMoneyRials(BigInt(12500000))}
              </h2>
              <button className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all">
                درخواست واریز به شماره شبا
              </button>
            </div>
          </div>
        )}
      </main>

      {/* App-like Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 p-2 flex items-center justify-around z-50">
        <button
          onClick={() => setActiveTab("ACTIVE")}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === "ACTIVE" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span>شیفت فعال</span>
        </button>

        <button
          onClick={() => setActiveTab("WALLET")}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === "WALLET" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span>کیف پول</span>
        </button>

        <button
          onClick={() => setActiveTab("PROFILE")}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors ${
            activeTab === "PROFILE" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <User className="w-5 h-5" />
          <span>پروفایل</span>
        </button>
      </nav>
    </div>
  );
}
