"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { cn } from "@/lib/utils";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";
import { Skeleton } from "@/components/ui/skeleton";

interface TopHoldersTabProps {
  decisionId: Id<"decisions">;
}

export function TopHoldersTab({ decisionId }: TopHoldersTabProps) {
  // Récupérer les anticipations pour cette décision, triées par nombre d'actions
  const anticipations = useQuery(api.trading.getDecisionAnticipations, { decisionId, limit: 20 });
  const tradingPools = useQuery(api.trading.getTradingPools, { decisionId });

  if (anticipations === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!anticipations || anticipations.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Aucun détenteur pour le moment
      </div>
    );
  }

  // Trier par nombre d'actions décroissant
  const sorted = [...anticipations].sort((a, b) => b.sharesOwned - a.sharesOwned);

  return (
    <div className="space-y-2">
      {sorted.map((anticipation, index) => (
        <div
          key={anticipation._id}
          className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-background/40 hover:bg-background/60 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xs font-mono text-muted-foreground w-6">
              #{index + 1}
            </span>
            <Avatar className="size-8 flex-shrink-0">
              <AvatarImage src={anticipation.user?.image} alt={anticipation.user?.name || ""} />
              <AvatarFallback className="text-xs">
                {anticipation.user?.name?.[0]?.toUpperCase() || anticipation.user?.email?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {anticipation.user?.name || anticipation.user?.email || "Utilisateur"}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={cn(
                    "text-xs font-semibold px-1.5 py-0.5 rounded",
                    anticipation.position === "yes"
                      ? cn(YES_COLORS.bg.medium, YES_COLORS.text.light)
                      : cn(NO_COLORS.bg.medium, NO_COLORS.text.light)
                  )}
                >
                  {anticipation.position === "yes" ? "OUI" : "NON"}
                </span>
                {(() => {
                  // Calculer la part de marché en pourcentage
                  const pool = anticipation.position === "yes" ? tradingPools?.yes : tradingPools?.no;
                  const totalSupply = pool?.totalSupply || 0;
                  const marketShare = totalSupply > 0 ? (anticipation.sharesOwned / totalSupply) * 100 : 0;
                  return marketShare > 0 ? (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {marketShare >= 0.01 ? marketShare.toFixed(2) : "<0.01"}% du marché
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">0% du marché</span>
                  );
                })()}
              </div>
            </div>
            <div className="text-right">
              <SeedDisplay
                amount={anticipation.totalInvested || 0}
                variant="default"
                className="text-sm font-bold"
                iconSize="size-3"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

