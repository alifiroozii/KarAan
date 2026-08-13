import React from "react";
import { Briefcase, MapPin, Clock } from "lucide-react";
import { formatMoneyRials } from "@/lib/money";

export interface ShiftCardProps {
  title: string;
  locationName: string;
  hourlyPayRials: bigint;
  status: string;
}

export function ShiftCard({ title, locationName, hourlyPayRials, status }: ShiftCardProps) {
  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 shadow-xl">
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
          {status}
        </span>
        <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
          <span>{formatMoneyRials(hourlyPayRials)} / ساعت</span>
        </div>
      </div>
      <h3 className="text-base font-bold text-slate-100">{title}</h3>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <MapPin className="w-4 h-4 text-indigo-400" />
        <span>{locationName}</span>
      </div>
    </div>
  );
}
