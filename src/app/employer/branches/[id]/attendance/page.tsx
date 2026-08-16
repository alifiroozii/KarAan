"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { EmployerDashboardLayout } from "@/components/layout/employer-dashboard-layout";
import { BranchAttendanceConsole } from "@/components/employer/branch-attendance-console";
import { Button } from "@/components/ui/button";

export default function BranchAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: branchId } = use(params);

  return (
    <EmployerDashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-extrabold">
              <ShieldCheck className="h-6 w-6 text-indigo-400" />
              کنسول حضور شعبه
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              مدیریت QR کوتاه‌عمر ورود و خروج و کد جایگزین مسئول
            </p>
          </div>
          <Link href="/employer">
            <Button variant="outline" size="sm">
              <ArrowRight className="ml-1 h-4 w-4" />
              بازگشت
            </Button>
          </Link>
        </div>

        <BranchAttendanceConsole branchId={branchId} />
      </div>
    </EmployerDashboardLayout>
  );
}
