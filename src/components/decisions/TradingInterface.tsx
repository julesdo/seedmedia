"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { OpinionCourseChart } from "./OpinionCourseChart";
import { MobileChart } from "./MobileChart";
import { TopArgumentsList } from "./TopArgumentsList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TopHoldersTab } from "./TopHoldersTab";
import { ActivityTab } from "./ActivityTab";
import { OrderBook } from "./OrderBook";
import { ResolutionTab } from "./ResolutionTab";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { TradingWidget } from "./TradingWidget";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useBottomNav } from "@/contexts/BottomNavContext";
import { motion } from "motion/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { RelatedPredictionsWidget } from "@/components/widgets/RelatedPredictionsWidget";
import { useTradingData } from "@/hooks/useTradingData";

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
export const TradingInterface = memo(function TradingInterface({
  decisionId,
  question,
  answer1,
  status,
  compact,
}: TradingInterfaceProps) {
  // Utiliser le hook optimisé pour charger toutes les données en une fois
  const { decision, probability, courseHistory, investmentWindow, topArguments, tradingPools } = useTradingData(decisionId);
  
  const [showInvestSheet, setShowInvestSheet] = useState(false);
  const [showGraphSheet, setShowGraphSheet] = useState(false);
  const [showOrderBookSheet, setShowOrderBookSheet] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  
  const { registerFabs, registerInvestButton, clearFabs } = useBottomNav();
  const router = useRouter();
  
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    if (!decision?.createdAt || !investmentWindow) return;
    
    // Optimisation mobile : réduire la fréquence du countdown (5s sur mobile, 1s sur desktop)
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    const intervalMs = isMobile ? 5000 : 1000;
    
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
    let interval = setInterval(updateCountdown, intervalMs);
    
    // Pause le timer si la page n'est pas visible (Page Visibility API)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        updateCountdown();
        interval = setInterval(updateCountdown, intervalMs);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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

  // Enregistrer les FABs et le bouton Investir dans la bottom bar (mobile uniquement)
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
    
    if (!isMobile) {
      clearFabs();
      return;
    }

    // Créer le bouton Investir
    const investButton = (
      <Sheet side="bottom" open={showInvestSheet} onOpenChange={setShowInvestSheet}>
        <SheetTrigger asChild>
          <Button 
            className="w-full h-12 text-sm font-bold bg-gradient-to-r from-primary via-blue-500 to-primary hover:opacity-90 text-white shadow-xl rounded-xl relative overflow-hidden group"
            onClick={() => setShowInvestSheet(true)}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ 
                x: ["-100%", "200%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut",
                repeatDelay: 0.5,
              }}
            />
            <SolarIcon icon="cart-bold" className="size-5 mr-2 relative z-10" />
            <span className="relative z-10">Investir</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl [&>button]:hidden flex flex-col overflow-hidden p-0">
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30">
            <SheetTitle className="text-lg">Prendre position</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <TradingWidget decisionId={decisionId} />
          </div>
        </SheetContent>
      </Sheet>
    );

    // Créer les FABs
    const fabs = [
      {
        id: "orderbook",
        icon: "list-check-bold",
        label: "Order",
        onClick: () => setShowOrderBookSheet(true),
      },
      {
        id: "comments",
        icon: "chat-round-bold",
        label: "Com.",
        onClick: () => setShowCommentsSheet(true),
        badge: topArguments?.length || 0,
      },
    ];

    registerInvestButton(investButton);
    registerFabs(fabs);

    return () => {
      clearFabs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInvestSheet, showOrderBookSheet, showCommentsSheet, topArguments?.length, decisionId]);

  return (
    <div className="relative w-full bg-background">
      {/* Header simple - Non sticky, focus sur la question */}
      <div className="border-b border-border/50 bg-background">
        <div className="relative overflow-hidden">
          {/* Image de fond - Optionnelle, visible sur mobile et desktop */}
          {decision?.imageUrl && (
            <div className="absolute inset-0" style={{ aspectRatio: '16/9', minHeight: '200px' }}>
              <Image
                src={decision.imageUrl}
                alt={decision.title || "Décision"}
                fill
                className="object-cover opacity-20 md:opacity-30"
                sizes="100vw"
                priority
                quality={75}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
              <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background md:from-background/80 md:via-background/90" />
            </div>
          )}
          
          {/* Contenu du header - Simple et épuré */}
          <div className="relative z-10 px-4 md:px-6 py-4 md:py-6">
            {/* Bouton retour - Mobile uniquement */}
            <div className="lg:hidden mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
              >
                <SolarIcon icon="arrow-left-bold" className="size-3.5 mr-1.5" />
                Retour
              </Button>
            </div>
            
            {/* Question - Focus principal */}
            <h1 className="text-base md:text-xl font-semibold text-foreground leading-snug">
              {question}
            </h1>
          </div>
        </div>
      </div>

      {/* Contenu principal - Optimisé mobile */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 lg:hidden">
        <div className="space-y-4 md:space-y-6">
          {/* Zone KPI principale - OUI/NON côte à côte, design épuré mobile */}
          <div className="lg:hidden">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Position OUI */}
              <div className="relative p-4 rounded-xl border border-border/30 bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <SolarIcon icon="check-circle-bold" className={cn("size-4", YES_COLORS.text.light)} />
                  <span className="text-xs font-semibold text-foreground">OUI</span>
                </div>
                {probability !== undefined ? (
                  <div>
                    <span className={cn(
                      "text-3xl font-bold block leading-none mb-1",
                      YES_COLORS.text.light
                    )}>
                      {probability.toFixed(1)}%
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      Probabilité
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <SolarIcon icon="loading" className="size-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Chargement...</span>
                  </div>
                )}
              </div>

              {/* Position NON */}
              <div className="relative p-4 rounded-xl border border-border/30 bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <SolarIcon icon="close-circle-bold" className={cn("size-4", NO_COLORS.text.light)} />
                  <span className="text-xs font-semibold text-foreground">NON</span>
                </div>
                {probability !== undefined ? (
                  <div>
                    <span className={cn(
                      "text-3xl font-bold block leading-none mb-1",
                      NO_COLORS.text.light
                    )}>
                      {(100 - probability).toFixed(1)}%
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      Probabilité
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <SolarIcon icon="loading" className="size-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Chargement...</span>
                  </div>
                )}
              </div>
            </div>

            {/* KPIs supplémentaires - Variation, Temps restant, Liquidité */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {/* Variation */}
              <div className="p-2.5 rounded-lg border border-border/30 bg-card/30">
                <div className="flex items-center gap-1 mb-1">
                  <SolarIcon icon="chart-bold" className="size-3 text-muted-foreground" />
                  <span className="text-[9px] font-semibold text-muted-foreground">Variation</span>
                </div>
                {probabilityVariation !== 0 ? (
                  <span className={cn(
                    "text-lg font-bold block",
                    probabilityVariation > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {probabilityVariation > 0 ? "+" : ""}{probabilityVariation.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Stable</span>
                )}
              </div>

              {/* Temps restant */}
              <div className="p-2.5 rounded-lg border border-border/30 bg-card/30">
                <div className="flex items-center gap-1 mb-1">
                  <SolarIcon icon="clock-circle-bold" className="size-3 text-muted-foreground" />
                  <span className="text-[9px] font-semibold text-muted-foreground">Temps</span>
                </div>
                {timeRemaining && !timeRemaining.isExpired ? (
                  <div className="text-xs font-mono font-bold text-foreground">
                    {timeRemaining.days > 0
                      ? `${timeRemaining.days}j ${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}`
                      : `${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {timeRemaining?.isExpired ? "Fermé" : "Calcul..."}
                  </span>
                )}
              </div>

              {/* Liquidité */}
              <div className="p-2.5 rounded-lg border border-border/30 bg-card/30">
                <div className="flex items-center gap-1 mb-1">
                  <SolarIcon icon="wallet-money-bold" className="size-3 text-muted-foreground" />
                  <span className="text-[9px] font-semibold text-muted-foreground">Liquidité</span>
                </div>
                {tradingPools ? (
                  <div className="text-xs">
                    <SeedDisplay
                      amount={(() => {
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
                      variant="compact"
                      iconSize="size-2.5"
                      className="text-xs font-bold"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <SolarIcon icon="loading" className="size-2.5 animate-spin text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground">...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Zone KPI Desktop - Conservée pour desktop */}
          <div className="hidden md:grid md:grid-cols-5 gap-6 py-6 border-b border-border/30">
            {/* Position OUI - Mise en avant */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <SolarIcon icon="check-circle-bold" className={cn("size-4", YES_COLORS.text.light)} />
                <span className="text-sm font-semibold text-foreground">OUI</span>
              </div>
              {probability !== undefined ? (
                <div className="space-y-1">
                  <span className={cn(
                    "text-3xl lg:text-4xl font-bold block leading-none",
                    YES_COLORS.text.light
                  )}>
                    {probability.toFixed(1)}%
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Probabilité
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <SolarIcon icon="loading" className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Chargement...</span>
                </div>
              )}
            </div>

            {/* Position NON - Mise en avant */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <SolarIcon icon="close-circle-bold" className={cn("size-4", NO_COLORS.text.light)} />
                <span className="text-sm font-semibold text-foreground">NON</span>
              </div>
              {probability !== undefined ? (
                <div className="space-y-1">
                  <span className={cn(
                    "text-3xl lg:text-4xl font-bold block leading-none",
                    NO_COLORS.text.light
                  )}>
                    {(100 - probability).toFixed(1)}%
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Probabilité
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <SolarIcon icon="loading" className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Chargement...</span>
                </div>
              )}
            </div>

            {/* Variation de probabilité */}
            <div className="flex flex-col hidden md:flex">
              <div className="flex items-center gap-2 mb-3">
                <SolarIcon icon="chart-bold" className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">Variation</span>
              </div>
              {probabilityVariation !== 0 ? (
                <div className="space-y-1">
                  <span className={cn(
                    "text-3xl md:text-4xl font-bold block",
                    probabilityVariation > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {probabilityVariation > 0 ? "+" : ""}{probabilityVariation.toFixed(1)}%
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Aujourd'hui
                  </p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Stable
                </div>
              )}
            </div>

            {/* Countdown */}
            <div className="flex flex-col hidden md:flex">
              <div className="flex items-center gap-2 mb-3">
                <SolarIcon icon="clock-circle-bold" className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">Temps restant</span>
              </div>
              {timeRemaining && !timeRemaining.isExpired ? (
                <div className="space-y-1">
                  <div className="text-3xl md:text-4xl font-bold font-mono text-foreground">
                    {timeRemaining.days > 0
                      ? `${timeRemaining.days}j ${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}`
                      : `${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avant fermeture
                  </p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {timeRemaining?.isExpired ? "Fermé" : "Calcul..."}
                </div>
              )}
            </div>

            {/* Liquidité */}
            <div className="flex flex-col hidden md:flex">
              <div className="flex items-center gap-2 mb-3">
                <SolarIcon icon="wallet-money-bold" className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-muted-foreground">Liquidité</span>
              </div>
              {tradingPools ? (
                <div className="space-y-1">
                  <div className="text-3xl md:text-4xl">
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
                      className="text-3xl md:text-4xl font-bold"
                      iconSize="size-5"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Seeds en réserve
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <SolarIcon icon="loading" className="size-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Chargement...</span>
                </div>
              )}
            </div>
          </div>

          {/* Graphique mobile dédié */}
          <div className="lg:hidden mb-6">
            <div className="rounded-lg border border-border/30 bg-card/30 p-3">
              <div className="flex items-center gap-2 mb-3">
                <SolarIcon icon="chart-bold" className="size-4 text-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Évolution</h3>
              </div>
              <MobileChart decisionId={decisionId} />
            </div>
          </div>

          {/* Section Résolution sur mobile - Affichée directement */}
          <div className="lg:hidden mb-6">
            <div className="rounded-lg border border-border/30 bg-card/30 p-3 overflow-hidden">
              <ResolutionTab decisionId={decisionId} />
            </div>
          </div>

          {/* Prédictions liées sur mobile - Lazy load après 500ms */}
          <div className="lg:hidden mb-20">
            <LazyRelatedPredictionsWidget decisionId={decisionId} />
          </div>
        </div>
      </div>

      {/* Sheets pour les FABs - Toujours présents mais déclenchés depuis la bottom bar */}
      <Sheet side="bottom" open={showOrderBookSheet} onOpenChange={setShowOrderBookSheet}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl [&>button]:hidden flex flex-col overflow-hidden p-0">
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30">
            <SheetTitle>Order Book</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <OrderBook decisionId={decisionId} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet side="bottom" open={showCommentsSheet} onOpenChange={setShowCommentsSheet}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl [&>button]:hidden flex flex-col overflow-hidden p-0">
          <SheetHeader className="px-4 pt-4 pb-3 shrink-0 border-b border-border/30">
            <SheetTitle>Commentaires</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <TopArgumentsList decisionId={decisionId} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Contenu desktop - Sans padding supplémentaire */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 hidden lg:block">
        <div className="space-y-4 md:space-y-6">

          {/* Onglets desktop - Conservés pour desktop */}
          <div className="hidden lg:block space-y-6">
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
    </div>
  );
});

// Composant lazy pour charger les prédictions liées après un délai
function LazyRelatedPredictionsWidget({ decisionId }: { decisionId: Id<"decisions"> }) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Charger après 500ms pour ne pas bloquer le rendu initial
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldLoad) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <SolarIcon icon="chart-bold" className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Prédictions liées</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg border border-border/30 bg-card/30 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return <RelatedPredictionsWidget decisionId={decisionId} />;
}
