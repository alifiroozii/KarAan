"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RatingContext {
  assignmentId: string;
  assignmentState: string;
  direction: "WORKER_TO_EMPLOYER" | "EMPLOYER_TO_WORKER";
  targetUserId: string;
  targetName: string;
  canRate: boolean;
  existing: {
    id: string;
    score: number;
    tags: string[];
    comment: string | null;
    createdAt: string;
  } | null;
  allowedTags: string[];
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || "خطا در ارتباط با سرور");
  }
  return body.data as T;
}

export function AssignmentRatingCard({ assignmentId }: { assignmentId: string }) {
  const queryClient = useQueryClient();
  const [score, setScore] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  const contextQuery = useQuery({
    queryKey: ["assignment", assignmentId, "rating"],
    queryFn: async () =>
      readJson<RatingContext>(await fetch(`/api/assignments/${assignmentId}/ratings`)),
  });

  const submitMutation = useMutation({
    mutationFn: async () =>
      readJson<{ rating: RatingContext["existing"]; idempotent: boolean }>(
        await fetch(`/api/assignments/${assignmentId}/ratings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score, tags, comment: comment.trim() || undefined }),
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["assignment", assignmentId, "rating"] });
      void queryClient.invalidateQueries({ queryKey: ["worker", "quality-rating"] });
    },
  });

  const context = contextQuery.data;
  const title = useMemo(() => {
    if (!context) return "امتیازدهی";
    return context.direction === "WORKER_TO_EMPLOYER"
      ? `تجربه همکاری با ${context.targetName}`
      : `کیفیت کار ${context.targetName}`;
  }, [context]);

  if (contextQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        در حال بررسی امکان امتیازدهی...
      </div>
    );
  }

  if (contextQuery.isError || !context) return null;

  if (context.existing) {
    return (
      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          امتیاز شما ثبت شده است
        </div>
        <div className="flex items-center gap-1" aria-label={`${context.existing.score} از ۵`}>
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className={`h-4 w-4 ${index < context.existing!.score ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
            />
          ))}
        </div>
        {context.existing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {context.existing.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-background/60 px-2 py-1 text-[10px]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (!context.canRate) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          این امتیاز مربوط به کیفیت تجربه/کار است و مستقیماً Reliability را تغییر نمی‌دهد.
        </p>
      </div>

      <div className="flex gap-1" role="radiogroup" aria-label="امتیاز از یک تا پنج">
        {Array.from({ length: 5 }, (_, index) => {
          const value = index + 1;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={score === value}
              className="rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setScore(value)}
            >
              <Star
                className={`h-7 w-7 ${value <= score ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
              />
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {context.allowedTags.map((tag) => {
          const selected = tags.includes(tag);
          return (
            <button
              type="button"
              key={tag}
              className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                selected
                  ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-200"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
              onClick={() =>
                setTags((current) =>
                  selected ? current.filter((item) => item !== tag) : current.length < 5 ? [...current, tag] : current
                )
              }
            >
              {tag}
            </button>
          );
        })}
      </div>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={1000}
        rows={3}
        className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-indigo-500/50"
        placeholder="توضیح اختیاری..."
      />

      <Button
        type="button"
        className="w-full font-bold"
        disabled={submitMutation.isPending}
        onClick={() => submitMutation.mutate()}
      >
        {submitMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        ثبت امتیاز
      </Button>
      {submitMutation.error && <p className="text-xs text-red-300">{submitMutation.error.message}</p>}
    </section>
  );
}
