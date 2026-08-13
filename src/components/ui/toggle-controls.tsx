"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Checkbox({ checked, onChange, label, className }: CheckboxProps) {
  return (
    <label className={cn("inline-flex items-center gap-2.5 cursor-pointer select-none", className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "h-5 w-5 rounded-lg border flex items-center justify-center transition-all",
          checked
            ? "bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-600/20"
            : "bg-slate-950 border-slate-800 text-transparent hover:border-slate-700"
        )}
      >
        <Check className="w-3.5 h-3.5 stroke-[3]" />
      </button>
      {label && <span className="text-xs font-medium text-slate-200">{label}</span>}
    </label>
  );
}

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Switch({ checked, onChange, label, className }: SwitchProps) {
  return (
    <label className={cn("inline-flex items-center gap-3 cursor-pointer select-none", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "h-6 w-11 rounded-full p-0.5 transition-colors relative",
          checked ? "bg-indigo-600" : "bg-slate-800"
        )}
      >
        <div
          className={cn(
            "h-5 w-5 rounded-full bg-white transition-transform shadow-md",
            checked ? "-translate-x-5" : "translate-x-0"
          )}
        />
      </button>
      {label && <span className="text-xs font-medium text-slate-200">{label}</span>}
    </label>
  );
}
