import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5 text-right">
        {label && (
          <label className="block text-xs font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
              icon && "pr-10",
              error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500",
              className
            )}
            ref={ref}
            {...props}
          />
          {icon && (
            <div className="absolute right-3 top-3 text-slate-500 pointer-events-none">
              {icon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] font-medium text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
