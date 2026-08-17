"use client";

import React, { use } from "react";
import Link from "next/link";
import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";
import { StatusBadge, CurrencyDisplay } from "@/components/ui/domain-displays";
import { ShiftAssignmentsLive } from "@/components/employer/shift-assignments-live";
import { EmployerAssignmentChatLauncher } from "@/components/messaging/employer-assignment-chat-launcher";
import { Button } from "@/components/ui/button";
import { Clock, Users, ShieldCheck, ArrowRight } from "lucide-react";

export default function ShiftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const shiftId = resolvedParams.id;

  return (
    <EmployerDashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto selection:bg-indigo-500 selection:text-white">
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
                وضعیت نیروها، حرکت و ETA از داده واقعی سیستم دریافت می‌شود.
              </p>
            </div>
          </div>

          <StatusBadge status="PUBLISHED" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-3xl p-5 space-y-2">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              نیروهای تخصیص‌یافته
            </span>
            <span className="text-sm font-bold text-foreground block">
              در لیست زنده پایین نمایش داده می‌شوند
            </span>
          </div>

          <div className="bg-card border border-border rounded-3xl p-5 space-y-2">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              پایش عملیات
            </span>
            <span className="text-sm font-bold text-foreground block">
              EN_ROUTE، ETA، ARRIVED و Attendance
            </span>
          </div>

          <div className="bg-card border border-border rounded-3xl p-5 space-y-2">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              وضعیت مالی
            </span>
            <span className="text-base font-extrabold text-muted-foreground block">
              <CurrencyDisplay amountRials={BigInt(0)} />
            </span>
            <span className="text-[10px] text-muted-foreground">در فاز مالی تکمیل می‌شود</span>
          </div>
        </div>

        <EmployerAssignmentChatLauncher shiftId={shiftId} />
        <ShiftAssignmentsLive shiftId={shiftId} />
      </div>
    </EmployerDashboardLayout>
  );
}
