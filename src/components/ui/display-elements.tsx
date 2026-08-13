import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all",
  {
    variants: {
      variant: {
        default: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300",
        indigo: "bg-indigo-500/10 border-indigo-500/30 text-indigo-300",
        emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
        amber: "bg-amber-500/10 border-amber-500/30 text-amber-300",
        rose: "bg-rose-500/10 border-rose-500/30 text-rose-300",
        secondary: "bg-slate-800 border-slate-700 text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function Avatar({ name, src }: { name: string; src?: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-600/20 overflow-hidden">
      {src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : initials}
    </div>
  );
}

export interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex items-center gap-2 bg-slate-950 p-1.5 border border-slate-800 rounded-2xl">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all text-center",
            activeTab === tab.id
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
