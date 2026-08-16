"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coffee, Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/hooks/use-location";

type BreakStatus = {
  active: boolean;
  breakId: string | null;
  startedAt: string | null;
};

async function readResult<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || "عملیات استراحت ناموفق بود.");
  }
  return body.data as T;
}

export function BreakControls({
  assignmentId,
  assignmentState,
}: {
  assignmentId: string;
  assignmentState: string;
}) {
  const queryClient = useQueryClient();
  const location = useLocation(true);
  const [now, setNow] = useState(() => Date.now());

  const statusQuery = useQuery({
    queryKey: ["worker", "break", assignmentId],
    queryFn: async () =>
      readResult<BreakStatus>(
        await fetch(`/api/worker/assignments/${assignmentId}/break`)
      ),
    enabled: assignmentState === "CHECKED_IN" || assignmentState === "ON_BREAK",
  });

  useEffect(() => {
    if (!statusQuery.data?.active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [statusQuery.data?.active]);

  const elapsedSeconds = useMemo(() => {
    if (!statusQuery.data?.active || !statusQuery.data.startedAt) return 0;
    return Math.max(
      0,
      Math.floor((now - new Date(statusQuery.data.startedAt).getTime()) / 1000)
    );
  }, [now, statusQuery.data]);

  const mutateBreak = useMutation({
    mutationFn: async (action: "start" | "end") => {
      if (location.latitude == null || location.longitude == null) {
        throw new Error("برای ثبت استراحت GPS را فعال کنید.");
      }
      return readResult(
        await fetch(`/api/assignments/${assignmentId}/break/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: location.latitude,
            longitude: location.longitude,
          }),
        })
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["worker", "break", assignmentId] });
      void queryClient.invalidateQueries({ queryKey: ["worker", "current-shift"] });
    },
  });

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold">
          <Coffee className="h-4 w-4 text-amber-400" />
          استراحت
        </div>
        {statusQuery.data?.active && (
          <span dir="ltr" className="font-mono text-sm font-black text-amber-300">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        )}
      </div>

      {assignmentState === "CHECKED_IN" ? (
        <Button
          className="w-full"
          variant="outline"
          disabled={mutateBreak.isPending || location.loading}
          onClick={() => mutateBreak.mutate("start")}
        >
          {mutateBreak.isPending ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <Pause className="ml-2 h-4 w-4" />
          )}
          شروع استراحت
        </Button>
      ) : (
        <Button
          className="w-full"
          disabled={mutateBreak.isPending}
          onClick={() => mutateBreak.mutate("end")}
        >
          {mutateBreak.isPending ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="ml-2 h-4 w-4" />
          )}
          پایان استراحت
        </Button>
      )}

      {mutateBreak.error && (
        <p className="text-xs text-red-300">{mutateBreak.error.message}</p>
      )}
    </div>
  );
}
