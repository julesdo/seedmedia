"use client";

import { Suspense } from "react";
import { DecisionCard } from "@/components/decisions/DecisionCard";
import { DecisionStories } from "@/components/decisions/DecisionStories";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Card } from "@/components/ui/card";
import { useTranslations } from 'next-intl';

function DecisionCardSkeleton() {
  return (
    <article className="flex flex-col overflow-hidden bg-background">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="p-6 md:p-8 space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-4/5" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <div className="flex gap-3 pt-4 border-t">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>
    </article>
  );
}

function TrendingContent() {
  const t = useTranslations('trending');
  // Récupérer les décisions les plus populaires (avec beaucoup d'anticipations)
  const hotDecisions = useQuery(api.decisions.getHotDecisions, { 
    limit: 20,
    minAnticipations: 3 // Minimum 3 anticipations pour être "hot"
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Masqué en mobile */}
      <div className="hidden lg:sticky lg:top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="max-w-[614px] mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <SolarIcon icon="fire-bold" className="size-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {t('badge')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Stories horizontales - Style Instagram (seulement sur mobile) */}
      <div className="lg:hidden">
        <DecisionStories />
      </div>

      {/* Liste des décisions tendances - Mode feed */}
      <div className="max-w-[614px] mx-auto">
        {hotDecisions === undefined ? (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <DecisionCardSkeleton key={i} />
            ))}
          </div>
        ) : hotDecisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <SolarIcon icon="fire-bold" className="size-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('empty.description')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {hotDecisions.map((decision) => (
              <DecisionCard key={decision._id} decision={decision as any} />
            ))}
          </div>
        )}
      </div>

      {/* Espace pour la bottom nav mobile */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}

export default function TrendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="max-w-[614px] mx-auto px-4 py-6">
            <Skeleton className="h-16 w-full mb-6" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-96 w-full" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <TrendingContent />
    </Suspense>
  );
}

