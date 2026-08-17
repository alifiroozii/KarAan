"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlarmClock, BriefcaseBusiness, Loader2, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/domain-displays";

interface WorkerOffer {
  offerId: string;
  shiftSlotId: string;
  shiftId: string;
  offeredPayRials: string;
  status: "PENDING";
  expiresAt: string;
  createdAt: string;
  shiftTitle: string;
  hourlyPayRials: string;
  locationName: string;
  startAt: string;
  endAt: string;
  backfillRequestId: string | null;
  urgentBonusRials: string;
  isBackfill: boolean;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || body?.success === false) {
    throw new Error(body?.error?.message || body?.error || "خطا در ارتباط با سرور");
  }
  return (body.data ?? body.offers ?? body.result ?? body) as T;
}

function formatClock(value: string) {
  return new Date(value).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tehran",
  });
}

export function WorkerShiftOffers() {
  const queryClient = useQueryClient();
  const offersQuery = useQuery({
    queryKey: ["worker", "offers"],
    queryFn: async () => readJson<WorkerOffer[]>(await fetch("/api/offers")),
    refetchInterval: 30_000,
  });

  const acceptMutation = useMutation({
    mutationFn: async (offerId: string) =>
      readJson<{ success: boolean; assignmentId?: string; message: string }>(
        await fetch(`/api/offers/${offerId}/accept`, { method: "POST" })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["worker", "offers"] });
      void queryClient.invalidateQueries({ queryKey: ["worker", "current-shift"] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (offerId: string) =>
      readJson<{ success: boolean; message: string }>(
        await fetch(`/api/offers/${offerId}/decline`, { method: "POST" })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["worker", "offers"] });
    },
  });

  if (offersQuery.isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-4 text-xs text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        در حال بررسی پیشنهادهای فعال...
      </div>
    );
  }

  if (offersQuery.isError) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-300">
        دریافت پیشنهادهای شیفت با خطا مواجه شد.
      </div>
    );
  }

  const offers = offersQuery.data ?? [];
  if (offers.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="h-5 w-5 text-indigo-400" />
          <h2 className="text-sm font-extrabold">پیشنهادهای فعال</h2>
        </div>
        <span className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold text-indigo-300">
          {offers.length.toLocaleString("fa-IR")} پیشنهاد
        </span>
      </div>

      <div className="space-y-3">
        {offers.map((offer) => {
          const urgentBonus = BigInt(offer.urgentBonusRials);
          const isPendingMutation =
            (acceptMutation.isPending && acceptMutation.variables === offer.offerId) ||
            (declineMutation.isPending && declineMutation.variables === offer.offerId);

          return (
            <article
              key={offer.offerId}
              className={`rounded-2xl border p-4 space-y-3 ${
                offer.isBackfill
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-border bg-background/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold">{offer.shiftTitle}</h3>
                    {offer.isBackfill && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-300">
                        <Zap className="h-3 w-3" />
                        جایگزینی فوری
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {offer.locationName}
                  </p>
                </div>
                <div className="text-left text-[11px] text-muted-foreground">
                  <span className="block">شروع {formatClock(offer.startAt)}</span>
                  <span className="block">پایان {formatClock(offer.endAt)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-border/70 p-3">
                  <span className="block text-muted-foreground">نرخ ساعتی</span>
                  <CurrencyDisplay amountRials={BigInt(offer.hourlyPayRials)} />
                </div>
                <div className="rounded-xl border border-border/70 p-3">
                  <span className="block text-muted-foreground">مهلت پاسخ</span>
                  <strong className="inline-flex items-center gap-1">
                    <AlarmClock className="h-3.5 w-3.5" />
                    {formatClock(offer.expiresAt)}
                  </strong>
                </div>
              </div>

              {urgentBonus > 0n && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                  <span className="block text-emerald-200/75">پاداش قطعی جایگزینی فوری</span>
                  <CurrencyDisplay amountRials={urgentBonus} />
                  <p className="mt-1 text-[10px] text-emerald-200/70">
                    با پذیرش این Offer، پاداش روی Assignment شما ثبت و در Timesheet لحاظ می‌شود.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  className="font-bold"
                  disabled={isPendingMutation}
                  onClick={() => acceptMutation.mutate(offer.offerId)}
                >
                  {acceptMutation.isPending && acceptMutation.variables === offer.offerId && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  )}
                  قبول می‌کنم
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPendingMutation}
                  onClick={() => declineMutation.mutate(offer.offerId)}
                >
                  رد پیشنهاد
                </Button>
              </div>

              {acceptMutation.error && acceptMutation.variables === offer.offerId && (
                <p className="text-xs text-red-300">{acceptMutation.error.message}</p>
              )}
              {declineMutation.error && declineMutation.variables === offer.offerId && (
                <p className="text-xs text-red-300">{declineMutation.error.message}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
