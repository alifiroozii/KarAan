"use client";

import React, { useState, useEffect } from "react";
import { Navigation, AlertTriangle, CheckCircle2, ShieldAlert, WifiOff } from "lucide-react";

export interface LiveLocationTrackerProps {
  isAvailable: boolean;
  assignmentId?: string;
  onLocationUpdate?: (location: { latitude: number; longitude: number; accuracy: number }) => void;
}

export type GeolocationStatus =
  | "INITIALIZING"
  | "TRACKING"
  | "PERMISSION_DENIED"
  | "GPS_UNAVAILABLE"
  | "LOW_ACCURACY"
  | "STALE_POSITION";

export function LiveLocationTracker({
  isAvailable,
  assignmentId,
  onLocationUpdate,
}: LiveLocationTrackerProps) {
  const [status, setStatus] = useState<GeolocationStatus>("INITIALIZING");
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const isEnRoute = Boolean(assignmentId);

  useEffect(() => {
    if (!isAvailable) return;

    if (!navigator.geolocation) {
      setTimeout(() => setStatus("GPS_UNAVAILABLE"), 0);
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy: acc } = position.coords;
      setAccuracy(acc);
      setLastUpdated(new Date().toLocaleTimeString("fa-IR"));

      if (acc > 150) {
        setStatus("LOW_ACCURACY");
      } else {
        setStatus("TRACKING");
      }

      if (onLocationUpdate) {
        onLocationUpdate({ latitude, longitude, accuracy: acc });
      }

      // Send to server
      fetch("/api/location/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude, assignmentId }),
      }).catch(console.error);
    };

    const handleError = (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        setStatus("PERMISSION_DENIED");
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        setStatus("GPS_UNAVAILABLE");
      } else {
        setStatus("STALE_POSITION");
      }
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: isEnRoute,
      timeout: 15000,
      maximumAge: isEnRoute ? 5000 : 30000,
    });

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isAvailable, isEnRoute, assignmentId, onLocationUpdate]);

  if (!isAvailable) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm select-none" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className={`w-4 h-4 ${status === "TRACKING" ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
          <span className="text-xs font-extrabold text-foreground">
            {isEnRoute ? "مسیریابی زنده شیفت (حالت پرسرعت)" : "ارسال موقیعت مکانی زنده (حالت استاندارد)"}
          </span>
        </div>

        {lastUpdated && <span className="text-[10px] text-muted-foreground font-semibold dir-ltr">{lastUpdated}</span>}
      </div>

      {status === "PERMISSION_DENIED" && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-400">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>دسترسی موقیعت مکانی مرورگر غیرفعال است. لطفاً در تنظیمات مرورگر اجازه دهید.</span>
        </div>
      )}

      {status === "GPS_UNAVAILABLE" && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-400">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>GPS دستگاه در دسترس نیست. لطفاً مکان‌یابی گوشی خود را روشن کنید.</span>
        </div>
      )}

      {status === "LOW_ACCURACY" && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>دقت مکان‌یابی پایین است ({Math.round(accuracy || 0)} متر).</span>
          </div>
        </div>
      )}

      {status === "TRACKING" && (
        <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            سیگنال مکان‌یابی فعال است
          </span>
          {accuracy && <span>دقت: {Math.round(accuracy)} متر</span>}
        </div>
      )}
    </div>
  );
}
