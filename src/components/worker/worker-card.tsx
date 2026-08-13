import React from "react";
import { User, Star } from "lucide-react";

export interface WorkerCardProps {
  fullName: string;
  reliabilityScore: number;
  completedShifts: number;
}

export function WorkerCard({ fullName, reliabilityScore, completedShifts }: WorkerCardProps) {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-100">{fullName}</h4>
          <span className="text-xs text-slate-400">تعداد شیفت‌های موفق: {completedShifts}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
        <Star className="w-3.5 h-3.5 fill-emerald-400" />
        <span>{reliabilityScore}</span>
      </div>
    </div>
  );
}
