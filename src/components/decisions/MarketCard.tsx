"use client";

import { useState, useEffect } from "react";
import { useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useMarketCardData } from "@/hooks/useMarketCardData";
import { Link } from "next-view-transitions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { SaveButton } from "./SaveButton";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { Badge } from "@/components/ui/badge";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PurchaseSuccessModal } from "@/components/ui/PurchaseSuccessModal";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { ComponentType } from "react";

// Lazy load Framer Motion pour réduire le bundle initial
// Utiliser des composants simples par défaut, motion se charge en arrière-plan
const MotionDiv = dynamic(
  () => import("motion/react").then((mod) => mod.motion.div),
  { 
    ssr: false,
    loading: () => <div />,
  }
) as ComponentType<any>;

const MotionButton = dynamic(
  () => import("motion/react").then((mod) => mod.motion.button),
  { 
    ssr: false,
    loading: () => <button />,
  }
) as ComponentType<any>;
import { Minus, Plus } from "lucide-react";
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
  priority?: boolean; // Pour précharger les images critiques (LCP)
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
  priority = false,
}: MarketCardProps) {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const buyShares = useMutation(api.trading.buyShares);
  
  // États pour le sheet d'investissement
  const [showInvestSheet, setShowInvestSheet] = useState(false);
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Utiliser le hook optimisé pour charger toutes les données en une fois
  const { decisionData, probability, tradingPools, courseHistory, investmentWindow, userBalance } = useMarketCardData(decision._id);

  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    if (!decisionData?.createdAt || !investmentWindow) return;
    const updateCountdown = () => {
      const now = Date.now();
      const expiresAt = decisionData.createdAt + investmentWindow;
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
  }, [decisionData?.createdAt, investmentWindow]);

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

  const seedNum = parseFloat(seedAmount) || 0;
  const isInvestmentExpired = timeRemaining?.isExpired ?? false;

  // Déterminer si la card mérite un bandeau spécial
  const getSpecialBanner = useMemo(() => {
    const isHighVolume = totalVolume > 1000;
    const isHot = Math.abs(probabilityVariation) > 5; // Forte variation
    const isRecent = decision.date > Date.now() - 24 * 60 * 60 * 1000; // Moins de 24h
    const isActive = decision.anticipationsCount > 10;
    
    if (isHighVolume && isHot) {
      return { type: "trending", label: "Tendance", color: "from-primary via-blue-500 to-primary" };
    }
    if (isHighVolume) {
      return { type: "volume", label: "Volume élevé", color: "from-green-500 via-emerald-500 to-green-500" };
    }
    if (isHot) {
      return { type: "hot", label: "En mouvement", color: "from-orange-500 via-red-500 to-orange-500" };
    }
    if (isRecent && isActive) {
      return { type: "new", label: "Nouveau", color: "from-purple-500 via-pink-500 to-purple-500" };
    }
    if (isRecent) {
      return { type: "recent", label: "Récent", color: "from-blue-500 via-cyan-500 to-blue-500" };
    }
    return null;
  }, [totalVolume, probabilityVariation, decision.date, decision.anticipationsCount]);

  // Calculer combien d'actions on peut acheter avec un montant en Seed
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

  // Calculer le temps ajouté
  const calculateTimeAdded = (shares: number): number => {
    if (!tradingPools || shares <= 0) return 0;
    const hoursAdded = shares * 0.01;
    return hoursAdded * 60 * 60 * 1000;
  };

  const estimatedShares = selectedPosition ? calculateSharesFromSeed(selectedPosition, seedNum) : 0;
  const estimatedCost = selectedPosition ? calculateBuyCost(selectedPosition, estimatedShares) : 0;
  const timeAddedMs = estimatedShares > 0 ? calculateTimeAdded(estimatedShares) : 0;

  // Calculer les multiplicateurs
  const multiplierYes = probabilityYes > 0 && probabilityYes < 100 ? 100 / probabilityYes : 0;
  const multiplierNo = probabilityNo > 0 && probabilityNo < 100 ? 100 / probabilityNo : 0;
  const currentMultiplier = selectedPosition === "yes" ? multiplierYes : selectedPosition === "no" ? multiplierNo : 0;

  // Gérer le clic sur les boutons OUI/NON
  const handlePositionClick = (e: React.MouseEvent, position: "yes" | "no") => {
    e.preventDefault();
    e.stopPropagation();
    
    if (decision.status === "resolved") {
      toast.error("Cette décision est déjà résolue");
      return;
    }
    
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    
    if (isInvestmentExpired) {
      toast.error("La fenêtre d'investissement est fermée");
      return;
    }
    
    setSelectedPosition(position);
    setShowInvestSheet(true);
  };

  // Gérer l'investissement
  const handleBuy = async () => {
    if (!selectedPosition) return;
    
    if (seedNum <= 0) {
      toast.error("Montant en Seed invalide");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const sharesToBuy = calculateSharesFromSeed(selectedPosition, seedNum);
      if (sharesToBuy <= 0) {
        toast.error("Montant trop faible pour acheter des actions");
        setIsSubmitting(false);
        return;
      }
      const timeAddedMs = calculateTimeAdded(sharesToBuy);
      await buyShares({ decisionId: decision._id, position: selectedPosition, shares: sharesToBuy });
      setPurchaseData({
        decisionId: decision._id,
        decisionTitle: decisionData?.title || decision.question || "Décision",
        position: selectedPosition,
        shares: sharesToBuy,
        timeAddedMs,
      });
      setShowPurchaseSuccess(true);
      setShowInvestSheet(false);
      setSeedAmount("1");
      setSelectedPosition(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden",
        "bg-background rounded-lg border border-border/50",
        "hover:border-border hover:shadow-lg",
        "transition-all duration-200",
        variant === "grid" ? "h-full" : "",
        className
      )}
      style={{ 
        maxWidth: "100%",
        willChange: "transform", // Optimisation pour les animations
        transform: "translateZ(0)", // Force GPU acceleration
      }}
    >
      {/* Bandeau spécial animé - En haut de la card */}
      {getSpecialBanner && (
        <div className="relative w-full">
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "h-3 w-full flex items-center justify-center relative overflow-hidden",
              "bg-gradient-to-r opacity-60",
              getSpecialBanner.color
            )}
          >
            <MotionDiv
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "easeInOut",
              }}
            />
            <span className="relative z-10 text-[8px] font-medium uppercase tracking-wider text-white/90">
              {getSpecialBanner.label}
            </span>
          </MotionDiv>
        </div>
      )}

      {/* Header - Style Polymarket simple */}
      <Link href={`/${decision.slug}`} className={cn(
        "relative z-10 flex items-start justify-between hover:opacity-80 transition-opacity",
        getSpecialBanner ? "p-4 pt-3 pb-3" : "p-4 pb-3"
      )}>
        {/* Icône + Question */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icône simple */}
          <div className="size-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {decision.imageUrl ? (
              <Image
                src={decision.imageUrl}
                alt={decision.title}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                sizes="40px"
                priority={priority}
              />
            ) : (
              <SolarIcon icon="document-text-bold" className="size-5 text-primary" />
            )}
          </div>
          
          {/* Question */}
          <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug flex-1">
            {decision.question || decision.title}
          </h3>
        </div>

        {/* Probabilité - Progress Circle style Polymarket */}
        <div className="flex items-center gap-2 ml-3 flex-shrink-0 relative z-10">
          <CircularProgress
            value={probabilityYes}
            size={56}
            strokeWidth={5}
            progressColor={probabilityYes >= 50 ? YES_COLORS.chart.light : NO_COLORS.chart.light}
            bgColor="hsl(var(--border))"
          >
            <div className="flex flex-col items-center justify-center">
              <div className={cn(
                "text-base font-bold leading-none",
                probabilityYes >= 50 ? YES_COLORS.text.light : NO_COLORS.text.light
              )}>
                {probabilityYes.toFixed(0)}%
              </div>
              <span className="text-[9px] text-muted-foreground uppercase leading-none mt-0.5 font-medium">
                chance
              </span>
            </div>
          </CircularProgress>
        </div>
      </Link>

      {/* Boutons Yes/No - Style épuré avec fonds light */}
      {/* Hauteur adaptée au contenu réel : py-3 = ~48px avec le texte */}
      <div className="relative z-10 px-4 pb-3">
        <div className="grid grid-cols-2 gap-2">
          {/* Bouton OUI */}
          <button
            onClick={(e) => handlePositionClick(e, "yes")}
            disabled={decision.status === "resolved"}
            className={cn(
              "px-4 py-3 rounded-lg font-medium text-sm transition-all",
              "flex items-center justify-center",
              YES_COLORS.bg.light,
              YES_COLORS.text.light,
              "hover:opacity-80 active:scale-95",
              "border",
              YES_COLORS.border.light,
              decision.status === "resolved" && "opacity-50 cursor-not-allowed"
            )}
          >
            OUI
          </button>

          {/* Bouton NON */}
          <button
            onClick={(e) => handlePositionClick(e, "no")}
            disabled={decision.status === "resolved"}
            className={cn(
              "px-4 py-3 rounded-lg font-medium text-sm transition-all",
              "flex items-center justify-center",
              NO_COLORS.bg.light,
              NO_COLORS.text.light,
              "hover:opacity-80 active:scale-95",
              "border",
              NO_COLORS.border.light,
              decision.status === "resolved" && "opacity-50 cursor-not-allowed"
            )}
          >
            NON
          </button>
        </div>
      </div>

      {/* Footer - Volume + Countdown + Bookmark - Style Polymarket */}
      <div className="relative z-10 px-4 pb-4 flex items-center justify-between gap-2">
        {/* Volume avec SeedDisplay */}
        <Link href={`/${decision.slug}`} className="hover:opacity-80 transition-opacity flex-1 min-w-0">
          {totalVolume > 0 ? (
            <div className="text-xs">
              <SeedDisplay
                amount={totalVolume}
                variant="compact"
                iconSize="size-3"
                className="text-muted-foreground"
              />
            </div>
          ) : (
            <div className="text-xs" style={{ minHeight: '16px' }} aria-hidden="true" />
          )}
        </Link>

        {/* Countdown ou Indicateur de fermeture */}
        {timeRemaining && (
          <div className="flex-shrink-0">
            {timeRemaining.isExpired ? (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 border border-border/50">
                <SolarIcon icon="lock-bold" className="size-3 text-muted-foreground" />
                <span className="text-[10px] font-medium text-muted-foreground">Fermé</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30">
                <SolarIcon icon="clock-circle-bold" className="size-3 text-primary" />
                <span className="text-[10px] font-mono font-semibold text-primary">
                  {timeRemaining.days > 0
                    ? `${timeRemaining.days}j ${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}`
                    : `${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Bookmark */}
        <div className="flex-shrink-0">
          <SaveButton
            decisionId={decision._id}
            size="icon"
            variant="ghost"
            className="size-7 text-muted-foreground hover:text-foreground flex-shrink-0"
            isSaved={isSavedProp}
          />
        </div>
      </div>

      {/* Sheet d'investissement - Même design que TradingWidget */}
      <Sheet open={showInvestSheet} onOpenChange={setShowInvestSheet}>
        <SheetContent 
          side={isMobile ? "bottom" : "right"}
          className={cn(
            "flex flex-col overflow-hidden",
            isMobile 
              ? "h-auto max-h-[90vh]"
              : "w-[500px] max-h-screen h-full"
          )}
        >
          <SheetHeader className="shrink-0">
            <SheetTitle>Prendre position</SheetTitle>
            <SheetDescription>{decision.question || decision.title}</SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 px-4">
            {/* Header avec probabilité */}
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

            {/* Boutons OUI/NON */}
            <div className="grid grid-cols-2 gap-2.5">
              <MotionButton
                whileHover={!isInvestmentExpired ? { scale: 1.03, y: -1 } : {}}
                whileTap={!isInvestmentExpired ? { scale: 0.97 } : {}}
                onClick={() => setSelectedPosition(selectedPosition === "yes" ? null : "yes")}
                disabled={isInvestmentExpired}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all relative overflow-hidden",
                  "shadow-sm hover:shadow-md",
                  selectedPosition === "yes"
                    ? cn("bg-gradient-to-br", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "border-primary shadow-lg ring-2 ring-primary/20")
                    : cn("bg-background/80 border-border/60 hover:border-primary/60", !isInvestmentExpired && "hover:bg-primary/5")
                )}
              >
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
              </MotionButton>

              <MotionButton
                whileHover={!isInvestmentExpired ? { scale: 1.03, y: -1 } : {}}
                whileTap={!isInvestmentExpired ? { scale: 0.97 } : {}}
                onClick={() => setSelectedPosition(selectedPosition === "no" ? null : "no")}
                disabled={isInvestmentExpired}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all relative overflow-hidden",
                  "shadow-sm hover:shadow-md",
                  selectedPosition === "no"
                    ? cn("bg-gradient-to-br", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "border-zinc-400/60 shadow-lg ring-2 ring-zinc-400/20")
                    : cn("bg-background/80 border-border/60 hover:border-zinc-400/60", !isInvestmentExpired && "hover:bg-zinc-500/5")
                )}
              >
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
              </MotionButton>
            </div>

            {/* Formulaire d'achat */}
            {selectedPosition && (
              <MotionDiv
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 pt-3 border-t border-border/30"
              >
                {/* Input montant en Seed */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-muted-foreground">Montant à investir</label>
                  <div className={cn(
                    "relative rounded-lg border-2 transition-all",
                    isFocused
                      ? selectedPosition === "yes"
                        ? "border-primary bg-primary/5"
                        : "border-zinc-400 bg-zinc-500/5"
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
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            setSeedAmount(value);
                          }
                        }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="0.00"
                        className="flex-1 bg-transparent text-lg font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
                      />
                      <span className="text-xs text-muted-foreground font-medium">Seed</span>
                    </div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                      <MotionButton
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const newValue = Math.max(0.01, Math.round((seedNum - 0.1) * 100) / 100);
                          setSeedAmount(newValue.toFixed(2));
                        }}
                        disabled={seedNum <= 0.01}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="size-5 rounded flex items-center justify-center bg-background/80 hover:bg-muted border border-border/50 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Minus className="size-3 text-foreground" />
                      </MotionButton>
                      <MotionButton
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const newValue = Math.min(1000000, Math.round((seedNum + 0.1) * 100) / 100);
                          setSeedAmount(newValue.toFixed(2));
                        }}
                        disabled={seedNum >= 1000000}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="size-5 rounded flex items-center justify-center bg-background/80 hover:bg-muted border border-border/50 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus className="size-3 text-foreground" />
                      </MotionButton>
                    </div>
                  </div>
                </div>

                {/* Détails */}
                {seedNum > 0 && (
                  <div className="p-3 rounded-lg bg-gradient-to-br from-muted/40 via-muted/30 to-muted/20 border border-border/30 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Montant investi</span>
                      <SeedDisplay amount={seedNum} variant="default" className="text-sm font-bold" iconSize="size-3" />
                    </div>
                    {selectedPosition && estimatedCost > 0 && Math.abs(estimatedCost - seedNum) > 0.01 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Coût réel</span>
                        <SeedDisplay amount={estimatedCost} variant="default" className="text-sm font-bold" iconSize="size-3" />
                      </div>
                    )}
                    {probabilityVariation !== 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Croissance du cours</span>
                        <span className={cn("text-xs font-semibold", probabilityVariation > 0 ? "text-green-500" : "text-red-500")}>
                          {probabilityVariation > 0 ? "+" : ""}{probabilityVariation.toFixed(1)}%
                        </span>
                      </div>
                    )}
                    {selectedPosition && currentMultiplier > 0 && estimatedCost > 0 && (
                      <div className="border-t border-border/30 pt-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">Gain potentiel</span>
                          <div className="text-right">
                            <div className="text-sm font-bold text-primary">
                              <SeedDisplay amount={currentMultiplier * estimatedCost} variant="default" className="text-sm font-bold" iconSize="size-3" showIcon={false} /> Seed
                            </div>
                            <div className="text-[9px] text-muted-foreground">si vous avez vu juste</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bouton d'achat */}
                <Button
                  onClick={handleBuy}
                  disabled={isSubmitting || seedNum <= 0 || !selectedPosition || isInvestmentExpired}
                  className={cn(
                    "w-full h-10 text-sm font-bold rounded-lg transition-all shadow-md hover:shadow-lg",
                    selectedPosition === "yes"
                      ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "hover:opacity-95 text-white ring-2 ring-primary/30")
                      : cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "hover:opacity-95 text-white ring-2 ring-zinc-400/30"),
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
              </MotionDiv>
            )}

          </div>

          {/* Footer avec Countdown FOMO */}
          {timeRemaining && !timeRemaining.isExpired && (
            <SheetFooter className="shrink-0 border-t border-border/30">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/15 via-primary/10 to-primary/15 border border-primary/40 shadow-sm">
                <SolarIcon icon="clock-circle-bold" className="size-3.5 text-primary" />
                <span className="text-[10px] font-mono text-primary font-bold">
                  {timeRemaining.days > 0
                    ? `${timeRemaining.days}j ${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}`
                    : `${String(timeRemaining.hours).padStart(2, '0')}:${String(timeRemaining.minutes).padStart(2, '0')}:${String(timeRemaining.seconds).padStart(2, '0')}`}
                </span>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

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
    </div>
  );
}

