"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { OpinionCourseChart } from "./OpinionCourseChart";
import { TopArgumentsList } from "./TopArgumentsList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TopHoldersTab } from "./TopHoldersTab";
import { ActivityTab } from "./ActivityTab";
import { OrderBook } from "./OrderBook";
import { ResolutionTab } from "./ResolutionTab";
import { SaveButton } from "./SaveButton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { SeedDisplay } from "@/components/ui/SeedDisplay";

interface TradingInterfaceProps {
  decisionId: Id<"decisions">;
  question: string;
  answer1: string;
  status: "announced" | "tracking" | "resolved";
  compact?: boolean;
}

/**
 * Interface desktop - Full width, design fluide
 * Une seule card pour le widget d'achat, tout le reste intégré
 */
export function TradingInterface({
  decisionId,
  question,
  answer1,
  status,
  compact,
}: TradingInterfaceProps) {
  const decision = useQuery(api.decisions.getDecisionById, { decisionId });
  const probability = useQuery(api.trading.getSingleOdds, { decisionId });
  const courseHistory = useQuery(api.trading.getDecisionCourseHistory, { decisionId });
  const investmentWindow = useQuery(api.trading.getInvestmentWindow, { decisionId });
  const topArguments = useQuery(api.topArguments.getAllArguments, { decisionId });
  const tradingPools = useQuery(api.trading.getTradingPools, { decisionId });
  
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    if (!decision?.createdAt || !investmentWindow) return;
    const updateCountdown = () => {
      const now = Date.now();
      const expiresAt = decision.createdAt + investmentWindow;
      const remaining = expiresAt - now;
      if (remaining <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }
      const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
      setTimeRemaining({ days, hours, minutes, seconds, isExpired: false });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [decision?.createdAt, investmentWindow]);

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

  if (status === "resolved") return null;

  const handleShare = async () => {
    if (typeof window !== "undefined" && decision?.slug) {
      const url = `${window.location.origin}/${decision.slug}`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: question,
            text: question,
            url,
          });
        } catch (error) {
          if ((error as Error).name !== "AbortError") {
            await navigator.clipboard.writeText(url);
            toast.success("Lien copié dans le presse-papier");
          }
        }
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Lien copié dans le presse-papier");
      }
    }
  };

  return (
    <div className="relative w-full bg-background">
      {/* Header sticky avec question et image de cover */}
      <div 
        className="sticky z-30 border-b border-border/50 bg-background/95 backdrop-blur-sm"
        style={{ 
          top: "calc(var(--header-height, 56px) + var(--breaking-news-height, 0px))" 
        }}
      >
        <div className="relative h-24 overflow-hidden">
          {/* Image de fond */}
          {decision?.imageUrl && (
            <div className="absolute inset-0">
              <Image
                src={decision.imageUrl}
                alt={decision.title || "Décision"}
                fill
                className="object-cover"
                sizes="100vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
            </div>
          )}
          
          {/* Contenu du header */}
          <div className="relative z-10 h-full flex items-center justify-between px-6">
            <div className="flex-1 min-w-0 pr-4">
              <h1 className="text-lg font-semibold text-foreground leading-tight line-clamp-2">
                {question}
              </h1>
            </div>
            
            {/* Boutons d'action */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="size-9"
              >
                <SolarIcon icon="share-bold" className="size-4" />
              </Button>
              <SaveButton decisionId={decisionId} size="icon" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal - Une colonne style Polymarket */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Description */}
          {decision?.description && (
            <div className="text-sm text-foreground/80 leading-relaxed">
              {decision.description}
            </div>
          )}

          {/* Zone KPI - Design fluide sans cards */}
          <div className="grid grid-cols-5 gap-6 py-4 border-b border-border/30">
            {/* Position OUI - Mise en avant */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <SolarIcon icon="check-circle-bold" className={cn("size-3.5", YES_COLORS.text.light)} />
                <span className="text-xs font-medium text-muted-foreground">OUI</span>
              </div>
              {probability !== undefined ? (
                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-2xl font-bold",
                      YES_COLORS.text.light
                    )}>
                      {probability.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Probabilité
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <SolarIcon icon="loading" className="size-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Chargement...</span>
                </div>
              )}
            </div>

            {/* Position NON - Mise en avant */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <SolarIcon icon="close-circle-bold" className={cn("size-3.5", NO_COLORS.text.light)} />
                <span className="text-xs font-medium text-muted-foreground">NON</span>
              </div>
              {probability !== undefined ? (
                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-2xl font-bold",
                      NO_COLORS.text.light
                    )}>
                      {(100 - probability).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Probabilité
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <SolarIcon icon="loading" className="size-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Chargement...</span>
                </div>
              )}
            </div>

            {/* Variation de probabilité */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <SolarIcon icon="chart-bold" className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Variation</span>
              </div>
              {probabilityVariation !== 0 ? (
                <div className="space-y-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-2xl font-bold",
                      probabilityVariation > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {probabilityVariation > 0 ? "+" : ""}{probabilityVariation.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Aujourd'hui
                  </p>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Stable
                </div>
              )}
            </div>

            {/* Countdown */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <SolarIcon icon="clock-circle-bold" className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Temps restant</span>
              </div>
              {timeRemaining && !timeRemaining.isExpired ? (
                <div className="space-y-0.5">
                  <div className="text-2xl font-bold font-mono text-foreground">
                    {timeRemaining.days > 0
                      ? `${timeRemaining.days}j ${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}`
                      : `${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Avant fermeture
                  </p>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  {timeRemaining?.isExpired ? "Fermé" : "Calcul..."}
                </div>
              )}
            </div>

            {/* Liquidité */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <SolarIcon icon="wallet-money-bold" className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Liquidité</span>
              </div>
              {tradingPools ? (
                <div className="space-y-0.5">
                  <div className="text-2xl">
                    <SeedDisplay
                      amount={(() => {
                        // Calculer la liquidité totale : reserve des deux pools
                        // Si reserve = 0, utiliser ghostSupply * slope (liquidité initiale)
                        const yesReserve = tradingPools.yes?.reserve || 0;
                        const noReserve = tradingPools.no?.reserve || 0;
                        const yesLiquidity = yesReserve > 0 
                          ? yesReserve 
                          : (tradingPools.yes?.ghostSupply || 0) * (tradingPools.yes?.slope || 0);
                        const noLiquidity = noReserve > 0 
                          ? noReserve 
                          : (tradingPools.no?.ghostSupply || 0) * (tradingPools.no?.slope || 0);
                        return yesLiquidity + noLiquidity;
                      })()}
                      variant="default"
                      className="text-2xl font-bold"
                      iconSize="size-4"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Seeds en réserve
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <SolarIcon icon="loading" className="size-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Chargement...</span>
                </div>
              )}
            </div>
          </div>

          {/* Onglets Graphiques/Order Book/Résolution style Polymarket */}
          <Tabs defaultValue="graph" className="w-full">
            <TabsList className="border-b border-border/50 rounded-none bg-transparent p-0 h-auto">
              <TabsTrigger
                value="graph"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
              >
                Graphique
              </TabsTrigger>
              <TabsTrigger
                value="orderbook"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
              >
                Order Book
              </TabsTrigger>
              <TabsTrigger
                value="resolution"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
              >
                Résolution
              </TabsTrigger>
            </TabsList>

            <TabsContent value="graph" className="mt-0">
              <div className="h-[500px] w-full">
                <OpinionCourseChart decisionId={decisionId} compact={false} fullHeight={true} />
              </div>
            </TabsContent>

            <TabsContent value="orderbook" className="mt-0">
              <OrderBook decisionId={decisionId} />
            </TabsContent>

            <TabsContent value="resolution" className="mt-0">
              <ResolutionTab decisionId={decisionId} />
            </TabsContent>
          </Tabs>

          {/* Tabs style Polymarket */}
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="border-b border-border/50 rounded-none bg-transparent p-0 h-auto">
              <TabsTrigger
                value="comments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
              >
                Commentaires ({topArguments?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="holders"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
              >
                Top Holders
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 text-sm font-medium"
              >
                Activité
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="comments" className="mt-6">
              <TopArgumentsList decisionId={decisionId} />
            </TabsContent>
            
            <TabsContent value="holders" className="mt-6">
              <TopHoldersTab decisionId={decisionId} />
            </TabsContent>
            
            <TabsContent value="activity" className="mt-6">
              <ActivityTab decisionId={decisionId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
