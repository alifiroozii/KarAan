"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock, MapPin, Navigation, Route, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/domain-displays";
import { useLocation } from "@/hooks/use-location";
import { useRealtimeRoom } from "@/hooks/use-realtime-room";

interface EtaSnapshot {
  distanceMeters: number;
  durationSeconds: number;
  estimatedArrivalAt: string;
  calculatedAt: string;
  lateRisk: "ON_TIME" | "RISK_OF_LATE" | "LATE";
}

interface CurrentShift {
  assignmentId: string;
  state: string;
  shiftId: string;
  title: string;
  locationName: string;
  latitude: number;
  longitude: number;
  startAt: string;
  endAt: string;
  hourlyPayRials: string;
  eta: EtaSnapshot | null;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok || !body.success) {
    throw new Error(body?.error?.message || body?.error || "خطا در ارتباط با سرور");
  }
  return body.data as T;
}

export function CurrentShiftCard() {
  const queryClient = useQueryClient();
  const location = useLocation(true);
  const lastTrackingAt = useRef(0);

  const currentShiftQuery = useQuery({
    queryKey: ["worker", "current-shift"],
    queryFn: async () => readJson<CurrentShift | null>(await fetch("/api/worker/current-shift")),
    refetchInterval: 60_000,
  });

  const currentShift = currentShiftQuery.data;
  useRealtimeRoom("assignment", currentShift?.assignmentId);

  const enRouteMutation = useMutation({
    mutationFn: async () => {
      if (!currentShift) throw new Error("شیفت فعالی وجود ندارد.");
      if (location.latitude == null || location.longitude == null) {
        throw new Error("برای اعلام حرکت، GPS را فعال کنید.");
      }

      const locationResponse = await fetch("/api/location/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });
      if (!locationResponse.ok) throw new Error("ثبت موقعیت فعلی انجام نشد.");

      return readJson<{ state: string; eta: EtaSnapshot }>(
        await fetch(`/api/assignments/${currentShift.assignmentId}/en-route`, {
          method: "POST",
        })
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["worker", "current-shift"] });
    },
  });

  useEffect(() => {
    if (
      currentShift?.state !== "EN_ROUTE" ||
      location.latitude == null ||
      location.longitude == null
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastTrackingAt.current < 12_000) return;
    lastTrackingAt.current = now;

    let cancelled = false;
    void (async () => {
      try {
        await fetch("/api/location/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: location.latitude,
            longitude: location.longitude,
            assignmentId: currentShift.assignmentId,
          }),
        });

        if (cancelled) return;
        await fetch(`/api/assignments/${currentShift.assignmentId}/eta`, {
          method: "POST",
        });
        if (!cancelled) {
          void queryClient.invalidateQueries({ queryKey: ["worker", "current-shift"] });
        }
      } catch {
        // Tracking retries naturally on the next geolocation update.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    currentShift?.assignmentId,
    currentShift?.state,
    location.latitude,
    location.longitude,
    queryClient,
  ]);

  if (currentShiftQuery.isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-5 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        در حال دریافت شیفت فعال...
      </div>
    );
  }

  if (currentShiftQuery.isError) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">
        دریافت شیفت فعال با خطا مواجه شد.
      </div>
    );
  }

  if (!currentShift) return null;

  const etaMinutes = currentShift.eta
    ? Math.max(1, Math.ceil(currentShift.eta.durationSeconds / 60))
    : null;
  const distanceKm = currentShift.eta
    ? (currentShift.eta.distanceMeters / 1000).toLocaleString("fa-IR", {
        maximumFractionDigits: 1,
      })
    : null;

  return (
    <section className="rounded-3xl border border-indigo-500/30 bg-indigo-500/10 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-indigo-300">شیفت فعلی</p>
          <h2 className="mt-1 text-base font-extrabold text-foreground">{currentShift.title}</h2>
        </div>
        <StatusBadge status={currentShift.state} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl border border-border/70 bg-background/50 p-3">
          <MapPin className="mb-1 h-4 w-4 text-indigo-400" />
          <span className="text-muted-foreground">{currentShift.locationName}</span>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/50 p-3">
          <Clock className="mb-1 h-4 w-4 text-indigo-400" />
          <span className="text-muted-foreground">
            {new Date(currentShift.startAt).toLocaleTimeString("fa-IR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {currentShift.state === "CONFIRMED" && (
        <Button
          className="w-full font-bold"
          onClick={() => enRouteMutation.mutate()}
          disabled={enRouteMutation.isPending || location.loading}
        >
          {enRouteMutation.isPending ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="ml-2 h-4 w-4" />
          )}
          حرکت کردم
        </Button>
      )}

      {enRouteMutation.error && (
        <p className="text-xs text-red-300">{enRouteMutation.error.message}</p>
      )}

      {currentShift.state === "EN_ROUTE" && (
        <div className="rounded-2xl border border-indigo-400/30 bg-background/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-indigo-300">
            <Route className="h-4 w-4" />
            در مسیر محل کار
          </div>
          {currentShift.eta ? (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="block text-muted-foreground">فاصله</span>
                <strong>{distanceKm} کیلومتر</strong>
              </div>
              <div>
                <span className="block text-muted-foreground">زمان تقریبی</span>
                <strong>{etaMinutes} دقیقه</strong>
              </div>
              <div>
                <span className="block text-muted-foreground">رسیدن</span>
                <strong>
                  {new Date(currentShift.eta.estimatedArrivalAt).toLocaleTimeString("fa-IR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </strong>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">در حال محاسبه ETA...</p>
          )}

          {currentShift.eta?.lateRisk !== "ON_TIME" && currentShift.eta && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-2 text-xs text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              {currentShift.eta.lateRisk === "LATE"
                ? "زمان شروع شیفت گذشته است؛ سریعاً با مسئول شیفت هماهنگ کنید."
                : "با ETA فعلی احتمال تأخیر وجود دارد."}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
