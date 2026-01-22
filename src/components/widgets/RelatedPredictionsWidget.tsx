"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";
import { CircularProgress } from "@/components/ui/circular-progress";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo, memo } from "react";

interface RelatedPredictionsWidgetProps {
  decisionId: Id<"decisions">;
}

const RelatedPredictionCard = memo(function RelatedPredictionCard({ decision }: { decision: any }) {
  const probability = useQuery(api.trading.getSingleOdds, { decisionId: decision._id });
  const tradingPools = useQuery(api.trading.getTradingPools, { decisionId: decision._id });
  
  const probabilityYes = probability !== undefined ? probability : 50;
  
  // Calculer le volume total
  const totalVolume = useMemo(() => {
    if (!tradingPools) return 0;
    const yesReserve = tradingPools.yes?.reserve || 0;
    const noReserve = tradingPools.no?.reserve || 0;
    return yesReserve + noReserve;
  }, [tradingPools]);

  const timeAgo = formatDistanceToNow(new Date(decision.date), { addSuffix: true, locale: fr });

  return (
    <Link
      href={`/${decision.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden",
        "bg-background rounded-lg border border-border/50",
        "hover:border-border hover:shadow-lg",
        "transition-all duration-200"
      )}
    >
      {/* Header compact */}
      <div className="relative z-10 flex items-start justify-between p-3 hover:opacity-80 transition-opacity">
        {/* Icône + Question */}
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          {/* Icône compacte */}
          <div className="size-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {decision.imageUrl ? (
              <Image
                src={decision.imageUrl}
                alt={decision.title}
                width={32}
                height={32}
                className="w-full h-full object-cover"
              />
            ) : (
              <SolarIcon icon="document-text-bold" className="size-4 text-primary" />
            )}
          </div>
          
          {/* Question compacte */}
          <h3 className="text-xs font-medium text-foreground line-clamp-2 leading-snug flex-1">
            {decision.question || decision.title}
          </h3>
        </div>

        {/* Probabilité - Progress Circle compact */}
        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0 relative z-10">
          <CircularProgress
            value={probabilityYes}
            size={44}
            strokeWidth={4}
            progressColor={probabilityYes >= 50 ? YES_COLORS.chart.light : NO_COLORS.chart.light}
            bgColor="hsl(var(--border))"
          >
            <div className="flex flex-col items-center justify-center">
              <div className={cn(
                "text-xs font-bold leading-none",
                probabilityYes >= 50 ? YES_COLORS.text.light : NO_COLORS.text.light
              )}>
                {probabilityYes.toFixed(0)}%
              </div>
              <span className="text-[7px] text-muted-foreground uppercase leading-none mt-0.5 font-medium">
                chance
              </span>
            </div>
          </CircularProgress>
        </div>
      </div>

      {/* Boutons Yes/No compacts - Décoratifs uniquement (la card entière est cliquable) */}
      <div className="relative z-10 px-3 pb-2.5 pointer-events-none">
        <div className="grid grid-cols-2 gap-1.5">
          {/* Bouton OUI compact */}
          <div
            className={cn(
              "px-3 py-2 rounded-lg font-medium text-xs",
              "flex items-center justify-center",
              YES_COLORS.bg.light,
              YES_COLORS.text.light,
              "border",
              YES_COLORS.border.light,
              decision.status === "resolved" && "opacity-50"
            )}
          >
            OUI
          </div>

          {/* Bouton NON compact */}
          <div
            className={cn(
              "px-3 py-2 rounded-lg font-medium text-xs",
              "flex items-center justify-center",
              NO_COLORS.bg.light,
              NO_COLORS.text.light,
              "border",
              NO_COLORS.border.light,
              decision.status === "resolved" && "opacity-50"
            )}
          >
            NON
          </div>
        </div>
      </div>

      {/* Footer compact - Volume + Date */}
      <div className="relative z-10 px-3 pb-2.5 flex items-center justify-between gap-2">
        {/* Volume avec SeedDisplay */}
        {totalVolume > 0 && (
          <div className="text-[10px]">
            <SeedDisplay
              amount={totalVolume}
              variant="compact"
              iconSize="size-2.5"
              className="text-muted-foreground"
            />
          </div>
        )}

        {/* Date */}
        <span className="text-[10px] text-muted-foreground flex-shrink-0">
          {timeAgo}
        </span>
      </div>
    </Link>
  );
});

export function RelatedPredictionsWidget({ decisionId }: RelatedPredictionsWidgetProps) {
  const decision = useQuery(api.decisions.getDecisionById, { decisionId });
  
  // Récupérer les décisions similaires (même type)
  const relatedDecisions = useQuery(
    api.decisions.getDecisions,
    decision
      ? {
          limit: 10,
          type: decision.type,
        }
      : "skip"
  );

  // Filtrer pour exclure la décision actuelle
  const filtered = relatedDecisions?.filter((d) => d._id !== decisionId) || [];

  if (!filtered.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <SolarIcon icon="chart-bold" className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Prédictions liées</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.slice(0, 6).map((related) => (
          <RelatedPredictionCard key={related._id} decision={related} />
        ))}
      </div>
    </div>
  );
}
