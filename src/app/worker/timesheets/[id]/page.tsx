"use client";

import { use } from "react";
import { WorkerMobileLayout } from "@/components/layout/worker-mobile-layout";
import { TimesheetDetail } from "@/components/timesheets/timesheet-detail";

export default function WorkerTimesheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <WorkerMobileLayout>
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <TimesheetDetail timesheetId={id} mode="worker" />
      </div>
    </WorkerMobileLayout>
  );
}
