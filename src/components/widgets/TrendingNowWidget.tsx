"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

/**
 * Widget Trending Now - FOMO
 * Affiche ce qui est en train de monter maintenant (volume récent)
 */
export function TrendingNowWidget() {
  const decisions = useQuery(api.decisions.getDecisions, {
    limit: 20,
    status: "tracking",
  });

  // Simuler le trending basé sur les décisions récentes
  // En production, on pourrait utiliser un système de volume récent
  const trending = useMemo(() => {
    if (!decisions || decisions.length === 0) return [];
    
    // Prendre les 3 premières décisions (les plus récentes/populaires)
    return decisions.slice(0, 3);
  }, [decisions]);

  // Afficher même si vide pour le moment (skeleton)
  if (decisions === undefined) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <SolarIcon icon="fire-bold" className="size-4 text-orange-500" />
            Trending maintenant
          </h3>
        </div>
        <div className="text-xs text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!trending || trending.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <SolarIcon icon="fire-bold" className="size-4 text-orange-500" />
          Trending maintenant
        </h3>
        <span className="text-xs text-orange-500 font-medium animate-pulse">🔥</span>
      </div>
      
      <div className="space-y-2">
        {trending.map((decision, index) => (
          <Link
            key={decision._id}
            href={`/${decision.slug}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="relative size-8 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-orange-500/20">
              {decision.imageUrl ? (
                <img
                  src={decision.imageUrl}
                  alt={decision.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-orange-500/20 to-orange-500/5">
                  <SolarIcon
                    icon="fire-bold"
                    className="size-4 text-orange-500"
                  />
                </div>
              )}
              {index === 0 && (
                <div className="absolute -top-1 -right-1 size-3 rounded-full bg-orange-500 animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {decision.title.length > 35
                  ? `${decision.title.substring(0, 35)}...`
                  : decision.title}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {decision.decider}
              </div>
            </div>
            <SolarIcon 
              icon="arrow-right-bold" 
              className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" 
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

