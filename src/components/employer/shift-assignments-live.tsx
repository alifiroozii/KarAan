"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Navigation,
  Users,
  Zap,
} from "lucide-react";
import { AssignmentCancellationControl } from "@/components/common/assignment-cancellation-control";
import { EmployerOvertimeControls } from "@/components/employer/overtime-controls";
import { EmployerWorkerRelationshipControls } from "@/components/employer/worker-relationship-controls";
import { CurrencyDisplay, StatusBadge } from "@/components/ui/domain-displays";
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
  scheduledEndAt: string;
  effectiveEndAt: string;
  eta: EtaSnapshot | null;
  noShowStatus: "POTENTIAL" | "FINAL" | "OVERRIDDEN" | null;
  noShowDetectedAt: string | null;
  noShowFinalizesAt: string | null;
  backfillRequestId: string | null;
  backfillStatus:
    | "REQUESTED"
    | "DISPATCHING"
    | "OFFERED"
    | "FILLED"
    | "EXHAUSTED"
    | "CANCELLED"
    | null;
  backfillTrigger: string | null;
  backfillUrgentBonusRials: string;
  backfillOffersCreated: number | null;
  backfillDispatchAttemptCount: number | null;
}

const cancellableStates = new Set([
  "OFFERED",
  "VIEWED",
  "ACCEPTED",
  "RECONFIRM_PENDING",
  "CONFIRMED",
  "EN_ROUTE",
  "ARRIVED",
]);

async function fetchAssignments(shiftId: string): Promise<AssignmentRow[]> {
  const response = await fetch(`/api/shifts/${shiftId}/assignments`);
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || "دریافت نیروهای شیفت ناموفق بود.");
  }
  return body.data as AssignmentRow[];
}

function backfillStatusLabel(status: AssignmentRow["backfillStatus"]) {
  switch (status) {
    case "REQUESTED":
      return "در صف جایگزینی";
    case "DISPATCHING":
      return "در حال جستجوی نیروی جایگزین";
    case "OFFERED":
      return "پیشنهاد فوری ارسال شده";
    case "FILLED":
      return "نیروی جایگزین پیدا شد";
    case "EXHAUSTED":
      return "کاندیدای مناسب پیدا نشد";
    case "CANCELLED":
      return "جایگزینی متوقف شد";
    default:
      return "";
  }
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
            const extended =
              new Date(assignment.effectiveEndAt).getTime() >
              new Date(assignment.scheduledEndAt).getTime();
            const backfillBonus = BigInt(assignment.backfillUrgentBonusRials || "0");

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

                {assignment.noShowStatus === "POTENTIAL" && (
                  <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <strong className="block">احتمال عدم حضور</strong>
                      <span className="mt-1 block text-amber-200/80">
                        ورود Worker هنوز ثبت نشده است
                        {assignment.noShowFinalizesAt
                          ? `؛ در صورت ادامه تا ${new Date(assignment.noShowFinalizesAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tehran" })} عدم حضور نهایی می‌شود.`
                          : "."}
                      </span>
                    </div>
                  </div>
                )}

                {(assignment.noShowStatus === "FINAL" || assignment.state === "NO_SHOW") && (
                  <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <strong className="block">عدم حضور نهایی ثبت شد</strong>
                      <span className="mt-1 block text-red-200/80">
                        جایگاه این Assignment برای جایگزینی آزاد شده است.
                      </span>
                    </div>
                  </div>
                )}

                {assignment.noShowStatus === "OVERRIDDEN" && (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ثبت No-show توسط سیستم/پشتیبانی اصلاح شده است.
                  </div>
                )}

                {assignment.backfillRequestId && assignment.backfillStatus && (
                  <div
                    className={`rounded-2xl border p-3 text-xs ${
                      assignment.backfillStatus === "FILLED"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                        : assignment.backfillStatus === "EXHAUSTED"
                          ? "border-red-500/30 bg-red-500/10 text-red-200"
                          : assignment.backfillStatus === "CANCELLED"
                            ? "border-border bg-muted/40 text-muted-foreground"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      <Zap className="h-4 w-4" />
                      {backfillStatusLabel(assignment.backfillStatus)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] opacity-80">
                      <span>
                        پیشنهادهای ارسال‌شده: {(assignment.backfillOffersCreated ?? 0).toLocaleString("fa-IR")}
                      </span>
                      <span>
                        تلاش: {(assignment.backfillDispatchAttemptCount ?? 0).toLocaleString("fa-IR")}
                      </span>
                      {backfillBonus > 0n && (
                        <span>
                          پاداش فوری: <CurrencyDisplay amountRials={backfillBonus} />
                        </span>
                      )}
                    </div>
                  </div>
                )}

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
                        timeZone: "Asia/Tehran",
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

                {extended && (
                  <div className="rounded-2xl border border-violet-500/25 bg-violet-500/5 p-3 text-xs text-violet-200">
                    پایان مؤثر این نیرو تا {new Date(assignment.effectiveEndAt).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Tehran",
                    })} تمدید شده است.
                  </div>
                )}

                {(assignment.state === "CHECKED_IN" || assignment.state === "ON_BREAK") && (
                  <EmployerOvertimeControls
                    assignmentId={assignment.assignmentId}
                    workerName={assignment.workerName}
                    state={assignment.state}
                  />
                )}

                <EmployerWorkerRelationshipControls
                  assignmentId={assignment.assignmentId}
                  workerUserId={assignment.workerId}
                />

                {cancellableStates.has(assignment.state) && (
                  <AssignmentCancellationControl
                    assignmentId={assignment.assignmentId}
                    shiftId={shiftId}
                    mode="employer"
                  />
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
