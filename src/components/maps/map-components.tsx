"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Building2, Briefcase, User, Layers } from "lucide-react";
import { CurrencyDisplay } from "@/components/ui/domain-displays";

export interface MapProps {
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
}

export function Map({
  centerLat = 35.7000,
  centerLng = 51.3500,
  zoom = 13,
  className = "w-full h-72 sm:h-96 rounded-3xl",
  children,
}: MapProps) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-900 border border-border shadow-md flex items-center justify-center select-none ${className}`}
      dir="rtl"
    >
      {/* Map Background Simulation Grid */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]" />
      
      {/* Map Control Overlays */}
      <div className="absolute top-3 right-3 z-10 bg-card/90 backdrop-blur-md border border-border p-2 rounded-2xl flex items-center gap-2 shadow-sm text-xs font-bold text-foreground">
        <Navigation className="w-4 h-4 text-indigo-400" />
        <span>نقشه متمرکز: {centerLat.toFixed(4)}, {centerLng.toFixed(4)} (زوم {zoom})</span>
      </div>

      <div className="relative z-0 w-full h-full p-4">
        {children}
      </div>
    </div>
  );
}

export interface LocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
}

export function LocationPicker({
  initialLat = 35.7000,
  initialLng = 51.3500,
  onLocationSelect,
}: LocationPickerProps) {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [address, setAddress] = useState("تهران، خیابان انقلاب، میدان انقلاب، پلاک ۱۲");

  const handlePickCenter = () => {
    // Simulate user moving pin center
    const newLat = 35.7000 + (Math.random() - 0.5) * 0.01;
    const newLng = 51.3500 + (Math.random() - 0.5) * 0.01;
    setLat(newLat);
    setLng(newLng);
    const newAddr = `تهران، پلاک ${Math.floor(Math.random() * 100 + 1)}`;
    setAddress(newAddr);

    if (onLocationSelect) {
      onLocationSelect({ lat: newLat, lng: newLng, address: newAddr });
    }
  };

  return (
    <div className="space-y-3 w-full">
      <Map centerLat={lat} centerLng={lng} className="w-full h-64 sm:h-80 rounded-3xl">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center -mt-8 animate-bounce">
            <div className="bg-indigo-600 text-white p-2 rounded-full shadow-lg border-2 border-white">
              <MapPin className="w-6 h-6" />
            </div>
            <div className="w-3 h-1.5 bg-black/40 rounded-full blur-[1px] mt-1" />
          </div>
        </div>

        <button
          type="button"
          onClick={handlePickCenter}
          className="absolute bottom-3 right-3 z-10 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
        >
          <Navigation className="w-4 h-4" />
          انتخاب موقیعت دقیق روی نقشه
        </button>
      </Map>

      <div className="p-4 bg-muted/40 border border-border rounded-2xl flex items-center gap-3 text-xs">
        <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
        <div className="space-y-0.5 min-w-0">
          <span className="text-muted-foreground font-semibold block text-[10px]">نشانی دقیق استخراج شده (Reverse Geocode):</span>
          <p className="font-bold text-foreground truncate">{address}</p>
        </div>
      </div>
    </div>
  );
}

export function WorkerMarker({ name, rating }: { name: string; rating?: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
      <User className="w-3.5 h-3.5" />
      <span>{name}</span>
      {rating && <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded-md">★ {rating}</span>}
    </div>
  );
}

export function BranchMarker({ title }: { title: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/40 text-indigo-400 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
      <Building2 className="w-3.5 h-3.5" />
      <span>{title}</span>
    </div>
  );
}

export function ShiftMarker({ title, hourlyPayRials }: { title: string; hourlyPayRials?: bigint }) {
  return (
    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/40 text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
      <Briefcase className="w-3.5 h-3.5" />
      <span>{title}</span>
      {hourlyPayRials && (
        <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded-md">
          <CurrencyDisplay amountRials={hourlyPayRials} />
        </span>
      )}
    </div>
  );
}

export function MapCluster({ count, children }: { count: number; children?: React.ReactNode }) {
  return (
    <div className="relative inline-block">
      <div className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
        <Layers className="w-4 h-4" />
        <span>تراکم {count} نیرو</span>
      </div>
      {children}
    </div>
  );
}
