"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2, ShieldX, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Relationship {
  workerUserId: string;
  rosterType: "FAVORITE" | "PREFERRED" | "BLOCKED" | null;
  blockedByEmployer: boolean;
  blockedByWorker: boolean;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body?.error?.message || "خطا در ارتباط با سرور");
  return body.data as T;
}

export function EmployerWorkerRelationshipControls({
  assignmentId,
  workerUserId,
}: {
  assignmentId: string;
  workerUserId: string;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["employer", "worker-relationship", workerUserId],
    queryFn: async () =>
      readJson<Relationship>(await fetch(`/api/employer/workers/${workerUserId}/relationship`)),
  });

  const rosterMutation = useMutation({
    mutationFn: async (rosterType: Relationship["rosterType"]) =>
      readJson<Relationship>(
        await fetch(`/api/employer/workers/${workerUserId}/relationship`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rosterType }),
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["employer", "worker-relationship", workerUserId] });
    },
  });

  const blockMutation = useMutation({
    mutationFn: async (blocked: boolean) =>
      readJson<unknown>(
        await fetch(`/api/assignments/${assignmentId}/counterparty-block`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocked, reason: blocked ? "عدم تمایل به همکاری مجدد" : undefined }),
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["employer", "worker-relationship", workerUserId] });
    },
  });

  if (query.isLoading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (!query.data) return null;
  const relationship = query.data;

  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-background/50 p-2">
      <Button
        type="button"
        size="sm"
        variant={relationship.rosterType === "FAVORITE" ? "default" : "outline"}
        disabled={rosterMutation.isPending || blockMutation.isPending || relationship.blockedByWorker}
        onClick={() =>
          rosterMutation.mutate(relationship.rosterType === "FAVORITE" ? null : "FAVORITE")
        }
      >
        <Heart className="ml-1 h-3.5 w-3.5" />
        علاقه‌مند
      </Button>
      <Button
        type="button"
        size="sm"
        variant={relationship.rosterType === "PREFERRED" ? "default" : "outline"}
        disabled={rosterMutation.isPending || blockMutation.isPending || relationship.blockedByWorker}
        onClick={() =>
          rosterMutation.mutate(relationship.rosterType === "PREFERRED" ? null : "PREFERRED")
        }
      >
        <Star className="ml-1 h-3.5 w-3.5" />
        اولویت‌دار
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={relationship.blockedByEmployer ? "border-red-500/40 text-red-300" : ""}
        disabled={rosterMutation.isPending || blockMutation.isPending}
        onClick={() => blockMutation.mutate(!relationship.blockedByEmployer)}
      >
        <ShieldX className="ml-1 h-3.5 w-3.5" />
        {relationship.blockedByEmployer ? "رفع مسدودی" : "عدم همکاری"}
      </Button>
      {relationship.blockedByWorker && (
        <span className="self-center text-[10px] text-amber-300">Worker شما را مسدود کرده است</span>
      )}
    </div>
  );
}
