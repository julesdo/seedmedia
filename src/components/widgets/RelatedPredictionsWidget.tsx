"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";

interface RelatedPredictionsWidgetProps {
  decisionId: Id<"decisions">;
}

function RelatedPredictionItem({ decision }: { decision: any }) {
  const probability = useQuery(api.trading.getSingleOdds, { decisionId: decision._id });

  return (
    <Link
      href={`/${decision.slug}`}
      className="block p-2.5 rounded-lg border border-border/30 bg-background/40 hover:bg-background/60 hover:border-border/50 transition-all group"
    >
      <div className="flex items-start gap-3">
        {decision.imageUrl && (
          <div className="relative size-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img
              src={decision.imageUrl}
              alt={decision.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
            {decision.title}
          </p>
          {probability !== undefined && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-bold",
                  probability >= 50 ? YES_COLORS.text.light : NO_COLORS.text.light
                )}
              >
                {probability.toFixed(1)}%
              </span>
              <span className="text-[10px] text-muted-foreground">
                {decision.decider}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

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
        <SolarIcon icon="chart-bold" className="size-3.5 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-muted-foreground">Prédictions liées</h3>
      </div>
      <div className="space-y-2">
        {filtered.slice(0, 3).map((related) => (
          <RelatedPredictionItem key={related._id} decision={related} />
        ))}
      </div>
    </div>
  );
}

