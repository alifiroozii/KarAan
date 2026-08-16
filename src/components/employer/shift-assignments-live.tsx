"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Navigation,
  Users,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/domain-displays";
import { useRealtimeRoom } from "@/hooks/use-realtime-room";

interface EtaSnapshot {
  distanceMeters: number;
  durationSeconds: number;
  estimatedArrivalAt: string;
  lateRisk: "ON_TIME" | "RISK_OF_LATE" | "LATE";
}

interface AssignmentRow {
  assignmentId: string;
  state: string;
  workerId: string;
  workerName: string;
  workerAvatarUrl: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  eta: EtaSnapshot | null;
}

async function fetchAssignments(shiftId: string): Promise<AssignmentRow[]> {
  const response = await fetch(`/api/shifts/${shiftId}/assignments`);
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || "دریافت نیروهای شیفت ناموفق بود.");
  }
  return body.data as AssignmentRow[];
}

export function ShiftAssignmentsLive({ shiftId }: { shiftId: string }) {
  useRealtimeRoom("shift", shiftId);

  const query = useQuery({
    queryKey: ["shift", shiftId, "assignments"],
    queryFn: () => fetchAssignments(shiftId),
    refetchInterval: 60_000,
  });

  if (query.isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        در حال دریافت وضعیت نیروها...
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

  const assignments = query.data ?? [];

  return (
    <section className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          وضعیت زنده نیروهای تخصیص‌یافته
        </h3>
        <span className="text-xs text-muted-foreground">
          {assignments.length.toLocaleString("fa-IR")} نیرو
        </span>
      </div>

      {assignments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          هنوز نیرویی به این شیفت تخصیص داده نشده است.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {assignments.map((assignment) => {
            const etaMinutes = assignment.eta
              ? Math.max(1, Math.ceil(assignment.eta.durationSeconds / 60))
              : null;
            const distanceKm = assignment.eta
              ? (assignment.eta.distanceMeters / 1000).toLocaleString("fa-IR", {
                  maximumFractionDigits: 1,
                })
              : null;

            return (
              <div key={assignment.assignmentId} className="py-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{assignment.workerName}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      شناسه نیرو: {assignment.workerId}
                    </p>
                  </div>
                  <StatusBadge status={assignment.state} />
                </div>

                {assignment.state === "EN_ROUTE" && assignment.eta && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-indigo-400" />
                      <span>{distanceKm} کیلومتر فاصله</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-indigo-400" />
                      <span>حدود {etaMinutes} دقیقه</span>
                    </div>
                    <div className="font-semibold">
                      رسیدن: {new Date(assignment.eta.estimatedArrivalAt).toLocaleTimeString("fa-IR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                )}

                {assignment.state === "ARRIVED" && (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>نیرو به محدوده محل رسیده و منتظر ثبت ورود است.</span>
                  </div>
                )}

                {assignment.eta?.lateRisk !== "ON_TIME" && assignment.eta && (
                  <div className="flex items-center gap-2 text-xs text-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                    {assignment.eta.lateRisk === "LATE"
                      ? "این نیرو از زمان مجاز شروع شیفت عبور کرده است."
                      : "با ETA فعلی احتمال تأخیر این نیرو وجود دارد."}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
