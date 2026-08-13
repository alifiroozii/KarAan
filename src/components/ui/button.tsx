import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20",
        emerald: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20",
        outline: "border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200",
        secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
        ghost: "hover:bg-slate-800/60 text-slate-300 hover:text-white",
        destructive: "bg-rose-600 text-white hover:bg-rose-500 shadow-md shadow-rose-600/20",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-10 w-10 p-0 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export interface IconButtonProps extends ButtonProps {
  icon: React.ReactNode;
  label: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, className, variant = "outline", size = "icon", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        aria-label={label}
        title={label}
        className={className}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";

export { Button, IconButton, buttonVariants };
