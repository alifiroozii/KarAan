"use client";

import { ReceiptText } from "lucide-react";
import { WorkerMobileLayout } from "@/components/layout/worker-mobile-layout";
import { TimesheetList } from "@/components/timesheets/timesheet-list";

export default function WorkerTimesheetsPage() {
  return (
    <WorkerMobileLayout>
      <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold">
            <ReceiptText className="h-6 w-6 text-indigo-400" />
            تایم‌شیت‌های من
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            ورود، خروج، استراحت، مبلغ و وضعیت تأیید هر شیفت
          </p>
        </div>
        <TimesheetList mode="worker" />
      </div>
    </WorkerMobileLayout>
  );
}
