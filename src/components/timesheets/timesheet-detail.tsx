"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Coffee,
  Loader2,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyDisplay, StatusBadge } from "@/components/ui/domain-displays";

interface TimesheetDetailModel {
  id: string;
  assignmentId: string;
  workerId: string;
  workerName: string;
  shiftId: string;
  title: string;
  locationName: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualCheckIn: string;
  actualCheckOut: string;
  grossMinutes: number;
  breakMinutes: number;
  netWorkedMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  calculatedPayRials: string;
  bonusRials: string;
  deductionRials: string;
  finalPayRials: string;
  requiresAdjustment: boolean;
  status: string;
  approvedAt: string | null;
  breaks: Array<{
    id: string;
    startAt: string;
    endAt: string | null;
    durationMinutes: number;
  }>;
}

async function readResult<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || "عملیات تایم‌شیت ناموفق بود.");
  }
  return body.data as T;
}

function durationLabel(minutes: number) {
  return `${Math.floor(minutes / 60).toLocaleString("fa-IR")} ساعت و ${(
    minutes % 60
  ).toLocaleString("fa-IR")} دقیقه`;
}

export function TimesheetDetail({
  timesheetId,
  mode,
}: {
  timesheetId: string;
  mode: "worker" | "employer";
}) {
  const queryClient = useQueryClient();
  const [showDispute, setShowDispute] = useState(false);
  const [reasonCode, setReasonCode] = useState("TIME");
  const [description, setDescription] = useState("");

  const query = useQuery({
    queryKey: ["timesheet", timesheetId],
    queryFn: async () =>
      readResult<TimesheetDetailModel>(await fetch(`/api/timesheets/${timesheetId}`)),
  });

  const approve = useMutation({
    mutationFn: async () =>
      readResult<TimesheetDetailModel>(
        await fetch(`/api/timesheets/${timesheetId}/approve`, { method: "POST" })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["timesheet", timesheetId] });
      void queryClient.invalidateQueries({ queryKey: ["employer", "timesheets"] });
    },
  });

  const dispute = useMutation({
    mutationFn: async () =>
      readResult<TimesheetDetailModel>(
        await fetch(`/api/timesheets/${timesheetId}/dispute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reasonCode, description }),
        })
      ),
    onSuccess: () => {
      setShowDispute(false);
      void queryClient.invalidateQueries({ queryKey: ["timesheet", timesheetId] });
      void queryClient.invalidateQueries({ queryKey: [mode, "timesheets"] });
    },
  });

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-3xl border border-border bg-card p-10 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        در حال دریافت جزئیات تایم‌شیت...
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        {query.error?.message || "تایم‌شیت پیدا نشد."}
      </div>
    );
  }

  const item = query.data;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-indigo-300">{item.workerName}</p>
            <h1 className="mt-1 text-xl font-black">{item.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{item.locationName}</p>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div className="rounded-2xl border border-border p-3">
            <span className="text-muted-foreground">شروع برنامه</span>
            <strong className="mt-1 block">
              {new Date(item.scheduledStart).toLocaleTimeString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </div>
          <div className="rounded-2xl border border-border p-3">
            <span className="text-muted-foreground">ورود واقعی</span>
            <strong className="mt-1 block">
              {new Date(item.actualCheckIn).toLocaleTimeString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </div>
          <div className="rounded-2xl border border-border p-3">
            <span className="text-muted-foreground">خروج واقعی</span>
            <strong className="mt-1 block">
              {new Date(item.actualCheckOut).toLocaleTimeString("fa-IR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </div>
          <div className="rounded-2xl border border-border p-3">
            <span className="text-muted-foreground">کارکرد قابل پرداخت</span>
            <strong className="mt-1 block">{durationLabel(item.netWorkedMinutes)}</strong>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-base font-extrabold">
          <ReceiptText className="h-5 w-5 text-indigo-400" />
          جزئیات محاسبه
        </h2>
        <div className="divide-y divide-border text-sm">
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">زمان حضور</span>
            <strong>{durationLabel(item.grossMinutes)}</strong>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">استراحت</span>
            <strong>{item.breakMinutes.toLocaleString("fa-IR")} دقیقه</strong>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">زمان عادی قابل پرداخت</span>
            <strong>{durationLabel(item.regularMinutes)}</strong>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">اضافه‌کاری خام</span>
            <strong>{item.overtimeMinutes.toLocaleString("fa-IR")} دقیقه</strong>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">حقوق محاسبه‌شده</span>
            <strong><CurrencyDisplay amountRials={BigInt(item.calculatedPayRials)} /></strong>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">پاداش</span>
            <strong><CurrencyDisplay amountRials={BigInt(item.bonusRials)} /></strong>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-muted-foreground">کسورات</span>
            <strong><CurrencyDisplay amountRials={BigInt(item.deductionRials)} /></strong>
          </div>
          <div className="flex justify-between py-4 text-base">
            <span className="font-extrabold">مبلغ نهایی</span>
            <strong className="text-emerald-400">
              <CurrencyDisplay amountRials={BigInt(item.finalPayRials)} />
            </strong>
          </div>
        </div>

        {item.requiresAdjustment && (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-6 text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            کارکرد بعد از پایان برنامه ثبت شده است. تا Prompt 23 و تأیید رسمی اضافه‌کاری، این زمان خودکار به مبلغ نهایی اضافه نمی‌شود.
          </div>
        )}
      </section>

      {item.breaks.length > 0 && (
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-3">
          <h2 className="flex items-center gap-2 text-base font-extrabold">
            <Coffee className="h-5 w-5 text-amber-400" />
            استراحت‌ها
          </h2>
          {item.breaks.map((brk) => (
            <div key={brk.id} className="flex justify-between rounded-2xl border border-border p-3 text-xs">
              <span>
                {new Date(brk.startAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                {" → "}
                {brk.endAt
                  ? new Date(brk.endAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
                  : "فعال"}
              </span>
              <strong>{brk.durationMinutes.toLocaleString("fa-IR")} دقیقه</strong>
            </div>
          ))}
        </section>
      )}

      {mode === "employer" && item.status === "SUBMITTED" && (
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            بررسی کارفرما
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              disabled={approve.isPending || item.requiresAdjustment}
              onClick={() => approve.mutate()}
            >
              {approve.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="ml-2 h-4 w-4" />}
              تأیید تایم‌شیت
            </Button>
            <Button variant="outline" onClick={() => setShowDispute((value) => !value)}>
              ثبت اختلاف
            </Button>
          </div>
          {approve.error && <p className="text-xs text-red-300">{approve.error.message}</p>}
        </section>
      )}

      {(mode === "worker" || showDispute) && item.status === "SUBMITTED" && (
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Clock3 className="h-5 w-5 text-amber-400" />
            ثبت اختلاف تایم‌شیت
          </div>
          <Input value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} placeholder="کد دلیل، مثلاً TIME" />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="شرح دقیق اختلاف..."
            className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            variant="destructive"
            disabled={description.trim().length < 5 || dispute.isPending}
            onClick={() => dispute.mutate()}
          >
            {dispute.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            ثبت اختلاف
          </Button>
          {dispute.error && <p className="text-xs text-red-300">{dispute.error.message}</p>}
        </section>
      )}
    </div>
  );
}
