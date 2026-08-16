"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

async function readResult<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || "عملیات اضافه‌کاری ناموفق بود.");
  }
  return body.data as T;
}

export function WorkerOvertimeCard({ assignmentId }: { assignmentId: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["worker", "overtime", assignmentId],
    queryFn: async () =>
      readResult<OvertimeItem[]>(
        await fetch(`/api/worker/assignments/${assignmentId}/overtime`)
      ),
    refetchInterval: 30_000,
  });

  const active = useMemo(
    () => query.data?.find((item) => item.status === "PENDING" || item.status === "ACCEPTED"),
    [query.data]
  );

  const responseMutation = useMutation({
    mutationFn: async (response: "accept" | "decline") => {
      if (!active) throw new Error("درخواست اضافه‌کاری فعالی وجود ندارد.");
      return readResult<OvertimeItem>(
        await fetch(`/api/overtime/${active.id}/${response}`, { method: "POST" })
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["worker", "overtime", assignmentId] });
      void queryClient.invalidateQueries({ queryKey: ["worker", "current-shift"] });
    },
  });

  if (!active) return null;

  const multiplier = (active.rateMultiplierBps / 10_000).toLocaleString("fa-IR", {
    maximumFractionDigits: 2,
  });

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-violet-200">
          <Clock3 className="h-4 w-4" />
          {active.status === "PENDING" ? "درخواست اضافه‌کاری" : "اضافه‌کاری پذیرفته‌شده"}
        </div>
        <span className="text-[11px] text-violet-300">
          {active.requestedMinutes.toLocaleString("fa-IR")} دقیقه
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-violet-500/20 bg-background/50 p-3">
          <span className="block text-muted-foreground">پایان پیشنهادی</span>
          <strong>
            {new Date(active.requestedEndAt).toLocaleTimeString("fa-IR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </strong>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-background/50 p-3">
          <span className="block text-muted-foreground">نرخ</span>
          <strong>
            {active.rateType === "MULTIPLIER"
              ? `${multiplier} برابر`
              : active.rateType === "FIXED_BONUS"
                ? "نرخ عادی + پاداش"
                : "نرخ عادی"}
          </strong>
        </div>
      </div>

      {BigInt(active.fixedBonusRials) > 0n && (
        <p className="text-xs text-violet-200">
          پاداش ثابت: <CurrencyDisplay amountRials={BigInt(active.fixedBonusRials)} />
        </p>
      )}
      {active.note && <p className="text-xs leading-6 text-muted-foreground">{active.note}</p>}

      {active.status === "PENDING" && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            disabled={responseMutation.isPending}
            onClick={() => responseMutation.mutate("accept")}
          >
            {responseMutation.isPending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="ml-2 h-4 w-4" />
            )}
            قبول می‌کنم
          </Button>
          <Button
            variant="outline"
            disabled={responseMutation.isPending}
            onClick={() => responseMutation.mutate("decline")}
          >
            <X className="ml-2 h-4 w-4" />
            رد می‌کنم
          </Button>
        </div>
      )}

      {responseMutation.error && (
        <p className="text-xs text-red-300">{responseMutation.error.message}</p>
      )}
    </div>
  );
}
