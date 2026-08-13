"use client";

import { useState, useEffect } from "react";

export interface GeoLocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export function useLocation(enableHighAccuracy = true) {
  const [location, setLocation] = useState<GeoLocationState>(() => {
    const isSupported = typeof window !== "undefined" && "geolocation" in navigator;
    return {
      latitude: null,
      longitude: null,
      accuracy: null,
      error: isSupported ? null : "مرورگر شما از قابلیت مکان‌یابی (GPS) پشتیبانی نمی‌کند.",
      loading: isSupported,
    };
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (err) => {
        setLocation({
          latitude: null,
          longitude: null,
          accuracy: null,
          error: err.message,
          loading: false,
        });
      },
      {
        enableHighAccuracy,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enableHighAccuracy]);

  return location;
}
