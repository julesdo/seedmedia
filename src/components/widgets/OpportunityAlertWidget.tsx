"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

/**
 * Widget Opportunity Alert - FOMO + Scarcity
 * Affiche les opportunités qui se ferment bientôt
 */
export function OpportunityAlertWidget() {
  const decisions = useQuery(api.decisions.getDecisions, {
    limit: 20,
    status: "tracking",
  });

  // Filtrer les décisions qui se ferment bientôt
  // Utiliser la date de la décision comme proxy pour les opportunités qui se ferment
  const closingSoon = useMemo(() => {
    if (!decisions || decisions.length === 0) return [];
    
    const now = Date.now();
    const oneDayFromNow = now + 24 * 60 * 60 * 1000;
    const threeDaysFromNow = now + 3 * 24 * 60 * 60 * 1000;
    
    // Prendre les décisions avec une date proche (dans les 3 prochains jours)
    // et qui ont un statut "tracking" (en cours)
    return decisions
      .filter(decision => {
        // Utiliser la date de la décision comme date de résolution approximative
        const decisionDate = decision.date;
        return decisionDate > now && decisionDate <= threeDaysFromNow;
      })
      .sort((a, b) => a.date - b.date) // Trier par date croissante (les plus proches en premier)
      .slice(0, 3);
  }, [decisions]);

  if (!closingSoon || closingSoon.length === 0) {
    return null;
  }

  const getTimeRemaining = (decisionDate: number) => {
    const now = Date.now();
    const diff = decisionDate - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}j ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <SolarIcon icon="clock-circle-bold" className="size-4 text-orange-500" />
          Se ferment bientôt
        </h3>
        <span className="text-xs text-orange-500 font-medium">⚠️</span>
      </div>
      
      <div className="space-y-2">
        {closingSoon.map((decision) => (
          <Link
            key={decision._id}
            href={`/${decision.slug}`}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group border border-orange-500/20 bg-orange-500/5"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {decision.title}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1 text-[10px] text-orange-500 font-medium">
                  <SolarIcon icon="clock-circle-bold" className="size-3" />
                  {getTimeRemaining(decision.date)}
                </div>
              </div>
            </div>
            <SolarIcon 
              icon="arrow-right-bold" 
              className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" 
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

