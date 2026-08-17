"use client";

import { useQuery } from "@tanstack/react-query";
import { AssignmentCancellationControl } from "@/components/common/assignment-cancellation-control";

interface CurrentShiftCancellationInfo {
  assignmentId: string;
  shiftId: string;
  state: string;
}

const cancellableStates = new Set([
  "ACCEPTED",
  "RECONFIRM_PENDING",
  "CONFIRMED",
  "EN_ROUTE",
  "ARRIVED",
]);

async function fetchCurrentShift(): Promise<CurrentShiftCancellationInfo | null> {
  const response = await fetch("/api/worker/current-shift");
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || "دریافت شیفت فعلی ناموفق بود.");
  }
  return body.data as CurrentShiftCancellationInfo | null;
}

export function WorkerCancellationPanel() {
  const query = useQuery({
    queryKey: ["worker", "current-shift"],
    queryFn: fetchCurrentShift,
    refetchInterval: 60_000,
  });

  const shift = query.data;
  if (!shift || !cancellableStates.has(shift.state)) return null;

  return (
    <AssignmentCancellationControl
      assignmentId={shift.assignmentId}
      shiftId={shift.shiftId}
      mode="worker"
    />
  );
}
