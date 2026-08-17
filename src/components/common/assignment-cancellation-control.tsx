"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/domain-displays";

interface CancellationPreview {
  assignmentId: string;
  side: "WORKER" | "EMPLOYER";
  targetState: "CANCELLED_BY_WORKER" | "CANCELLED_BY_EMPLOYER";
  hoursBeforeStart: number;
  minutesBeforeStart: number;
  isLate: boolean;
  scheduledPayRials: string;
  penaltyRials: string;
  workerCompensationRials: string;
  scoreImpact: number;
  monetarySettlementDeferred: true;
}

const workerReasons = [
  ["SICKNESS", "بیماری"],
  ["TRANSPORT", "مشکل رفت‌وآمد"],
  ["EMERGENCY", "شرایط اضطراری"],
  ["SCHEDULE_CONFLICT", "تداخل برنامه"],
  ["OTHER", "سایر"],
] as const;

const employerReasons = [
  ["STAFFING_CHANGE", "تغییر نیاز نیروی انسانی"],
  ["BUSINESS_CLOSED", "تعطیلی محل کار"],
  ["SHIFT_CHANGED", "تغییر یا حذف شیفت"],
  ["WORKER_MISMATCH", "عدم تطابق Assignment"],
  ["OTHER", "سایر"],
] as const;

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || "عملیات لغو ناموفق بود.");
  }
  return body.data as T;
}

function formatHours(value: number) {
  if (value <= 0) return "زمان شروع شیفت رسیده یا گذشته است";
  if (value < 1) return `${Math.max(1, Math.round(value * 60)).toLocaleString("fa-IR")} دقیقه تا شروع`;
  return `${value.toLocaleString("fa-IR", { maximumFractionDigits: 1 })} ساعت تا شروع`;
}

export function AssignmentCancellationControl({
  assignmentId,
  shiftId,
  mode,
}: {
  assignmentId: string;
  shiftId: string;
  mode: "worker" | "employer";
}) {
  const queryClient = useQueryClient();
  const reasons = mode === "worker" ? workerReasons : employerReasons;
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<string>(reasons[0][0]);
  const [description, setDescription] = useState("");

  const previewQuery = useQuery({
    queryKey: ["assignment", assignmentId, "cancellation-preview"],
    queryFn: async () =>
      readJson<CancellationPreview>(await fetch(`/api/assignments/${assignmentId}/cancel`)),
    enabled: open,
    staleTime: 15_000,
  });

  const cancelMutation = useMutation({
    mutationFn: async () =>
      readJson<unknown>(
        await fetch(`/api/assignments/${assignmentId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reasonCode, description: description.trim() || undefined }),
        })
      ),
    onSuccess: () => {
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["worker", "current-shift"] });
      void queryClient.invalidateQueries({ queryKey: ["shift", shiftId, "assignments"] });
      void queryClient.invalidateQueries({
        queryKey: ["assignment", assignmentId, "cancellation-preview"],
      });
    },
  });

  const preview = previewQuery.data;
  const requiresDescription = reasonCode === "OTHER";
  const canSubmit = useMemo(
    () => !requiresDescription || description.trim().length >= 10,
    [description, requiresDescription]
  );

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full border-red-500/30 text-red-300 hover:bg-red-500/10 hover:text-red-200"
        onClick={() => setOpen(true)}
      >
        <XCircle className="ml-2 h-4 w-4" />
        {mode === "worker" ? "لغو این شیفت" : "لغو Assignment این نیرو"}
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
      <div className="flex items-start gap-2 text-sm text-red-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-bold">لغو Assignment</p>
          <p className="mt-1 text-xs text-red-200/75">
            قبل از تأیید، اثر زمانی و مالی طبق Policy سرور نمایش داده می‌شود.
          </p>
        </div>
      </div>

      {previewQuery.isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          در حال محاسبه Policy لغو...
        </div>
      )}
      {previewQuery.isError && (
        <p className="text-xs text-red-300">{previewQuery.error.message}</p>
      )}

      {preview && (
        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <span className="block text-muted-foreground">زمان باقی‌مانده</span>
            <strong>{formatHours(preview.hoursBeforeStart)}</strong>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <span className="block text-muted-foreground">وضعیت Policy</span>
            <strong className={preview.isLate ? "text-amber-300" : "text-emerald-300"}>
              {preview.isLate ? "لغو دیرهنگام" : "لغو عادی"}
            </strong>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <span className="block text-muted-foreground">جریمه ثبت‌شونده</span>
            <strong>
              <CurrencyDisplay amountRials={BigInt(preview.penaltyRials)} />
            </strong>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-3">
            <span className="block text-muted-foreground">غرامت Worker</span>
            <strong>
              <CurrencyDisplay amountRials={BigInt(preview.workerCompensationRials)} />
            </strong>
          </div>
        </div>
      )}

      {preview && preview.scoreImpact !== 0 && (
        <p className="rounded-xl bg-amber-500/10 p-2 text-xs text-amber-300">
          اثر پیشنهادی روی امتیاز اعتماد: {preview.scoreImpact.toLocaleString("fa-IR")} امتیاز. اعمال
          واقعی امتیاز در Reliability Engine انجام خواهد شد.
        </p>
      )}
      {preview?.monetarySettlementDeferred && (
        <p className="text-[11px] text-muted-foreground">
          در این مرحله هیچ برداشت یا واریزی Wallet انجام نمی‌شود؛ مبلغ فقط برای تسویه مالی آینده ثبت
          می‌شود.
        </p>
      )}

      <label className="block space-y-1 text-xs">
        <span className="font-semibold">دلیل لغو</span>
        <select
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          value={reasonCode}
          onChange={(event) => setReasonCode(event.target.value)}
        >
          {reasons.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1 text-xs">
        <span className="font-semibold">توضیح {requiresDescription ? "(الزامی)" : "(اختیاری)"}</span>
        <textarea
          className="min-h-20 w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm"
          value={description}
          maxLength={1000}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="توضیح کوتاه درباره علت لغو"
        />
      </label>

      {cancelMutation.error && <p className="text-xs text-red-300">{cancelMutation.error.message}</p>}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={cancelMutation.isPending}
          onClick={() => setOpen(false)}
        >
          انصراف
        </Button>
        <Button
          type="button"
          className="flex-1 bg-red-600 text-white hover:bg-red-700"
          disabled={!preview || !canSubmit || cancelMutation.isPending}
          onClick={() => cancelMutation.mutate()}
        >
          {cancelMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          تأیید لغو
        </Button>
      </div>
    </div>
  );
}
