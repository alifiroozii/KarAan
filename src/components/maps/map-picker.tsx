"use client";

import React from "react";
import { MapPin } from "lucide-react";

export interface MapPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange?: (lat: number, lng: number) => void;
}

export function MapPicker({ latitude, longitude }: MapPickerProps) {
  return (
    <div className="relative w-full h-48 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-4">
      <MapPin className="w-8 h-8 text-indigo-400 animate-bounce mb-2" />
      <span className="text-xs font-semibold text-slate-200">نقشه انتخابی سیستم (نشان / برگه‌ها)</span>
      <span className="text-[11px] text-slate-400 dir-ltr mt-1">
        Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
      </span>
    </div>
  );
}
