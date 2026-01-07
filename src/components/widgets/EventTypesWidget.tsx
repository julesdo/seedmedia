"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

const typeColors: Record<string, string> = {
  crisis: "bg-red-500/10 text-red-600 dark:text-red-400",
  disaster: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  conflict: "bg-red-600/10 text-red-700 dark:text-red-500",
  discovery: "bg-green-500/10 text-green-600 dark:text-green-400",
  election: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  economic_event: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  law: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  sanction: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  tax: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  agreement: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  policy: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  regulation: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  other: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
};

/**
 * Widget : Types d'événements du jour
 */
export function EventTypesWidget() {
  const t = useTranslations('widgets.eventTypes');
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  const decisions = useQuery(api.decisions.getDecisions, { limit: 100 });

  if (!decisions) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  // Filtrer les événements des dernières 24h
  const recentDecisions = decisions.filter((d) => d.date >= oneDayAgo);

  // Compter par type
  const typeCounts = new Map<string, number>();
  recentDecisions.forEach((decision) => {
    const type = decision.type;
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  });

  // Trier et prendre le top 5
  const topTypes = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (topTypes.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SolarIcon icon="chart-2-bold" className="size-4 text-muted-foreground" />
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t('title')}
          </h4>
        </div>
        <p className="text-xs text-muted-foreground">{t('noRecentEvents')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <SolarIcon icon="chart-2-bold" className="size-4 text-muted-foreground" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {t('title')}
        </h4>
      </div>
      <div className="flex flex-wrap gap-2">
        {topTypes.map(([type, count]) => (
          <Badge
            key={type}
            variant="outline"
            className={cn("text-xs", typeColors[type] || typeColors.other)}
          >
            {t(`types.${type}`)} ({count})
          </Badge>
        ))}
      </div>
    </div>
  );
}

