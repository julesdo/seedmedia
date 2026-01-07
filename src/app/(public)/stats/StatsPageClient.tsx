"use client";

import { DailyLoginWidget } from "@/components/widgets/DailyLoginWidget";
import { LeaderboardWidget } from "@/components/widgets/LeaderboardWidget";
import { WorldMapWidget } from "@/components/widgets/WorldMapWidget";
import { WordCloudWidget } from "@/components/widgets/WordCloudWidget";
import { TrendingRegionsWidget } from "@/components/widgets/TrendingRegionsWidget";
import { EventTypesWidget } from "@/components/widgets/EventTypesWidget";
import { RecentResolutionsWidget } from "@/components/widgets/RecentResolutionsWidget";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from 'next-intl';

export function StatsPageClient() {
  const t = useTranslations('navigation');
  const tCommon = useTranslations('common');

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <div className="max-w-[614px] mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{t('stats')}</h1>
          <p className="text-sm text-muted-foreground">
            {tCommon('all')} {t('stats')}
          </p>
        </div>

        {/* Widgets - Identiques à la right sidebar desktop */}
        <div className="space-y-6">
          {/* Daily Login - En haut pour visibilité */}
          <DailyLoginWidget />
          
          <Separator />
          
          {/* Leaderboard */}
          <LeaderboardWidget />
          
          <Separator />
          
          {/* Carte du monde */}
          <WorldMapWidget />
          
          <Separator />
          
          {/* Nuage de mots */}
          <WordCloudWidget />
          
          <Separator />
          
          {/* Zones actives */}
          <TrendingRegionsWidget />
          
          <Separator />
          
          {/* Tendances du jour */}
          <EventTypesWidget />
          
          <Separator />
          
          {/* Résolutions récentes */}
          <RecentResolutionsWidget />
        </div>
      </div>
    </div>
  );
}

