"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlockState {
  assignmentId: string;
  targetUserId: string;
  blockedByMe: boolean;
  blockedMe: boolean;
  reason: string | null;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body?.error?.message || "خطا در ارتباط با سرور");
  return body.data as T;
}

export function CounterpartyBlockControl({ assignmentId }: { assignmentId: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["assignment", assignmentId, "counterparty-block"],
    queryFn: async () =>
      readJson<BlockState>(await fetch(`/api/assignments/${assignmentId}/counterparty-block`)),
  });

  const mutation = useMutation({
    mutationFn: async (blocked: boolean) =>
      readJson<BlockState>(
        await fetch(`/api/assignments/${assignmentId}/counterparty-block`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blocked,
            reason: blocked ? "عدم تمایل به همکاری مجدد" : undefined,
          }),
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId, "counterparty-block"] });
    },
  });

  if (query.isLoading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (!query.data) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">همکاری مجدد</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Block دوطرفه است و این فرد را از Matchهای آینده بین شما حذف می‌کند.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={query.data.blockedByMe ? "border-red-500/40 text-red-300" : ""}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(!query.data!.blockedByMe)}
        >
          {mutation.isPending ? <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin" /> : <ShieldX className="ml-1 h-3.5 w-3.5" />}
          {query.data.blockedByMe ? "رفع مسدودی" : "عدم همکاری"}
        </Button>
      </div>
      {query.data.blockedMe && (
        <p className="text-[10px] text-amber-300">طرف مقابل قبلاً شما را برای همکاری آینده مسدود کرده است.</p>
      )}
      {mutation.error && <p className="text-xs text-red-300">{mutation.error.message}</p>}
    </div>
  );
}
