"use client";

import { memo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { SeedDisplay } from "@/components/ui/SeedDisplay";

interface ResolutionTabProps {
  decisionId: Id<"decisions">;
}

/**
 * Tab Résolution avec timeline checklist
 * Design épuré et compact pour mobile et desktop
 */
export const ResolutionTab = memo(function ResolutionTab({ decisionId }: ResolutionTabProps) {
  const decision = useQuery(api.decisions.getDecisionById, { decisionId });
  const tradingPools = useQuery(api.trading.getTradingPools, { decisionId });

  if (!decision) {
    return (
      <div className="w-full min-h-[200px] flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <SolarIcon icon="loading" className="size-4 animate-spin" />
          <span className="text-sm">Chargement...</span>
        </div>
      </div>
    );
  }

  const isResolved = decision.status === "resolved";
  const winner = decision.winner;
  const now = new Date();
  const createdAt = decision.createdAt ? new Date(decision.createdAt) : null;
  const deadline = decision.deadline ? new Date(decision.deadline) : null;
  const resolvedAt = decision.resolvedAt ? new Date(decision.resolvedAt) : null;

  // Timeline steps
  const steps = [
    {
      id: "created",
      label: "Création",
      date: createdAt,
      completed: true,
      icon: "calendar-bold",
    },
    {
      id: "tracking",
      label: "En cours",
      date: deadline && deadline > now ? deadline : null,
      completed: isResolved,
      icon: "clock-circle-bold",
    },
    {
      id: "resolved",
      label: "Résolution",
      date: resolvedAt,
      completed: isResolved,
      icon: "check-circle-bold",
    },
  ];

  return (
    <div className="w-full flex flex-col">
      {/* Timeline Checklist */}
      <div className="px-4 md:px-6 py-4 md:py-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Timeline</h3>
        
        <div className="relative">
          {/* Ligne verticale */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border/50" />
          
          {/* Steps */}
          <div className="space-y-4 md:space-y-6 relative">
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              const isActive = step.completed;
              
              return (
                <div key={step.id} className="relative flex items-start gap-3 md:gap-4">
                  {/* Icône */}
                  <div className={cn(
                    "relative z-10 flex items-center justify-center size-6 md:size-7 rounded-full border-2 transition-all shrink-0",
                    isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border/50 text-muted-foreground"
                  )}>
                    {isActive ? (
                      <SolarIcon icon="check-bold" className="size-3 md:size-3.5" />
                    ) : (
                      <SolarIcon icon={step.icon as any} className="size-3 md:size-3.5" />
                    )}
                  </div>
                  
                  {/* Contenu */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={cn(
                        "text-xs md:text-sm font-medium",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                      {step.date && (
                        <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(step.date, { addSuffix: true, locale: fr })}
                        </span>
                      )}
                    </div>
                    {step.id === "resolved" && isResolved && winner && (
                      <div className={cn(
                        "mt-1.5 md:mt-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border text-xs md:text-sm font-semibold inline-block",
                        winner === "yes"
                          ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                          : "border-red-500/30 bg-red-500/10 text-red-400"
                      )}>
                        {winner === "yes" ? "OUI" : "NON"}
                      </div>
                    )}
                    {step.id === "resolved" && isResolved && decision.resolutionReason && (
                      <p className="mt-1.5 md:mt-2 text-[10px] md:text-xs text-muted-foreground">
                        {decision.resolutionReason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Statistiques - Compact */}
      {isResolved && tradingPools && (
        <div className="px-3 md:px-6 pb-3 md:pb-6 border-t border-border/50 pt-3 md:pt-4">
          <h3 className="text-xs md:text-sm font-semibold text-foreground mb-2 md:mb-3">Statistiques</h3>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <div className="p-2 md:p-3 rounded-lg border border-border/30 bg-card/30">
              <div className="text-[10px] md:text-xs text-muted-foreground mb-1">Pool OUI</div>
              <div className="text-sm md:text-base font-bold text-blue-400">
                <SeedDisplay
                  amount={tradingPools.yes?.reserve || 0}
                  variant="compact"
                  iconSize="size-2.5 md:size-3"
                />
              </div>
            </div>
            <div className="p-2 md:p-3 rounded-lg border border-border/30 bg-card/30">
              <div className="text-[10px] md:text-xs text-muted-foreground mb-1">Pool NON</div>
              <div className="text-sm md:text-base font-bold text-red-400">
                <SeedDisplay
                  amount={tradingPools.no?.reserve || 0}
                  variant="compact"
                  iconSize="size-2.5 md:size-3"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
