"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Widget Top Performers - Social Proof + FOMO
 * Affiche les meilleures prédictions du jour avec gains élevés
 */
export function TopPerformersWidget() {
  // Récupérer les décisions avec le plus de volume aujourd'hui
  const topDecisions = useQuery(api.decisions.getHotDecisions, { limit: 3 });

  if (!topDecisions || topDecisions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <SolarIcon icon="cup-star" className="size-4 text-primary" />
          Top du jour
        </h3>
        <span className="text-xs text-muted-foreground">🔥</span>
      </div>
      
      <div className="space-y-2">
        {topDecisions.slice(0, 3).map((decision, index) => (
          <Link
            key={decision._id}
            href={`/${decision.slug}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className={cn(
              "flex items-center justify-center size-8 rounded-full text-xs font-bold shrink-0",
              index === 0 && "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white",
              index === 1 && "bg-gradient-to-br from-gray-300 to-gray-500 text-white",
              index === 2 && "bg-gradient-to-br from-amber-600 to-amber-800 text-white",
              index > 2 && "bg-muted text-muted-foreground"
            )}>
              {index + 1}
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

