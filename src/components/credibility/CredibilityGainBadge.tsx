"use client";

import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";

interface CredibilityGainBadgeProps {
  points: number;
  className?: string;
  size?: "sm" | "md";
}

export function CredibilityGainBadge({ points, className, size = "sm" }: CredibilityGainBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 bg-green-500/10 dark:bg-green-500/20",
        "text-green-600 dark:text-green-400 border-green-500/30",
        "font-semibold",
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1",
        className
      )}
    >
      <SolarIcon icon="star-bold" className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
      <span>+{points.toFixed(0)}</span>
    </Badge>
  );
}

