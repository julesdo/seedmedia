"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { CircularProgress } from "@/components/ui/circular-progress";
import { useTranslations } from 'next-intl';
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Minus, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { PurchaseSuccessModal } from "@/components/ui/PurchaseSuccessModal";
import { OpinionCourseChart } from "@/components/decisions/OpinionCourseChart";
import { useCallback } from "react";
import { motion } from "motion/react";

/**
 * Formate un nombre pour le sheet de détail avec arrondi à 1-2 décimales max
 */
function formatDetailNumber(value: number): string {
  const absVal = Math.abs(value);
  
  if (absVal >= 1000000) {
    const mValue = value / 1000000;
    return `${mValue.toFixed(absVal >= 10000000 ? 1 : 2)}M`;
  }
  
  if (absVal >= 1000) {
    const kValue = value / 1000;
    return `${kValue.toFixed(absVal >= 10000 ? 1 : 2)}K`;
  }
  
  if (absVal >= 1) {
    return value.toFixed(absVal >= 10 ? 1 : 2);
  }
  
  return value.toFixed(2);
}

/**
 * Formate un montant de Seeds pour le sheet de détail
 */
function formatSeedAmount(amount: number): string {
  const absVal = Math.abs(amount);
  
  if (absVal >= 1000000) {
    const mValue = amount / 1000000;
    return `${mValue.toFixed(absVal >= 10000000 ? 1 : 2)}M`;
  }
  
  if (absVal >= 1000) {
    const kValue = amount / 1000;
    return `${kValue.toFixed(absVal >= 10000 ? 1 : 2)}K`;
  }
  
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
  currentPrice,
  decisionId,
  position,
}: {
  sharesOwned: number;
  currentPrice?: number;
  decisionId: Id<"decisions">;
  position: "yes" | "no";
}) {
  const courseHistory = useQuery(
    api.trading.getDecisionCourseHistory,
    { decisionId } as any
  ) as any;

  const probability = useQuery(
    api.trading.getSingleOdds,
    { decisionId } as any
  );

  // Calculer la variation de la probabilité (24h)
  const probabilityVariation = useMemo(() => {
    if (!courseHistory?.history?.length || probability === undefined) return null;
    
    const history = courseHistory.history as any[];
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Trouver le point d'il y a 24h
    let previousProbability = probability;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].timestamp <= oneDayAgo) {
        const yesPrice = history[i].yes || 0;
        const noPrice = history[i].no || 0;
        const totalPrice = yesPrice + noPrice;
        if (totalPrice > 0) {
          previousProbability = (yesPrice / totalPrice) * 100;
        }
        break;
      }
    }
    
    if (previousProbability === probability) return null;
    
    return ((probability - previousProbability) / previousProbability) * 100;
  }, [courseHistory, probability]);

  return (
    <div className="flex items-center justify-between py-3 border-t border-b border-border/20">
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-1 font-medium">
          Parts possédées
        </p>
        <p className="text-lg font-bold">{formatDetailNumber(sharesOwned)}</p>
      </div>
      <div className="w-px h-12 bg-border/30 mx-4" />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-1 font-medium">
          Probabilité actuelle
        </p>
        {probability !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold">
              {position === "yes" ? probability.toFixed(2) : (100 - probability).toFixed(2)}%
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
          <span className="text-lg text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

/**
 * Composant wrapper pour gérer le swipe horizontal sur mobile
 */
function SwipeableTabsContent({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
  baseTransform,
}: {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  baseTransform?: string; // Transform de base (position du carousel)
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // Mettre à jour la largeur du conteneur
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Seuil minimum pour déclencher un swipe (en pixels)
  const SWIPE_THRESHOLD = 50;
  // Vitesse minimum pour déclencher un swipe (en pixels/ms)
  const SWIPE_VELOCITY_THRESHOLD = 0.3;
  // Seuil vertical pour ignorer les swipes verticaux
  const VERTICAL_THRESHOLD = 30;

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    touchMoveRef.current = null;
    setIsSwiping(false);
    setSwipeOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Ignorer si le mouvement vertical est plus important que le horizontal
    if (Math.abs(deltaY) > Math.abs(deltaX) + VERTICAL_THRESHOLD) {
      return;
    }

    touchMoveRef.current = { x: touch.clientX, y: touch.clientY };
    setIsSwiping(true);
    setSwipeOffset(deltaX);

    // Empêcher le scroll vertical pendant le swipe horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchMoveRef.current) {
      touchStartRef.current = null;
      touchMoveRef.current = null;
      setIsSwiping(false);
      setSwipeOffset(0);
      return;
    }

    const deltaX = touchMoveRef.current.x - touchStartRef.current.x;
    const deltaY = touchMoveRef.current.y - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(deltaX) / deltaTime;

    // Vérifier si c'est un swipe horizontal valide
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) + VERTICAL_THRESHOLD;
    const isSwipeLongEnough = Math.abs(deltaX) > SWIPE_THRESHOLD;
    const isSwipeFastEnough = velocity > SWIPE_VELOCITY_THRESHOLD;

    if (isHorizontalSwipe && (isSwipeLongEnough || isSwipeFastEnough)) {
      if (deltaX > 0 && onSwipeRight) {
        // Swipe vers la droite
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        // Swipe vers la gauche
        onSwipeLeft();
      }
    }

    // Réinitialiser
    touchStartRef.current = null;
    touchMoveRef.current = null;
    setIsSwiping(false);
    setSwipeOffset(0);
  };

  // Extraire le pourcentage de baseTransform (ex: "-100%" -> -100)
  const basePercent = baseTransform 
    ? parseFloat(baseTransform.match(/-?(\d+(?:\.\d+)?)%/)?.[1] || "0") * (baseTransform.includes("-") ? -1 : 1)
    : 0;
  
  // Convertir le pourcentage en pixels
  const basePixels = containerWidth > 0 ? (basePercent / 100) * containerWidth : 0;
  
  // Calculer le transform final : base en pixels + offset du swipe en pixels
  const finalTransform = isSwiping && containerWidth > 0
    ? `translateX(${basePixels + swipeOffset}px)`
    : baseTransform || "translateX(0%)";

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: "pan-y", // Permettre le scroll vertical mais intercepter le swipe horizontal
        isolation: "isolate", // Créer un nouveau contexte de stacking
      }}
    >
      <div
        className={cn(
          "transition-transform duration-300 ease-out",
          isSwiping && "transition-none",
          // Les enfants doivent être en flex horizontal pour le carousel (mobile ET desktop)
          "flex relative will-change-transform"
        )}
        style={{
          transform: finalTransform,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          zIndex: 0,
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface UserProfileClientProps {
  username: string;
}

/**
 * Vue privée - Affiche seulement les infos de base
 */
function PrivateProfileView({ user }: { user: any }) {
  const t = useTranslations('profile');
  const tSuccess = useTranslations('success');
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[614px] mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="size-24">
                <AvatarImage src={user.image || undefined} alt={user.name || user.username || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  {user.name || user.username || user.email}
                </h1>
                {user.username && (
                  <button
                    onClick={async () => {
                      const url = `${window.location.origin}/u/${user.username}`;
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success(tSuccess('linkCopied'), {
                          description: tSuccess('linkCopiedDescription'),
                        });
                      } catch (error) {
                        console.error("Failed to copy:", error);
                      }
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    @{user.username}
                  </button>
                )}
              </div>
              
              {user.bio && (
                <p className="text-muted-foreground text-sm max-w-md">
                  {user.bio}
                </p>
              )}
              
              <Badge variant="secondary" className="mt-2">
                <SolarIcon icon="lock-bold" className="size-3 mr-1" />
                {t('private')}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Espace pour la bottom nav mobile */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}

/**
 * Card de performance pour afficher une position dans la grille
 */
function PerformanceCard({ 
  anticipation, 
  decision,
  onClick
}: { 
  anticipation: any; 
  decision: any;
  onClick: () => void;
}) {
  const courseHistory = useQuery(
    api.trading.getDecisionCourseHistory,
    decision?._id ? { decisionId: decision._id } : "skip"
  );
  
  const probability = useQuery(
    api.trading.getSingleOdds,
    decision?._id ? { decisionId: decision._id } : "skip"
  );

  // Préparer les données pour le mini graphique
  const chartData = useMemo(() => {
    if (!courseHistory?.history?.length) return [];
    
    // Prendre les 10 derniers points pour le mini graphique
    const recentHistory = courseHistory.history.slice(-10);
    
    // Calculer la probabilité pour chaque point à partir des prix yes/no
    // Les prix sont normalisés par normalizeBinaryPrices, donc le ratio yes/no reflète la probabilité
    return recentHistory.map((point: any, index: number) => {
      const yesPrice = point.yes || 0;
      const noPrice = point.no || 0;
      const totalPrice = yesPrice + noPrice;
      
      // Calculer la probabilité à partir du ratio des prix normalisés
      // Les prix normalisés reflètent le ratio de liquidité, donc probabilité ≈ (yesPrice / totalPrice) * 100
      let calculatedProbability = 50; // Valeur par défaut
      if (totalPrice > 0) {
        calculatedProbability = (yesPrice / totalPrice) * 100;
        // S'assurer que la probabilité est entre 0 et 100
        calculatedProbability = Math.max(0, Math.min(100, calculatedProbability));
      }
      
      return {
        index,
        value: calculatedProbability,
      };
    });
  }, [courseHistory]);

  // Calculer la variation (non utilisée pour l'instant mais gardée pour cohérence)
  const variation = useMemo(() => {
    if (!courseHistory?.history?.length || probability === undefined) return 0;
    
    const history = courseHistory.history as any[];
    const currentProb = probability;
    
    // Prendre le premier point disponible
    const firstPoint = history[0];
    if (!firstPoint) return 0;
    
    // Calculer la probabilité du premier point
    const yesPrice = firstPoint.yes || 0;
    const noPrice = firstPoint.no || 0;
    const totalPrice = yesPrice + noPrice;
    const previousProb = totalPrice > 0 ? (yesPrice / totalPrice) * 100 : 50;
    
    if (previousProb === 0) return 0;
    
    return ((currentProb - previousProb) / previousProb) * 100;
  }, [courseHistory, probability]);

  // Calculer la valeur estimée (2 décimales)
  const estimatedValue = useMemo(() => {
    if (probability === undefined) return 0;
    return anticipation.sharesOwned * probability;
  }, [anticipation.sharesOwned, probability]);

  // Calculer le profit
  const profit = estimatedValue - anticipation.totalInvested;
  const profitPercentage = anticipation.totalInvested > 0 
    ? (profit / anticipation.totalInvested) * 100 
    : 0;

  const isProfit = profit > 0;
  const position = anticipation.position as "yes" | "no";
  const color = position === "yes" ? YES_COLORS.chart.light : NO_COLORS.chart.light;
  const gradientStart = position === "yes" 
    ? YES_COLORS.chart.gradient.start 
    : NO_COLORS.chart.gradient.start;
  const gradientEnd = position === "yes"
    ? YES_COLORS.chart.gradient.end
    : NO_COLORS.chart.gradient.end;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  // Formater les Seeds avec arrondi
  const formatSeeds = (amount: number) => {
    if (amount >= 1000000) return Math.round(amount / 100000) / 10 + "M";
    if (amount >= 1000) return Math.round(amount / 100) / 10 + "K";
    return Math.round(amount).toString();
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="group relative rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-all p-3 flex flex-col gap-2 w-full text-left cursor-pointer"
      style={{ zIndex: 1 }}
    >
      {/* Header: Titre + Badge position */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-xs font-semibold line-clamp-2 flex-1 leading-tight">
          {decision.title}
        </h3>
        <span className={cn(
          "inline-flex items-center justify-center px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0",
          position === "yes" 
            ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "text-white")
            : cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "text-white")
        )}>
          {position === "yes" ? "OUI" : "NON"}
        </span>
      </div>

      {/* Stats: Parts + Probabilité */}
      <div className="flex items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">Parts:</span>
          <span className="font-semibold">{formatNumber(anticipation.sharesOwned)}</span>
        </div>
        {probability !== undefined && (
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Prob:</span>
            <span className="font-semibold">{probability.toFixed(2)}%</span>
          </div>
        )}
      </div>

      {/* Mini graphique */}
      <div className="h-12 w-full pointer-events-none">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${decision._id}-${position}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={gradientStart} />
                  <stop offset="100%" stopColor={gradientEnd} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#gradient-${decision._id}-${position})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-[8px] text-muted-foreground">—</div>
          </div>
        )}
      </div>

      {/* Footer: Gain/Perte */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30">
        <div className="flex items-center gap-1">
          <SeedDisplay amount={estimatedValue} variant="compact" iconSize="size-2.5" />
        </div>
        <div className={cn(
          "text-[10px] font-bold",
          isProfit ? YES_COLORS.text.light : 
          profit < 0 ? "text-muted-foreground" : 
          "text-foreground"
        )}>
          {isProfit ? "+" : ""}{formatNumber(profit)}
        </div>
      </div>
    </button>
  );
}

/**
 * Drawer de détail de position avec boutons d'achat orientés égo
 */
function PositionDetailDrawer({
  open,
  onOpenChange,
  anticipation,
  decision,
  onBuy,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anticipation: any;
  decision: any;
  onBuy: (position: "yes" | "no", shares: number) => void;
  isSubmitting: boolean;
}) {
  const { user: currentUser, isAuthenticated } = useUser();
  const router = useRouter();
  const [selectedPosition, setSelectedPosition] = useState<"yes" | "no" | null>(null);
  const [partsAmount, setPartsAmount] = useState<string>("1");
  
  const probability = useQuery(
    api.trading.getSingleOdds,
    decision?._id ? { decisionId: decision._id } : "skip"
  );
  
  const tradingPools = useQuery(
    api.trading.getTradingPools,
    decision?._id ? { decisionId: decision._id } : "skip"
  );
  
  // Calculer le coût estimé
  const partsNum = parseInt(partsAmount) || 0;
  const calculateBuyCost = (position: "yes" | "no", parts: number): number => {
    if (!tradingPools || parts <= 0) return 0;
    const pool = position === "yes" ? tradingPools.yes : tradingPools.no;
    if (!pool) return 0;
    const currentSupply = pool.totalSupply;
    const slope = pool.slope;
    const newSupply = currentSupply + parts;
    return Math.round(((slope / 2) * (newSupply * newSupply - currentSupply * currentSupply)) * 100) / 100;
  };
  const estimatedCost = selectedPosition ? calculateBuyCost(selectedPosition, partsNum) : 0;
  
  const position = anticipation.position as "yes" | "no";
  const userPosition = position;
  
  // Messages orientés égo selon la position de l'utilisateur
  const egoMessages = {
    yes: [
      "Montrez que vous avez raison !",
      "Rejoignez les gagnants !",
      "Prouvez votre intuition !",
      "Ne laissez pas les autres gagner sans vous !",
      "Votre opinion compte, faites-la valoir !",
    ],
    no: [
      "Montrez que vous avez raison !",
      "Rejoignez les gagnants !",
      "Prouvez votre intuition !",
      "Ne laissez pas les autres gagner sans vous !",
      "Votre opinion compte, faites-la valoir !",
    ],
  };
  
  const randomEgoMessage = useMemo(() => {
    const messages = userPosition === "yes" ? egoMessages.yes : egoMessages.no;
    return messages[Math.floor(Math.random() * messages.length)];
  }, [userPosition]);
  
  const handleBuy = (position: "yes" | "no") => {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    if (partsNum <= 0) {
      toast.error("Nombre de parts invalide");
      return;
    }
    onBuy(position, partsNum);
  };
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="bottom">
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0 overflow-hidden w-full max-w-full [&>button]:hidden flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-border/50 flex-shrink-0">
          <SheetTitle className="text-lg font-bold line-clamp-2">
            {decision.title}
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
          {/* Position de l'utilisateur */}
          <div className={cn(
            "rounded-lg p-4 border-2",
            userPosition === "yes"
              ? cn("bg-gradient-to-br", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "border-primary/30")
              : cn("bg-gradient-to-br", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "border-zinc-400/30")
          )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">
                Position actuelle
              </span>
              <span className="text-xs font-bold text-white/90 uppercase">
                {userPosition === "yes" ? "OUI" : "NON"}
              </span>
            </div>
            <div className="flex items-center justify-between text-white/90">
              <span className="text-xs">Parts possédées:</span>
              <span className="text-sm font-bold">{anticipation.sharesOwned.toFixed(2)}</span>
            </div>
            {probability !== undefined && (
              <div className="flex items-center justify-between text-white/90 mt-1">
                <span className="text-xs">Probabilité actuelle:</span>
                <span className="text-sm font-bold">
                  {userPosition === "yes" ? probability.toFixed(2) : (100 - probability).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          
          {/* Graphique de tendance */}
          {decision._id && (
            <div className="rounded-lg border border-border/50 p-3 bg-card">
              <OpinionCourseChart 
                decisionId={decision._id} 
                compact 
                hideLabels 
                hideBottomElements 
                position={anticipation.position}
              />
            </div>
          )}
          
          {/* Message orienté égo */}
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
            <p className="text-sm font-semibold text-center text-primary">
              {randomEgoMessage}
            </p>
          </div>
          
          {/* Boutons d'achat */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-center">Prendre position</p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Bouton OUI */}
              <Button
                onClick={() => {
                  if (selectedPosition === "yes") {
                    setSelectedPosition(null);
                  } else {
                    setSelectedPosition("yes");
                  }
                }}
                className={cn(
                  "h-auto py-4 flex flex-col items-center gap-2",
                  selectedPosition === "yes"
                    ? cn("bg-gradient-to-br", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "text-white border-2 border-primary/50")
                    : "bg-background border-2 border-border hover:border-primary/30"
                )}
              >
                <SolarIcon icon="check-circle-bold" className="size-6" />
                <span className="font-bold">OUI</span>
                {probability !== undefined && (
                  <span className="text-xs opacity-90">{probability.toFixed(1)}%</span>
                )}
              </Button>
              
              {/* Bouton NON */}
              <Button
                onClick={() => {
                  if (selectedPosition === "no") {
                    setSelectedPosition(null);
                  } else {
                    setSelectedPosition("no");
                  }
                }}
                className={cn(
                  "h-auto py-4 flex flex-col items-center gap-2",
                  selectedPosition === "no"
                    ? cn("bg-gradient-to-br", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "text-white border-2 border-zinc-400/50")
                    : "bg-background border-2 border-border hover:border-zinc-400/30"
                )}
              >
                <SolarIcon icon="close-circle-bold" className="size-6" />
                <span className="font-bold">NON</span>
                {probability !== undefined && (
                  <span className="text-xs opacity-90">{(100 - probability).toFixed(1)}%</span>
                )}
              </Button>
            </div>
            
            {/* Sélecteur de quantité */}
            {selectedPosition && (
              <div className="space-y-3 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Nombre de parts</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        const newValue = Math.max(1, partsNum - 1);
                        setPartsAmount(newValue.toString());
                      }}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <input
                      type="number"
                      min="1"
                      value={partsAmount}
                      onChange={(e) => setPartsAmount(e.target.value)}
                      className="w-16 text-center text-sm font-semibold border border-border rounded-md px-2 py-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        const newValue = partsNum + 1;
                        setPartsAmount(newValue.toString());
                      }}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Coût estimé - Simplifié */}
                <div className="rounded-lg bg-muted/50 p-3 border border-border/50 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="text-xs text-muted-foreground">Coût total:</span>
                    <SeedDisplay amount={estimatedCost} variant="compact" className="text-base font-bold" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer fixe pour le bouton d'achat */}
        {selectedPosition && (
          <div className="px-4 py-4 border-t border-border/50 bg-background/95 backdrop-blur-sm flex-shrink-0">
            <Button
              onClick={() => handleBuy(selectedPosition)}
              disabled={isSubmitting || partsNum <= 0}
              className={cn(
                "w-full h-12 font-bold text-base",
                selectedPosition === "yes"
                  ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "text-white")
                  : cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "text-white")
              )}
            >
              {isSubmitting ? (
                <>
                  <SolarIcon icon="loading" className="size-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                `Prendre position ${selectedPosition === "yes" ? "OUI" : "NON"} (${partsNum} parts)`
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Section d'achat pour le drawer de détail
 */
function BuyMoreSection({
  selectedPosition,
  buyMoreAmount,
  setBuyMoreAmount,
  isBuyingMore,
  setIsBuyingMore,
  buyShares,
  setDetailSheetOpen,
  setShowPurchaseSuccess,
  setPurchaseData,
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
  setShowPurchaseSuccess: (show: boolean) => void;
  setPurchaseData: (data: any) => void;
}) {
  const probability = useQuery(
    api.trading.getSingleOdds,
    selectedPosition?.decisionId ? { decisionId: selectedPosition.decisionId } : "skip"
  );
  
  const tradingPools = useQuery(
    api.trading.getTradingPools,
    selectedPosition?.decisionId ? { decisionId: selectedPosition.decisionId } : "skip"
  );
  
  // Calculer le coût estimé et le prix actuel
  const partsNum = parseInt(buyMoreAmount) || 0;
  const calculateBuyCost = (position: "yes" | "no", parts: number): number => {
    if (!tradingPools || parts <= 0) return 0;
    const pool = position === "yes" ? tradingPools.yes : tradingPools.no;
    if (!pool) return 0;
    const currentSupply = pool.totalSupply;
    const slope = pool.slope;
    const newSupply = currentSupply + parts;
    return Math.round(((slope / 2) * (newSupply * newSupply - currentSupply * currentSupply)) * 100) / 100;
  };
  const estimatedCost = selectedPosition ? calculateBuyCost(selectedPosition.position, partsNum) : 0;
  
  // 🎯 Calculer le prix actuel et le prix après achat pour le multiplicateur
  const calculateCurrentPrice = (position: "yes" | "no"): number => {
    if (!tradingPools) return 0;
    const pool = position === "yes" ? tradingPools.yes : tradingPools.no;
    if (!pool) return 0;
    const currentSupply = pool.totalSupply;
    const slope = pool.slope;
    return slope * currentSupply;
  };
  
  const calculatePriceAfterPurchase = (position: "yes" | "no", parts: number): number => {
    if (!tradingPools || parts <= 0) return 0;
    const pool = position === "yes" ? tradingPools.yes : tradingPools.no;
    if (!pool) return 0;
    const currentSupply = pool.totalSupply;
    const slope = pool.slope;
    const newSupply = currentSupply + parts;
    return slope * newSupply;
  };
  
  const currentPrice = selectedPosition ? calculateCurrentPrice(selectedPosition.position) : 0;
  const priceAfterPurchase = selectedPosition ? calculatePriceAfterPurchase(selectedPosition.position, partsNum) : 0;
  
  // 🎯 Calculer le multiplicateur théorique (100 / prix actuel)
  // C'est le multiplicateur max si l'événement se produit et que personne n'achète après
  const currentMultiplier = currentPrice > 0 && currentPrice < 100 ? 100 / currentPrice : 0;
  const multiplierAfterPurchase = priceAfterPurchase > 0 && priceAfterPurchase < 100 ? 100 / priceAfterPurchase : 0;
  
  const handleBuy = async () => {
    if (!selectedPosition) return;
    
    if (partsNum <= 0) {
      toast.error("Nombre de parts invalide");
      return;
    }
    
    setIsBuyingMore(true);
    try {
      await buyShares({
        decisionId: selectedPosition.decisionId,
        position: selectedPosition.position,
        shares: partsNum,
      });
      
      toast.success(`${partsNum} part${partsNum > 1 ? "s" : ""} achetée${partsNum > 1 ? "s" : ""} avec succès !`);
      
      setPurchaseData({
        decisionId: selectedPosition.decisionId,
        decisionTitle: selectedPosition.decisionTitle,
        position: selectedPosition.position,
        shares: partsNum,
      });
      setShowPurchaseSuccess(true);
      setDetailSheetOpen(false);
      setBuyMoreAmount("1");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'achat");
    } finally {
      setIsBuyingMore(false);
    }
  };
  
  const [showDetails, setShowDetails] = useState(false);
  
  if (!selectedPosition) return null;
  
  return (
    <div className="space-y-3">
      {/* 🎯 VERSION SIMPLIFIÉE : Focus sur l'essentiel */}
      
      {/* Probabilité actuelle - Simplifiée */}
      <div className="bg-muted/50 rounded-lg p-3 text-center border border-border/20">
        <p className="text-[10px] text-muted-foreground mb-1 font-medium">Probabilité actuelle</p>
        <div className="text-2xl font-bold">
          {probability !== undefined ? (
            <span className={selectedPosition.position === "yes" ? YES_COLORS.text.light : NO_COLORS.text.light}>
              {selectedPosition.position === "yes" ? probability.toFixed(1) : (100 - probability).toFixed(1)}%
            </span>
          ) : (
            <SolarIcon icon="loading" className="size-5 animate-spin mx-auto" />
          )}
        </div>
      </div>

      {/* Contrôle nombre de parts */}
      <div className="space-y-2">
        <label className="text-[10px] text-muted-foreground font-medium block">Nombre de parts</label>
        <div className="flex items-center justify-center gap-3">
          <motion.button
            onClick={() => {
              const newValue = Math.max(1, partsNum - 1);
              setBuyMoreAmount(newValue.toString());
            }}
            disabled={partsNum <= 1}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "size-9 rounded-lg flex items-center justify-center",
              "bg-muted hover:bg-muted/80 active:bg-muted/60",
              "border border-border",
              "transition-colors",
              "disabled:opacity-30 disabled:cursor-not-allowed"
            )}
          >
            <Minus className="size-3.5 text-foreground" />
          </motion.button>
          
          <div className="flex flex-col items-center min-w-[70px]">
            <span className="text-2xl font-bold text-foreground leading-none">
              {partsNum}
            </span>
            <span className="text-[9px] text-muted-foreground leading-none mt-0.5">
              part{partsNum > 1 ? "s" : ""}
            </span>
          </div>
          
          <motion.button
            onClick={() => {
              const newValue = Math.min(1000, partsNum + 1);
              setBuyMoreAmount(newValue.toString());
            }}
            disabled={partsNum >= 1000}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "size-9 rounded-lg flex items-center justify-center",
              "bg-muted hover:bg-muted/80 active:bg-muted/60",
              "border border-border",
              "transition-colors",
              "disabled:opacity-30 disabled:cursor-not-allowed"
            )}
          >
            <Plus className="size-3.5 text-foreground" />
          </motion.button>
        </div>
      </div>

      {/* Coût total - Simplifié */}
      <div className="text-center space-y-2 py-3">
        <p className="text-xs text-muted-foreground font-medium">Coût total</p>
        <div className="flex items-center justify-center gap-1.5">
          <SeedDisplay 
            amount={estimatedCost} 
            variant="default" 
            className="text-2xl font-bold"
            iconSize="size-4"
          />
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
          {currentPrice > 0 && currentPrice < 100 && (
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground">Multiplicateur max</span>
              <span className="text-xs font-semibold text-primary">
                {currentMultiplier.toFixed(2)}x
              </span>
            </div>
          )}
          {priceAfterPurchase > 0 && priceAfterPurchase < 100 && partsNum > 0 && (
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground">Après votre achat</span>
              <span className="text-xs font-semibold text-muted-foreground">
                {multiplierAfterPurchase.toFixed(2)}x
              </span>
            </div>
          )}
          {currentPrice > 0 && currentPrice < 100 && (
            <p className="text-[10px] text-muted-foreground italic pt-1">
              Si l'événement se produit et que personne n'achète après
            </p>
          )}
          <p className="text-[10px] text-muted-foreground italic pt-1">
            Vous payez en Seeds, pas en probabilité
          </p>
        </div>
      )}
      
      {/* Bouton d'achat */}
      <Button
        onClick={handleBuy}
        disabled={isBuyingMore || partsNum <= 0}
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
            Acheter {partsNum} part{partsNum > 1 ? "s" : ""} {selectedPosition.position === "yes" ? "OUI" : "NON"}
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * Section de vente pour le drawer de détail (identique au portefeuille)
 */
function SellMoreSection({
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
  } | null;
  sellSharesAmount: string;
  setSellSharesAmount: (value: string) => void;
  isSelling: boolean;
  setIsSelling: (value: boolean) => void;
  sellShares: any;
  setDetailSheetOpen: (open: boolean) => void;
  estimatedSellAmount: { gross: number; net: number; fee: number };
  }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const handleSell = async () => {
    if (!selectedPosition) return;
    
    const partsNum = parseFloat(sellSharesAmount) || 0;
    if (partsNum <= 0 || partsNum > selectedPosition.sharesOwned) {
      toast.error("Nombre de parts invalide");
      return;
    }
    
    setIsSelling(true);
    try {
      await sellShares({
        decisionId: selectedPosition.decisionId,
        position: selectedPosition.position,
        shares: partsNum,
      });
      
      toast.success(`${partsNum} part${partsNum > 1 ? "s" : ""} revendue${partsNum > 1 ? "s" : ""} avec succès !`);
      setDetailSheetOpen(false);
      setSellSharesAmount("1");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la vente");
    } finally {
      setIsSelling(false);
    }
  };
  
  if (!selectedPosition) return null;
  
  return (
    <div className="space-y-4">
      {/* Slider pour choisir le nombre de parts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-medium">Parts à revendre</span>
          <span className="text-lg font-bold">
            {formatDetailNumber(parseFloat(sellSharesAmount) || 0)}
          </span>
        </div>
        <Slider
          value={[parseFloat(sellSharesAmount) || 1]}
          onValueChange={([value]) => setSellSharesAmount(value.toString())}
          min={1}
          max={selectedPosition.sharesOwned}
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
              if (!isNaN(num) && num >= 1 && num <= selectedPosition.sharesOwned) {
                setSellSharesAmount(value);
              }
            }}
            min={1}
            max={selectedPosition.sharesOwned}
            className="w-full text-center text-2xl font-bold bg-transparent border-none outline-none"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            const current = parseFloat(sellSharesAmount) || 1;
            if (current < selectedPosition.sharesOwned) {
              setSellSharesAmount((current + 1).toString());
            }
          }}
          disabled={parseFloat(sellSharesAmount) >= selectedPosition.sharesOwned}
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
            Revendre {formatDetailNumber(parseFloat(sellSharesAmount) || 0)} part{(parseFloat(sellSharesAmount) || 0) > 1 ? "s" : ""}
          </>
        )}
      </Button>
    </div>
  );
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
 * Vue publique - Style moderne avec performances des positions
 */
function PublicProfileView({ user, userId }: { user: any; userId: string | Id<"users"> }) {
  const t = useTranslations('profile');
  const tErrors = useTranslations('errors');
  const { user: currentUser, isAuthenticated } = useUser();
  const [activeTab, setActiveTab] = useState("resolved");
  const [resolvedLimit, setResolvedLimit] = useState(20);
  const [correctLimit, setCorrectLimit] = useState(20);
  const [savedLimit, setSavedLimit] = useState(20);
  
  // Helper pour comparer les IDs (convertir en string pour éviter les problèmes de type)
  const isOwnProfile = useMemo(() => {
    if (!isAuthenticated || !currentUser?._id) return false;
    const currentUserIdStr = String(currentUser._id);
    const profileUserIdStr = String(userId);
    return currentUserIdStr === profileUserIdStr;
  }, [isAuthenticated, currentUser?._id, userId]);
  
  // Vérifier l'accès au profil (gratuit si c'est son propre profil)
  const hasAccess = useQuery(
    api.profileAccess.hasProfileAccess,
    isAuthenticated && !isOwnProfile
      ? { profileUserId: userId as Id<"users"> }
      : "skip"
  );
  
  // Prix d'accès (seulement si pas d'accès)
  const accessPrice = useQuery(
    api.profileAccess.getProfileAccessPrice,
    isAuthenticated && !isOwnProfile && hasAccess === false
      ? { profileUserId: userId as Id<"users"> }
      : "skip"
  );
  
  const payForAccess = useMutation(api.profileAccess.payForProfileAccess);
  const [isPaying, setIsPaying] = useState(false);
  
  // État pour le drawer de détail de position
  const [selectedPositionDetail, setSelectedPositionDetail] = useState<{
    anticipation: any;
    decision: any;
  } | null>(null);
  const [showPositionDetail, setShowPositionDetail] = useState(false);
  const [selectedBuyPosition, setSelectedBuyPosition] = useState<"yes" | "no" | null>(null);
  const [partsAmount, setPartsAmount] = useState<string>("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [purchaseData, setPurchaseData] = useState<{
    decisionId: Id<"decisions">;
    decisionTitle: string;
    position: "yes" | "no";
    shares: number;
  } | null>(null);
  
  const buyShares = useMutation(api.trading.buyShares);
  const sellShares = useMutation(api.trading.sellShares);
  
  // États pour le drawer de détail/vente (comme dans PortfolioClient)
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
    createdAt?: number; // Date de création de l'anticipation pour calculer la taxe progressive
  } | null>(null);
  const [sellSheetOpen, setSellSheetOpen] = useState(false);
  const [selectedSellItem, setSelectedSellItem] = useState<{
    decisionId: Id<"decisions">;
    position: "yes" | "no";
    sharesOwned: number;
    decisionTitle: string;
    imageUrl?: string;
    createdAt?: number; // Date de création de l'anticipation pour calculer la taxe progressive
  } | null>(null);
  const [sellSharesAmount, setSellSharesAmount] = useState<string>("1");
  const [isSelling, setIsSelling] = useState(false);
  const [showSellDetails, setShowSellDetails] = useState(false);
  
  // États pour l'achat depuis le drawer de détail
  const [buyMoreMode, setBuyMoreMode] = useState<"buy" | "sell">("sell");
  const [buyMoreAmount, setBuyMoreAmount] = useState<string>("1");
  const [isBuyingMore, setIsBuyingMore] = useState(false);
  
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
  
  // Prix pour le drawer de détail (selectedPosition)
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
  
  // Calcul pour le drawer de vente séparé
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
  
  // Calcul pour le drawer de détail (mode vente)
  const estimatedSellAmountDetail = useMemo(() => {
    if (!selectedPosition || currentPriceDetail === undefined) return { gross: 0, net: 0, fee: 0 };
    
    const shares = parseFloat(sellSharesAmount) || 0;
    if (shares <= 0) return { gross: 0, net: 0, fee: 0 };

    const gross = currentPriceDetail * shares;
    
    // Calculer la taxe progressive basée sur la durée de détention
    const holdingDurationMs = selectedPosition.createdAt 
      ? Date.now() - selectedPosition.createdAt 
      : 30 * 24 * 60 * 60 * 1000; // Par défaut, considérer > 30j si pas de date
    const net = calculateSellNetProgressive(gross, holdingDurationMs);
    const fee = gross - net;

    return { gross, net, fee };
  }, [selectedPosition, currentPriceDetail, sellSharesAmount]);
  
  // Fonction pour ouvrir le drawer de détail (comme dans PortfolioClient)
  const handleOpenDetailSheet = useCallback((
    item: any,
    decision: any,
    position: "yes" | "no"
  ) => {
    const profit = ('profit' in item && typeof item.profit === 'number') ? item.profit : 0;
    const profitPercentage = ('profitPercentage' in item && typeof item.profitPercentage === 'number') ? item.profitPercentage : 0;
    
    const positionData = {
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
      createdAt: item.createdAt, // Date de création de l'anticipation pour calculer la taxe progressive
    };
    
    setSelectedPosition(positionData);
    setBuyMoreMode("sell"); // Réinitialiser le mode à "sell" par défaut
    setBuyMoreAmount("1"); // Réinitialiser la quantité
    setSellSharesAmount("1"); // Réinitialiser la quantité de vente
    setDetailSheetOpen(true);
  }, []);
  
  // Fonction pour ouvrir le drawer de vente
  const handleOpenSellSheet = useCallback(() => {
    if (!selectedPosition) return;
    
    setSelectedSellItem({
      decisionId: selectedPosition.decisionId,
      position: selectedPosition.position,
      sharesOwned: selectedPosition.sharesOwned,
      decisionTitle: selectedPosition.decisionTitle,
      imageUrl: selectedPosition.decision?.imageUrl,
      createdAt: selectedPosition.createdAt, // Passer la date de création pour la taxe progressive
    });
    setSellSheetOpen(true);
    setDetailSheetOpen(false);
  }, [selectedPosition]);
  
  // Fonction pour gérer la vente
  const handleSell = async () => {
    if (!selectedSellItem) return;
    
    const shares = parseFloat(sellSharesAmount) || 0;
    if (shares <= 0 || shares > selectedSellItem.sharesOwned) {
      toast.error("Nombre de parts invalide");
      return;
    }
    
    setIsSelling(true);
    try {
      await sellShares({
        decisionId: selectedSellItem.decisionId,
        position: selectedSellItem.position,
        shares,
      });
      toast.success(`${shares} part${shares > 1 ? "s" : ""} revendue${shares > 1 ? "s" : ""} avec succès !`);
      setSellSheetOpen(false);
      setSellSharesAmount("1");
      setSelectedSellItem(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la vente");
    } finally {
      setIsSelling(false);
    }
  };

  // Ordre des tabs pour la navigation par swipe
  const tabs = ["resolved", "correct", "saved"] as const;
  const currentTabIndex = tabs.indexOf(activeTab as typeof tabs[number]);

  // Navigation par swipe
  const handleSwipeLeft = () => {
    // Swipe vers la gauche = aller au tab suivant
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1]);
    }
  };

  const handleSwipeRight = () => {
    // Swipe vers la droite = aller au tab précédent
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1]);
    }
  };
  
  // Réinitialiser les limites quand on change d'onglet (optionnel, pour optimiser)
  // On garde les limites pour éviter de recharger à chaque changement d'onglet
  const router = useRouter();
  
  // Condition pour déterminer si on doit vérifier le follow
  const shouldCheckFollow = isAuthenticated && !isOwnProfile;
  
  // Helper pour contourner le problème d'inférence récursive de TypeScript avec Convex
  // Le problème vient de l'inférence récursive avec les unions de types littéraux
  const getFollowQueryArgs = (): { targetType: "user"; targetId: string } | "skip" => {
    if (shouldCheckFollow) {
      return { targetType: "user", targetId: userId };
    }
    return "skip";
  };
  
  // @ts-ignore - Type instantiation is excessively deep (known Convex limitation with union literal types)
  const isFollowingUser = useQuery(api.follows.isFollowing, getFollowQueryArgs());
  const toggleFollow = useMutation(api.follows.toggleFollow);
  
  const userProfile = useQuery(
    api.users.getUserProfile,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );
  const followersCount = useQuery(
    api.follows.getUserFollowersCount,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );
  const followingCount = useQuery(
    api.follows.getUserFollowingCount,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );
  // Charger toutes les données en parallèle dès le début pour éviter les rechargements
  // Si c'est le profil de l'utilisateur connecté, utiliser getUserPortfolio pour avoir les données enrichies
  const userPortfolio = useQuery(
    api.trading.getUserPortfolio,
    isOwnProfile ? {} : "skip"
  );
  
  const allAnticipations = useQuery(
    api.anticipations.getUserAnticipations,
    userId ? { userId: userId as Id<"users">, limit: 1000 } : "skip" // Récupérer toutes pour filtrer
  );
  
  // Utiliser le portfolio enrichi si disponible, sinon les anticipations simples
  const enrichedAnticipations = useMemo(() => {
    if (isOwnProfile && userPortfolio) {
      return userPortfolio.map((item: any) => ({
        ...item,
        _id: item._id || item.anticipationId || item.decision?._id,
        decision: item.decision,
        position: item.position,
        sharesOwned: item.sharesOwned,
        totalInvested: item.totalInvested,
        profit: item.profit || 0,
        profitPercentage: item.profitPercentage || 0,
        currentPrice: item.currentPrice,
        estimatedValue: item.estimatedValue,
        averageBuyPrice: item.averageBuyPrice,
        resolved: item.resolved || false,
        result: item.result,
      }));
    }
    return allAnticipations || [];
  }, [isAuthenticated, currentUser?._id, userId, userPortfolio, allAnticipations]);
  const resolvedAnticipations = useQuery(
    api.anticipations.getUserResolvedAnticipations,
    userId ? { userId: userId as Id<"users">, limit: resolvedLimit } : "skip"
  );

  // Filtrer les anticipations EN COURS (non résolues) pour l'onglet "En cours"
  const pendingAnticipations = useMemo(() => {
    return enrichedAnticipations.filter((a) => !a.resolved);
  }, [enrichedAnticipations]);
  
  // Calculer les stats depuis les données réelles
  const resolvedAnticipationsList = useMemo(() => {
    return enrichedAnticipations.filter((a) => a.resolved);
  }, [enrichedAnticipations]);
  
  const correctAnticipationsList = useMemo(() => {
    return resolvedAnticipationsList.filter((a) => a.result === "won");
  }, [resolvedAnticipationsList]);
  
  // Utiliser les anticipations enrichies pour les correctes aussi
  const correctAnticipations = useMemo(() => {
    return correctAnticipationsList.slice(0, correctLimit);
  }, [correctAnticipationsList, correctLimit]);
  
  const stats = {
    resolvedAnticipations: pendingAnticipations.length, // En cours = non résolues
    correctAnticipations: correctAnticipationsList.length,
    accuracy:
      resolvedAnticipationsList.length > 0
        ? Math.round((correctAnticipationsList.length / resolvedAnticipationsList.length) * 100)
        : 0,
  };
  
  // Récupérer les favoris (décisions sauvegardées) pour l'onglet "Sauvegardées"
  const savedFavorites = useQuery(
    api.favorites.getUserFavorites,
    userId ? { userId: userId as Id<"users">, limit: savedLimit } : "skip"
  );
  
  // Filtrer pour ne garder que les décisions sauvegardées
  const savedDecisions = savedFavorites?.filter((f) => f.targetType === "decision") || [];

  // Calculer la progression vers le prochain niveau basé sur les Seeds
  // Formule : level = floor(sqrt(seedsBalance / 100)) + 1
  const calculateLevelProgress = (level: number, seedsBalance: number): number => {
    // Calculer les Seeds nécessaires pour le niveau actuel
    const seedsForCurrentLevel = Math.pow(level - 1, 2) * 100;
    
    // Calculer les Seeds nécessaires pour le niveau suivant
    const seedsForNextLevel = Math.pow(level, 2) * 100;
    
    // Si on est déjà au niveau max ou plus, retourner 100%
    if (seedsBalance >= seedsForNextLevel) {
      return 100;
    }
    
    // Calculer la progression dans le niveau actuel
    const progress = ((seedsBalance - seedsForCurrentLevel) / (seedsForNextLevel - seedsForCurrentLevel)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const levelProgress = user ? calculateLevelProgress(user.level || 1, user.seedsBalance || 0) : 0;

  // Gérer le paiement pour l'accès
  const handlePayForAccess = async () => {
    if (!isAuthenticated || !currentUser) {
      toast.error("Vous devez être connecté pour accéder à ce profil");
      return;
    }

    if (hasAccess === true) {
      return; // Déjà accès
    }

    setIsPaying(true);
    try {
      const result = await payForAccess({ profileUserId: userId as Id<"users"> });
      if (result.success) {
        toast.success(`Accès au profil débloqué pour ${accessPrice?.toFixed(2) || 0} Seeds !`);
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du paiement");
    } finally {
      setIsPaying(false);
    }
  };

  // Si pas d'accès et utilisateur connecté, afficher le paywall
  if (isAuthenticated && !isOwnProfile && hasAccess === false) {
    return (
      <div className="bg-background pb-16 lg:pb-0 min-h-screen">
        <div className="max-w-2xl mx-auto w-full px-4 py-8">
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6 lg:p-8">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Icône verrouillée */}
                <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <SolarIcon icon="lock-password-bold" className="size-10 text-primary" />
                </div>

                {/* Titre */}
                <div>
                  <h1 className="text-2xl font-bold mb-2">Profil verrouillé</h1>
                  <p className="text-muted-foreground">
                    Accédez aux performances détaillées de <span className="font-semibold">@{user.username || user.name}</span>
                  </p>
                </div>

                {/* Prix */}
                {accessPrice !== undefined && (
                  <div className="w-full max-w-sm">
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <p className="text-sm text-muted-foreground mb-2">Prix d'accès</p>
                      <div className="flex items-center justify-center gap-2">
                        <SeedDisplay amount={accessPrice} variant="default" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Prix proportionnel à l'économie totale de l'app
                      </p>
                    </div>
                  </div>
                )}

                {/* Bouton de paiement */}
                <Button
                  onClick={handlePayForAccess}
                  disabled={isPaying || accessPrice === undefined}
                  size="lg"
                  className="w-full max-w-sm"
                >
                  {isPaying ? (
                    <>
                      <SolarIcon icon="loading" className="size-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <SolarIcon icon="wallet-bold" className="size-4 mr-2" />
                      Débloquer l'accès
                    </>
                  )}
                </Button>

                {/* Info supplémentaire */}
                <p className="text-xs text-muted-foreground max-w-sm">
                  💡 L'accès est permanent. Une fois débloqué, vous pourrez consulter ce profil à tout moment.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background pb-16 lg:pb-0 min-h-screen">
      <div className="max-w-2xl mx-auto w-full relative" style={{ zIndex: 0 }}>
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            setActiveTab(value);
          }} 
          className="w-full"
        >
        {/* Header Profil + Tabs - Sticky unifié pour éviter les espaces */}
        <div 
          className="sticky bg-background border-b border-border/50"
          style={{
            top: "calc(var(--breaking-news-height, 0px) + var(--header-height, 56px))",
            zIndex: 999,
            position: "sticky",
          }}
        >
          {/* Header Profil - Collé directement sous le header mobile */}
          <div className="px-4 pb-4 pt-6 bg-background/95 backdrop-blur-xl lg:pt-8">
              {/* Ligne 1: Avatar + Nom + Niveau + Bouton Suivre */}
              <div className="flex items-start gap-3 mb-4">
                <Avatar className="size-14 shrink-0 ring-2 ring-primary/20">
                  <AvatarImage src={user.image || undefined} alt={user.name || user.username || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h1 className="text-lg font-bold truncate">
                      {user.name || user.username || user.email}
                    </h1>
                    {/* Progress circulaire du niveau */}
                    <div className="shrink-0">
                      <CircularProgress
                        value={levelProgress}
                        size={36}
                        strokeWidth={3}
                      >
                        <span className="text-xs font-bold text-foreground">
                          {user.level || 1}
                        </span>
                      </CircularProgress>
                    </div>
                  </div>
                  
                  {/* Bio */}
                  {user.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {user.bio}
                    </p>
                  )}
                  
                  {/* Bouton Suivre - Seulement si ce n'est pas son propre profil */}
                  {isAuthenticated && !isOwnProfile && (
                    <Button
                      variant={isFollowingUser ? "outline" : "default"}
                      size="sm"
                      onClick={async () => {
                        try {
                          await toggleFollow({
                            targetType: "user",
                            targetId: userId,
                          });
                          toast.success(
                            isFollowingUser ? t('unfollowed') : t('following'),
                            {
                              description: isFollowingUser
                                ? t('unfollowDescription', { name: user.name || user.username || "cet utilisateur" })
                                : t('followDescription', { name: user.name || user.username || "cet utilisateur" }),
                            }
                          );
                        } catch (error) {
                          console.error("Error toggling follow:", error);
                          toast.error(tErrors('generic'), {
                            description: error instanceof Error ? error.message : tErrors('followError'),
                          });
                        }
                      }}
                      className="text-xs mt-1"
                    >
                      {isFollowingUser ? t('unfollow') : t('follow')}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Stats - Style compact comme le portfolio */}
              {userProfile === undefined ? (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground mb-1 truncate">{t('stats.inProgress')}</p>
                    <p className="text-base font-bold text-foreground">{stats.resolvedAnticipations}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground mb-1 truncate">{t('stats.correct')}</p>
                    <p className="text-base font-bold text-foreground">{stats.correctAnticipations}</p>
                    {stats.resolvedAnticipations > 0 && (
                      <p className="text-[9px] text-muted-foreground truncate">{stats.accuracy.toFixed(2)}% {t('stats.accuracy')}</p>
                    )}
                  </div>
                  <div className="min-w-0 text-right">
                    <p className="text-[10px] text-muted-foreground mb-1 truncate">{t('stats.seeds')}</p>
                    <SeedDisplay amount={user.seedsBalance || 0} variant="compact" className="justify-end" />
                    {(followersCount !== undefined || followingCount !== undefined) && (
                      <div className="flex items-center gap-2 justify-end mt-1">
                        {followersCount !== undefined && (
                          <span className="text-[9px] text-muted-foreground">{followersCount} {t('stats.followers')}</span>
                        )}
                        {followingCount !== undefined && (
                          <span className="text-[9px] text-muted-foreground">{followingCount} {t('stats.following')}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
                    
              {/* Infos supplémentaires - Discrètes */}
              {(user.createdAt || (user.links && user.links.length > 0)) && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-border/30">
                  {user.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      {t('memberSince')} {new Date(user.createdAt).toLocaleDateString("fr-FR", { 
                        year: "numeric", 
                        month: "long" 
                      })}
                    </p>
                  )}
                  
                  {user.links && user.links.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {user.links.map((link: any, idx: number) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-muted/50"
                        >
                          <SolarIcon icon="link-bold" className="size-3" />
                          <span className="truncate max-w-[120px]">{link.type}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          
          {/* Onglets - Dans le même sticky pour éviter les espaces */}
          <div 
            className="bg-background/95 backdrop-blur-xl border-t border-border/50 relative"
            style={{
              zIndex: 999,
              transform: "translateZ(0)",
              position: "relative",
              isolation: "isolate",
            }}
          >
            <TabsList 
              className="w-full h-auto p-0 bg-transparent rounded-none relative"
              style={{
                zIndex: 999,
                transform: "translateZ(0)",
                position: "relative",
              }}
            >
              <TabsTrigger
                value="resolved"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm font-medium"
              >
                {t('tabs.inProgress')}
              </TabsTrigger>
              <TabsTrigger
                value="correct"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm font-medium"
              >
                {t('tabs.correct')}
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm font-medium"
              >
                {t('tabs.saved')}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

          {/* Contenu scrollable des tabs - en dehors du div sticky */}
          {/* Carousel pour mobile ET desktop - Tous les tabs côte à côte */}
          <div 
            className="relative overflow-hidden"
            style={{
              zIndex: 0,
              position: "relative",
            }}
          >
            <SwipeableTabsContent
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              className=""
              baseTransform={`translateX(-${currentTabIndex * 100}%)`}
            >
              {/* Tab En cours */}
              <div className="w-full shrink-0 relative z-0">
                <TabsContent value="resolved" className="px-4 pt-4 pb-6 animate-none">
                  {allAnticipations === undefined ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                      ))}
                    </div>
                  ) : pendingAnticipations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <SolarIcon icon="clock-circle-bold" className="size-8 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold mb-1">{t('empty.inProgress')}</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {t('empty.inProgressDescription')}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {pendingAnticipations.slice(0, resolvedLimit).map((anticipation) => {
                        if (!anticipation.decision) return null;
                        const decision = anticipation.decision as any;
                        return (
                          <PerformanceCard
                            key={anticipation._id}
                            anticipation={anticipation}
                            decision={decision}
                            onClick={() => {
                              // Si c'est le profil de l'utilisateur connecté, ouvrir le drawer de détail/vente
                              if (isOwnProfile) {
                                handleOpenDetailSheet(anticipation, decision, anticipation.position);
                              } else {
                                // Sinon, ouvrir le drawer de détail avec boutons d'achat orientés égo
                                setSelectedPositionDetail({ anticipation, decision });
                                setShowPositionDetail(true);
                              }
                            }}
                          />
                        );
                      })}
                      {pendingAnticipations.length > resolvedLimit && (
                        <div className="col-span-2 sm:col-span-3 flex justify-center pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setResolvedLimit(resolvedLimit + 20)}
                          >
                            {t('seeMore')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </div>

              {/* Tab Correctes */}
              <div className="w-full shrink-0 relative z-0">
                <TabsContent value="correct" className="px-4 pt-4 pb-6 animate-none">
                  {correctAnticipations === undefined ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                      ))}
                    </div>
                  ) : !correctAnticipations || correctAnticipations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <SolarIcon icon="trophy-bold" className="size-8 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold mb-1">{t('empty.correct')}</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {t('empty.correctDescription')}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {correctAnticipations.map((anticipation) => {
                        if (!anticipation.decision) return null;
                        const decision = anticipation.decision as any;
                        return (
                          <PerformanceCard
                            key={anticipation._id}
                            anticipation={anticipation}
                            decision={decision}
                            onClick={() => {
                              // Si c'est le profil de l'utilisateur connecté, ouvrir le drawer de détail/vente
                              if (isOwnProfile) {
                                handleOpenDetailSheet(anticipation, decision, anticipation.position);
                              } else {
                                // Sinon, ouvrir le drawer de détail avec boutons d'achat orientés égo
                                setSelectedPositionDetail({ anticipation, decision });
                                setShowPositionDetail(true);
                              }
                            }}
                          />
                        );
                      })}
                      {correctAnticipations.length === correctLimit && correctLimit >= 20 && (
                        <div className="col-span-2 sm:col-span-3 flex justify-center pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCorrectLimit(correctLimit + 20)}
                          >
                            {t('seeMore')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </div>

              {/* Tab Sauvegardées */}
              <div className="w-full shrink-0 relative z-0">
                <TabsContent value="saved" className="px-4 pt-4 pb-6 animate-none">
                  {savedFavorites === undefined ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                      ))}
                    </div>
                  ) : savedDecisions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <SolarIcon icon="bookmark-bold" className="size-8 text-primary" />
                      </div>
                      <h3 className="text-base font-semibold mb-1">{t('empty.saved')}</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        {t('empty.savedDescription')}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {savedDecisions.map((favorite) => {
                        if (!favorite.content) return null;
                        const decision = favorite.content as any;
                        const imageUrl = decision.coverImage || decision.imageUrl;
                        return (
                          <Link
                            key={favorite._id}
                            href={`/${decision.slug}`}
                            className="group relative aspect-square overflow-hidden rounded-lg bg-muted/50 border border-border/50 hover:border-primary/30 transition-all"
                          >
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={decision.title}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                                sizes="(max-width: 640px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted/30">
                                <SolarIcon icon="bookmark-bold" className="size-8 text-muted-foreground" />
                              </div>
                            )}
                            
                            {/* Badge emoji en haut à gauche */}
                            {decision.emoji && (
                              <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs border border-border/50">
                                {decision.emoji}
                              </div>
                            )}
                            
                            {/* Badge Sauvegardé en bas */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/95 via-background/80 to-transparent p-2">
                              <div className="flex items-center justify-between gap-1">
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-background/90">
                                  <SolarIcon icon="bookmark-bold" className="size-2.5 mr-0.5" />
                                  {t('status.saved')}
                                </Badge>
                                {decision.anticipationsCount > 0 && (
                                  <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                    <SolarIcon icon="users-group-two-rounded-bold" className="size-2.5" />
                                    <span>{decision.anticipationsCount}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Overlay au hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity px-3 text-center">
                                <p className="text-xs font-medium text-white line-clamp-2 drop-shadow-lg">
                                  {decision.title}
                                </p>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                      {savedDecisions.length >= savedLimit && (
                        <div className="col-span-2 sm:col-span-3 flex justify-center pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSavedLimit(savedLimit + 20)}
                          >
                            {t('seeMore')}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </div>
            </SwipeableTabsContent>
          </div>
          </Tabs>
      
        {/* Espace pour la bottom nav mobile */}
        <div className="h-16 lg:hidden" />
      </div>
      
      {/* Drawer de détail de position avec boutons d'achat */}
      {selectedPositionDetail && (
        <PositionDetailDrawer
          open={showPositionDetail}
          onOpenChange={setShowPositionDetail}
          anticipation={selectedPositionDetail.anticipation}
          decision={selectedPositionDetail.decision}
          onBuy={(position: "yes" | "no", shares: number) => {
            if (!isAuthenticated) {
              router.push("/sign-in");
              return;
            }
            setIsSubmitting(true);
            buyShares({
              decisionId: selectedPositionDetail.decision._id,
              position,
              shares,
            })
              .then(() => {
                setShowPositionDetail(false);
                setPurchaseData({
                  decisionId: selectedPositionDetail.decision._id,
                  decisionTitle: selectedPositionDetail.decision.title,
                  position,
                  shares,
                });
                setShowPurchaseSuccess(true);
                toast.success("Position achetée avec succès !");
              })
              .catch((error: any) => {
                toast.error(error.message || "Erreur lors de l'achat");
              })
              .finally(() => {
                setIsSubmitting(false);
              });
          }}
          isSubmitting={isSubmitting}
        />
      )}
      
      {/* Modal de succès d'achat */}
      {purchaseData && (
        <PurchaseSuccessModal
          open={showPurchaseSuccess}
          onOpenChange={setShowPurchaseSuccess}
          decisionId={purchaseData.decisionId}
          decisionTitle={purchaseData.decisionTitle}
          position={purchaseData.position}
          shares={purchaseData.shares}
        />
      )}
      
      {/* Drawers de détail et vente pour le profil de l'utilisateur connecté */}
      {/* Toujours rendre le drawer mais ne l'ouvrir que si c'est le propre profil */}
        <>
          {/* Sheet de détail de position */}
        <Sheet open={detailSheetOpen && isOwnProfile} onOpenChange={(open) => {
          if (isOwnProfile) {
            setDetailSheetOpen(open);
          }
        }} side="bottom">
            <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0 overflow-hidden w-full max-w-full [&>button]:hidden">
              {selectedPosition && (
                <div className="relative h-full flex flex-col overflow-hidden w-full max-w-full min-w-0">
                  {/* Cover progressif partout */}
                  {selectedPosition.decision?.imageUrl && (
                    <div className="absolute inset-0 z-0">
                      <Image
                        src={selectedPosition.decision.imageUrl}
                        alt={selectedPosition.decisionTitle}
                        fill
                        className="object-cover"
                        sizes="100vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-background from-20% via-background/95 to-background" />
                    </div>
                  )}

                  {/* Contenu avec z-index relatif */}
                  <div className="relative z-10 flex flex-col h-full overflow-hidden max-w-full min-h-0">
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

                    {/* Contenu scrollable compact */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-2 space-y-4 max-w-full flex flex-col min-h-0">
                      {/* Gains */}
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

                      {/* Graphique du cours */}
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
                        currentPrice={selectedPosition.currentPrice}
                        decisionId={selectedPosition.decisionId}
                        position={selectedPosition.position}
                      />
                    </div>

                    {/* Footer fixe avec onglets Acheter/Revendre */}
                    <div className="shrink-0 px-4 pb-6 pt-2.5 bg-background/95 backdrop-blur-sm border-t border-border/30 space-y-3 max-h-[50vh] overflow-y-auto">
                      {/* Onglets */}
                      <div className="flex gap-2">
                      <Button
                          variant={buyMoreMode === "buy" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setBuyMoreMode("buy")}
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
                          variant={buyMoreMode === "sell" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setBuyMoreMode("sell")}
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
                      
                      {/* Contenu selon le mode */}
                      {buyMoreMode === "sell" ? (
                        <SellMoreSection 
                          selectedPosition={selectedPosition}
                          sellSharesAmount={sellSharesAmount}
                          setSellSharesAmount={setSellSharesAmount}
                          isSelling={isSelling}
                          setIsSelling={setIsSelling}
                          sellShares={sellShares}
                          setDetailSheetOpen={setDetailSheetOpen}
                          estimatedSellAmount={estimatedSellAmountDetail}
                        />
                      ) : (
                        <BuyMoreSection 
                          selectedPosition={selectedPosition}
                          buyMoreAmount={buyMoreAmount}
                          setBuyMoreAmount={setBuyMoreAmount}
                          isBuyingMore={isBuyingMore}
                          setIsBuyingMore={setIsBuyingMore}
                          buyShares={buyShares}
                          setDetailSheetOpen={setDetailSheetOpen}
                          setShowPurchaseSuccess={setShowPurchaseSuccess}
                          setPurchaseData={setPurchaseData}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Sheet de vente */}
          <Sheet open={sellSheetOpen && isOwnProfile} onOpenChange={(open) => {
            if (isOwnProfile) {
              setSellSheetOpen(open);
            }
          }} side="bottom">
            <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0 overflow-hidden w-full max-w-full [&>button]:hidden">
              {selectedSellItem && (
                <div className="relative h-full flex flex-col overflow-hidden w-full max-w-full min-w-0">
                  {/* Cover progressif partout */}
                  {selectedSellItem.imageUrl && (
                    <div className="absolute inset-0 z-0">
                      <Image
                        src={selectedSellItem.imageUrl}
                        alt={selectedSellItem.decisionTitle}
                        fill
                        className="object-cover"
                        sizes="100vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-background from-20% via-background/95 to-background" />
                    </div>
                  )}

                  {/* Contenu avec z-index relatif */}
                  <div className="relative z-10 flex flex-col h-full overflow-hidden max-w-full">
                    {/* Header compact */}
                    <div className="px-4 pt-3 pb-2 shrink-0">
                      <SheetHeader className="text-left p-0">
                        <SheetTitle className="text-sm font-bold mb-1.5 line-clamp-2">
                          Revendre des parts
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
                      {/* Slider pour choisir le nombre de parts */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground font-medium">Parts à revendre</span>
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
                      </div>

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
                        </div>
                      )}
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
                            Revendre {formatDetailNumber(parseFloat(sellSharesAmount) || 0)} part{(parseFloat(sellSharesAmount) || 0) > 1 ? "s" : ""}
                          </>
                        )}
                      </Button>
                    </SheetFooter>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </>
    </div>
  );
}

export function UserProfileClient({ username }: UserProfileClientProps) {
  const { user: currentUser, isAuthenticated } = useUser();
  const user = useQuery(api.users.getUserByUsername, { username });

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[614px] mx-auto px-4 py-6">
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    notFound();
  }

  // Si le profil est privé et que ce n'est pas le propriétaire, afficher la vue privée
  if (!user.isPublic && currentUser?._id !== user._id) {
    return <PrivateProfileView user={user} />;
  }

  // Si public ou propriétaire, afficher la vue publique
  return <PublicProfileView user={user} userId={user._id} />;
}

