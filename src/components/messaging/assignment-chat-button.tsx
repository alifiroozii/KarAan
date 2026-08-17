"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";

async function ensureConversation(assignmentId: string) {
  const response = await fetch(`/api/assignments/${assignmentId}/conversation`, { method: "POST" });
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message ?? "باز کردن گفتگو ناموفق بود.");
  }
  return body.data as { id: string };
}

export function AssignmentChatButton({
  assignmentId,
  destinationBase,
  className = "",
}: {
  assignmentId: string;
  destinationBase: "/worker/messages" | "/employer/messages";
  className?: string;
}) {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: () => ensureConversation(assignmentId),
    onSuccess: (conversation) => router.push(`${destinationBase}/${conversation.id}`),
  });

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-300 transition hover:bg-indigo-500/15 disabled:opacity-50"
      >
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
        گفتگو
      </button>
      {mutation.error && <p className="mt-1 text-[11px] text-red-300">{mutation.error.message}</p>}
    </div>
  );
}
