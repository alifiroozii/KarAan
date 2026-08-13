export interface ShiftDispute {
  id: string;
  assignmentId: string;
  reason: string;
  status: "OPEN" | "RESOLVED" | "REJECTED";
}
