"use client";

import React, { use } from "react";
import Link from "next/link";
import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";
import { StatusBadge, CurrencyDisplay } from "@/components/ui/domain-displays";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserCheck,
  XCircle,
} from "lucide-react";

export default function ShiftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const shiftId = resolvedParams.id;

  return (
    <EmployerDashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto selection:bg-indigo-500 selection:text-white">
        {/* Back Link & Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Link href="/employer">
              <Button variant="outline" size="sm">
                <ArrowRight className="w-4 h-4 ml-1" />
                بازگشت به داشبورد
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-foreground">جزئیات شیفت کاری #{shiftId}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                انباردار و چیدمان کالا (شعبه مرکزی انقلاب)
              </p>
            </div>
          </div>

          <StatusBadge status="PUBLISHED" />
        </div>

        {/* Shift Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-3xl p-5 space-y-2">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              ظرفیت اسلات‌ها
            </span>
            <span className="text-lg font-bold text-foreground block">۳ نیرو (۲ اسلات پر شده)</span>
          </div>

          <div className="bg-card border border-border rounded-3xl p-5 space-y-2">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              زمان برگزاری
            </span>
            <span className="text-sm font-bold text-foreground block">امروز ۱۶:۰۰ تا ۲۰:۰۰ (۴ ساعت)</span>
          </div>

          <div className="bg-card border border-border rounded-3xl p-5 space-y-2">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              بودجه کل سپرده شیفت
            </span>
            <span className="text-base font-extrabold text-emerald-400 block">
              <CurrencyDisplay amountRials={BigInt(18000000)} />
            </span>
          </div>
        </div>

        {/* Auto-Generated ShiftSlots & Assigned Workers Section */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>اسلات‌های اختصاصی تولیدشده (ShiftSlots)</span>
            </h3>
            <span className="text-xs text-muted-foreground">۳ اسلات فعال</span>
          </div>

          <div className="divide-y divide-border">
            {/* Slot 1 */}
            <div className="py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">اسلات شماره ۱</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    تخصیص داده شد (CHECKED_IN)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">نیروی تخصیص‌یافته: علی رضایی (کد: #WORKER-901)</p>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="text-xs">
                  مشاهده رادار زنده
                </Button>
              </div>
            </div>

            {/* Slot 2 */}
            <div className="py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">اسلات شماره ۲</span>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                    در انتظار پذیرش (OFFERED)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">نیروی تخصیص‌یافته: حسین کریمی (در انتظار تایید ریکنفرم)</p>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="text-xs">
                  ارسال یادآوری
                </Button>
              </div>
            </div>

            {/* Slot 3 */}
            <div className="py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">اسلات شماره ۳</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                    خالی (OPEN)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">در حال جستجوی نیروهای دارای اولویت در رادار شیفت</p>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="emerald" className="text-xs font-bold">
                  دعوت نیروهای منتخب
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployerDashboardLayout>
  );
}
