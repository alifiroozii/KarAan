"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  variant?: "dialog" | "bottom-sheet" | "sheet";
}

export function Dialog({ isOpen, onClose, title, children, variant = "dialog" }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={cn(
          "w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-w-lg relative",
          variant === "bottom-sheet" && "mt-auto rounded-b-none rounded-t-3xl border-b-0 max-w-md animate-in slide-in-from-bottom duration-300"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

export function BottomSheet(props: Omit<ModalProps, "variant">) {
  return <Dialog {...props} variant="bottom-sheet" />;
}
