"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";
import { StatCard, StatusBadge, CurrencyDisplay } from "@/components/ui/domain-displays";
import { Button } from "@/components/ui/button";
import {
  Building2,
  PlusCircle,
  Users,
  MapPin,
  Clock,
  Wallet,
  Settings,
  FileText,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  UserPlus,
  Store,
} from "lucide-react";

export default function EmployerDashboard() {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "BRANCHES" | "MEMBERS" | "ROSTER">("OVERVIEW");

  return (
    <EmployerDashboardLayout>
      <div className="space-y-8 selection:bg-indigo-500 selection:text-white">
        {/* Top Header Controls & Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">مدیریت کسب‌وکار و رادار شیفت‌ها</h1>
            <p className="text-xs text-muted-foreground mt-1">
              مدیریت شعب، تخصیص اعضا و مانیتورینگ آنلاین ورود و خروج نیروها
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/employer/onboarding">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                <Store className="w-4 h-4 ml-1.5 text-indigo-400" />
                تعریف شعبه جدید
              </Button>
            </Link>

            <Button size="sm" className="text-xs font-bold shadow-md shadow-indigo-600/20">
              <PlusCircle className="w-4 h-4 ml-1.5" />
              ایجاد شیفت جدید
            </Button>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="شیفت‌های فعال امروز" value="۸ شیفت" icon={<Clock className="w-5 h-5" />} trend="+۲ نسبت به دیروز" />
          <StatCard title="نیروهای در حال کار" value="۱۲ نفر" icon={<Users className="w-5 h-5" />} />
          <StatCard title="موجودی کیف پول سپرده" value="۲۵۰,۰۰۰,۰۰۰ ریال" icon={<Wallet className="w-5 h-5" />} />
          <StatCard title="نرخ حضور به موقع" value="۹۹.۲٪" icon={<ShieldCheck className="w-5 h-5" />} />
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border space-x-reverse space-x-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === "OVERVIEW"
                ? "border-indigo-600 text-indigo-400 font-extrabold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            خلاصه وضعیت و شیفت‌های زنده
          </button>
          <button
            onClick={() => setActiveTab("BRANCHES")}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === "BRANCHES"
                ? "border-indigo-600 text-indigo-400 font-extrabold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            مدیریت شعب (۳ شعبه)
          </button>
          <button
            onClick={() => setActiveTab("MEMBERS")}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === "MEMBERS"
                ? "border-indigo-600 text-indigo-400 font-extrabold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            مدیران و سرپرستان شعب (BusinessMembers)
          </button>
          <button
            onClick={() => setActiveTab("ROSTER")}
            className={`pb-3 border-b-2 transition-all ${
              activeTab === "ROSTER"
                ? "border-indigo-600 text-indigo-400 font-extrabold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            نیروهای منتخب و ترجیحی (Favorite Roster)
          </button>
        </div>

        {/* Tab Content: OVERVIEW */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-3">
                شیفت‌های کاری فعال در شعب
              </h3>

              <div className="divide-y divide-border">
                <div className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                      شعبه ۱: انقلاب
                    </span>
                    <h4 className="text-sm font-bold text-foreground">انباردار و دسته‌بندی کالا</h4>
                    <p className="text-xs text-muted-foreground">امروز ۱۶:۰۰ تا ۲۰:۰۰ | نیروی تخصیص داده شده: علی رضایی</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status="CHECKED_IN" />
                    <Button size="sm" variant="outline" className="text-xs">
                      مشاهده رادار GPS
                    </Button>
                  </div>
                </div>

                <div className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                      شعبه ۲: ونک
                    </span>
                    <h4 className="text-sm font-bold text-foreground">صندوق‌دار فروشگاه</h4>
                    <p className="text-xs text-muted-foreground">امروز ۰۸:۰۰ تا ۱۶:۰۰ | تایم‌شیت ارسال شده</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status="PUBLISHED" />
                    <Button size="sm" variant="emerald" className="text-xs font-bold">
                      تایید تایم‌شیت و تسویه
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: BRANCHES */}
        {activeTab === "BRANCHES" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  <span>شعبه مرکزی انقلاب</span>
                </h4>
                <span className="text-xs text-emerald-400 font-bold">فعال</span>
              </div>
              <p className="text-xs text-muted-foreground">تهران، میدان انقلاب، خیابان کارگر شمالی، پلاک ۱۲</p>
              <p className="text-xs text-muted-foreground">تلفن: ۰۲۱۶۶۴۰۰۰۰۰ | مدیر: محمد صادقی (OWNER)</p>
            </div>

            <div className="bg-card border border-border p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  <span>شعبه ونک</span>
                </h4>
                <span className="text-xs text-emerald-400 font-bold">فعال</span>
              </div>
              <p className="text-xs text-muted-foreground">تهران، میدان ونک، خیابان ولیعصر</p>
              <p className="text-xs text-muted-foreground">تلفن: ۰۲۱۸۸۸۰۰۰۰۰ | مدیر: حسین احمدی (MANAGER)</p>
            </div>
          </div>
        )}

        {/* Tab Content: MEMBERS */}
        {activeTab === "MEMBERS" && (
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">اعضای دسترسی کسب‌وکار (BusinessMembers)</h3>
              <Button size="sm" variant="outline" className="text-xs">
                <UserPlus className="w-4 h-4 ml-1.5" />
                دعوت عضو جدید
              </Button>
            </div>

            <div className="divide-y divide-border text-xs">
              <div className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-foreground block">محمد صادقی</span>
                  <span className="text-muted-foreground">صاحب کسب‌وکار (OWNER)</span>
                </div>
                <span className="bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full font-bold">دسته‌بندی کامل</span>
              </div>

              <div className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-foreground block">حسین احمدی</span>
                  <span className="text-muted-foreground">مدیر شعبه (MANAGER)</span>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-bold">مدیریت شیفت شعبه ونک</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: ROSTER */}
        {activeTab === "ROSTER" && (
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground border-b border-border pb-3">
              نیروهای منتخب و ترجیحی (Favorite Workers Roster)
            </h3>
            <p className="text-xs text-muted-foreground">
              شیفت‌های جدید با اولویت اول برای نیروهای لیست منتخب شما ارسال خواهند شد.
            </p>
          </div>
        )}
      </div>
    </EmployerDashboardLayout>
  );
}
