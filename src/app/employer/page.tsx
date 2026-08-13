"use client";

import React, { useState } from "react";
import {
  Building2,
  PlusCircle,
  Clock,
  Users,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { formatMoneyRials } from "@/lib/money";

export default function EmployerDashboard() {
  const [activeTab, setActiveTab] = useState<"CREATE_SHIFT" | "LIVE_SHIFTS" | "TIMESHEETS" | "WALLET">("CREATE_SHIFT");

  // Shift Creation Form state
  const [title, setTitle] = useState("انباردار و دسته‌بندی کالا");
  const [description] = useState("نیاز به ۱ نفر نیروی مسلط به انبارداری و بسته‌بندی کالا");
  const [locationName, setLocationName] = useState("تهران، میدان انقلاب، خیابان کارگر شمالی");
  const [latitude] = useState(35.7000);
  const [longitude] = useState(51.3500);
  const [geofenceRadius, setGeofenceRadius] = useState(100);
  const [hourlyPayToman, setHourlyPayToman] = useState("150000");
  const [hours, setHours] = useState("4");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const calculateTotalBudgetRials = () => {
    const hourlyRials = BigInt(parseInt(hourlyPayToman || "0", 10) * 10);
    const totalHours = parseInt(hours || "0", 10);
    return hourlyRials * BigInt(totalHours);
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const totalBudgetRials = calculateTotalBudgetRials();
      const idempotencyKey = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock_employer_token",
        },
        body: JSON.stringify({
          title,
          description,
          locationName,
          latitude,
          longitude,
          geofenceRadiusMeters: geofenceRadius,
          requiredSkills: ["انبارداری", "بسته‌بندی"],
          hourlyPayRials: Number(parseInt(hourlyPayToman, 10) * 10),
          totalBudgetRials: Number(totalBudgetRials),
          startTime: new Date(Date.now() + 3600000).toISOString(),
          endTime: new Date(Date.now() + 3600000 * 5).toISOString(),
          idempotencyKey,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || "خطا در ایجاد شیفت");
      }

      setSuccessMsg("شیفت جدید با موفقیت ایجاد و مبلغ بودجه در سپرده امن قفل گردید!");
      setActiveTab("LIVE_SHIFTS");
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">کارآن | پنل مدیریت کارفرما</h1>
              <p className="text-xs text-slate-400">شرکت خدمات فروشگاهی آریا</p>
            </div>
          </div>

          {/* Employer Wallet Balance Badge */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-right">
              <span className="text-[10px] text-slate-400 block">موجودی کیف پول</span>
              <span className="text-sm font-bold text-emerald-400">
                {formatMoneyRials(BigInt(250000000))}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <aside className="md:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab("CREATE_SHIFT")}
            className={`w-full p-3.5 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all ${
              activeTab === "CREATE_SHIFT"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>ایجاد شیفت جدید</span>
          </button>

          <button
            onClick={() => setActiveTab("LIVE_SHIFTS")}
            className={`w-full p-3.5 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all ${
              activeTab === "LIVE_SHIFTS"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>رادار و مانیتورینگ شیفت‌ها</span>
          </button>

          <button
            onClick={() => setActiveTab("TIMESHEETS")}
            className={`w-full p-3.5 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all ${
              activeTab === "TIMESHEETS"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>کارتابل تایید تایم‌شیت‌ها</span>
          </button>
        </aside>

        {/* Dynamic Main Section */}
        <main className="md:col-span-3">
          {activeTab === "CREATE_SHIFT" && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">تعریف شیفت کاری جدید</h2>
                  <p className="text-xs text-slate-400">مشخصات شیفت، شعاع مکانی GPS و مبلغ دستمزد را وارد کنید</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>قفل خودکار سپرده امن (Escrow)</span>
                </div>
              </div>

              {successMsg && (
                <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-semibold text-center">
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-rose-950/80 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-semibold text-center">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleCreateShift} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">عنوان شیفت</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">آدرس و عنوان مکان شیفت</label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">دستمزد ساعتی (تومان)</label>
                    <input
                      type="number"
                      value={hourlyPayToman}
                      onChange={(e) => setHourlyPayToman(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">مدت زمان (ساعت)</label>
                    <input
                      type="number"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">شعاع مجاز ورود (متر)</label>
                    <input
                      type="number"
                      value={geofenceRadius}
                      onChange={(e) => setGeofenceRadius(parseInt(e.target.value, 10))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <span className="text-xs text-slate-400">مبلغ کل بودجه قفل شونده در سپرده (Escrow):</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {formatMoneyRials(calculateTotalBudgetRials())}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      <span>انتشار شیفت و قفل بودجه</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {activeTab === "LIVE_SHIFTS" && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-slate-100">شیفت‌های فعال و مانیتورینگ آنلاین</h2>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-200">انباردار و دسته‌بندی کالا</h3>
                  <p className="text-xs text-slate-400">مکان: تهران، خیابان کارگر شمالی | وضعیت: در حال انجام کار</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  کارجو: علی رضایی (ورود تایید شده)
                </span>
              </div>
            </div>
          )}

          {activeTab === "TIMESHEETS" && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-slate-100">کارتابل تایید تایم‌شیت‌ها</h2>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-200">تایم‌شیت ارسالی شیفت انبارداری</h3>
                  <p className="text-xs text-slate-400">کارکرد: ۴ ساعت (۶۰۰,۰۰۰ تومان)</p>
                </div>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all">
                  تایید کارکرد و آزادسازی تسویه
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
