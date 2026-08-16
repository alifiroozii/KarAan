"use client";

import { ReceiptText } from "lucide-react";
import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";
import { TimesheetList } from "@/components/timesheets/timesheet-list";

export default function EmployerTimesheetsPage() {
  return (
    <EmployerDashboardLayout>
      <div className="mx-auto max-w-6xl space-y-5">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold">
            <ReceiptText className="h-6 w-6 text-indigo-400" />
            تایم‌شیت‌ها
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            بررسی کارکرد واقعی نیروها و تأیید برای مرحله مالی
          </p>
        </div>
        <TimesheetList mode="employer" />
      </div>
    </EmployerDashboardLayout>
  );
}
