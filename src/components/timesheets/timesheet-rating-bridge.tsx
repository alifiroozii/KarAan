"use client";

import { useQuery } from "@tanstack/react-query";
import { AssignmentRatingCard } from "@/components/ratings/assignment-rating-card";

async function fetchAssignmentId(timesheetId: string): Promise<string> {
  const response = await fetch(`/api/timesheets/${timesheetId}`);
  const body = await response.json();
  if (!response.ok || !body.success || !body.data?.assignmentId) {
    throw new Error(body?.error?.message || "Assignment تایمشیت پیدا نشد.");
  }
  return body.data.assignmentId as string;
}

export function TimesheetRatingBridge({ timesheetId }: { timesheetId: string }) {
  const query = useQuery({
    queryKey: ["timesheet", timesheetId, "rating-assignment"],
    queryFn: () => fetchAssignmentId(timesheetId),
    staleTime: 5 * 60_000,
  });

  if (!query.data) return null;
  return <AssignmentRatingCard assignmentId={query.data} />;
}
