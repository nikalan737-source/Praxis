import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "destructive" |
            "strong" | "emerging" | "theoretical" | "unsupported";
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default:      "bg-secondary text-secondary-foreground border-border",
  secondary:    "bg-secondary text-secondary-foreground border-border",
  outline:      "border border-border text-foreground bg-transparent",
  destructive:  "bg-destructive/15 text-destructive border-destructive/30",
  // Tier badges: all neutral — color coding is on the dot only
  strong:       "bg-secondary text-secondary-foreground border-border",
  emerging:     "bg-secondary text-secondary-foreground border-border",
  theoretical:  "bg-secondary text-secondary-foreground border-border",
  unsupported:  "bg-secondary text-secondary-foreground border-border",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors font-mono",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
