"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyDisplay } from "@/components/ui/domain-displays";

interface OvertimeItem {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "EXPIRED";
  requestedEndAt: string;
  requestedMinutes: number;
  rateType: "NORMAL_RATE" | "MULTIPLIER" | "FIXED_BONUS";
  rateMultiplierBps: number;
  fixedBonusRials: string;
  expiresAt: string;
  note: string | null;
}

interface ManagerOvertimeResponse {
  assignmentId: string;
  state: string;
  scheduledEndAt: string;
  effectiveEndAt: string;
  items: OvertimeItem[];
}

async function readResult<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || "عملیات اضافه‌کاری ناموفق بود.");
  }
  return body.data as T;
}

export function EmployerOvertimeControls({
  assignmentId,
  workerName,
  state,
}: {
  assignmentId: string;
  workerName: string;
  state: string;
}) {
  const queryClient = useQueryClient();
  const [extensionMinutes, setExtensionMinutes] = useState(60);
  const [rateType, setRateType] = useState<
    "NORMAL_RATE" | "MULTIPLIER" | "FIXED_BONUS"
  >("NORMAL_RATE");
  const [multiplier, setMultiplier] = useState(1.5);
  const [fixedBonusRials, setFixedBonusRials] = useState("0");
  const [note, setNote] = useState("");

  const query = useQuery({
    queryKey: ["employer", "overtime", assignmentId],
    queryFn: async () =>
      readResult<ManagerOvertimeResponse>(
        await fetch(`/api/assignments/${assignmentId}/overtime`)
      ),
    enabled: state === "CHECKED_IN" || state === "ON_BREAK",
    refetchInterval: 30_000,
  });

  const active = useMemo(
    () => query.data?.items.find((item) => item.status === "PENDING" || item.status === "ACCEPTED"),
    [query.data]
  );

  const requestMutation = useMutation({
    mutationFn: async () => {
      const baseline = query.data?.effectiveEndAt;
      if (!baseline) throw new Error("زمان پایان فعلی Worker مشخص نیست.");
      const requestedEndAt = new Date(
        new Date(baseline).getTime() + extensionMinutes * 60_000
      );

      return readResult<OvertimeItem>(
        await fetch(`/api/assignments/${assignmentId}/overtime`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestedEndAt: requestedEndAt.toISOString(),
            rateType,
            rateMultiplier: rateType === "MULTIPLIER" ? multiplier : 1,
            fixedBonusRials: rateType === "FIXED_BONUS" ? fixedBonusRials || "0" : "0",
            note: note.trim() || undefined,
          }),
        })
      );
    },
    onSuccess: () => {
      setNote("");
      void queryClient.invalidateQueries({ queryKey: ["employer", "overtime", assignmentId] });
      void queryClient.invalidateQueries({ queryKey: ["shift"] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) =>
      readResult<OvertimeItem>(
        await fetch(`/api/overtime/${id}/cancel`, { method: "POST" })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["employer", "overtime", assignmentId] });
    },
  });

  if (state !== "CHECKED_IN" && state !== "ON_BREAK") return null;
  if (query.isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        در حال دریافت وضعیت اضافه‌کاری...
      </div>
    );
  }
  if (query.isError) {
    return <p className="text-xs text-red-300">{query.error.message}</p>;
  }

  if (active) {
    const rateLabel =
      active.rateType === "MULTIPLIER"
        ? `${(active.rateMultiplierBps / 10_000).toLocaleString("fa-IR", { maximumFractionDigits: 2 })} برابر`
        : active.rateType === "FIXED_BONUS"
          ? "نرخ عادی + پاداش ثابت"
          : "نرخ عادی";

    return (
      <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-3 text-xs space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-violet-200">
            {active.status === "PENDING" ? "منتظر پاسخ Worker" : "اضافه‌کاری پذیرفته شد"}
          </span>
          <span>{active.requestedMinutes.toLocaleString("fa-IR")} دقیقه</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <span>
            پایان: {new Date(active.requestedEndAt).toLocaleTimeString("fa-IR", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Tehran",
            })}
          </span>
          <span>نرخ: {rateLabel}</span>
        </div>
        {BigInt(active.fixedBonusRials) > 0n && (
          <div>
            پاداش: <CurrencyDisplay amountRials={BigInt(active.fixedBonusRials)} />
          </div>
        )}
        {active.status === "PENDING" && (
          <Button
            size="sm"
            variant="outline"
            disabled={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate(active.id)}
          >
            {cancelMutation.isPending ? (
              <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="ml-1 h-3.5 w-3.5" />
            )}
            لغو درخواست
          </Button>
        )}
        {cancelMutation.error && <p className="text-red-300">{cancelMutation.error.message}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-background/50 p-3 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold">
        <Clock3 className="h-4 w-4 text-violet-400" />
        درخواست اضافه‌کاری برای {workerName}
      </div>

      <div className="flex flex-wrap gap-2">
        {[30, 60, 120].map((minutes) => (
          <Button
            key={minutes}
            type="button"
            size="sm"
            variant={extensionMinutes === minutes ? "default" : "outline"}
            onClick={() => setExtensionMinutes(minutes)}
          >
            +{minutes.toLocaleString("fa-IR")} دقیقه
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["NORMAL_RATE", "نرخ عادی"],
            ["MULTIPLIER", "ضریبی"],
            ["FIXED_BONUS", "پاداش ثابت"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={rateType === value ? "default" : "outline"}
            onClick={() => setRateType(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {rateType === "MULTIPLIER" && (
        <div className="flex flex-wrap gap-2">
          {[1.25, 1.5, 2].map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={multiplier === value ? "default" : "outline"}
              onClick={() => setMultiplier(value)}
            >
              {value.toLocaleString("fa-IR")}x
            </Button>
          ))}
        </div>
      )}

      {rateType === "FIXED_BONUS" && (
        <Input
          dir="ltr"
          inputMode="numeric"
          value={fixedBonusRials}
          onChange={(event) =>
            setFixedBonusRials(event.target.value.replace(/\D/g, ""))
          }
          placeholder="پاداش ثابت به ریال"
        />
      )}

      <Input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="توضیح اختیاری برای Worker"
        maxLength={1000}
      />

      <Button
        className="w-full"
        disabled={
          requestMutation.isPending ||
          (rateType === "FIXED_BONUS" && BigInt(fixedBonusRials || "0") <= 0n)
        }
        onClick={() => requestMutation.mutate()}
      >
        {requestMutation.isPending ? (
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="ml-2 h-4 w-4" />
        )}
        ارسال درخواست اضافه‌کاری
      </Button>
      {requestMutation.error && (
        <p className="text-xs text-red-300">{requestMutation.error.message}</p>
      )}
    </div>
  );
}
