"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { RatingStars } from "@/components/ui/domain-displays";

interface QualitySummary {
  averageScore: number | null;
  ratingCount: number;
}

export function WorkerQualityRatingSummary() {
  const query = useQuery({
    queryKey: ["worker", "quality-rating"],
    queryFn: async () => {
      const response = await fetch("/api/worker/ratings/summary");
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body?.error?.message || "دریافت امتیاز کیفیت ناموفق بود.");
      }
      return body.data as QualitySummary;
    },
    staleTime: 60_000,
  });

  if (query.isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (!query.data || query.data.averageScore == null) {
    return <span className="text-[10px] text-muted-foreground">هنوز امتیاز کیفیت ثبت نشده</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <RatingStars score={query.data.averageScore} />
      <span className="text-[10px] text-muted-foreground">
        {query.data.ratingCount.toLocaleString("fa-IR")} نظر
      </span>
    </div>
  );
}
