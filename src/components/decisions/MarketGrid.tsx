"use client";

import { MarketCard } from "./MarketCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MarketGridProps {
  decisions: any[];
  isLoading?: boolean;
  className?: string;
  variant?: "grid" | "list";
}

/**
 * Grille responsive de Market Cards
 * Desktop : 3 colonnes | Tablet : 2 colonnes | Mobile : 1 colonne
 */
export function MarketGrid({
  decisions,
  isLoading = false,
  className,
  variant = "grid",
}: MarketGridProps) {
  if (isLoading) {
    return (
      <div className={cn(
        "grid gap-4",
        variant === "grid"
          ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          : "grid-cols-1",
        className
      )}>
        {Array.from({ length: 6 }).map((_, i) => (
          <MarketCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!decisions || decisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Aucun marché disponible pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "grid gap-4 w-full max-w-full",
      variant === "grid"
        ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
        : "grid-cols-1",
      className
    )}>
      {decisions.map((decision) => (
        <MarketCard
          key={decision._id}
          decision={decision}
          variant={variant}
        />
      ))}
    </div>
  );
}

function MarketCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden bg-background border border-border/50 rounded-lg">
      <Skeleton className="w-full aspect-[16/9]" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

