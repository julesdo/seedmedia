"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BotAvatar } from "@/components/bots/BotAvatar";
import { BotMetricsChart } from "@/components/bots/BotMetricsChart";
import { BotLogs } from "@/components/bots/BotLogs";
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

interface BotDetailClientProps {
  slug: string;
}

export function BotDetailClient({ slug }: BotDetailClientProps) {
  const t = useTranslations('bots');
  const bot = useQuery(api.bots.getBotBySlug, { slug });

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

  if (bot === undefined) {
    return (
      <div className="min-h-screen bg-background pb-16 lg:pb-0">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="size-16 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (bot === null) {
    notFound();
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return t('detail.never');
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/bots">
          <Button variant="ghost" size="sm" className="mb-6">
            <SolarIcon icon="arrow-left-bold" className="size-4 mr-2" />
            {t('back')}
          </Button>
        </Link>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              <BotAvatar
                name={bot.name}
                seed={bot.slug}
                avatar={bot.avatar}
                color={bot.color}
                category={bot.category}
                size={64}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl">{bot.name}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", statusColors[bot.status])}
                  >
                    {statusLabels[bot.status]}
                  </Badge>
                </div>
                <CardDescription className="text-base mb-2">
                  {categoryLabels[bot.category]}
                </CardDescription>
                {bot.bio && (
                  <p className="text-sm text-muted-foreground">{bot.bio}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{bot.description}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SolarIcon icon="document-text-bold" className="size-5" />
                {t('stats.decisionsCreated')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{bot.decisionsCreated}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('descriptions.decisionsCreated')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SolarIcon icon="check-circle-bold" className="size-5" />
                {t('stats.decisionsResolved')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{bot.decisionsResolved}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('descriptions.decisionsResolved')}
              </p>
            </CardContent>
          </Card>

          {bot.newsAggregated > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <SolarIcon icon="news-bold" className="size-5" />
                  {t('stats.newsAggregated')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{bot.newsAggregated}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('descriptions.newsAggregated')}
                </p>
              </CardContent>
            </Card>
          )}

          {bot.indicatorsTracked > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <SolarIcon icon="chart-2-bold" className="size-5" />
                  {t('stats.indicatorsTracked')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{bot.indicatorsTracked}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('descriptions.indicatorsTracked')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Graphiques temporels */}
        <div className="mb-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">{t('detail.temporalMetrics')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {bot.decisionsCreated > 0 && (
              <BotMetricsChart
                botId={bot._id}
                metricType="decisionsCreated"
                title={t('metrics.decisionsCreated')}
                color={bot.color || "#3b82f6"}
              />
            )}
            {bot.decisionsResolved > 0 && (
              <BotMetricsChart
                botId={bot._id}
                metricType="decisionsResolved"
                title={t('metrics.decisionsResolved')}
                color={bot.color || "#10b981"}
              />
            )}
            {bot.newsAggregated > 0 && (
              <BotMetricsChart
                botId={bot._id}
                metricType="newsAggregated"
                title={t('metrics.newsAggregated')}
                color={bot.color || "#ef4444"}
              />
            )}
            {bot.indicatorsTracked > 0 && (
              <BotMetricsChart
                botId={bot._id}
                metricType="indicatorsTracked"
                title={t('metrics.indicatorsTracked')}
                color={bot.color || "#f59e0b"}
              />
            )}
          </div>
        </div>

        {/* Logs d'activité */}
        <div className="mb-6">
          <BotLogs botId={bot._id} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('detail.technicalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.function')}</span>
              <code className="text-foreground font-mono text-xs">
                {bot.functionName}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.category')}</span>
              <span className="text-foreground">{categoryLabels[bot.category]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.lastActivity')}</span>
              <span className="text-foreground">{formatDate(bot.lastActivityAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('detail.createdAt')}</span>
              <span className="text-foreground">{formatDate(bot.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

