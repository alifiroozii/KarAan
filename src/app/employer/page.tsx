"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";
import { StatCard, StatusBadge } from "@/components/ui/domain-displays";
import { Button } from "@/components/ui/button";
import {
  Clock,
  PlusCircle,
  Users,
  MapPin,
  Wallet,
  ShieldCheck,
  UserPlus,
  Store,
} from "lucide-react";

export default function EmployerDashboard() {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "BRANCHES" | "MEMBERS" | "ROSTER">("OVERVIEW");

  return (
    <EmployerDashboardLayout>
      <div className="space-y-8 selection:bg-indigo-500 selection:text-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">مدیریت کسب‌وکار و رادار شیفت‌ها</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              مدیریت شعب، تخصیص اعضا و مانیتورینگ آنلاین ورود و خروج نیروها
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/employer/onboarding">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                <Store className="ml-1.5 h-4 w-4 text-indigo-400" />
                تعریف شعبه جدید
              </Button>
            </Link>
            <Link href="/employer/shifts/new">
              <Button size="sm" className="text-xs font-bold shadow-md shadow-indigo-600/20">
                <PlusCircle className="ml-1.5 h-4 w-4" />
                ایجاد شیفت جدید
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard title="شیفت‌های فعال امروز" value="۸ شیفت" icon={<Clock className="h-5 w-5" />} trend="+۲ نسبت به دیروز" />
          <StatCard title="نیروهای در حال کار" value="۱۲ نفر" icon={<Users className="h-5 w-5" />} />
          <Link
            href="/employer/wallet"
            className="rounded-3xl border border-border bg-card p-5 transition-colors hover:border-indigo-500/40"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Wallet className="h-5 w-5 text-emerald-400" />
              موجودی و سپرده
            </div>
            <div className="mt-3 text-base font-extrabold">مشاهده موجودی زنده</div>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              موجودی آزاد و Escrow فقط از Wallet Ledger خوانده می‌شوند.
            </p>
          </Link>
          <StatCard title="نرخ حضور به موقع" value="۹۹.۲٪" icon={<ShieldCheck className="h-5 w-5" />} />
        </div>

        <div className="flex space-x-6 space-x-reverse border-b border-border text-xs font-bold">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`border-b-2 pb-3 transition-all ${
              activeTab === "OVERVIEW"
                ? "border-indigo-600 font-extrabold text-indigo-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            خلاصه وضعیت و شیفت‌های زنده
          </button>
          <button
            onClick={() => setActiveTab("BRANCHES")}
            className={`border-b-2 pb-3 transition-all ${
              activeTab === "BRANCHES"
                ? "border-indigo-600 font-extrabold text-indigo-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            مدیریت شعب (۳ شعبه)
          </button>
          <button
            onClick={() => setActiveTab("MEMBERS")}
            className={`border-b-2 pb-3 transition-all ${
              activeTab === "MEMBERS"
                ? "border-indigo-600 font-extrabold text-indigo-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            مدیران و سرپرستان شعب (BusinessMembers)
          </button>
          <button
            onClick={() => setActiveTab("ROSTER")}
            className={`border-b-2 pb-3 transition-all ${
              activeTab === "ROSTER"
                ? "border-indigo-600 font-extrabold text-indigo-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            نیروهای منتخب و ترجیحی (Favorite Roster)
          </button>
        </div>

        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h3 className="border-b border-border pb-3 text-base font-bold text-foreground">
                شیفت‌های کاری فعال در شعب
              </h3>

              <div className="divide-y divide-border">
                <div className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="space-y-1">
                    <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                      شعبه ۱: انقلاب
                    </span>
                    <h4 className="text-sm font-bold text-foreground">انباردار و دسته‌بندی کالا</h4>
                    <p className="text-xs text-muted-foreground">امروز ۱۶:۰۰ تا ۲۰:۰۰ | نیروی تخصیص داده شده: علی رضایی</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status="CHECKED_IN" />
                    <Link href="/employer/live">
                      <Button size="sm" variant="outline" className="text-xs">
                        مشاهده رادار GPS
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="space-y-1">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                      شعبه ۲: ونک
                    </span>
                    <h4 className="text-sm font-bold text-foreground">صندوق‌دار فروشگاه</h4>
                    <p className="text-xs text-muted-foreground">امروز ۰۸:۰۰ تا ۱۶:۰۰ | تایم‌شیت ارسال شده</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status="PUBLISHED" />
                    <Link href="/employer/timesheets">
                      <Button size="sm" variant="emerald" className="text-xs font-bold">
                        بررسی تایم‌شیت
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "BRANCHES" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <MapPin className="h-4 w-4 text-indigo-400" />
                  <span>شعبه مرکزی انقلاب</span>
                </h4>
                <span className="text-xs font-bold text-emerald-400">فعال</span>
              </div>
              <p className="text-xs text-muted-foreground">تهران، میدان انقلاب، خیابان کارگر شمالی، پلاک ۱۲</p>
              <p className="text-xs text-muted-foreground">تلفن: ۰۲۱۶۶۴۰۰۰۰۰ | مدیر: محمد صادقی (OWNER)</p>
            </div>

            <div className="space-y-3 rounded-3xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <MapPin className="h-4 w-4 text-indigo-400" />
                  <span>شعبه ونک</span>
                </h4>
                <span className="text-xs font-bold text-emerald-400">فعال</span>
              </div>
              <p className="text-xs text-muted-foreground">تهران، میدان ونک، خیابان ولیعصر</p>
              <p className="text-xs text-muted-foreground">تلفن: ۰۲۱۸۸۸۰۰۰۰۰ | مدیر: حسین احمدی (MANAGER)</p>
            </div>
          </div>
        )}

        {activeTab === "MEMBERS" && (
          <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">اعضای دسترسی کسب‌وکار (BusinessMembers)</h3>
              <Button size="sm" variant="outline" className="text-xs">
                <UserPlus className="ml-1.5 h-4 w-4" />
                دعوت عضو جدید
              </Button>
            </div>

            <div className="divide-y divide-border text-xs">
              <div className="flex items-center justify-between py-3">
                <div>
                  <span className="block font-bold text-foreground">محمد صادقی</span>
                  <span className="text-muted-foreground">صاحب کسب‌وکار (OWNER)</span>
                </div>
                <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 font-bold text-indigo-400">دسته‌بندی کامل</span>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <span className="block font-bold text-foreground">حسین احمدی</span>
                  <span className="text-muted-foreground">مدیر شعبه (MANAGER)</span>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-bold text-emerald-400">مدیریت شیفت شعبه ونک</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "ROSTER" && (
          <div className="space-y-4 rounded-3xl border border-border bg-card p-6">
            <h3 className="border-b border-border pb-3 text-base font-bold text-foreground">
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
