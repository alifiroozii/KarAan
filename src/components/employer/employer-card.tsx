import React from "react";
import { Building2 } from "lucide-react";

export interface EmployerCardProps {
  companyName: string;
  address?: string;
}

export function EmployerCard({ companyName, address }: EmployerCardProps) {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
        <Building2 className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-100">{companyName}</h4>
        {address && <span className="text-xs text-slate-400">{address}</span>}
      </div>
    </div>
  );
}
