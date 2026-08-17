"use client";

import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { AssignmentChatButton } from "@/components/messaging/assignment-chat-button";

interface AssignmentRow {
  assignmentId: string;
  workerName: string;
  state: string;
}

async function fetchAssignments(shiftId: string): Promise<AssignmentRow[]> {
  const response = await fetch(`/api/shifts/${shiftId}/assignments`, { cache: "no-store" });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body?.error?.message ?? "دریافت نیروها ناموفق بود.");
  return body.data as AssignmentRow[];
}

export function EmployerAssignmentChatLauncher({ shiftId }: { shiftId: string }) {
  const query = useQuery({
    queryKey: ["shift", shiftId, "assignments"],
    queryFn: () => fetchAssignments(shiftId),
  });
  const assignments = query.data ?? [];
  if (query.isLoading || assignments.length === 0) return null;

  return (
    <section className="rounded-3xl border border-indigo-500/20 bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-indigo-400" />
        <div>
          <h3 className="text-sm font-extrabold">گفتگو با نیروها</h3>
          <p className="text-[11px] text-muted-foreground">هر گفتگو فقط به Assignment همان نیرو متصل است.</p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {assignments.map((assignment) => (
          <div key={assignment.assignmentId} className="flex items-center justify-between gap-3 rounded-2xl border border-border p-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">{assignment.workerName}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{assignment.state}</p>
            </div>
            <AssignmentChatButton assignmentId={assignment.assignmentId} destinationBase="/employer/messages" />
          </div>
        ))}
      </div>
    </section>
  );
}
