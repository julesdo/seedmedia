"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Minus, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";
import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { useUser } from "@/contexts/UserContext";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { PortfolioROIChart } from "@/components/portfolio/PortfolioROIChart";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { OpinionCourseChart } from "@/components/decisions/OpinionCourseChart";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * Fonction pour formater les nombres avec abréviations (K, M) sur mobile
 */
function formatNumber(value: number, isMobile: boolean): string {
  const absVal = Math.abs(value);
  
  if (absVal >= 1000000) {
    const mValue = value / 1000000;
    return `${mValue.toFixed(absVal >= 10000000 ? 1 : 2)}M`;
  }
  
  if (absVal >= 1000) {
    const kValue = value / 1000;
    return `${kValue.toFixed(absVal >= 10000 ? 1 : 2)}K`;
  }
  
  return Math.round(value).toString();
}

/**
 * Calcule le montant net après taxe progressive selon la durée de détention
 */
function calculateSellNetProgressive(gross: number, holdingDurationMs: number): number {
  const holdingDurationDays = holdingDurationMs / (24 * 60 * 60 * 1000);
  
  let taxRate: number;
  if (holdingDurationDays < 1) {
    taxRate = 0.20; // < 24h : 20%
  } else if (holdingDurationDays < 7) {
    taxRate = 0.15; // 24h-7j : 15%
  } else if (holdingDurationDays < 30) {
    taxRate = 0.10; // 7j-30j : 10%
  } else {
    taxRate = 0.05; // > 30j : 5%
  }
  
  const net = gross * (1 - taxRate);
  return Math.round(net * 100) / 100;
}

/**
 * Formate un nombre pour le sheet de détail avec arrondi à 1-2 décimales max
 */
function formatDetailNumber(value: number): string {
  const absVal = Math.abs(value);
  
  // Si très grand, utiliser abréviations avec 1-2 décimales
  if (absVal >= 1000000) {
    const mValue = value / 1000000;
    return `${mValue.toFixed(absVal >= 10000000 ? 1 : 2)}M`;
  }
  
  if (absVal >= 1000) {
    const kValue = value / 1000;
    return `${kValue.toFixed(absVal >= 10000 ? 1 : 2)}K`;
  }
  
  // Pour les nombres < 1000, arrondir à 1-2 décimales max
  if (absVal >= 1) {
    return value.toFixed(absVal >= 10 ? 1 : 2);
  }
  
  // Pour les très petits nombres (< 1), garder 2 décimales
  return value.toFixed(2);
}

/**
 * Formate un montant de Seeds pour le sheet de détail
 */
function formatSeedAmount(amount: number): string {
  const absVal = Math.abs(amount);
  
  // Si très grand, utiliser abréviations
  if (absVal >= 1000000) {
    const mValue = amount / 1000000;
    return `${mValue.toFixed(absVal >= 10000000 ? 1 : 2)}M`;
  }
  
  if (absVal >= 1000) {
    const kValue = amount / 1000;
    return `${kValue.toFixed(absVal >= 10000 ? 1 : 2)}K`;
  }
  
  // Arrondir à 1-2 décimales max
  if (absVal >= 1) {
    return amount.toFixed(absVal >= 10 ? 1 : 2);
  }
  
  return amount.toFixed(2);
}

/**
 * Composant pour afficher les stats sur une ligne avec séparateur dans le sheet de détail
 */
function DetailStatsRow({
  sharesOwned,
  decisionId,
  position,
}: {
  sharesOwned: number;
  decisionId: Id<"decisions">;
  position: "yes" | "no";
}) {
  const probability = useQuery(
    api.trading.getSingleOdds,
    { decisionId } as any
  ) as number | undefined;
  
  const courseHistory = useQuery(
    api.trading.getDecisionCourseHistory,
    { decisionId } as any
  ) as any;

  // Calculer la variation de la probabilité (24h)
  const probabilityVariation = useMemo(() => {
    if (!courseHistory?.history?.length || probability === undefined) return null;
    
    const history = courseHistory.history;
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Calculer la probabilité précédente à partir de l'historique normalisé
    let previousProbability = probability;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].timestamp <= oneDayAgo) {
        const previousYes = history[i].yes || 0;
        const previousNo = history[i].no || 0;
        const previousTotal = previousYes + previousNo;
        if (previousTotal > 0) {
          previousProbability = position === "yes" 
            ? (previousYes / previousTotal) * 100 
            : (previousNo / previousTotal) * 100;
        }
        break;
      }
    }
    
    if (previousProbability === probability && history.length > 1) {
      const firstYes = history[0].yes || 0;
      const firstNo = history[0].no || 0;
      const firstTotal = firstYes + firstNo;
      if (firstTotal > 0) {
        previousProbability = position === "yes" 
          ? (firstYes / firstTotal) * 100 
          : (firstNo / firstTotal) * 100;
      }
    }
    
    if (previousProbability === 0 || previousProbability === probability) return null;
    
    return probability - previousProbability; // Variation en points de pourcentage
  }, [courseHistory, probability, position]);

  // Calculer la probabilité pour cette position
  const currentProbability = probability !== undefined
    ? (position === "yes" ? probability : 100 - probability)
    : undefined;

  return (
    <div className="flex items-center justify-between py-3 border-t border-b border-border/20">
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-1 font-medium">
          Seeds investis
        </p>
        <p className="text-lg font-bold">{formatDetailNumber(sharesOwned)}</p>
      </div>
      <div className="w-px h-12 bg-border/30 mx-4" />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-1 font-medium">
          Probabilité actuelle
        </p>
        {currentProbability !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-lg font-bold",
              position === "yes" ? YES_COLORS.text.light : NO_COLORS.text.light
            )}>
              {currentProbability.toFixed(1)}%
            </span>
            {probabilityVariation !== null && (
              <span className={cn(
                "text-[10px] font-medium",
                probabilityVariation > 0 ? "text-green-500" : 
                probabilityVariation < 0 ? "text-red-500" : 
                "text-muted-foreground"
              )}>
                {probabilityVariation > 0 ? "▲" : probabilityVariation < 0 ? "▼" : ""} {probabilityVariation > 0 ? "+" : ""}{probabilityVariation.toFixed(1)} points
              </span>
            )}
          </div>
        ) : (
          <SolarIcon icon="loading" className="size-4 animate-spin" />
        )}
      </div>
    </div>
  );
}

/**
 * Card de position - Style MarketCard avec image de fond et design premium
 */
function PositionCard({
  item,
  decision,
  position,
  profit,
  profitPercentage,
  currentPrice,
  onClick,
  isMobile,
}: {
  item: any;
  decision: any;
  position: "yes" | "no";
  profit: number;
  profitPercentage: number;
  currentPrice?: number;
  onClick: () => void;
  isMobile: boolean;
}) {
  const courseHistory = useQuery(
    api.trading.getDecisionCourseHistory,
    { decisionId: decision._id } as any
  );

  // Préparer les données pour le mini graphique
  const chartData = useMemo(() => {
    if (!courseHistory?.history?.length) return [];
    
    // Prendre les 20 derniers points pour le mini graphique
    const recentHistory = courseHistory.history.slice(-20);
    const priceKey = position === "yes" ? "yes" : "no";
    
    return recentHistory.map((point: any, index: number) => ({
      index,
      value: point[priceKey] || 0,
    }));
  }, [courseHistory, position]);

  // Calculer la variation du prix
  const priceVariation = useMemo(() => {
    if (!courseHistory?.history?.length || currentPrice === undefined) return 0;
    
    const priceKey = position === "yes" ? "yes" : "no";
    const history = courseHistory.history;
    
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    let previousPrice = currentPrice;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].timestamp <= oneDayAgo) {
        previousPrice = history[i][priceKey] || currentPrice;
        break;
      }
    }
    
    if (previousPrice === currentPrice && history.length > 1) {
      previousPrice = history[0][priceKey] || currentPrice;
    }
    
    if (previousPrice === 0 || previousPrice === currentPrice) return 0;
    
    return ((currentPrice - previousPrice) / previousPrice) * 100;
  }, [courseHistory, currentPrice, position]);

  const isProfit = profit > 0;
  const color = position === "yes" ? YES_COLORS.chart.light : NO_COLORS.chart.light;
  const gradientStart = position === "yes" 
    ? YES_COLORS.chart.gradient.start 
    : NO_COLORS.chart.gradient.start;
  const gradientEnd = position === "yes"
    ? YES_COLORS.chart.gradient.end
    : NO_COLORS.chart.gradient.end;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <button
        onClick={onClick}
        className={cn(
          "relative w-full overflow-hidden rounded-xl",
          "bg-background border border-border/50",
          "hover:border-border hover:shadow-lg",
          "transition-all duration-200",
          "text-left"
        )}
        style={{ 
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      >
        {/* Image de fond avec overlay */}
        {decision.imageUrl && (
          <div className="absolute inset-0 z-0">
            <Image
              src={decision.imageUrl}
              alt={decision.title || "Décision"}
              fill
              className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
          </div>
        )}

        {/* Contenu */}
        <div className="relative z-10 p-4">
          {/* Header avec badge position */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold line-clamp-2 mb-2">
                {decision.title || "Décision"}
              </h3>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase",
                  position === "yes" 
                    ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "text-white")
                    : cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "text-white")
                )}>
                  {position === "yes" ? "OUI" : "NON"}
                </span>
                {priceVariation !== 0 && (
                  <span className={cn(
                    "text-[10px] font-medium",
                    priceVariation > 0 ? "text-green-500" : 
                    priceVariation < 0 ? "text-red-500" : 
                    "text-muted-foreground"
                  )}>
                    {priceVariation > 0 ? "▲" : priceVariation < 0 ? "▼" : ""} {Math.abs(priceVariation).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Mini graphique - Plus grand et visible */}
          <div className="h-24 mb-3 rounded-lg overflow-hidden bg-muted/20">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`gradient-portfolio-${decision._id}-${position}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={gradientStart} stopOpacity={0.8} />
                      <stop offset="100%" stopColor={gradientEnd} stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#gradient-portfolio-${decision._id}-${position})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <SolarIcon icon="chart-2-bold" className="size-6 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Footer avec gains et Seeds investis */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gains/Pertes</p>
              <p className={cn(
                "text-lg font-bold",
                isProfit ? YES_COLORS.text.light : 
                profit < 0 ? "text-red-500" : 
                "text-foreground"
              )}>
                {isProfit ? "+" : ""}{formatNumber(profit, isMobile)}
              </p>
              {profitPercentage !== 0 && (
                <p className={cn(
                  "text-[10px] font-medium mt-0.5",
                  profitPercentage > 0 ? "text-green-500" : 
                  profitPercentage < 0 ? "text-red-500" : 
                  "text-muted-foreground"
                )}>
                  {profitPercentage > 0 ? "+" : ""}{profitPercentage.toFixed(1)}%
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Seeds investis</p>
              <div className="flex items-center gap-1">
                <SolarIcon icon="leaf-bold" className="size-3 text-primary" />
                <p className="text-base font-bold">{formatNumber((item.totalInvested || 0), isMobile)}</p>
              </div>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

/**
 * Section d'achat pour le portefeuille
 */
function BuyMoreSectionPortfolio({
  selectedPosition,
  buyMoreAmount,
  setBuyMoreAmount,
  isBuyingMore,
  setIsBuyingMore,
  buyShares,
  setDetailSheetOpen,
  isMobile,
}: {
  selectedPosition: {
    decisionId: Id<"decisions">;
    position: "yes" | "no";
    decisionTitle: string;
    decision: any;
  } | null;
  buyMoreAmount: string;
  setBuyMoreAmount: (value: string) => void;
  isBuyingMore: boolean;
  setIsBuyingMore: (value: boolean) => void;
  buyShares: any;
  setDetailSheetOpen: (open: boolean) => void;
  isMobile: boolean;
}) {
  const probability = useQuery(
    api.trading.getSingleOdds,
    selectedPosition?.decisionId ? { decisionId: selectedPosition.decisionId } : "skip"
  );
  
  const tradingPools = useQuery(
    api.trading.getTradingPools,
    selectedPosition?.decisionId ? { decisionId: selectedPosition.decisionId } : "skip"
  );
  
  const seedAmountNum = parseFloat(buyMoreAmount) || 0;
  
  // Calculer combien de shares on peut acheter avec un montant en Seeds (même logique que MarketCard)
  const calculateSharesFromSeed = (position: "yes" | "no", seedAmount: number): number => {
    if (!tradingPools || seedAmount <= 0) return 0;
    const pool = position === "yes" ? tradingPools.yes : tradingPools.no;
    if (!pool) return 0;
    const currentSupply = pool.totalSupply || 0;
    const slope = pool.slope;
    
    let shares = 0;
    let totalCost = 0;
    const step = 0.01;
    const maxIterations = 100000;
    let iterations = 0;
    
    while (totalCost < seedAmount && iterations < maxIterations) {
      shares += step;
      const newSupply = currentSupply + shares;
      totalCost = (slope / 2) * (newSupply * newSupply - currentSupply * currentSupply);
      iterations++;
    }
    
    if (totalCost > seedAmount && shares > step) {
      shares -= step;
    }
    
    return Math.round(shares * 100) / 100;
  };

  // Calculer le coût exact pour un nombre de shares donné
  const calculateBuyCost = (position: "yes" | "no", shares: number): number => {
    if (!tradingPools || shares <= 0) return 0;
    const pool = position === "yes" ? tradingPools.yes : tradingPools.no;
    if (!pool) return 0;
    const currentSupply = pool.totalSupply || 0;
    const slope = pool.slope;
    const newSupply = currentSupply + shares;
    return Math.round(((slope / 2) * (newSupply * newSupply - currentSupply * currentSupply)) * 100) / 100;
  };

  const estimatedShares = selectedPosition ? calculateSharesFromSeed(selectedPosition.position, seedAmountNum) : 0;
  const estimatedCost = selectedPosition ? calculateBuyCost(selectedPosition.position, estimatedShares) : 0;
  
  const handleBuy = async () => {
    if (!selectedPosition) return;
    
    if (seedAmountNum <= 0) {
      toast.error("Montant en Seeds invalide");
      return;
    }
    
    setIsBuyingMore(true);
    try {
      const sharesToBuy = calculateSharesFromSeed(selectedPosition.position, seedAmountNum);
      if (sharesToBuy <= 0) {
        toast.error("Montant trop faible pour acheter des shares");
        setIsBuyingMore(false);
        return;
      }
      
      await buyShares({
        decisionId: selectedPosition.decisionId,
        position: selectedPosition.position,
        shares: sharesToBuy,
      });
      
      toast.success(`${formatNumber(seedAmountNum, isMobile)} Seeds investis avec succès !`);
      setDetailSheetOpen(false);
      setBuyMoreAmount("1");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'achat");
    } finally {
      setIsBuyingMore(false);
    }
  };
  
  if (!selectedPosition) return null;
  
  return (
    <div className="space-y-3">
      <div className="bg-muted/50 rounded-lg p-3 text-center border border-border/20 space-y-2">
        <div>
          <p className="text-[10px] text-muted-foreground mb-1 font-medium">Probabilité actuelle</p>
          <div className="text-lg font-bold">
            {probability !== undefined ? (
              <span className={selectedPosition.position === "yes" ? YES_COLORS.text.light : NO_COLORS.text.light}>
                {selectedPosition.position === "yes" ? probability.toFixed(1) : (100 - probability).toFixed(1)}%
              </span>
            ) : (
              <SolarIcon icon="loading" className="size-4 animate-spin mx-auto" />
            )}
          </div>
        </div>
        {estimatedShares > 0 && (
          <div className="pt-2 border-t border-border/30 space-y-1">
            <p className="text-[9px] text-muted-foreground mb-1">Coût estimé</p>
            <div className="flex items-center justify-center gap-1.5">
              <SeedDisplay 
                amount={estimatedCost} 
                variant="default" 
                className="text-base font-bold"
                iconSize="size-3"
              />
            </div>
            <p className="text-[8px] text-muted-foreground">
              ≈ {estimatedShares.toFixed(2)} shares
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-muted-foreground font-medium block">Montant en Seeds</label>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newValue = Math.max(1, seedAmountNum - 1);
              setBuyMoreAmount(newValue.toString());
            }}
            disabled={seedAmountNum <= 1}
            className="size-9 rounded-lg"
          >
            <Minus className="size-3.5" />
          </Button>
          
          <div className="flex flex-col items-center min-w-[70px]">
            <div className="flex items-center gap-1">
              <SolarIcon icon="leaf-bold" className="size-4 text-primary" />
              <span className="text-2xl font-bold text-foreground leading-none">
                {seedAmountNum}
              </span>
            </div>
            <span className="text-[9px] text-muted-foreground leading-none mt-0.5">
              Seeds
            </span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newValue = Math.min(10000, seedAmountNum + 1);
              setBuyMoreAmount(newValue.toString());
            }}
            disabled={seedAmountNum >= 10000}
            className="size-9 rounded-lg"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>

      <Button
        onClick={handleBuy}
        disabled={isBuyingMore || seedAmountNum <= 0}
        className={cn(
          "w-full h-11 text-xs font-bold rounded-lg transition-all",
          selectedPosition.position === "yes"
            ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "hover:opacity-90 text-white")
            : cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "hover:opacity-90 text-white relative overflow-hidden", "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-zinc-400/10")
        )}
      >
        {isBuyingMore ? (
          <>
            <SolarIcon icon="loading" className="size-3.5 mr-1.5 animate-spin" />
            Traitement...
          </>
        ) : (
          <>
            <SolarIcon icon="add-circle-bold" className="size-3.5 mr-1.5" />
            Investir {formatNumber(seedAmountNum, isMobile)} Seeds {selectedPosition.position === "yes" ? "OUI" : "NON"}
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * Section de vente pour le portefeuille (identique au profil public)
 */
function SellMoreSectionPortfolio({
  selectedPosition,
  sellSharesAmount,
  setSellSharesAmount,
  isSelling,
  setIsSelling,
  sellShares,
  setDetailSheetOpen,
  estimatedSellAmount,
}: {
  selectedPosition: {
    decisionId: Id<"decisions">;
    position: "yes" | "no";
    sharesOwned: number;
    decisionTitle: string;
    decision: any;
    createdAt?: number;
    averageBuyPrice?: number;
    currentPrice?: number;
  } | null;
  sellSharesAmount: string;
  setSellSharesAmount: (value: string) => void;
  isSelling: boolean;
  setIsSelling: (value: boolean) => void;
  sellShares: any;
  setDetailSheetOpen: (open: boolean) => void;
  estimatedSellAmount: { gross: number; net: number; fee: number };
}) {
  // Query pour obtenir le prix brut (nécessaire pour les calculs de vente)
  const currentPriceData = useQuery(
    api.trading.getCurrentPriceForPosition,
    selectedPosition
      ? {
          decisionId: selectedPosition.decisionId,
          position: selectedPosition.position,
        }
      : "skip"
  );
  const currentPrice = typeof currentPriceData === 'number' ? currentPriceData : undefined;
  
  const [sellAll, setSellAll] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Synchroniser sellAll avec sellSharesAmount
  useEffect(() => {
    if (selectedPosition) {
      const isAllSelected = parseFloat(sellSharesAmount) === selectedPosition.sharesOwned;
      if (isAllSelected !== sellAll) {
        setSellAll(isAllSelected);
      }
    }
  }, [sellSharesAmount, selectedPosition, sellAll]);

  const handleSellAllChange = (checked: boolean) => {
    setSellAll(checked);
    if (checked && selectedPosition) {
      setSellSharesAmount(selectedPosition.sharesOwned.toString());
    } else if (!checked) {
      setSellSharesAmount("1");
    }
  };

  const handleSell = async () => {
    if (!selectedPosition) return;
    
    const sharesNum = parseFloat(sellSharesAmount) || 0;
    if (sharesNum <= 0 || sharesNum > selectedPosition.sharesOwned) {
      toast.error("Nombre de Seeds invalide");
      return;
    }
    
    setIsSelling(true);
    try {
      const result = await sellShares({
        decisionId: selectedPosition.decisionId,
        position: selectedPosition.position,
        shares: sharesNum,
      });
      
      toast.success(`${formatNumber(result.net, isMobile)} Seeds reçus avec succès !`);
      setDetailSheetOpen(false);
      setSellSharesAmount("1");
      setSellAll(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la vente");
    } finally {
      setIsSelling(false);
    }
  };
  
  if (!selectedPosition) return null;
  
  return (
    <div className="space-y-4">
      {/* Checkbox tout vendre */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="sell-all"
          checked={sellAll}
          onCheckedChange={handleSellAllChange}
        />
        <label
          htmlFor="sell-all"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Tout vendre
        </label>
      </div>

      {/* Slider pour choisir le nombre de Seeds à revendre */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Seeds à revendre</span>
          <span className="text-lg font-bold">
            {formatDetailNumber(parseFloat(sellSharesAmount) || 0)}
          </span>
        </div>
        <Slider
          value={[parseFloat(sellSharesAmount) || 1]}
          onValueChange={([value]) => {
            setSellSharesAmount(value.toString());
            if (selectedPosition && value === selectedPosition.sharesOwned) {
              setSellAll(true);
            } else {
              setSellAll(false);
            }
          }}
          min={1}
          max={selectedPosition.sharesOwned}
          step={1}
          className="w-full"
          disabled={sellAll}
        />
      </div>

      {/* Boutons +/- */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const current = parseFloat(sellSharesAmount) || 1;
            if (current > 1) {
              setSellSharesAmount((current - 1).toString());
              setSellAll(false);
            }
          }}
          disabled={parseFloat(sellSharesAmount) <= 1 || sellAll}
          className="size-10 rounded-xl"
        >
          <Minus className="size-4" />
        </Button>
        <div className="flex-1 text-center">
          <input
            type="number"
            value={sellSharesAmount}
            onChange={(e) => {
              const value = e.target.value;
              const num = parseFloat(value);
              if (!isNaN(num) && num >= 1 && num <= selectedPosition.sharesOwned) {
                setSellSharesAmount(value);
                if (num === selectedPosition.sharesOwned) {
                  setSellAll(true);
                } else {
                  setSellAll(false);
                }
              }
            }}
            min={1}
            max={selectedPosition.sharesOwned}
            disabled={sellAll}
            className="w-full text-center text-2xl font-bold bg-transparent border-none outline-none disabled:opacity-50"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const current = parseFloat(sellSharesAmount) || 1;
            if (current < selectedPosition.sharesOwned) {
              setSellSharesAmount((current + 1).toString());
              if (current + 1 === selectedPosition.sharesOwned) {
                setSellAll(true);
              } else {
                setSellAll(false);
              }
            }
          }}
          disabled={parseFloat(sellSharesAmount) >= selectedPosition.sharesOwned || sellAll}
          className="size-10 rounded-xl"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* 🎯 VERSION SIMPLIFIÉE : Focus sur l'essentiel */}
      <div className="space-y-4 pt-2">
        {/* Montant principal - Mise en avant sans card */}
        <div className="text-center space-y-2 py-4">
          <p className="text-xs text-muted-foreground font-medium">Vous recevrez</p>
          <div className="flex items-center justify-center gap-2">
            <SolarIcon icon="leaf-bold" className="size-6 text-primary shrink-0" />
            <span className={cn(
              "text-3xl font-bold tracking-tight",
              selectedPosition.position === "yes" ? YES_COLORS.text.light : NO_COLORS.text.light
            )}>
              {formatSeedAmount(estimatedSellAmount.net)}
            </span>
          </div>
        </div>

        {/* Bouton pour voir les détails */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {showDetails ? (
            <>
              <ChevronUp className="size-3 mr-1" />
              Masquer les détails
            </>
          ) : (
            <>
              <ChevronDown className="size-3 mr-1" />
              Voir les détails
            </>
          )}
        </Button>

        {/* Détails techniques (dépliables) */}
        {showDetails && (
          <div className="space-y-2 pt-2 border-t border-border/20">
            {/* Profit/Perte */}
            {(() => {
              if (!selectedPosition.averageBuyPrice || currentPrice === undefined) return null;
              const sharesToSell = parseFloat(sellSharesAmount) || 0;
              const investedForShares = (selectedPosition.averageBuyPrice || 0) * sharesToSell;
              const profitForShares = estimatedSellAmount.net - investedForShares;
              
              if (profitForShares > 0) {
                return (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-muted-foreground">Gain</span>
                    <span className="text-xs font-semibold text-green-500">
                      +{formatSeedAmount(profitForShares)}
                    </span>
                  </div>
                );
              } else if (profitForShares < 0) {
                return (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-muted-foreground">Perte</span>
                    <span className="text-xs font-semibold text-red-500">
                      {formatSeedAmount(profitForShares)}
                    </span>
                  </div>
                );
              }
              return null;
            })()}
            
            {/* Message d'avertissement (seulement si perte) */}
            {(() => {
              if (!selectedPosition.averageBuyPrice || currentPrice === undefined) return null;
              const sharesToSell = parseFloat(sellSharesAmount) || 0;
              const investedForShares = (selectedPosition.averageBuyPrice || 0) * sharesToSell;
              const profitForShares = estimatedSellAmount.net - investedForShares;
              
              if (profitForShares < 0) {
                const priceHasDropped = currentPrice < selectedPosition.averageBuyPrice;
                const lossAmount = Math.abs(profitForShares);
                const lossMessage = priceHasDropped 
                  ? "Le prix a baissé depuis votre achat."
                  : "Les frais sont supérieurs à la plus-value.";
                
                return (
                  <div className="py-2">
                    <p className="text-xs text-red-500 font-semibold mb-1">
                      ⚠️ Vous perdrez {formatSeedAmount(lossAmount)} Seeds
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {lossMessage}
                    </p>
                  </div>
                );
              }
              return null;
            })()}
            {/* Explication des frais progressifs */}
            {(() => {
              const holdingDurationMs = (selectedPosition.createdAt !== undefined && selectedPosition.createdAt !== null)
                ? Date.now() - selectedPosition.createdAt 
                : 30 * 24 * 60 * 60 * 1000;
              const holdingDurationDays = holdingDurationMs / (24 * 60 * 60 * 1000);
              
              let taxRate: number;
              let taxRateLabel: string;
              if (holdingDurationDays < 1) {
                taxRate = 0.20;
                taxRateLabel = "20% (< 24h)";
              } else if (holdingDurationDays < 7) {
                taxRate = 0.15;
                taxRateLabel = "15% (24h-7j)";
              } else if (holdingDurationDays < 30) {
                taxRate = 0.10;
                taxRateLabel = "10% (7j-30j)";
              } else {
                taxRate = 0.05;
                taxRateLabel = "5% (> 30j)";
              }
              
              let holdingDurationLabel: string;
              if (holdingDurationDays < 1) {
                holdingDurationLabel = "moins de 24h";
              } else if (holdingDurationDays < 7) {
                holdingDurationLabel = `${Math.floor(holdingDurationDays)} jour${Math.floor(holdingDurationDays) > 1 ? "s" : ""}`;
              } else if (holdingDurationDays < 30) {
                holdingDurationLabel = `${Math.floor(holdingDurationDays)} jour${Math.floor(holdingDurationDays) > 1 ? "s" : ""}`;
              } else {
                holdingDurationLabel = `${Math.floor(holdingDurationDays)} jour${Math.floor(holdingDurationDays) > 1 ? "s" : ""}`;
              }
              
              return (
                <div className="bg-muted/30 rounded-lg p-3 border border-border/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-foreground">Frais</span>
                    <span className="text-xs font-bold text-primary">{taxRateLabel}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-1">
                    Durée : {holdingDurationLabel}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Les frais diminuent avec le temps pour encourager les investissements à long terme.
                  </p>
                </div>
              );
            })()}

            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground">Valeur avant frais</span>
              <div className="flex items-center gap-1">
                <SolarIcon icon="leaf-bold" className="size-3 text-primary shrink-0" />
                <span className="text-sm font-semibold">{formatSeedAmount(estimatedSellAmount.gross)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground">Frais</span>
              <span className="text-xs text-muted-foreground">
                -{formatSeedAmount(estimatedSellAmount.fee)}
              </span>
            </div>
            
            {selectedPosition.averageBuyPrice && currentPrice !== undefined && (
              <div className="flex items-center justify-between py-2 border-t border-border/20 pt-2">
                <span className="text-xs text-muted-foreground">Prix d'achat</span>
                <span className="text-xs font-semibold">{formatSeedAmount(selectedPosition.averageBuyPrice)}/Seed</span>
              </div>
            )}
            {currentPrice !== undefined && (
              <div className="flex items-center justify-between py-2">
                <span className="text-xs text-muted-foreground">Prix actuel</span>
                <span className="text-xs font-semibold">{formatSeedAmount(currentPrice)}/Seed</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Bouton de vente */}
      <Button
        onClick={handleSell}
        disabled={isSelling || parseFloat(sellSharesAmount) <= 0 || parseFloat(sellSharesAmount) > selectedPosition.sharesOwned}
        className={cn(
          "w-full h-12 text-sm font-bold rounded-xl transition-all relative overflow-hidden",
          selectedPosition.position === "yes"
            ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "hover:opacity-90 text-white")
            : cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "hover:opacity-90 text-white", "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-zinc-400/10"),
          (isSelling || parseFloat(sellSharesAmount) <= 0 || parseFloat(sellSharesAmount) > selectedPosition.sharesOwned) &&
            "opacity-50 cursor-not-allowed"
        )}
      >
        {isSelling ? (
          <>
            <SolarIcon icon="loading" className="size-4 mr-2 animate-spin" />
            Vente en cours...
          </>
        ) : (
          <>
            <SolarIcon icon="cart-3-bold" className="size-4 mr-2" />
            Revendre {formatDetailNumber(parseFloat(sellSharesAmount) || 0)} Seeds
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * 🎮 Portfolio - Design gamifié mobile-first style jeu vidéo
 * Grand public, visuel, simple et addictif
 */
export function PortfolioClient() {
  const [isMobile, setIsMobile] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { user, isAuthenticated } = useUser();
  const portfolioQuery = isAuthenticated ? {} : "skip";
  const portfolio = useQuery(
    api.trading.getUserPortfolio,
    portfolioQuery as any
  );

  // États pour la vente et le détail
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{
    decisionId: Id<"decisions">;
    position: "yes" | "no";
    sharesOwned: number;
    decisionTitle: string;
    decision: any;
    profit: number;
    profitPercentage: number;
    currentPrice?: number;
    estimatedValue?: number;
    totalInvested?: number;
    averageBuyPrice?: number;
    createdAt?: number;
  } | null>(null);
  const [sellSheetOpen, setSellSheetOpen] = useState(false);
  const [selectedSellItem, setSelectedSellItem] = useState<{
    decisionId: Id<"decisions">;
    position: "yes" | "no";
    sharesOwned: number;
    decisionTitle: string;
    imageUrl?: string;
    createdAt?: number; // Date de création de l'anticipation pour calculer la taxe progressive
    totalInvested?: number; // Investissement total en Seeds
    averageBuyPrice?: number; // Prix d'achat moyen par Seed
    profit?: number; // Profit total en Seeds
    profitPercentage?: number; // Pourcentage de profit
  } | null>(null);
  const [sellSharesAmount, setSellSharesAmount] = useState<string>("1");
  const [isSelling, setIsSelling] = useState(false);
  const [showSellDetails, setShowSellDetails] = useState(false);

  // États pour l'achat depuis le drawer de détail
  const [buyMoreMode, setBuyMoreMode] = useState<"buy" | "sell">("sell");
  const [buyMoreAmount, setBuyMoreAmount] = useState<string>("1");
  const [isBuyingMore, setIsBuyingMore] = useState(false);

  const sellShares = useMutation(api.trading.sellShares);
  const buyShares = useMutation(api.trading.buyShares);

  const currentPriceData = useQuery(
    api.trading.getCurrentPriceForPosition,
    selectedSellItem
      ? {
          decisionId: selectedSellItem.decisionId,
          position: selectedSellItem.position,
        }
      : "skip"
  );
  
  const currentPrice = typeof currentPriceData === 'number' ? currentPriceData : undefined;

  // Query pour obtenir le prix brut dans le drawer de détail (pour SellMoreSectionPortfolio)
  const currentPriceForDetail = useQuery(
    api.trading.getCurrentPriceForPosition,
    selectedPosition
      ? {
          decisionId: selectedPosition.decisionId,
          position: selectedPosition.position,
        }
      : "skip"
  );
  const currentPriceDetail = typeof currentPriceForDetail === 'number' ? currentPriceForDetail : undefined;

  const estimatedSellAmount = useMemo(() => {
    if (!selectedSellItem || currentPrice === undefined) return { gross: 0, net: 0, fee: 0 };
    
    const shares = parseFloat(sellSharesAmount) || 0;
    if (shares <= 0) return { gross: 0, net: 0, fee: 0 };

    const gross = currentPrice * shares;
    
    // Calculer la taxe progressive basée sur la durée de détention
    const holdingDurationMs = selectedSellItem.createdAt 
      ? Date.now() - selectedSellItem.createdAt 
      : 30 * 24 * 60 * 60 * 1000; // Par défaut, considérer > 30j si pas de date
    const net = calculateSellNetProgressive(gross, holdingDurationMs);
    const fee = gross - net;

    return { gross, net, fee };
  }, [selectedSellItem, currentPrice, sellSharesAmount]);

  // Définir handleOpenDetailSheet avant les calculs qui dépendent de portfolio
  const handleOpenDetailSheet = useCallback((
    item: any,
    decision: any,
    position: "yes" | "no"
  ) => {
    const profit = ('profit' in item && typeof item.profit === 'number') ? item.profit : 0;
    const profitPercentage = ('profitPercentage' in item && typeof item.profitPercentage === 'number') ? item.profitPercentage : 0;
    
    setSelectedPosition({
      decisionId: decision._id,
      position,
      sharesOwned: item.sharesOwned || 0,
      decisionTitle: decision.title || "Décision",
      decision,
      profit,
      profitPercentage,
      currentPrice: item.currentPrice,
      estimatedValue: item.estimatedValue,
      totalInvested: item.totalInvested,
      averageBuyPrice: item.averageBuyPrice,
      createdAt: item.createdAt,
    });
    setBuyMoreMode("sell"); // Par défaut, afficher la vente
    setBuyMoreAmount("1");
    setSellSharesAmount("1");
    setDetailSheetOpen(true);
  }, []);

  // Ouvrir automatiquement le détail si les paramètres d'URL sont présents
  useEffect(() => {
    const decisionIdParam = searchParams.get("decisionId");
    const positionParam = searchParams.get("position") as "yes" | "no" | null;
    
    if (decisionIdParam && positionParam && portfolio && portfolio.length > 0 && !detailSheetOpen) {
      // Trouver la position correspondante
      const matchingItem = portfolio.find((item: any) => 
        item.decision?._id === decisionIdParam && 
        item.position === positionParam &&
        !item.resolved
      );
      
      if (matchingItem && matchingItem.decision) {
        handleOpenDetailSheet(matchingItem, matchingItem.decision, positionParam);
        // Nettoyer l'URL après ouverture
        router.replace("/portfolio", { scroll: false });
      }
    }
  }, [searchParams, portfolio, detailSheetOpen, router, handleOpenDetailSheet]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-6 max-w-sm"
        >
          <div className="size-24 mx-auto rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10">
            <SolarIcon icon="wallet-bold" className="size-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Connectez-vous</h2>
            <p className="text-muted-foreground text-sm">
              Connectez-vous pour voir votre portefeuille et suivre vos gains !
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (portfolio === undefined) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-40 w-full rounded-3xl" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (portfolio.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-6 max-w-sm"
        >
          <div className="size-24 mx-auto rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center shadow-lg shadow-primary/10">
            <SolarIcon icon="chart-2-bold" className="size-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Portefeuille vide</h2>
            <p className="text-muted-foreground text-sm">
              Commencez à trader sur des décisions pour voir vos gains ici !
            </p>
          </div>
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "px-8 py-4 rounded-2xl font-bold text-base shadow-lg transition-all",
                "bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to,
                "text-white hover:opacity-90"
              )}
            >
              Explorer les décisions
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Calculer les totaux
  const totalProfit = portfolio.reduce((sum: number, item: any) => {
    const profit = ('profit' in item && typeof item.profit === 'number') ? item.profit : 0;
    return sum + profit;
  }, 0);
  const totalInvested = portfolio.reduce((sum: number, item: any) => sum + (item.totalInvested || 0), 0);
  const totalValue = portfolio.reduce((sum: number, item: any) => sum + (item.estimatedValue || 0), 0);
  const totalReturnPercent = totalInvested > 0 
    ? ((totalProfit / totalInvested) * 100) 
    : 0;

  const activePositions = portfolio.filter((item: any) => item.decision && !item.resolved);
  const resolvedPositions = portfolio.filter((item: any) => item.decision && item.resolved);

  const handleOpenSellSheet = () => {
    if (!selectedPosition) return;
    // Trouver l'item du portfolio correspondant pour récupérer createdAt
    const portfolioItem = portfolio.find(
      (item: any) => 
        item.decisionId === selectedPosition.decisionId && 
        item.position === selectedPosition.position
    );
    
    setSelectedSellItem({
      decisionId: selectedPosition.decisionId,
      position: selectedPosition.position,
      sharesOwned: selectedPosition.sharesOwned,
      decisionTitle: selectedPosition.decisionTitle,
      imageUrl: selectedPosition.decision?.imageUrl,
      createdAt: portfolioItem?.createdAt, // Date de création de l'anticipation
      totalInvested: selectedPosition.totalInvested,
      averageBuyPrice: selectedPosition.averageBuyPrice,
      profit: selectedPosition.profit,
      profitPercentage: selectedPosition.profitPercentage,
    });
    setSellSharesAmount("1");
    setDetailSheetOpen(false);
    setSellSheetOpen(true);
  };

  const handleSell = async () => {
    if (!selectedSellItem) return;

    const shares = parseFloat(sellSharesAmount);
    if (shares <= 0 || shares > selectedSellItem.sharesOwned) {
      toast.error("Nombre de Seeds invalide");
      return;
    }

    setIsSelling(true);
    try {
      const result = await sellShares({
        decisionId: selectedSellItem.decisionId,
        position: selectedSellItem.position,
        shares: Math.floor(shares),
      });

      toast.success(
        `Vente réussie ! Vous avez reçu ${formatNumber(result.net, isMobile)} Seeds`
      );
      setSellSheetOpen(false);
      setSelectedSellItem(null);
      setSellSharesAmount("1");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la vente");
    } finally {
      setIsSelling(false);
    }
  };

  return (
    <div className="pb-20 lg:pb-4">
      {/* Header épuré - Sans cards imbriquées, style simple */}
      <div className="px-4 md:px-6 lg:px-8 pt-6 pb-4 overflow-x-hidden w-full max-w-full">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Titre et badge ROI */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">Mon Portefeuille</h1>
                <p className="text-sm text-muted-foreground">
                  {activePositions.length} position{activePositions.length > 1 ? "s" : ""} active{activePositions.length > 1 ? "s" : ""}
                </p>
              </div>
              {/* Badge ROI */}
              {totalReturnPercent !== 0 && (
                <div className={cn(
                  "px-4 py-2 rounded-xl font-bold text-sm",
                  "flex items-center gap-2",
                  totalReturnPercent > 0
                    ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "text-white")
                    : "bg-red-500/20 text-red-500 border border-red-500/30"
                )}>
                  <SolarIcon 
                    icon={totalReturnPercent > 0 ? "arrow-up-bold" : "arrow-down-bold"} 
                    className="size-4" 
                  />
                  {totalReturnPercent > 0 ? "+" : ""}{totalReturnPercent.toFixed(1)}%
                </div>
              )}
            </div>

            {/* Stats principales - Grid simple sans cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Investi */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <SolarIcon icon="wallet-bold" className="size-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground font-medium">Investi</p>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <SolarIcon icon="leaf-bold" className="size-5 text-primary shrink-0" />
                  <p className="text-2xl md:text-3xl font-bold">{formatNumber(totalInvested, isMobile)}</p>
                </div>
              </div>

              {/* Valeur */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <SolarIcon icon="chart-2-bold" className="size-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground font-medium">Valeur actuelle</p>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <SolarIcon icon="leaf-bold" className="size-5 text-primary shrink-0" />
                  <p className="text-2xl md:text-3xl font-bold">{formatNumber(totalValue, isMobile)}</p>
                </div>
              </div>

              {/* Gains */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <SolarIcon 
                    icon={totalProfit > 0 ? "arrow-up-bold" : totalProfit < 0 ? "arrow-down-bold" : "minus-bold"} 
                    className={cn(
                      "size-4",
                      totalProfit > 0 ? "text-green-500" : totalProfit < 0 ? "text-red-500" : "text-muted-foreground"
                    )} 
                  />
                  <p className="text-sm text-muted-foreground font-medium">Gains/Pertes</p>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <SolarIcon icon="leaf-bold" className={cn(
                    "size-5 shrink-0",
                    totalProfit > 0 ? "text-green-500" : totalProfit < 0 ? "text-red-500" : "text-primary"
                  )} />
                  <p className={cn(
                    "text-2xl md:text-3xl font-bold",
                    totalProfit > 0 ? "text-green-500" : 
                    totalProfit < 0 ? "text-red-500" : 
                    "text-foreground"
                  )}>
                    {totalProfit > 0 ? "+" : ""}{formatNumber(totalProfit, isMobile)}
                  </p>
                </div>
              </div>
            </div>

            {/* Graphique ROI - Desktop visible, mobile compact */}
            {activePositions.length > 0 && (
              <div className="hidden md:block">
                <PortfolioROIChart />
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Graphique ROI - Mobile uniquement (compact) */}
      {activePositions.length > 0 && (
        <div className="px-4 md:hidden pt-4">
          <PortfolioROIChart />
        </div>
      )}

      {/* Positions actives - Cards style MarketCard */}
      {activePositions.length > 0 && (
        <div className="px-4 md:px-6 lg:px-8 pt-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold">Mes positions</h2>
              <span className="text-sm text-muted-foreground">
                {activePositions.length} position{activePositions.length > 1 ? "s" : ""}
              </span>
            </div>
            
            {/* Grid responsive : 1 colonne mobile, 2 tablet, 3 desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activePositions.map((item: any, index: number) => {
                const { 
                  decision, 
                  sharesOwned, 
                  position,
                  currentPrice,
                  _id
                } = item;
                
                const profit = ('profit' in item && typeof item.profit === 'number') ? item.profit : 0;
                const profitPercentage = ('profitPercentage' in item && typeof item.profitPercentage === 'number') ? item.profitPercentage : 0;

                if (!decision) return null;

                const positionValue = position || "yes";

                return (
                  <PositionCard
                    key={_id}
                    item={item}
                    decision={decision}
                    position={positionValue as "yes" | "no"}
                    profit={profit}
                    profitPercentage={profitPercentage}
                    currentPrice={currentPrice}
                    onClick={() => handleOpenDetailSheet(item, decision, positionValue as "yes" | "no")}
                    isMobile={isMobile}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Positions résolues - Style épuré */}
      {resolvedPositions.length > 0 && (
        <div className="px-4 pt-6 pb-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {resolvedPositions.length} position{resolvedPositions.length > 1 ? "s" : ""} terminée{resolvedPositions.length > 1 ? "s" : ""}
          </h2>
          
          <div className="space-y-2">
            {resolvedPositions.map((item: any, index: number) => {
              const { 
                decision, 
                seedsEarned,
                result,
                position,
                _id
              } = item;
              
              const profit = ('profit' in item && typeof item.profit === 'number') ? item.profit : 0;

              if (!decision) return null;

              const isWon = result === "won";
              const finalProfit = seedsEarned !== undefined ? seedsEarned : (profit || 0);
              const positionValue = position || "yes";

              return (
                <motion.div
                  key={_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Link href={`/${decision.slug || decision._id}`} className="block">
                    <div className="relative overflow-hidden rounded-xl group">
                      {/* Image de fond très subtile */}
                      {decision.imageUrl && (
                        <div className="absolute inset-0">
                          <Image
                            src={decision.imageUrl}
                            alt={decision.title || "Décision"}
                            fill
                            className="object-cover opacity-10"
                            sizes="(max-width: 768px) 100vw, 400px"
                          />
                        </div>
                      )}
                      
                      {/* Contenu glassmorphism */}
                      <div className="relative p-3 bg-card/50 backdrop-blur-sm rounded-xl border border-border/20">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-medium leading-tight line-clamp-1 mb-1.5">
                              {decision.title || "Décision sans titre"}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide",
                                positionValue === "yes" 
                                  ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "text-white")
                                  : cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "text-white")
                              )}>
                                {positionValue === "yes" ? "OUI" : "NON"}
                              </span>
                              <span className={cn(
                                "text-[9px] font-medium",
                                isWon ? YES_COLORS.text.light : "text-muted-foreground"
                              )}>
                                {isWon ? "✓ Gagné" : "✗ Perdu"}
                              </span>
                            </div>
                          </div>
                          <p className={cn(
                            "text-base font-bold shrink-0",
                            isWon ? YES_COLORS.text.light : "text-muted-foreground"
                          )}>
                            {isWon ? "+" : ""}{formatNumber(finalProfit, isMobile)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sheet de détail de position - Bottom sur mobile, Right sur desktop */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen} side={isMobile ? "bottom" : "right"}>
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className={cn(
            isMobile ? "h-[90vh] rounded-t-3xl" : "w-[500px] max-w-[90vw]",
            "p-0 overflow-hidden w-full max-w-full"
          )}
        >
          {selectedPosition && (
            <div className={cn(
              "relative flex flex-col overflow-hidden w-full max-w-full min-w-0",
              isMobile ? "h-full" : "h-screen"
            )}>
              {/* Cover progressif partout */}
              {selectedPosition.decision?.imageUrl && (
                <div className="absolute inset-0 z-0">
                  <Image
                    src={selectedPosition.decision.imageUrl}
                    alt={selectedPosition.decisionTitle}
                    fill
                    className="object-cover"
                    sizes={isMobile ? "100vw" : "500px"}
                  />
                  <div className={cn(
                    "absolute inset-0",
                    isMobile 
                      ? "bg-gradient-to-b from-background from-20% via-background/95 to-background"
                      : "bg-gradient-to-l from-background from-10% via-background/95 to-background"
                  )} />
                </div>
              )}

              {/* Contenu avec z-index relatif */}
              <div className="relative z-10 flex flex-col h-full overflow-hidden max-w-full">
                {/* Header compact */}
                <div className="px-4 pt-3 pb-2 shrink-0">
                  <SheetHeader className="text-left p-0">
                    <SheetTitle className="text-sm font-bold mb-1.5 line-clamp-2">
                      {selectedPosition.decisionTitle}
                    </SheetTitle>
                    <span className={cn(
                      "inline-block px-2.5 py-0.5 rounded-md font-bold text-[10px] w-fit",
                      selectedPosition.position === "yes"
                        ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "text-white")
                        : cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "text-white relative overflow-hidden", "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-zinc-400/10")
                    )}>
                      <span className="relative z-10">{selectedPosition.position === "yes" ? "OUI" : "NON"}</span>
                    </span>
                  </SheetHeader>
                </div>

                {/* Contenu scrollable compact - Design épuré sans cards */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 space-y-4 max-w-full flex flex-col">
                  {/* Gains - Design minimaliste avec pourcentage comme sur les lignes */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">
                      {selectedPosition.profit > 0 ? "Gains réalisés" : selectedPosition.profit < 0 ? "Perte réalisée" : "Aucun gain"}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className={cn(
                        "text-xl font-bold tracking-tight",
                        selectedPosition.profit > 0 
                          ? (selectedPosition.position === "yes" ? YES_COLORS.text.light : NO_COLORS.text.light)
                          : selectedPosition.profit < 0 
                          ? "text-muted-foreground" 
                          : "text-foreground"
                      )}>
                        {selectedPosition.profit > 0 ? "+" : ""}{formatDetailNumber(selectedPosition.profit)}
                      </p>
                      {selectedPosition.profitPercentage !== 0 && (
                        <span className={cn(
                          "text-sm font-medium",
                          selectedPosition.profitPercentage > 0 ? "text-green-500" : 
                          selectedPosition.profitPercentage < 0 ? "text-red-500" : 
                          "text-muted-foreground"
                        )}>
                          {selectedPosition.profitPercentage > 0 ? "▲" : selectedPosition.profitPercentage < 0 ? "▼" : ""} {Math.abs(selectedPosition.profitPercentage).toFixed(2)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Graphique du cours - Pleine hauteur */}
                  <div className="rounded-lg overflow-hidden bg-muted/5 flex-1 min-h-[200px]">
                    <OpinionCourseChart 
                      decisionId={selectedPosition.decisionId} 
                      compact={true}
                      hideLabels={true}
                      hideBottomElements={true}
                      fullHeight={true}
                      position={selectedPosition.position}
                    />
                  </div>

                  {/* Stats sur une ligne avec séparateur */}
                  <DetailStatsRow 
                    sharesOwned={selectedPosition.sharesOwned}
                    decisionId={selectedPosition.decisionId}
                    position={selectedPosition.position}
                  />

                  {/* Section Acheter/Revendre selon le mode */}
                  <div className="pt-4 border-t border-border/20">
                    {buyMoreMode === "buy" ? (
                      <BuyMoreSectionPortfolio
                        selectedPosition={selectedPosition}
                        buyMoreAmount={buyMoreAmount}
                        setBuyMoreAmount={setBuyMoreAmount}
                        isBuyingMore={isBuyingMore}
                        setIsBuyingMore={setIsBuyingMore}
                        buyShares={buyShares}
                        setDetailSheetOpen={setDetailSheetOpen}
                        isMobile={isMobile}
                      />
                    ) : (
                      <SellMoreSectionPortfolio
                        selectedPosition={selectedPosition}
                        sellSharesAmount={sellSharesAmount}
                        setSellSharesAmount={setSellSharesAmount}
                        isSelling={isSelling}
                        setIsSelling={setIsSelling}
                        sellShares={sellShares}
                        setDetailSheetOpen={setDetailSheetOpen}
                        estimatedSellAmount={(() => {
                          if (!selectedPosition || currentPriceDetail === undefined) return { gross: 0, net: 0, fee: 0 };
                          const shares = parseFloat(sellSharesAmount) || 0;
                          if (shares <= 0) return { gross: 0, net: 0, fee: 0 };
                          const gross = currentPriceDetail * shares;
                          const holdingDurationMs = (selectedPosition.createdAt !== undefined && selectedPosition.createdAt !== null)
                            ? Date.now() - selectedPosition.createdAt 
                            : 30 * 24 * 60 * 60 * 1000;
                          const net = calculateSellNetProgressive(gross, holdingDurationMs);
                          const fee = gross - net;
                          return { gross, net, fee };
                        })()}
                      />
                    )}
                  </div>
                </div>

                {/* Footer fixe avec tabs */}
                <div className="shrink-0 px-4 pb-4 pt-2.5 bg-background/95 backdrop-blur-sm border-t border-border/30">
                  <div className="flex gap-2">
                  <Button
                      onClick={() => setBuyMoreMode("buy")}
                      variant={buyMoreMode === "buy" ? "default" : "outline"}
                      size="sm"
                    className={cn(
                        "flex-1 h-9 text-xs font-semibold",
                        buyMoreMode === "buy" && selectedPosition.position === "yes"
                          ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "text-white")
                          : buyMoreMode === "buy" && selectedPosition.position === "no"
                          ? cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "text-white")
                          : ""
                      )}
                    >
                      <SolarIcon icon="add-circle-bold" className="size-3.5 mr-1.5" />
                      Acheter plus
                    </Button>
                    <Button
                      onClick={() => setBuyMoreMode("sell")}
                      variant={buyMoreMode === "sell" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "flex-1 h-9 text-xs font-semibold",
                        buyMoreMode === "sell" && selectedPosition.position === "yes"
                          ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "text-white")
                          : buyMoreMode === "sell" && selectedPosition.position === "no"
                          ? cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "text-white")
                          : ""
                    )}
                  >
                    <SolarIcon icon="cart-3-bold" className="size-3.5 mr-1.5" />
                    Revendre
                  </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Sheet de vente - Bottom sur mobile, Right sur desktop */}
      <Sheet open={sellSheetOpen} onOpenChange={setSellSheetOpen} side={isMobile ? "bottom" : "right"}>
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className={cn(
            isMobile ? "h-[90vh] rounded-t-3xl" : "w-[500px] max-w-[90vw]",
            "p-0 overflow-hidden w-full max-w-full"
          )}
        >
          {selectedSellItem && (
            <div className={cn(
              "relative flex flex-col overflow-hidden w-full max-w-full min-w-0",
              isMobile ? "h-full" : "h-screen"
            )}>
              {/* Cover progressif partout */}
              {selectedSellItem.imageUrl && (
                <div className="absolute inset-0 z-0">
                  <Image
                    src={selectedSellItem.imageUrl}
                    alt={selectedSellItem.decisionTitle}
                    fill
                    className="object-cover"
                    sizes={isMobile ? "100vw" : "500px"}
                  />
                  <div className={cn(
                    "absolute inset-0",
                    isMobile 
                      ? "bg-gradient-to-b from-background from-20% via-background/95 to-background"
                      : "bg-gradient-to-l from-background from-10% via-background/95 to-background"
                  )} />
                </div>
              )}

              {/* Contenu avec z-index relatif */}
              <div className="relative z-10 flex flex-col h-full overflow-hidden max-w-full">
                {/* Header compact */}
                <div className="px-4 pt-3 pb-2 shrink-0">
                  <SheetHeader className="text-left p-0">
                    <SheetTitle className="text-sm font-bold mb-1.5 line-clamp-2">
                      Revendre des Seeds
                    </SheetTitle>
                    <span className={cn(
                      "inline-block px-2.5 py-0.5 rounded-md font-bold text-[10px] w-fit",
                      selectedSellItem.position === "yes"
                        ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "text-white")
                        : cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "text-white relative overflow-hidden", "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-zinc-400/10")
                    )}>
                      <span className="relative z-10">{selectedSellItem.position === "yes" ? "OUI" : "NON"}</span>
                    </span>
                  </SheetHeader>
                </div>

                {/* Contenu scrollable compact */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 space-y-4 max-w-full flex flex-col">
                  {/* Slider pour choisir le nombre de Seeds à revendre */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Seeds à revendre</span>
                      <span className="text-lg font-bold">
                        {formatDetailNumber(parseFloat(sellSharesAmount) || 0)}
                      </span>
                    </div>
                    <Slider
                      value={[parseFloat(sellSharesAmount) || 1]}
                      onValueChange={([value]) => setSellSharesAmount(value.toString())}
                      min={1}
                      max={selectedSellItem.sharesOwned}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Boutons +/- */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const current = parseFloat(sellSharesAmount) || 1;
                        if (current > 1) {
                          setSellSharesAmount((current - 1).toString());
                        }
                      }}
                      disabled={parseFloat(sellSharesAmount) <= 1}
                      className="size-10 rounded-xl"
                    >
                      <Minus className="size-4" />
                    </Button>
                    <div className="flex-1 text-center">
                      <input
                        type="number"
                        value={sellSharesAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          const num = parseFloat(value);
                          if (!isNaN(num) && num >= 1 && num <= selectedSellItem.sharesOwned) {
                            setSellSharesAmount(value);
                          }
                        }}
                        min={1}
                        max={selectedSellItem.sharesOwned}
                        className="w-full text-center text-2xl font-bold bg-transparent border-none outline-none"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const current = parseFloat(sellSharesAmount) || 1;
                        if (current < selectedSellItem.sharesOwned) {
                          setSellSharesAmount((current + 1).toString());
                        }
                      }}
                      disabled={parseFloat(sellSharesAmount) >= selectedSellItem.sharesOwned}
                      className="size-10 rounded-xl"
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>

                    {/* 🎯 VERSION SIMPLIFIÉE : Focus sur l'essentiel */}
                    <div className="space-y-4 pt-2">
                      {/* Montant principal - Mise en avant sans card */}
                      <div className="text-center space-y-2 py-4">
                        <p className="text-xs text-muted-foreground font-medium">Vous recevrez</p>
                        <div className="flex items-center justify-center gap-2">
                          <SolarIcon icon="leaf-bold" className="size-6 text-primary shrink-0" />
                          <span className={cn(
                            "text-3xl font-bold tracking-tight",
                            selectedSellItem.position === "yes" ? YES_COLORS.text.light : NO_COLORS.text.light
                          )}>
                            {formatSeedAmount(estimatedSellAmount.net)}
                          </span>
                        </div>
                        
                        {/* Profit/Perte simple */}
                        {(() => {
                          if (!selectedSellItem.averageBuyPrice || currentPrice === undefined) return null;
                          const sharesToSell = parseFloat(sellSharesAmount) || 0;
                          const investedForShares = (selectedSellItem.averageBuyPrice || 0) * sharesToSell;
                          const profitForShares = estimatedSellAmount.net - investedForShares;
                          
                          if (profitForShares > 0) {
                            return (
                              <p className="text-sm font-semibold text-green-500 mt-2">
                                Gain : +{formatSeedAmount(profitForShares)}
                              </p>
                            );
                          } else if (profitForShares < 0) {
                            return (
                              <p className="text-sm font-semibold text-red-500 mt-2">
                                Perte : {formatSeedAmount(profitForShares)}
                              </p>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Message d'avertissement simplifié (seulement si perte) - sans card */}
                      {(() => {
                        if (!selectedSellItem.averageBuyPrice || currentPrice === undefined) return null;
                        const sharesToSell = parseFloat(sellSharesAmount) || 0;
                        const investedForShares = (selectedSellItem.averageBuyPrice || 0) * sharesToSell;
                        const profitForShares = estimatedSellAmount.net - investedForShares;
                        
                        if (profitForShares < 0) {
                          const priceHasDropped = currentPrice < selectedSellItem.averageBuyPrice;
                          const lossAmount = Math.abs(profitForShares);
                          const lossMessage = priceHasDropped 
                            ? "Le prix a baissé depuis votre achat."
                            : "Les frais sont supérieurs à la plus-value.";
                          
                          return (
                            <div className="py-2">
                              <p className="text-xs text-red-500 font-semibold mb-1">
                                ⚠️ Vous perdrez {formatSeedAmount(lossAmount)} Seeds
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {lossMessage}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}

                    {/* Bouton pour voir les détails */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSellDetails(!showSellDetails)}
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
                    >
                      {showSellDetails ? (
                        <>
                          <ChevronUp className="size-3 mr-1" />
                          Masquer les détails
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-3 mr-1" />
                          Voir les détails
                        </>
                      )}
                    </Button>

                    {/* Détails techniques (dépliables) */}
                    {showSellDetails && (
                      <div className="space-y-2 pt-2 border-t border-border/20">
                        {/* Explication des frais progressifs */}
                        {(() => {
                          const holdingDurationMs = selectedSellItem.createdAt 
                            ? Date.now() - selectedSellItem.createdAt 
                            : 30 * 24 * 60 * 60 * 1000;
                          const holdingDurationDays = holdingDurationMs / (24 * 60 * 60 * 1000);
                          
                          let taxRate: number;
                          let taxRateLabel: string;
                          let holdingDurationLabel: string;
                          if (holdingDurationDays < 1) {
                            taxRate = 0.20;
                            taxRateLabel = "20% (< 24h)";
                            holdingDurationLabel = "moins de 24h";
                          } else if (holdingDurationDays < 7) {
                            taxRate = 0.15;
                            taxRateLabel = "15% (24h-7j)";
                            holdingDurationLabel = `${Math.floor(holdingDurationDays)} jour${Math.floor(holdingDurationDays) > 1 ? "s" : ""}`;
                          } else if (holdingDurationDays < 30) {
                            taxRate = 0.10;
                            taxRateLabel = "10% (7j-30j)";
                            holdingDurationLabel = `${Math.floor(holdingDurationDays)} jour${Math.floor(holdingDurationDays) > 1 ? "s" : ""}`;
                          } else {
                            taxRate = 0.05;
                            taxRateLabel = "5% (> 30j)";
                            holdingDurationLabel = `${Math.floor(holdingDurationDays)} jour${Math.floor(holdingDurationDays) > 1 ? "s" : ""}`;
                          }
                          
                          return (
                            <div className="py-2 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground">Frais</span>
                                <span className="text-xs font-bold text-primary">{taxRateLabel}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Durée : {holdingDurationLabel}
                              </p>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Les frais diminuent avec le temps pour encourager les investissements à long terme.
                              </p>
                            </div>
                          );
                        })()}

                        <div className="flex items-center justify-between py-2">
                          <span className="text-xs text-muted-foreground">Valeur avant frais</span>
                          <div className="flex items-center gap-1">
                            <SolarIcon icon="leaf-bold" className="size-3 text-primary shrink-0" />
                            <span className="text-sm font-semibold">{formatSeedAmount(estimatedSellAmount.gross)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-xs text-muted-foreground">Frais</span>
                          <span className="text-xs text-muted-foreground">
                            -{formatSeedAmount(estimatedSellAmount.fee)}
                          </span>
                        </div>
                        
                        {selectedSellItem.averageBuyPrice && currentPrice !== undefined && (
                          <>
                            <div className="flex items-center justify-between py-2 border-t border-border/20 pt-2">
                              <span className="text-xs text-muted-foreground">Prix d'achat</span>
                              <span className="text-xs font-semibold">{formatSeedAmount(selectedSellItem.averageBuyPrice)}/Seed</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <span className="text-xs text-muted-foreground">Prix actuel</span>
                              <span className="text-xs font-semibold">{formatSeedAmount(currentPrice)}/Seed</span>
                            </div>
                            {(() => {
                              const sharesToSell = parseFloat(sellSharesAmount) || 0;
                              const investedForShares = (selectedSellItem.averageBuyPrice || 0) * sharesToSell;
                              const profitForShares = estimatedSellAmount.net - investedForShares;
                              const profitPercentageForShares = investedForShares > 0 
                                ? ((profitForShares / investedForShares) * 100) 
                                : 0;
                              
                              return (
                                <div className="flex items-center justify-between py-2 border-t border-border/20 pt-2">
                                  <span className="text-xs text-muted-foreground">Rendement</span>
                                  <span className={cn(
                                    "text-xs font-bold",
                                    profitPercentageForShares >= 0 ? "text-green-500" : "text-red-500"
                                  )}>
                                    {profitPercentageForShares >= 0 ? "+" : ""}{profitPercentageForShares.toFixed(2)}%
                                  </span>
                                </div>
                              );
                            })()}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer avec bouton de vente */}
                <SheetFooter className="px-4 pb-6 pt-4 border-t border-border/20 shrink-0">
                  <Button
                    onClick={handleSell}
                    disabled={isSelling || parseFloat(sellSharesAmount) <= 0 || parseFloat(sellSharesAmount) > selectedSellItem.sharesOwned}
                    className={cn(
                      "w-full h-12 text-sm font-bold rounded-xl transition-all relative overflow-hidden",
                      selectedSellItem.position === "yes"
                        ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "hover:opacity-90 text-white")
                        : cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "hover:opacity-90 text-white", "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-zinc-400/10"),
                      (isSelling || parseFloat(sellSharesAmount) <= 0 || parseFloat(sellSharesAmount) > selectedSellItem.sharesOwned) &&
                        "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSelling ? (
                      <>
                        <SolarIcon icon="loading" className="size-4 mr-2 animate-spin" />
                        Vente en cours...
                      </>
                    ) : (
                      <>
                        <SolarIcon icon="cart-3-bold" className="size-4 mr-2" />
                        Revendre {formatDetailNumber(parseFloat(sellSharesAmount) || 0)} Seeds
                      </>
                    )}
                  </Button>
                </SheetFooter>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
