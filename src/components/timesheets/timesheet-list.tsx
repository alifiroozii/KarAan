"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay, StatusBadge } from "@/components/ui/domain-displays";

export interface TimesheetListItem {
  id: string;
  workerName: string;
  title: string;
  locationName: string;
  scheduledStart: string;
  actualCheckIn: string | null;
  actualCheckOut: string | null;
  netWorkedMinutes: number;
  overtimeMinutes: number;
  unapprovedOvertimeMinutes: number;
  overtimePayRials: string;
  finalPayRials: string;
  status: string;
  requiresAdjustment: boolean;
}

interface TimesheetPage {
  items: TimesheetListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

async function fetchTimesheets(mode: "worker" | "employer", page: number) {
  const endpoint =
    mode === "worker" ? "/api/worker/timesheets" : "/api/employer/timesheets";
  const response = await fetch(`${endpoint}?page=${page}&pageSize=25`);
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || "دریافت تایم‌شیت‌ها ناموفق بود.");
  }
  return body.data as TimesheetPage;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours.toLocaleString("fa-IR")} ساعت و ${rest.toLocaleString("fa-IR")} دقیقه`;
}

export function TimesheetList({ mode }: { mode: "worker" | "employer" }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: [mode, "timesheets", page],
    queryFn: () => fetchTimesheets(mode, page),
  });

  if (query.isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        در حال دریافت تایم‌شیت‌ها...
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        {query.error.message}
      </div>
    );
  }

  const result = query.data;
  const items = result?.items ?? [];
  if (items.length === 0 && page === 1) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center">
        <ReceiptText className="mx-auto h-9 w-9 text-muted-foreground" />
        <p className="mt-3 text-sm font-bold">هنوز تایم‌شیتی ثبت نشده است.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          بعد از Check-out امن، تایم‌شیت به‌صورت خودکار ساخته می‌شود.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/${mode}/timesheets/${item.id}`}
          className="block rounded-3xl border border-border bg-card p-5 transition-colors hover:bg-muted/40"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold">{item.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {mode === "employer" ? `${item.workerName} • ` : ""}
                {item.locationName}
              </p>
            </div>
            <StatusBadge status={item.status} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
            <div>
              <span className="block text-muted-foreground">تاریخ</span>
              <strong>
                {new Date(item.scheduledStart).toLocaleDateString("fa-IR", {
                  timeZone: "Asia/Tehran",
                })}
              </strong>
            </div>
            <div>
              <span className="block text-muted-foreground">کارکرد قابل پرداخت</span>
              <strong>{formatDuration(item.netWorkedMinutes)}</strong>
            </div>
            <div>
              <span className="block text-muted-foreground">اضافه‌کاری پذیرفته‌شده</span>
              <strong>{item.overtimeMinutes.toLocaleString("fa-IR")} دقیقه</strong>
            </div>
            <div>
              <span className="block text-muted-foreground">مبلغ اضافه‌کاری</span>
              <strong>
                <CurrencyDisplay amountRials={BigInt(item.overtimePayRials)} />
              </strong>
            </div>
            <div>
              <span className="block text-muted-foreground">مبلغ نهایی</span>
              <strong className="text-emerald-400">
                <CurrencyDisplay amountRials={BigInt(item.finalPayRials)} />
              </strong>
            </div>
          </div>

          {item.unapprovedOvertimeMinutes > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-500/10 p-2 text-xs text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {item.unapprovedOvertimeMinutes.toLocaleString("fa-IR")} دقیقه کار بدون قرارداد اضافه‌کاری ثبت شده و خودکار پرداخت نشده است.
            </div>
          )}
        </Link>
      ))}

      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
          <Button
            variant="outline"
            size="sm"
            disabled={result.page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            صفحه قبل
          </Button>
          <span>
            صفحه {result.page.toLocaleString("fa-IR")} از {result.totalPages.toLocaleString("fa-IR")}
            {" • "}
            {result.total.toLocaleString("fa-IR")} تایم‌شیت
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={result.page >= result.totalPages}
            onClick={() => setPage((value) => value + 1)}
          >
            صفحه بعد
          </Button>
        </div>
      )}
    </div>
  );
}
