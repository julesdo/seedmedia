"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "next-view-transitions";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { TrendingRegionsWidget } from "@/components/widgets/TrendingRegionsWidget";
import { EventTypesWidget } from "@/components/widgets/EventTypesWidget";
import { RecentResolutionsWidget } from "@/components/widgets/RecentResolutionsWidget";
import { WorldMapWidget } from "@/components/widgets/WorldMapWidget";
import { WordCloudWidget } from "@/components/widgets/WordCloudWidget";
import { Separator } from "@/components/ui/separator";

/**
 * Sidebar droite - Style Instagram Desktop (Suggestions)
 */
export function DesktopRightSidebar() {
  // Récupérer les décisions "hot" pour les suggestions
  const hotDecisions = useQuery(api.decisions.getHotDecisions, { limit: 5 });

  return (
    <aside className="hidden xl:flex flex-col w-[319px] border-l border-border/50 bg-background fixed right-0 top-0 bottom-0 overflow-y-auto">
      <div className="flex flex-col h-full px-6 py-6">

        {/* Suggestions de décisions */}
        {hotDecisions && hotDecisions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Décisions importantes
              </h3>
              <Button variant="ghost" size="sm" className="text-xs h-auto p-0">
                Voir tout
              </Button>
            </div>
            
            <div className="space-y-4">
              {hotDecisions.slice(0, 5).map((decision) => (
                <Link
                  key={decision._id}
                  href={`/${decision.slug}`}
                  className="flex items-center gap-3 hover:opacity-70 transition-opacity group"
                >
                  <div className="relative size-11 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-primary/20">
                    {decision.imageUrl ? (
                      <img
                        src={decision.imageUrl}
                        alt={decision.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/20 to-primary/5">
                        <SolarIcon
                          icon="document-text-bold"
                          className="size-5 text-primary/60"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {decision.decider}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {decision.title.length > 40
                        ? `${decision.title.substring(0, 40)}...`
                        : decision.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Widgets pertinents */}
        <div className="space-y-6">
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
    </aside>
  );
}

