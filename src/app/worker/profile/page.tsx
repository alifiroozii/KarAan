"use client";

import React from "react";
import Link from "next/link";
import { WorkerMobileLayout } from "@/components/layout/worker-mobile-layout";
import { Avatar } from "@/components/ui/display-elements";
import { RatingStars, ReliabilityBadge, CurrencyDisplay } from "@/components/ui/domain-displays";
import { Button } from "@/components/ui/button";
import { User, MapPin, Briefcase, CreditCard, ShieldCheck, Settings, LogOut } from "lucide-react";

export default function WorkerProfilePage() {
  return (
    <WorkerMobileLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-lg mx-auto selection:bg-indigo-500 selection:text-white">
        {/* Profile Card Header */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm text-center space-y-4">
          <div className="flex justify-center">
            <Avatar name="علی رضایی" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground">علی رضایی</h2>
            <p className="text-xs text-muted-foreground">نیروی ارشد انبارداری و چیدمان کالا</p>
          </div>

          <div className="flex justify-center items-center gap-3">
            <RatingStars score={5} />
            <ReliabilityBadge score={98.5} />
          </div>

          <div className="pt-2 border-t border-border grid grid-cols-2 gap-4 text-right">
            <div>
              <span className="text-[10px] text-muted-foreground block">شیفت‌های موفق</span>
              <span className="text-sm font-extrabold text-foreground">۴۸ شیفت</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">مجموع درآمد</span>
              <span className="text-sm font-extrabold text-emerald-400">
                <CurrencyDisplay amountRials={BigInt(72000000)} />
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details List */}
        <div className="bg-card border border-border rounded-3xl divide-y divide-border overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-foreground">محدوده فعالیت</span>
            </div>
            <span className="text-xs text-muted-foreground">تهران (شعاع ۱۵ کیلومتر)</span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-foreground">مهارت‌های ثبت شده</span>
            </div>
            <span className="text-xs text-muted-foreground">انبارداری، بسته‌بندی</span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-foreground">شماره شبا</span>
            </div>
            <span className="text-xs text-muted-foreground dir-ltr">IR12015...8901</span>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-foreground">وضعیت احراز هویت</span>
            </div>
            <span className="text-xs font-bold text-emerald-400">تایید شده (VERIFIED)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/worker/onboarding" className="block">
            <Button variant="outline" className="w-full justify-start text-xs font-semibold">
              <Settings className="w-4 h-4 ml-2" />
              ویرایش اطلاعات و سوابق آنبوردینگ
            </Button>
          </Link>

          <Button variant="destructive" className="w-full justify-start text-xs font-semibold">
            <LogOut className="w-4 h-4 ml-2" />
            خروج از حساب کاربری
          </Button>
        </div>
      </div>
    </WorkerMobileLayout>
  );
}
