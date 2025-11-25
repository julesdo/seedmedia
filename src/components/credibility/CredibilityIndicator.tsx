"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { CredibilityGainBadge } from "./CredibilityGainBadge";
import { cn } from "@/lib/utils";

interface CredibilityIndicatorProps {
  points: number;
  action: string;
  className?: string;
  variant?: "default" | "compact";
}

export function CredibilityIndicator({ 
  points, 
  action, 
  className,
  variant = "default"
}: CredibilityIndicatorProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <SolarIcon icon="star-bold" className="h-3 w-3 text-primary" />
        <span>Gagnez</span>
        <CredibilityGainBadge points={points} size="sm" />
        <span>de crédibilité</span>
      </div>
    );
  }

  return (
    <Alert className={cn("bg-primary/5 border-primary/20", className)}>
      <AlertDescription className="flex items-center gap-2 text-xs">
        <span>{action}</span>
        <CredibilityGainBadge points={points} size="sm" />
        <span className="text-muted-foreground">de crédibilité</span>
      </AlertDescription>
    </Alert>
  );
}

