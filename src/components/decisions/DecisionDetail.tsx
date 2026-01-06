"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SaveButton } from "./SaveButton";
import { EventBadge } from "./EventBadge";
import { QuizSimple } from "./QuizSimple";
import { useTranslations } from 'next-intl';

interface DecisionDetailProps {
  decisionId: Id<"decisions">;
  className?: string;
}

const statusColors: Record<string, string> = {
  announced: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  tracking: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  resolved: "bg-green-500/10 text-green-600 dark:text-green-400",
};

export function DecisionDetail({
  decisionId,
  className,
}: DecisionDetailProps) {
  const t = useTranslations('decisions');
  const decision = useQuery(api.decisions.getDecisionById, {
    decisionId,
  });

  const typeLabels: Record<string, string> = {
    law: t('types.law'),
    sanction: t('types.sanction'),
    tax: t('types.tax'),
    agreement: t('types.agreement'),
    policy: t('types.policy'),
    regulation: t('types.regulation'),
    crisis: t('types.crisis'),
    disaster: t('types.disaster'),
    conflict: t('types.conflict'),
    discovery: t('types.discovery'),
    election: t('types.election'),
    economic_event: t('types.economic_event'),
    other: t('types.other'),
  };

  const statusLabels: Record<string, string> = {
    announced: t('announced'),
    tracking: t('tracking'),
    resolved: t('resolved'),
  };

  if (decision === undefined) {
    return (
      <div className={className}>
        <Skeleton className="aspect-video w-full mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (decision === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <SolarIcon name="document" className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('detail.notFound')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('detail.notFoundDescription')}
        </p>
        <Link href="/">
          <Button variant="outline">{t('detail.backToDecisions')}</Button>
        </Link>
      </div>
    );
  }

  const decisionDate = new Date(decision.date);
  const timeAgo = formatDistanceToNow(decisionDate, { addSuffix: true, locale: fr });
  const formattedDate = format(decisionDate, "d MMMM yyyy", { locale: fr });

  return (
    <div className={cn("space-y-6 pb-24", className)}>
      {/* Image */}
      {decision.imageUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Image
            src={decision.imageUrl}
            alt={decision.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      )}

      {/* Header simplifié - Mobile first */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <EventBadge
                emoji={decision.emoji}
                heat={decision.heat}
                sentiment={decision.sentiment}
                badgeColor={decision.badgeColor}
                size="md"
              />
              <Badge variant="secondary" className="text-xs">{typeLabels[decision.type]}</Badge>
              <Badge className={cn("text-xs", statusColors[decision.status])}>
                {statusLabels[decision.status]}
              </Badge>
              {decision.impactedDomains.slice(0, 3).map((domain) => (
                <Badge key={domain} variant="outline" className="text-xs">
                  {domain}
                </Badge>
              ))}
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight">{decision.title}</h1>
            {decision.description && (
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {decision.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <span>{decision.decider}</span>
              <span className="hidden sm:inline">•</span>
              <span>{formattedDate}</span>
              {decision.sourceUrl && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <Link
                    href={decision.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t('detail.source')}
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex sm:block">
            <SaveButton decisionId={decision._id} className="w-full sm:w-auto" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Quizz simple avec stats */}
      {decision.status !== "resolved" && (
        <QuizSimple
          decisionId={decision._id}
          question={decision.question}
          answer1={decision.answer1}
          answer2={decision.answer2}
          answer3={decision.answer3}
          status={decision.status}
        />
      )}


      {/* Actualités avec images */}
      {decision.newsItems && decision.newsItems.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">{t('detail.relatedNews')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {decision.newsItems.map((news) => (
              <Link
                key={news._id}
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block overflow-hidden rounded-lg border bg-card hover:border-primary/50 transition-all"
              >
                {news.imageUrl && (
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={news.imageUrl}
                      alt={news.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        // Cacher l'image si elle ne charge pas
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <p className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {news.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{news.source}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(news.publishedAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                  {news.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {news.summary}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Résolution */}
      {decision.resolution && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <SolarIcon name="check-circle" className="size-5 text-green-600" />
              {t('detail.resolution')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">{t('detail.result')}</p>
              <Badge className={cn(statusColors[decision.resolution.issue])}>
                {statusLabels[decision.resolution.issue]}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">{t('detail.confidence')}</p>
              <p className="text-sm text-muted-foreground">
                {decision.resolution.confidence}%
              </p>
            </div>
            {decision.resolution.variations && decision.resolution.variations.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">{t('detail.indicatorVariations')}</p>
                <div className="space-y-2">
                  {decision.resolution.variations.map((variation, index) => (
                    <div
                      key={index}
                      className="p-2 rounded border bg-background text-xs"
                    >
                      <p className="font-medium">{variation.variationPercent > 0 ? "+" : ""}
                        {variation.variationPercent.toFixed(2)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}

