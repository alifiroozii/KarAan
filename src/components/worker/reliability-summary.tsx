"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { ReliabilityBadge } from "@/components/ui/domain-displays";
import { useRealtimeRoom } from "@/hooks/use-realtime-room";

interface ReliabilitySummary {
  workerId: string;
  score: number;
  activeStrikeWeight: number;
  strikes: Array<{
    id: string;
    weight: number;
    reason: string;
    expiresAt: string;
  }>;
  sanctions: Array<{
    id: string;
    sanctionType: string;
    reason: string;
    startAt: string;
    endAt: string | null;
  }>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    scoreDelta: number;
    resultingScore: number;
    createdAt: string;
  }>;
}

async function fetchReliability(): Promise<ReliabilitySummary> {
  const response = await fetch("/api/worker/reliability");
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || "دریافت امتیاز اعتماد ناموفق بود.");
  }
  return body.data as ReliabilitySummary;
}

export function WorkerReliabilitySummary() {
  const query = useQuery({
    queryKey: ["worker", "reliability"],
    queryFn: fetchReliability,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useRealtimeRoom("user", query.data?.workerId);

  if (query.isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        در حال دریافت امتیاز اعتماد...
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-300">
        <AlertTriangle className="h-4 w-4" />
        امتیاز اعتماد فعلاً قابل دریافت نیست.
      </div>
    );
  }

  const summary = query.data;
  const activeSanction = summary.sanctions[0];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ReliabilityBadge score={summary.score} />
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          وزن Strike فعال: {summary.activeStrikeWeight.toLocaleString("fa-IR")}
        </span>
      </div>

      {activeSanction && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
          <div className="flex items-center gap-2 font-bold">
            <ShieldX className="h-4 w-4" />
            محدودیت فعال حساب
          </div>
          <p className="mt-1 text-red-200/80">{activeSanction.reason}</p>
          <p className="mt-1 text-[10px] text-red-200/65">
            نوع: {activeSanction.sanctionType}
            {activeSanction.endAt
              ? ` — تا ${new Date(activeSanction.endAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}`
              : " — بدون تاریخ پایان"}
          </p>
        </div>
      )}
    </div>
  );
}
