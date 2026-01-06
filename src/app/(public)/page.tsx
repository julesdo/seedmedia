"use client";

import { Suspense } from "react";
import { DecisionList } from "@/components/decisions/DecisionList";
import { DecisionStories } from "@/components/decisions/DecisionStories";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useTranslations } from 'next-intl';

function HomePageContent() {
  const t = useTranslations('decisions');
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header - Masqué en mobile */}
      <div className="hidden lg:sticky lg:top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="max-w-[614px] mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <SolarIcon icon="document-text-bold" className="size-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Stories horizontales - Style Instagram */}
      <DecisionStories />

      {/* Feed vertical - Style Instagram */}
      <div className="max-w-[614px] mx-auto">
        <DecisionList limit={20} />
      </div>

      {/* Espace pour la bottom nav mobile */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 max-w-4xl">
            <div className="space-y-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 max-w-7xl">
            <Skeleton className="h-10 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-96 w-full" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
