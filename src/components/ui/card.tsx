import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border border-slate-800 bg-slate-900 text-slate-100 shadow-xl",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export { Card };
