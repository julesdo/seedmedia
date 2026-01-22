"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useMemo } from "react";

/**
 * Widget Your Performance - Gamification + Illusory Superiority
 * Affiche les stats personnelles avec comparaison
 */
export function YourPerformanceWidget() {
  const { user, isAuthenticated } = useUser();
  // getUserPortfolio utilise automatiquement l'utilisateur authentifié
  // et n'accepte que decisionId (optionnel) en paramètre
  const portfolio = useQuery(
    api.trading.getUserPortfolio,
    isAuthenticated ? {} : "skip"
  );

  // Calculer les stats
  const stats = useMemo(() => {
    if (!portfolio || portfolio.length === 0) {
      return {
        totalInvested: 0,
        totalValue: 0,
        totalProfit: 0,
        totalProfitPercent: 0,
        activePositions: 0,
      };
    }

    const totalInvested = portfolio.reduce((sum, pos) => sum + (pos.totalInvested || 0), 0);
    const totalValue = portfolio.reduce((sum, pos) => sum + (pos.estimatedValue || 0), 0);
    const totalProfit = totalValue - totalInvested;
    const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    const activePositions = portfolio.length;

    return {
      totalInvested,
      totalValue,
      totalProfit,
      totalProfitPercent,
      activePositions,
    };
  }, [portfolio]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <SolarIcon icon="chart-2-bold" className="size-4 text-primary" />
          Vos performances
        </h3>
        <Link 
          href="/portfolio"
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Voir tout
        </Link>
      </div>
      
      <div className="space-y-3">
        {/* Stats principales */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-muted/30">
            <div className="text-[10px] text-muted-foreground mb-1">Positions</div>
            <div className="text-sm font-bold text-foreground">{stats.activePositions}</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <div className="text-[10px] text-muted-foreground mb-1">Gains</div>
            <div className={cn(
              "text-sm font-bold",
              stats.totalProfit > 0 ? "text-green-500" : 
              stats.totalProfit < 0 ? "text-red-500" : 
              "text-foreground"
            )}>
              {stats.totalProfit > 0 ? "+" : ""}
              {stats.totalProfitPercent.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Meilleure position */}
        {portfolio && portfolio.length > 0 && (() => {
          const bestPosition = portfolio.reduce((best, current) => {
            const currentProfit = current.profitPercentage || 0;
            const bestProfit = best.profitPercentage || 0;
            return currentProfit > bestProfit ? current : best;
          }, portfolio[0]);

          if (!bestPosition || !bestPosition.decision) return null;

          return (
            <Link
              href={`/${bestPosition.decision.slug}`}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-muted-foreground mb-0.5">Meilleure position</div>
                <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {bestPosition.decision.title.length > 30
                    ? `${bestPosition.decision.title.substring(0, 30)}...`
                    : bestPosition.decision.title}
                </div>
                <div className={cn(
                  "text-[10px] font-medium mt-0.5",
                  (bestPosition.profitPercentage || 0) > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {(bestPosition.profitPercentage || 0) > 0 ? "+" : ""}
                  {(bestPosition.profitPercentage || 0).toFixed(1)}%
                </div>
              </div>
              <SolarIcon 
                icon="arrow-right-bold" 
                className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" 
              />
            </Link>
          );
        })()}
      </div>
    </div>
  );
}

