"use client";

import React, { useState } from "react";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "../ui/button";

export interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

export function LocationPicker({
  initialLat = 35.7000,
  initialLng = 51.3500,
  onLocationSelect,
}: LocationPickerProps) {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);

  const handleSelect = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    onLocationSelect(newLat, newLng);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-indigo-400" />
          <span>انتخاب موقعیت روی نقشه</span>
        </span>
        <span className="text-[10px] text-muted-foreground dir-ltr">
          {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
        </span>
      </div>

      {/* Simulated Map Canvas View */}
      <div className="relative w-full h-44 bg-slate-900 border border-border rounded-xl flex flex-col items-center justify-center text-center p-4 selection:bg-indigo-500 selection:text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-indigo-600/30 border border-indigo-500 text-indigo-400 flex items-center justify-center animate-bounce">
            <MapPin className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-300 font-semibold">
            نقشه تعاملی نشان / بلد (Neshan Map Picker)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={() => handleSelect(35.7000, 51.3500)}
        >
          <Navigation className="w-3.5 h-3.5 ml-1 text-indigo-400" />
          تهران - مرکز (انقلاب)
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full text-xs"
          onClick={() => handleSelect(35.7500, 51.4000)}
        >
          <Navigation className="w-3.5 h-3.5 ml-1 text-emerald-400" />
          تهران - شمال (ونک)
        </Button>
      </div>
    </div>
  );
}
