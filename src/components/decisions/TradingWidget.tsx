"use client";

import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "motion/react";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { Minus, Plus } from "lucide-react";
import { PurchaseSuccessModal } from "@/components/ui/PurchaseSuccessModal";

interface TradingWidgetProps {
  decisionId: Id<"decisions">;
}

/**
 * Widget d'achat pour la sidebar droite
 */
export function TradingWidget({ decisionId }: TradingWidgetProps) {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  const decision = useQuery(api.decisions.getDecisionById, { decisionId });
  const tradingPools = useQuery(api.trading.getTradingPools, { decisionId });
  const probability = useQuery(api.trading.getSingleOdds, { decisionId });
  const investmentWindow = useQuery(api.trading.getInvestmentWindow, { decisionId });
  const courseHistory = useQuery(api.trading.getDecisionCourseHistory, { decisionId });
  
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

  const [selectedPosition, setSelectedPosition] = useState<"yes" | "no" | null>(null);
  const [seedAmount, setSeedAmount] = useState<string>("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [purchaseData, setPurchaseData] = useState<{
    decisionId: Id<"decisions">;
    decisionTitle: string;
    position: "yes" | "no";
    shares: number;
    timeAddedMs?: number;
  } | null>(null);

  const buyShares = useMutation(api.trading.buyShares);

  const seedNum = parseFloat(seedAmount) || 0;
  
  // Calculer la variation de probabilité
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
  
  // Calculer le cours actuel (bonding curve) - C'est le prix d'une action actuellement
  const calculateCurrentPrice = (position: "yes" | "no"): number => {
    if (!tradingPools) return 0;
    const pool = position === "yes" ? tradingPools.yes : tradingPools.no;
    if (!pool) return 0;
    const currentSupply = pool.totalSupply || 0;
    const slope = pool.slope;
    return slope * currentSupply; // Prix d'une action = slope * supply actuelle
  };
  
  // Calculer combien d'actions on peut acheter avec un montant en Seed
  // Utilise une itération pour trouver la solution exacte de la bonding curve
  const calculateSharesFromSeed = (position: "yes" | "no", seedAmount: number): number => {
    if (!tradingPools || seedAmount <= 0) return 0;
    const pool = position === "yes" ? tradingPools.yes : tradingPools.no;
    if (!pool) return 0;
    const currentSupply = pool.totalSupply || 0;
    const slope = pool.slope;
    
    // Itérer pour trouver le nombre d'actions qui correspond au montant
    let shares = 0;
    let totalCost = 0;
    const step = 0.01;
    const maxIterations = 100000; // Sécurité
    let iterations = 0;
    
    while (totalCost < seedAmount && iterations < maxIterations) {
      shares += step;
      const newSupply = currentSupply + shares;
      totalCost = (slope / 2) * (newSupply * newSupply - currentSupply * currentSupply);
      iterations++;
    }
    
    // Ajuster légèrement en arrière si on a dépassé
    if (totalCost > seedAmount && shares > step) {
      shares -= step;
    }
    
    return Math.round(shares * 100) / 100; // Arrondir à 2 décimales
  };
  
  // Calculer le coût exact pour un nombre d'actions donné
  const calculateBuyCost = (position: "yes" | "no", shares: number): number => {
    if (!tradingPools || shares <= 0) return 0;
    const pool = position === "yes" ? tradingPools.yes : tradingPools.no;
    if (!pool) return 0;
    const currentSupply = pool.totalSupply || 0;
    const slope = pool.slope;
    const newSupply = currentSupply + shares;
    return Math.round(((slope / 2) * (newSupply * newSupply - currentSupply * currentSupply)) * 100) / 100;
  };
  
  // Calculer le cours après achat (bonding curve)
  const calculatePriceAfterPurchase = (position: "yes" | "no", shares: number): number => {
    if (!tradingPools || shares <= 0) return 0;
    const pool = position === "yes" ? tradingPools.yes : tradingPools.no;
    if (!pool) return 0;
    const currentSupply = pool.totalSupply || 0;
    const slope = pool.slope;
    const newSupply = currentSupply + shares;
    return slope * newSupply;
  };
  
  // Calculer le temps ajouté
  const calculateTimeAdded = (shares: number): number => {
    if (!tradingPools || shares <= 0) return 0;
    const hoursAdded = shares * 0.01;
    return hoursAdded * 60 * 60 * 1000;
  };
  
  // Calculer les valeurs dérivées
  const estimatedShares = selectedPosition ? calculateSharesFromSeed(selectedPosition, seedNum) : 0;
  const estimatedCost = selectedPosition ? calculateBuyCost(selectedPosition, estimatedShares) : 0;
  
  const formatTimeAdded = (ms: number): string => {
    if (ms <= 0) return "0s";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? `${minutes}min` : ""}${seconds > 0 && minutes === 0 ? `${seconds}s` : ""}`;
    }
    if (minutes > 0) {
      return `${minutes}min${seconds > 0 ? `${seconds}s` : ""}`;
    }
    return `${seconds}s`;
  };
  
  // Calculer le prix actuel pour OUI et NON séparément (prix brut de bonding curve)
  const currentPriceYes = calculateCurrentPrice("yes");
  const currentPriceNo = calculateCurrentPrice("no");
  
  // Utiliser directement la probabilité de getSingleOdds pour calculer le multiplicateur
  // getSingleOdds retourne la probabilité normalisée (0-100%) pour OUI
  // Probabilité NON = 100 - probabilité OUI
  const probabilityYes = probability !== undefined ? probability : 50;
  const probabilityNo = probability !== undefined ? 100 - probability : 50;
  
  // Prix actuel pour la position sélectionnée (prix brut pour le calcul du coût)
  const currentPrice = selectedPosition === "yes" ? currentPriceYes : selectedPosition === "no" ? currentPriceNo : 0;
  const priceAfterPurchase = selectedPosition ? calculatePriceAfterPurchase(selectedPosition, estimatedShares) : 0;
  
  // Calculer le multiplicateur correct basé sur la probabilité normalisée
  // Le multiplicateur = 100 / probabilité
  // Si probabilité OUI = 93.8%, multiplicateur = 100 / 93.8 ≈ 1.07x
  // Si probabilité NON = 6.2%, multiplicateur = 100 / 6.2 ≈ 16.13x
  const multiplierYes = probabilityYes > 0 && probabilityYes < 100 ? 100 / probabilityYes : 0;
  const multiplierNo = probabilityNo > 0 && probabilityNo < 100 ? 100 / probabilityNo : 0;
  const currentMultiplier = selectedPosition === "yes" ? multiplierYes : selectedPosition === "no" ? multiplierNo : 0;
  
  const timeAddedMs = estimatedShares > 0 ? calculateTimeAdded(estimatedShares) : 0;
  const isInvestmentExpired = timeRemaining?.isExpired ?? false;

  const handleBuy = async (position: "yes" | "no") => {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    if (isInvestmentExpired) {
      toast.error("La fenêtre d'investissement est fermée");
      return;
    }
    if (seedNum <= 0) {
      toast.error("Montant en Seed invalide");
      return;
    }
    setIsSubmitting(true);
    try {
      // Convertir le montant en Seed en nombre d'actions via la bonding curve
      const sharesToBuy = calculateSharesFromSeed(position, seedNum);
      if (sharesToBuy <= 0) {
        toast.error("Montant trop faible pour acheter des actions");
        setIsSubmitting(false);
        return;
      }
      const timeAddedMs = calculateTimeAdded(sharesToBuy);
      await buyShares({ decisionId, position, shares: sharesToBuy });
      setPurchaseData({
        decisionId,
        decisionTitle: decision?.title || "Décision",
        position,
        shares: sharesToBuy,
        timeAddedMs,
      });
      setShowPurchaseSuccess(true);
      setSeedAmount("1");
      setSelectedPosition(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!decision || decision.status === "resolved") return null;

  return (
    <>
      <div className="space-y-4 p-4 rounded-xl border-2 border-border/50 bg-gradient-to-br from-background via-background to-muted/20 shadow-lg">
        {/* Header avec probabilité et variation - Style Polymarket attractif */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-foreground">Prendre position</h2>
          {probability !== undefined ? (
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-2xl font-bold",
                  probability >= 50 ? YES_COLORS.text.light : NO_COLORS.text.light
                )}>
                  {probability.toFixed(1)}%
                </span>
                {probabilityVariation !== 0 && (
                  <span className={cn(
                    "text-xs font-semibold px-1.5 py-0.5 rounded",
                    probabilityVariation > 0 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                  )}>
                    {probabilityVariation > 0 ? "+" : ""}{probabilityVariation.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {probability >= 50 
                  ? `${probability.toFixed(1)}% pensent que ça va arriver`
                  : `${(100 - probability).toFixed(1)}% pensent que ça n'arrivera pas`}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <SolarIcon icon="loading" className="size-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Chargement...</span>
            </div>
          )}
        </div>

        {/* Boutons OUI/NON horizontaux - Style Polymarket attractif */}
        <div className="grid grid-cols-2 gap-2.5">
          <motion.button
            whileHover={!isInvestmentExpired ? { scale: 1.03, y: -1 } : {}}
            whileTap={!isInvestmentExpired ? { scale: 0.97 } : {}}
            onClick={() => {
              if (isInvestmentExpired) {
                toast.error("La fenêtre d'investissement est fermée");
                return;
              }
              if (!isAuthenticated) {
                router.push("/sign-in");
                return;
              }
              setSelectedPosition(selectedPosition === "yes" ? null : "yes");
            }}
            disabled={isInvestmentExpired}
            className={cn(
              "p-3 rounded-lg border-2 transition-all relative overflow-hidden",
              "shadow-sm hover:shadow-md",
              selectedPosition === "yes"
                ? cn(
                    "bg-gradient-to-br", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to,
                    "border-primary shadow-lg ring-2 ring-primary/20"
                  )
                : cn(
                    "bg-background/80 border-border/60 hover:border-primary/60",
                    !isInvestmentExpired && "hover:bg-primary/5 hover:shadow-md"
                  )
            )}
          >
            {selectedPosition === "yes" && (
              <>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  animate={{
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  }}
                />
              </>
            )}
            <div className="relative flex flex-col items-center gap-1">
              <SolarIcon 
                icon="check-circle-bold" 
                className={cn("size-7", selectedPosition === "yes" ? "text-white drop-shadow-lg" : "text-muted-foreground")} 
              />
              <span className={cn("text-sm font-bold", selectedPosition === "yes" ? "text-white drop-shadow-md" : "text-foreground")}>
                OUI
              </span>
              {probability !== undefined && (
                <span className={cn("text-[10px] font-semibold", selectedPosition === "yes" ? "text-white/90" : "text-muted-foreground")}>
                  {probability.toFixed(1)}%
                </span>
              )}
            </div>
          </motion.button>

          <motion.button
            whileHover={!isInvestmentExpired ? { scale: 1.03, y: -1 } : {}}
            whileTap={!isInvestmentExpired ? { scale: 0.97 } : {}}
            onClick={() => {
              if (isInvestmentExpired) {
                toast.error("La fenêtre d'investissement est fermée");
                return;
              }
              if (!isAuthenticated) {
                router.push("/sign-in");
                return;
              }
              setSelectedPosition(selectedPosition === "no" ? null : "no");
            }}
            disabled={isInvestmentExpired}
            className={cn(
              "p-3 rounded-lg border-2 transition-all relative overflow-hidden",
              "shadow-sm hover:shadow-md",
              selectedPosition === "no"
                ? cn(
                    "bg-gradient-to-br", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to,
                    "border-zinc-400/60 shadow-lg ring-2 ring-zinc-400/20"
                  )
                : cn(
                    "bg-background/80 border-border/60 hover:border-zinc-400/60",
                    !isInvestmentExpired && "hover:bg-zinc-500/5 hover:shadow-md"
                  )
            )}
          >
            {selectedPosition === "no" && (
              <>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-0 bg-white/8"
                  animate={{
                    opacity: [0.08, 0.15, 0.08],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  }}
                />
              </>
            )}
            <div className="relative flex flex-col items-center gap-1">
              <SolarIcon 
                icon="close-circle-bold" 
                className={cn("size-7", selectedPosition === "no" ? "text-white drop-shadow-lg" : "text-muted-foreground")} 
              />
              <span className={cn("text-sm font-bold", selectedPosition === "no" ? "text-white drop-shadow-md" : "text-foreground")}>
                NON
              </span>
              {probability !== undefined && (
                <span className={cn("text-[10px] font-semibold", selectedPosition === "no" ? "text-white/90" : "text-muted-foreground")}>
                  {(100 - probability).toFixed(1)}%
                </span>
              )}
            </div>
          </motion.button>
        </div>

        {/* Formulaire d'achat - Compact avec toutes les infos */}
        {selectedPosition && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 pt-3 border-t border-border/30"
          >
            {/* Input montant en Seed - Style Polymarket */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground">Montant à investir</label>
              <div className={cn(
                "relative rounded-lg border-2 transition-all",
                isFocused
                  ? selectedPosition === "yes"
                    ? "border-primary bg-primary/5"
                    : selectedPosition === "no"
                    ? "border-zinc-400 bg-zinc-500/5"
                    : "border-primary/50 bg-background"
                  : "border-border/50 bg-muted/30",
                "hover:border-primary/70"
              )}>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1000000"
                    value={seedAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permettre les nombres décimaux
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setSeedAmount(value);
                      }
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="0.00"
                    className={cn(
                      "flex-1 bg-transparent text-lg font-bold text-foreground outline-none",
                      "placeholder:text-muted-foreground/50"
                    )}
                  />
                  <span className="text-xs text-muted-foreground font-medium">Seed</span>
                </div>
                {/* Boutons +/- compacts */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const newValue = Math.max(0.01, Math.round((seedNum - 0.1) * 100) / 100);
                      setSeedAmount(newValue.toFixed(2));
                    }}
                    disabled={seedNum <= 0.01}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "size-5 rounded flex items-center justify-center",
                      "bg-background/80 hover:bg-muted border border-border/50",
                      "disabled:opacity-30 disabled:cursor-not-allowed"
                    )}
                  >
                    <Minus className="size-3 text-foreground" />
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const newValue = Math.min(1000000, Math.round((seedNum + 0.1) * 100) / 100);
                      setSeedAmount(newValue.toFixed(2));
                    }}
                    disabled={seedNum >= 1000000}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "size-5 rounded flex items-center justify-center",
                      "bg-background/80 hover:bg-muted border border-border/50",
                      "disabled:opacity-30 disabled:cursor-not-allowed"
                    )}
                  >
                    <Plus className="size-3 text-foreground" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Détails simplifiés - Toujours affichés (pré-sélection) */}
            {seedNum > 0 ? (
              <div className="p-3 rounded-lg bg-gradient-to-br from-muted/40 via-muted/30 to-muted/20 border border-border/30 shadow-sm space-y-3">
                {/* Montant investi */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Montant investi</span>
                  <SeedDisplay
                    amount={seedNum}
                    variant="default"
                    className="text-sm font-bold"
                    iconSize="size-3"
                  />
                </div>
                
                {/* Coût réel (si position sélectionnée) */}
                {selectedPosition && estimatedCost > 0 && Math.abs(estimatedCost - seedNum) > 0.01 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Coût réel</span>
                    <SeedDisplay
                      amount={estimatedCost}
                      variant="default"
                      className="text-sm font-bold"
                      iconSize="size-3"
                    />
                  </div>
                )}
                
                {/* Croissance du cours (variation de probabilité) */}
                {probabilityVariation !== 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Croissance du cours</span>
                    <span className={cn(
                      "text-xs font-semibold",
                      probabilityVariation > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {probabilityVariation > 0 ? "+" : ""}{probabilityVariation.toFixed(1)}%
                    </span>
                  </div>
                )}
                
                {/* Coefficient multiplicateur - Toujours affiché pour OUI et NON */}
                <div className="space-y-2">
                  {multiplierYes > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Multiplicateur OUI</span>
                      <span className={cn(
                        "text-xs font-bold",
                        selectedPosition === "yes" ? "text-primary" : "text-muted-foreground"
                      )}>
                        {multiplierYes.toFixed(2)}x
                      </span>
                    </div>
                  )}
                  {multiplierNo > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Multiplicateur NON</span>
                      <span className={cn(
                        "text-xs font-bold",
                        selectedPosition === "no" ? "text-primary" : "text-muted-foreground"
                      )}>
                        {multiplierNo.toFixed(2)}x
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Gain potentiel à la résolution si on a vu juste */}
                {selectedPosition && currentMultiplier > 0 && estimatedCost > 0 && (
                  <div className="border-t border-border/30 pt-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Gain potentiel</span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary">
                          <SeedDisplay
                            amount={currentMultiplier * estimatedCost}
                            variant="default"
                            className="text-sm font-bold"
                            iconSize="size-3"
                            showIcon={false}
                          /> Seed
                        </div>
                        <div className="text-[9px] text-muted-foreground">
                          si vous avez vu juste
                        </div>
                      </div>
                    </div>
                    <p className="text-[8px] text-muted-foreground/80 italic">
                      Estimation basée sur le cours actuel. Le gain réel dépendra du cours à la résolution.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Affichage pré-sélection : montrer les multiplicateurs même sans montant
              <div className="p-3 rounded-lg bg-gradient-to-br from-muted/40 via-muted/30 to-muted/20 border border-border/30 shadow-sm space-y-3">
                {/* Croissance du cours */}
                {probabilityVariation !== 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Croissance du cours</span>
                    <span className={cn(
                      "text-xs font-semibold",
                      probabilityVariation > 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {probabilityVariation > 0 ? "+" : ""}{probabilityVariation.toFixed(1)}%
                    </span>
                  </div>
                )}
                
                {/* Coefficient multiplicateur - Toujours affiché */}
                <div className="space-y-2">
                  {multiplierYes > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Multiplicateur OUI</span>
                      <span className="text-xs font-bold text-muted-foreground">
                        {multiplierYes.toFixed(2)}x
                      </span>
                    </div>
                  )}
                  {multiplierNo > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Multiplicateur NON</span>
                      <span className="text-xs font-bold text-muted-foreground">
                        {multiplierNo.toFixed(2)}x
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <motion.div
              whileHover={!isSubmitting && seedNum > 0 && selectedPosition && !isInvestmentExpired ? { scale: 1.01 } : {}}
              whileTap={!isSubmitting && seedNum > 0 && selectedPosition && !isInvestmentExpired ? { scale: 0.99 } : {}}
            >
              <Button
                onClick={() => selectedPosition && handleBuy(selectedPosition)}
                disabled={isSubmitting || seedNum <= 0 || !selectedPosition || isInvestmentExpired}
                className={cn(
                  "w-full h-10 text-sm font-bold rounded-lg transition-all shadow-md hover:shadow-lg",
                  selectedPosition === "yes"
                    ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "hover:opacity-95 text-white ring-2 ring-primary/30")
                    : selectedPosition === "no"
                    ? cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "hover:opacity-95 text-white ring-2 ring-zinc-400/30")
                    : "bg-muted",
                  (isSubmitting || seedNum <= 0 || !selectedPosition || isInvestmentExpired) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <SolarIcon icon="loading" className="size-3.5 mr-1.5 animate-spin" />
                    Achat en cours...
                  </>
                ) : (
                  <>
                    <SolarIcon icon="cart-bold" className="size-3.5 mr-1.5" />
                    Investir <SeedDisplay amount={seedNum} variant="default" className="text-sm font-bold" iconSize="size-3.5" showIcon={false} /> Seed
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Countdown FOMO - Style Polymarket */}
        {timeRemaining && !timeRemaining.isExpired && (
          <div className="pt-3 border-t border-border/30">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 border border-primary/40 shadow-sm">
              <SolarIcon icon="clock-circle-bold" className="size-3.5 text-primary" />
              <span className="text-[10px] font-mono text-primary font-bold">
                {timeRemaining.days > 0
                  ? `${timeRemaining.days}j ${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}`
                  : `${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal de succès */}
      {purchaseData && (
        <PurchaseSuccessModal
          open={showPurchaseSuccess}
          onOpenChange={setShowPurchaseSuccess}
          decisionId={purchaseData.decisionId}
          decisionTitle={purchaseData.decisionTitle}
          position={purchaseData.position}
          shares={purchaseData.shares}
          timeAddedMs={purchaseData.timeAddedMs}
        />
      )}
    </>
  );
}

