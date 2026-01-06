"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BotAvatar } from "@/components/bots/BotAvatar";
import { useTranslations } from 'next-intl';

const categoryIcons: Record<string, string> = {
  detection: "radar-2-bold",
  generation: "magic-stick-3-bold",
  resolution: "check-circle-bold",
  tracking: "chart-2-bold",
  aggregation: "news-bold",
  other: "settings-bold",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-600 dark:text-green-400",
  paused: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  maintenance: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

export function BotsListClient() {
  const t = useTranslations('bots');
  const bots = useQuery(api.bots.getBots, { active: true });

  const categoryLabels: Record<string, string> = {
    detection: t('categories.detection'),
    generation: t('categories.generation'),
    resolution: t('categories.resolution'),
    tracking: t('categories.tracking'),
    aggregation: t('categories.aggregation'),
    other: t('categories.other'),
  };

  const statusLabels: Record<string, string> = {
    active: t('status.active'),
    paused: t('status.paused'),
    maintenance: t('status.maintenance'),
  };

  if (bots === undefined) {
    return (
      <div className="min-h-screen bg-background pb-16 lg:pb-0">
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-6 lg:py-6">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-6 lg:py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>

        {bots.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <SolarIcon icon="robot-bold" className="size-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('noBots')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {bots.map((bot) => (
              <Link key={bot._id} href={`/bots/${bot.slug}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <BotAvatar
                        name={bot.name}
                        seed={bot.slug}
                        avatar={bot.avatar}
                        color={bot.color}
                        category={bot.category}
                        size={48}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{bot.name}</CardTitle>
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", statusColors[bot.status])}
                          >
                            {statusLabels[bot.status]}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {categoryLabels[bot.category]}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {bot.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {bot.decisionsCreated > 0 && (
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="document-text-bold" className="size-3" />
                          <span>{bot.decisionsCreated} {t('stats.decisions')}</span>
                        </div>
                      )}
                      {bot.decisionsResolved > 0 && (
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="check-circle-bold" className="size-3" />
                          <span>{bot.decisionsResolved} {t('stats.resolved')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

