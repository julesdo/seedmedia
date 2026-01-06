"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

/**
 * Widget : Dernières résolutions
 */
export function RecentResolutionsWidget() {
  const resolutions = useQuery(api.resolutions.getAllResolutions, { limit: 5 });

  if (!resolutions) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (resolutions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <SolarIcon icon="check-circle-bold" className="size-4 text-muted-foreground" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Résolutions récentes
        </h4>
      </div>
      <div className="space-y-3">
        {resolutions.slice(0, 3).map((resolution) => {
          if (!resolution.decision) return null;
          
          const isCorrect = resolution.result === resolution.issue;
          
          return (
            <Link
              key={resolution._id}
              href={`/${resolution.decision.slug}`}
              className="block space-y-1 hover:opacity-70 transition-opacity"
            >
              <div className="text-xs font-medium text-foreground line-clamp-2">
                {resolution.decision.title}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={isCorrect ? "default" : "destructive"}
                  className={cn(
                    "text-[10px] h-5",
                    isCorrect && "bg-green-500/10 text-green-600 dark:text-green-400"
                  )}
                >
                  {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(resolution.resolvedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

