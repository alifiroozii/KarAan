"use client";

import { use } from "react";
import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";
import { TimesheetDetail } from "@/components/timesheets/timesheet-detail";

export default function EmployerTimesheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <EmployerDashboardLayout>
      <div className="mx-auto max-w-4xl">
        <TimesheetDetail timesheetId={id} mode="employer" />
      </div>
    </EmployerDashboardLayout>
  );
}
