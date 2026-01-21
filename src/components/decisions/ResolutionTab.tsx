"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ResolutionTabProps {
  decisionId: Id<"decisions">;
}

/**
 * Tab Résolution style Polymarket
 * Affiche les informations de résolution de la décision
 */
export function ResolutionTab({ decisionId }: ResolutionTabProps) {
  const decision = useQuery(api.decisions.getDecisionById, { decisionId });
  const tradingPools = useQuery(api.trading.getTradingPools, { decisionId });

  if (!decision) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <SolarIcon icon="loading" className="size-4 animate-spin" />
          <span className="text-sm">Chargement...</span>
        </div>
      </div>
    );
  }

  const isResolved = decision.status === "resolved";
  const winner = decision.winner;

  return (
    <div className="w-full h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground">Résolution</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isResolved ? (
          <div className="space-y-6">
            {/* Statut résolu */}
            <div className="flex items-center gap-3 p-4 rounded-lg border border-green-500/20 bg-green-500/10">
              <SolarIcon icon="check-circle-bold" className="size-5 text-green-500" />
              <div>
                <div className="text-sm font-semibold text-green-500">Résolu</div>
                <div className="text-xs text-muted-foreground">
                  {decision.resolvedAt
                    ? `Résolu ${formatDistanceToNow(new Date(decision.resolvedAt), { addSuffix: true, locale: fr })}`
                    : "Résolu"}
                </div>
              </div>
            </div>

            {/* Gagnant */}
            {winner && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Gagnant
                </div>
                <div className={cn(
                  "p-4 rounded-lg border-2",
                  winner === "yes"
                    ? "border-blue-500/30 bg-blue-500/10"
                    : "border-red-500/30 bg-red-500/10"
                )}>
                  <div className={cn(
                    "text-2xl font-bold",
                    winner === "yes" ? "text-blue-400" : "text-red-400"
                  )}>
                    {winner === "yes" ? "OUI" : "NON"}
                  </div>
                  {decision.resolutionReason && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {decision.resolutionReason}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Statistiques de résolution */}
            {tradingPools && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Statistiques
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                    <div className="text-xs text-muted-foreground">Pool OUI</div>
                    <div className="text-lg font-bold text-blue-400">
                      {tradingPools.yes?.reserve?.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) || 0} Seeds
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                    <div className="text-xs text-muted-foreground">Pool NON</div>
                    <div className="text-lg font-bold text-red-400">
                      {tradingPools.no?.reserve?.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) || 0} Seeds
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statut en cours */}
            <div className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-muted/20">
              <SolarIcon icon="clock-circle-bold" className="size-5 text-muted-foreground" />
              <div>
                <div className="text-sm font-semibold text-foreground">En cours</div>
                <div className="text-xs text-muted-foreground">
                  La décision n'a pas encore été résolue
                </div>
              </div>
            </div>

            {/* Informations */}
            <div className="space-y-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Informations
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                  <div className="text-xs text-muted-foreground mb-1">Date de création</div>
                  <div className="text-sm font-medium text-foreground">
                    {decision.createdAt
                      ? formatDistanceToNow(new Date(decision.createdAt), { addSuffix: true, locale: fr })
                      : "N/A"}
                  </div>
                </div>
                {decision.deadline && (
                  <div className="p-3 rounded-lg border border-border/50 bg-muted/20">
                    <div className="text-xs text-muted-foreground mb-1">Date limite</div>
                    <div className="text-sm font-medium text-foreground">
                      {formatDistanceToNow(new Date(decision.deadline), { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

