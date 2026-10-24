import React from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "gold" | "secondary" | "outline" | "danger" | "success" | "warning";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tracking-wide";

  const variants = {
    default: "bg-ink-800 text-ivory-300 border border-ink-700",
    gold: "bg-gold-500/15 text-gold-300 border border-gold-500/30",
    secondary: "bg-ink-700/60 text-ivory-400",
    outline: "border border-ink-600 text-ivory-300",
    danger: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
    success: "bg-sage-400/15 text-sage-400 border border-sage-400/30",
    warning: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  };

  return (
    <span className={cn(base, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}
