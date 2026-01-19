"use client";

import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";

interface SeedDisplayProps {
  amount: number;
  className?: string;
  iconSize?: string;
  showLabel?: boolean;
  variant?: "default" | "compact" | "inline";
}

/**
 * Composant réutilisable pour afficher les Seeds avec l'icône
 */
export function SeedDisplay({ 
  amount, 
  className,
  iconSize = "size-3.5",
  showLabel = false,
  variant = "default"
}: SeedDisplayProps) {
  if (variant === "compact") {
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        <SolarIcon icon="leaf-bold" className={cn(iconSize, "text-primary")} />
        <span className="font-semibold">{amount.toFixed(2)}</span>
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <SolarIcon icon="leaf-bold" className={cn(iconSize, "text-primary shrink-0")} />
        <span className="inherit">{amount.toFixed(2)}</span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <SolarIcon icon="leaf-bold" className={cn(iconSize, "text-primary")} />
      <span className="font-semibold">{amount.toFixed(2)}</span>
      {showLabel && <span className="text-muted-foreground text-xs">Seeds</span>}
    </span>
  );
}

