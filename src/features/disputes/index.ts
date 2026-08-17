export interface ShiftDispute {
  id: string;
  assignmentId: string;
  reason: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
  resolutionNotes?: string | null;
  resolvedByUserId?: string | null;
}
