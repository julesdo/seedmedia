"use client";

import { useState, useEffect } from "react";
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
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "@/contexts/UserContext";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { Input } from "@/components/ui/input";
import { OpinionCourseChart } from "./OpinionCourseChart";

interface TradingInterfaceProps {
  decisionId: Id<"decisions">;
  question: string;
  answer1: string; // Scénario OUI
  status: "announced" | "tracking" | "resolved";
  compact?: boolean;
}

export function TradingInterface({
  decisionId,
  question,
  answer1,
  status,
  compact,
}: TradingInterfaceProps) {
  // Récupérer la décision pour le countdown FOMO
  const decision = useQuery(api.decisions.getDecisionById, { decisionId });
  
  // 🎯 FOMO Countdown : Calculer le temps restant pour investir (fenêtre variable)
  const investmentWindow = useQuery(api.trading.getInvestmentWindow, { decisionId });

  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  // Vérifier si la fenêtre d'investissement est expirée
  const isInvestmentExpired = timeRemaining?.isExpired ?? false;

  useEffect(() => {
    if (!decision?.createdAt || !investmentWindow) return;

    const updateCountdown = () => {
      const now = Date.now();
      const createdAt = decision.createdAt;
      const expiresAt = createdAt + investmentWindow;
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
    const interval = setInterval(updateCountdown, 1000); // Mise à jour chaque seconde

    return () => clearInterval(interval);
  }, [decision?.createdAt, investmentWindow]);
  const { isAuthenticated } = useConvexAuth();
  const { user: currentUser } = useUser();
  const router = useRouter();

  // Récupérer les pools de trading
  const tradingPools = useQuery(
    api.trading.getTradingPools,
    { decisionId }
  );

  // Récupérer le portefeuille de l'utilisateur pour cette décision
  const userPortfolio = useQuery(
    api.trading.getUserPortfolio,
    isAuthenticated ? { decisionId } : "skip"
  );

  // Récupérer les prix actuels
  const yesPrice = useQuery(
    api.trading.getCurrentPriceForPosition,
    { decisionId, position: "yes" }
  );
  const noPrice = useQuery(
    api.trading.getCurrentPriceForPosition,
    { decisionId, position: "no" }
  );

  // Récupérer l'historique pour calculer les variations
  const courseHistory = useQuery(api.trading.getDecisionCourseHistory, {
    decisionId,
  });

  // Calculer les variations
  const calculateVariations = () => {
    if (!courseHistory || !courseHistory.history || courseHistory.history.length === 0) {
      return { yesVariationPercent: 0, noVariationPercent: 0 };
    }

    const { history } = courseHistory;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const todayFirstPoint = history.find((point) => (point.timestamp || 0) >= todayStart) || history[0];
    const lastPoint = history[history.length - 1];
    const openingPoint = todayFirstPoint || history[0];
    
    const yesVariation = (lastPoint.yes || 0) - (openingPoint.yes || 0);
    const noVariation = (lastPoint.no || 0) - (openingPoint.no || 0);
    
    const yesVariationPercent = (openingPoint.yes || 0) > 0 
      ? Math.round((yesVariation / openingPoint.yes) * 100) 
      : 0;
    const noVariationPercent = (openingPoint.no || 0) > 0 
      ? Math.round((noVariation / openingPoint.no) * 100) 
      : 0;

    return { yesVariationPercent, noVariationPercent };
  };

  const { yesVariationPercent, noVariationPercent } = calculateVariations();

  // Mutations
  const buyShares = useMutation(api.trading.buyShares);

  // États locaux
  const [selectedPosition, setSelectedPosition] = useState<"yes" | "no" | null>(null);
  const [sharesAmount, setSharesAmount] = useState<string>("1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Récupérer les actions possédées par position
  const yesShares = userPortfolio?.find((p) => p.position === "yes")?.sharesOwned || 0;
  const noShares = userPortfolio?.find((p) => p.position === "no")?.sharesOwned || 0;

  // Calculer le coût estimé pour l'achat
  const calculateBuyCost = (position: "yes" | "no", shares: number): number => {
    if (!tradingPools || shares <= 0) return 0;
    const pool = position === "yes" ? tradingPools.yes : tradingPools.no;
    if (!pool) return 0;

    // Utiliser la formule de bonding curve
    const currentSupply = pool.totalSupply;
    const slope = pool.slope;
    const newSupply = currentSupply + shares;
    const cost = (slope / 2) * (newSupply * newSupply - currentSupply * currentSupply);
    return Math.round(cost * 100) / 100;
  };

  const sharesNum = parseInt(sharesAmount) || 0;
  const estimatedCost = selectedPosition
    ? calculateBuyCost(selectedPosition, sharesNum)
    : 0;

  // Calculer le temps ajouté pour cet achat (PROGRESSIF)
  const calculateTimeAdded = (sharesPurchased: number): number => {
    if (!tradingPools || sharesPurchased <= 0) return 0;
    
    // Formule progressive : +0.01h (36 secondes) par action
    // Le temps ajouté est directement proportionnel au nombre d'actions achetées
    const hoursAdded = sharesPurchased * 0.01; // Progressif : 1 action = 0.01h (36s), 10 actions = 0.1h (6min), 100 actions = 1h
    
    // Convertir en millisecondes
    return hoursAdded * 60 * 60 * 1000;
  };

  // Gérer l'achat
  const handleBuy = async (position: "yes" | "no") => {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    if (isInvestmentExpired) {
      toast.error("La fenêtre d'investissement est fermée");
      return;
    }

    if (sharesNum <= 0) {
      toast.error("Veuillez entrer un nombre d'actions valide");
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculer le temps ajouté AVANT l'achat (basé sur l'état actuel)
      const timeAddedMs = calculateTimeAdded(sharesNum);
      
      const result = await buyShares({
        decisionId,
        position,
        shares: sharesNum,
      });

      // Formater le temps ajouté pour l'affichage
      const formatTimeAdded = (ms: number): string => {
        if (ms <= 0) return "";
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
      
      const timeAddedText = formatTimeAdded(timeAddedMs);
      const description = timeAddedText
        ? `${sharesNum} actions ${position === "yes" ? "OUI" : "NON"} achetées pour ${result.cost.toFixed(2)} Seeds • +${timeAddedText} ajouté à la fenêtre`
        : `${sharesNum} actions ${position === "yes" ? "OUI" : "NON"} achetées pour ${result.cost.toFixed(2)} Seeds`;

      toast.success("Achat réussi !", {
        description,
      });

      setSharesAmount("1");
      setSelectedPosition(null);
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue lors de l'achat",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (status === "resolved") {
    return null;
  }

  return (
    <Card className="border-2 border-border/50 shadow-xl overflow-hidden rounded-lg">
      <CardContent className="p-0">
        {/* Header ultra-léger - Style reels */}
        <div className="p-3 border-b border-border/30 space-y-2">
          <p className="text-xs font-medium leading-tight text-foreground/90">{question}</p>
          {/* Countdown FOMO */}
          {timeRemaining && !timeRemaining.isExpired && (
            <p className="text-xs font-mono text-primary/90 tracking-tight">
              {timeRemaining.days > 0
                ? `${timeRemaining.days}j ${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`
                : timeRemaining.hours > 0
                ? `${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`
                : `${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`}
            </p>
          )}
          {timeRemaining?.isExpired && (
            <p className="text-xs font-medium text-muted-foreground/90">
              Fenêtre d'investissement fermée
            </p>
          )}
        </div>

        {/* Graphique intégré - Mode compact mobile */}
        <div className="p-3 border-b border-border/30">
          <OpinionCourseChart decisionId={decisionId} compact={true} />
        </div>

          {/* Positions OUI/NON - Style reels avec icônes */}
          <div className="grid grid-cols-2 gap-2 px-3 py-3">
            {/* OUI */}
            <motion.button
              whileHover={!isInvestmentExpired ? { scale: selectedPosition === "yes" ? 1 : 1.02 } : {}}
              whileTap={!isInvestmentExpired ? { scale: 0.98 } : {}}
              onClick={() => {
                if (isInvestmentExpired) {
                  toast.error("La fenêtre d'investissement est fermée");
                  return;
                }
                setSelectedPosition(selectedPosition === "yes" ? null : "yes");
              }}
              disabled={isInvestmentExpired}
              className={cn(
                "p-3 transition-all relative rounded-lg border-2",
                selectedPosition === "yes"
                  ? cn(YES_COLORS.bg.medium, YES_COLORS.border.dark)
                  : cn("bg-background border-border/30", "hover:" + YES_COLORS.border.medium)
              )}
            >

              <div className="relative flex flex-col items-center justify-center gap-2">
                {/* Icône principale */}
                <motion.div
                  animate={{
                    scale: selectedPosition === "yes" ? 1.1 : 1,
                  }}
                  className={cn("size-14 rounded-xl border-2 flex items-center justify-center", YES_COLORS.bg.dark, YES_COLORS.border.dark)}
                >
                  <SolarIcon icon="check-circle-bold" className={cn("size-7", YES_COLORS.text.light)} />
                </motion.div>
                {/* Prix - Style reels */}
                <div className="flex flex-col items-center gap-0.5">
                  {yesPrice !== undefined ? (
                    <SeedDisplay amount={yesPrice} variant="inline" iconSize="size-3" className={cn(YES_COLORS.text.light, "font-bold text-sm")} />
                  ) : (
                    <SolarIcon icon="loading" className="size-3 text-muted-foreground animate-spin" />
                  )}
                  {yesVariationPercent !== 0 && (
                    <span className={cn(
                      "text-[9px] font-bold",
                      yesVariationPercent > 0 ? YES_COLORS.text.light : "text-muted-foreground"
                    )}>
                      {yesVariationPercent > 0 ? "↑" : "↓"} {Math.abs(yesVariationPercent)}%
                    </span>
                  )}
                </div>
                {/* Checkbox */}
                {selectedPosition === "yes" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn("absolute -top-1 -right-1 size-5 rounded-full flex items-center justify-center border-2 border-background", "bg-gradient-to-br", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to)}
                  >
                    <SolarIcon icon="check-bold" className="size-3 text-white" />
                  </motion.div>
                )}
              </div>
            </motion.button>

            {/* NON */}
            <motion.button
              whileHover={!isInvestmentExpired ? { scale: selectedPosition === "no" ? 1 : 1.02 } : {}}
              whileTap={!isInvestmentExpired ? { scale: 0.98 } : {}}
              onClick={() => {
                if (isInvestmentExpired) {
                  toast.error("La fenêtre d'investissement est fermée");
                  return;
                }
                setSelectedPosition(selectedPosition === "no" ? null : "no");
              }}
              disabled={isInvestmentExpired}
              className={cn(
                "p-3 transition-all relative rounded-lg border-2",
                isInvestmentExpired && "opacity-50 cursor-not-allowed",
                selectedPosition === "no"
                  ? cn(NO_COLORS.bg.medium, NO_COLORS.border.dark, "relative overflow-hidden")
                  : cn("bg-background border-border/30", !isInvestmentExpired && "hover:" + NO_COLORS.border.medium)
              )}
            >

              <div className="relative flex flex-col items-center justify-center gap-2">
                {/* Icône principale */}
                <motion.div
                  animate={{
                    scale: selectedPosition === "no" ? 1.1 : 1,
                  }}
                  className={cn("size-14 rounded-xl border-2 flex items-center justify-center relative overflow-hidden", NO_COLORS.bg.dark, NO_COLORS.border.dark)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-slate-400/5 pointer-events-none" />
                  <SolarIcon icon="close-circle-bold" className={cn("size-7 relative z-10", NO_COLORS.text.light)} />
                </motion.div>
                {/* Prix - Style reels */}
                <div className="flex flex-col items-center gap-0.5">
                  {noPrice !== undefined ? (
                    <SeedDisplay amount={noPrice} variant="inline" iconSize="size-3" className={cn(NO_COLORS.text.light, "font-bold text-sm")} />
                  ) : (
                    <SolarIcon icon="loading" className="size-3 text-muted-foreground animate-spin" />
                  )}
                  {noVariationPercent !== 0 && (
                    <span className={cn(
                      "text-[9px] font-bold",
                      noVariationPercent > 0 ? YES_COLORS.text.light : "text-muted-foreground"
                    )}>
                      {noVariationPercent > 0 ? "↑" : "↓"} {Math.abs(noVariationPercent)}%
                    </span>
                  )}
                </div>
                {/* Checkbox */}
                {selectedPosition === "no" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn("absolute -top-1 -right-1 size-5 rounded-full flex items-center justify-center border-2 border-background relative overflow-hidden", "bg-gradient-to-br", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full" />
                    <SolarIcon icon="check-bold" className="size-3 text-white relative z-10" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          </div>

        {/* Formulaire style reels - Ultra-léger */}
        <div className={cn(
          "border-t border-border/30 transition-all",
          selectedPosition 
            ? "bg-background" 
            : "bg-muted/30 opacity-50"
        )}>
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  min="1"
                  value={sharesAmount}
                  onChange={(e) => setSharesAmount(e.target.value)}
                  placeholder="1"
                  disabled={!selectedPosition}
                  className={cn(
                    "h-10 text-sm font-medium pr-8",
                    !selectedPosition && "opacity-40 cursor-not-allowed"
                  )}
                />
                <SolarIcon icon="chart-2-bold" className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>

            <Button
              onClick={() => selectedPosition && handleBuy(selectedPosition)}
              disabled={isSubmitting || sharesNum <= 0 || !selectedPosition || isInvestmentExpired}
              className={cn(
                "w-full h-10 text-sm font-semibold transition-all rounded-lg",
                selectedPosition && sharesNum > 0
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <SolarIcon icon="loading" className="size-4 animate-spin mx-auto" />
              ) : selectedPosition && sharesNum > 0 ? (
                <div className="flex items-center justify-center gap-2 w-full">
                  <SolarIcon icon="cart-bold" className="size-4" />
                  <SeedDisplay 
                    amount={estimatedCost} 
                    variant="inline" 
                    iconSize="size-3"
                    className="font-bold"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5">
                  <SolarIcon icon="hand-stars-bold" className="size-4" />
                  <span className="text-[11px]">Sélectionner</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

