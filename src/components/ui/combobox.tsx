"use client";

import * as React from "react";
import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  label?: string;
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Combobox({ label, options, value, onChange, placeholder = "انتخاب کنید..." }: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full space-y-1.5 text-right relative">
      {label && <label className="block text-xs font-medium text-slate-300">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronsUpDown className="w-4 h-4 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-2xl space-y-2">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pr-8 text-xs text-slate-100 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredOptions.length === 0 ? (
              <p className="p-2 text-center text-xs text-slate-500">موردی یافت نشد</p>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors",
                    value === opt.value
                      ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                      : "hover:bg-slate-800 text-slate-200"
                  )}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
