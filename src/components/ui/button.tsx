import React from "react";
import { cn } from "@/lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-gold-500 text-ink-950 hover:bg-gold-400 active:bg-gold-600 font-semibold shadow-sm",
    secondary:
      "bg-ink-800 text-ivory-100 hover:bg-ink-700 active:bg-ink-750 border border-ink-700",
    outline:
      "border border-gold-500/40 text-gold-300 hover:bg-gold-500/10 active:bg-gold-500/20",
    ghost:
      "text-ivory-300 hover:text-ivory-100 hover:bg-ink-800/60 active:bg-ink-800",
    gold:
      "bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 font-semibold hover:brightness-110 active:brightness-95 shadow-md",
  };

  const sizes = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-6 py-3 gap-2.5",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
