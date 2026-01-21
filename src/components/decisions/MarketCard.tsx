"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { SaveButton } from "./SaveButton";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

interface MarketCardProps {
  decision: {
    _id: Id<"decisions">;
    title: string;
    slug: string;
    decider: string;
    imageUrl?: string;
    status: "announced" | "tracking" | "resolved";
    anticipationsCount: number;
    question: string;
    date: number;
    type: "law" | "sanction" | "tax" | "agreement" | "policy" | "regulation" | "crisis" | "disaster" | "conflict" | "discovery" | "election" | "economic_event" | "other";
    impactedDomains: string[];
  };
  className?: string;
  isSaved?: boolean;
  variant?: "grid" | "list"; // Pour adapter le layout selon le contexte
}

/**
 * Market Card style Polymarket - Respecte l'ADN de l'app
 * Focus sur les données de marché : probabilités, variations, volume
 */
export function MarketCard({
  decision,
  className,
  isSaved: isSavedProp,
  variant = "grid",
}: MarketCardProps) {
  // Récupérer les données de marché
  const probability = useQuery(api.trading.getSingleOdds, { decisionId: decision._id });
  const tradingPools = useQuery(api.trading.getTradingPools, { decisionId: decision._id });
  const courseHistory = useQuery(api.trading.getDecisionCourseHistory, { decisionId: decision._id });

  // Calculer la variation de probabilité (aujourd'hui)
  const probabilityVariation = useMemo(() => {
    if (!courseHistory?.history?.length) return 0;
    const { history } = courseHistory;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayFirstPoint = history.find((p) => (p.timestamp || 0) >= todayStart) || history[0];
    const lastPoint = history[history.length - 1];
    const openingTotal = (todayFirstPoint.yes || 0) + (todayFirstPoint.no || 0);
    const lastTotal = (lastPoint.yes || 0) + (lastPoint.no || 0);
    if (openingTotal <= 0 || lastTotal <= 0) return 0;
    const openingProbability = ((todayFirstPoint.yes || 0) / openingTotal) * 100;
    const lastProbability = ((lastPoint.yes || 0) / lastTotal) * 100;
    return Math.round((lastProbability - openingProbability) * 10) / 10;
  }, [courseHistory]);

  // Calculer le volume total (liquidité des deux pools)
  const totalVolume = useMemo(() => {
    if (!tradingPools) return 0;
    const yesReserve = tradingPools.yes?.reserve || 0;
    const noReserve = tradingPools.no?.reserve || 0;
    return yesReserve + noReserve;
  }, [tradingPools]);

  // Calculer le nombre de participants (anticipations)
  const participants = decision.anticipationsCount || 0;

  const probabilityYes = probability !== undefined ? probability : 50;
  const probabilityNo = probability !== undefined ? 100 - probability : 50;

  const timeAgo = formatDistanceToNow(new Date(decision.date), { addSuffix: true, locale: fr });

  // Format compact pour le volume
  const formatVolume = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  };

  return (
    <Link
      href={`/${decision.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden",
        "bg-background/50 backdrop-blur-sm rounded-xl",
        "hover:bg-background/80 hover:shadow-xl",
        "transition-all duration-300",
        variant === "grid" ? "h-full" : "",
        className
      )}
      style={{ maxWidth: "100%" }}
    >
      {/* Image de couverture - Épurée */}
      {decision.imageUrl && (
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <Image
            src={decision.imageUrl}
            alt={decision.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500 opacity-60"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
          {/* Overlay gradient subtil */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          
          {/* Badge résolu - Épuré */}
          {decision.status === "resolved" && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-green-500/90 text-white border-0 text-xs px-2 py-1 backdrop-blur-sm">
                Résolu
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Contenu - Design épuré */}
      <div className="flex-1 flex flex-col p-5 space-y-4">
        {/* Question/Titre - Plus grand et épuré */}
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {decision.question || decision.title}
        </h3>

        {/* Probabilités Yes/No - Design épuré sans bordures */}
        <div className="grid grid-cols-2 gap-3">
          {/* OUI */}
          <div className={cn(
            "p-3 rounded-lg transition-all",
            probabilityYes >= 50
              ? "bg-primary/10"
              : "bg-muted/30"
          )}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">OUI</span>
              {probabilityVariation > 0 && probabilityYes >= 50 && (
                <span className="text-xs font-semibold text-green-500">
                  +{probabilityVariation.toFixed(1)}%
                </span>
              )}
            </div>
            <div className={cn(
              "text-2xl font-bold mb-2",
              probabilityYes >= 50 ? YES_COLORS.text.light : "text-muted-foreground"
            )}>
              {probabilityYes.toFixed(1)}%
            </div>
            {/* Barre de progression - Plus visible */}
            <div className="h-1 bg-background/50 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  probabilityYes >= 50 ? "bg-primary" : "bg-muted-foreground/30"
                )}
                style={{ width: `${probabilityYes}%` }}
              />
            </div>
          </div>

          {/* NON */}
          <div className={cn(
            "p-3 rounded-lg transition-all",
            probabilityNo >= 50
              ? "bg-zinc-500/10"
              : "bg-muted/30"
          )}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">NON</span>
              {probabilityVariation < 0 && probabilityNo >= 50 && (
                <span className="text-xs font-semibold text-green-500">
                  +{Math.abs(probabilityVariation).toFixed(1)}%
                </span>
              )}
            </div>
            <div className={cn(
              "text-2xl font-bold mb-2",
              probabilityNo >= 50 ? NO_COLORS.text.light : "text-muted-foreground"
            )}>
              {probabilityNo.toFixed(1)}%
            </div>
            {/* Barre de progression - Plus visible */}
            <div className="h-1 bg-background/50 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  probabilityNo >= 50 ? "bg-zinc-400" : "bg-muted-foreground/30"
                )}
                style={{ width: `${probabilityNo}%` }}
              />
            </div>
          </div>
        </div>

        {/* Métriques - Épurées sans séparateur */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {totalVolume > 0 && (
            <div className="flex items-center gap-1.5">
              <SolarIcon icon="wallet-money-bold" className="size-3.5" />
              <span className="font-medium">
                {formatVolume(totalVolume)}
              </span>
            </div>
          )}
          {participants > 0 && (
            <div className="flex items-center gap-1.5">
              <SolarIcon icon="users-group-rounded-bold" className="size-3.5" />
              <span>{participants}</span>
            </div>
          )}
        </div>

        {/* Footer - Épuré sans séparateur */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1 text-xs text-muted-foreground">
            <span className="truncate">
              {decision.decider}
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span>
              {timeAgo}
            </span>
          </div>
          
          {/* Actions */}
          <div className="flex items-center">
            <SaveButton
              decisionId={decision._id}
              size="icon"
              variant="ghost"
              className="size-7"
              isSaved={isSavedProp}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

