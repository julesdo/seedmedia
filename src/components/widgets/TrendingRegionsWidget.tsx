"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTranslations } from 'next-intl';

/**
 * Widget : Régions les plus actives
 */
export function TrendingRegionsWidget() {
  const t = useTranslations('widgets.trendingRegions');
  const decisions = useQuery(api.decisions.getDecisions, { limit: 50 });

  if (!decisions) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  // Compter les événements par décideur (pays/institutions)
  const regionCounts = new Map<string, number>();
  decisions.forEach((decision) => {
    const key = decision.decider;
    regionCounts.set(key, (regionCounts.get(key) || 0) + 1);
  });

  // Trier et prendre le top 5
  const topRegions = Array.from(regionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topRegions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <SolarIcon icon="map-point-bold" className="size-4 text-muted-foreground" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {t('title')}
        </h4>
      </div>
      <div className="space-y-2">
        {topRegions.map(([region, count]) => (
          <div
            key={region}
            className="flex items-center justify-between text-sm hover:opacity-70 transition-opacity"
          >
            <span className="text-foreground truncate flex-1">{region}</span>
            <span className="text-muted-foreground text-xs ml-2 shrink-0">
              {count} {count === 1 ? t('event') : t('events')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

