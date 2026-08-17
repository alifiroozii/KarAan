"use client";

import { useQuery } from "@tanstack/react-query";
import { AssignmentChatButton } from "@/components/messaging/assignment-chat-button";

async function getCurrentAssignment() {
  const response = await fetch("/api/worker/current-shift", { cache: "no-store" });
  const body = await response.json();
  if (!response.ok || !body.success) return null;
  return body.data as { assignmentId: string } | null;
}

export function WorkerCurrentChatButton() {
  const query = useQuery({
    queryKey: ["worker", "current-shift"],
    queryFn: getCurrentAssignment,
    staleTime: 30_000,
  });
  if (!query.data?.assignmentId) return null;
  return (
    <div className="rounded-3xl border border-indigo-500/20 bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold">هماهنگی با کارفرما</p>
          <p className="mt-1 text-[11px] text-muted-foreground">گفتگوی این شیفت فقط برای طرف‌های همان Assignment باز است.</p>
        </div>
        <AssignmentChatButton assignmentId={query.data.assignmentId} destinationBase="/worker/messages" />
      </div>
    </div>
  );
}
