"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "motion/react";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { OpinionCourseChart } from "./OpinionCourseChart";
import { TopArgumentsList } from "./TopArgumentsList";
import { Sheet, SheetContent, SheetTitle, SheetHeader, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { AnimatePresence } from "motion/react";
import { ActionSlider } from "./ActionSlider";
import { Minus, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Area, AreaChart, XAxis } from "recharts";
import { useTranslations } from 'next-intl';
import { RelatedNewsClient } from "./RelatedNewsClient";
import Image from "next/image";
import { PurchaseSuccessModal } from "@/components/ui/PurchaseSuccessModal";

// Wrapper pour le bouton Save avec le style des autres boutons d'action
function SaveButtonWrapper({ decisionId }: { decisionId: Id<"decisions"> }) {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const isSaved = useQuery(
    api.favorites.isFavorite,
    isAuthenticated
      ? {
          targetType: "decision",
          targetId: decisionId,
        }
      : "skip"
  );
  const toggleSave = useMutation(api.favorites.toggleFavorite);
  const [isSaving, setIsSaving] = useState(false);
  const t = useTranslations('decisions');
  const tErrors = useTranslations('errors');

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    setIsSaving(true);
    try {
      const result = await toggleSave({
        targetType: "decision",
        targetId: decisionId,
      });

      if (result.favorited) {
        toast.success(t('save.savedToast'));
      } else {
        toast.success(t('save.unsavedToast'));
      }
    } catch (error: any) {
      toast.error(tErrors('generic'), {
        description: error.message || tErrors('generic'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saved = isSaved === true;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      disabled={isSaving}
      className={cn(
        "size-14 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all duration-200 backdrop-blur-sm",
        saved
          ? "bg-primary/10 border-primary/40 text-primary"
          : "bg-background/60 border-border/40 text-muted-foreground hover:bg-muted hover:border-primary/30 hover:text-primary"
      )}
    >
      <SolarIcon 
        icon="bookmark-bold" 
        className={cn(
          "size-5 transition-all duration-200",
          saved && "text-primary"
        )}
      />
      <span className="text-[9px] font-medium text-muted-foreground">
        Enregistrer
      </span>
    </motion.button>
  );
}

interface TradingInterfaceReelsProps {
  decisionId: Id<"decisions">;
  question: string;
  answer1: string;
  status: "announced" | "tracking" | "resolved";
  description?: string;
}

/**
 * Interface style reels Instagram/TikTok - Fullscreen
 * - Boutons d'action à droite (OUI, NON, Commentaire)
 * - Question + graphique en bas
 * - Graphique transparent au centre (optionnel)
 * - Tout tient sur la hauteur de l'écran
 */
export function TradingInterfaceReels({
  decisionId,
  question,
  answer1,
  status,
  description,
}: TradingInterfaceReelsProps) {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  // Récupérer les données
  const decision = useQuery(api.decisions.getDecisionById, { decisionId });
  const tradingPools = useQuery(api.trading.getTradingPools, { decisionId });
  const userPortfolio = useQuery(
    api.trading.getUserPortfolio,
    isAuthenticated ? { decisionId } : "skip"
  );
  // 🎯 Cote unique : probabilité que l'événement se produise (0-100%)
  const probability = useQuery(api.trading.getSingleOdds, {
    decisionId,
  });
  const courseHistory = useQuery(api.trading.getDecisionCourseHistory, {
    decisionId,
  });

  // 🎯 FOMO Countdown : Calculer le temps restant pour investir (fenêtre variable)
  const investmentWindow = useQuery(api.trading.getInvestmentWindow, { decisionId });
  
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

  // Récupérer les commentaires pour afficher le nombre
  const topArguments = useQuery(api.topArguments.getAllArguments, {
    decisionId,
  });
  const commentsCount = topArguments?.length || 0;

  // Utiliser la description de la prop ou de la query
  const decisionDescription = description || decision?.description;

  // États
  const [selectedPosition, setSelectedPosition] = useState<"yes" | "no" | null>(null);
  const [partsAmount, setPartsAmount] = useState<string>("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showBuySheet, setShowBuySheet] = useState(false);
  const [showChartSheet, setShowChartSheet] = useState(false);
  const [showNewsSheet, setShowNewsSheet] = useState(false);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [purchaseData, setPurchaseData] = useState<{
    decisionId: Id<"decisions">;
    decisionTitle: string;
    position: "yes" | "no";
    shares: number;
    timeAddedMs?: number;
  } | null>(null);

  // Callback mémorisé pour éviter les boucles infinies
  const handleBuySheetOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setShowBuySheet(false);
      // Réinitialiser la position après la fermeture du sheet
      setSelectedPosition(null);
    }
  }, []);

  // Mutations
  const buyShares = useMutation(api.trading.buyShares);

  // Calculer la variation de probabilité
  const calculateProbabilityVariation = () => {
    if (!courseHistory?.history?.length) {
      return 0;
    }
    const { history } = courseHistory;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayFirstPoint = history.find((p) => (p.timestamp || 0) >= todayStart) || history[0];
    const lastPoint = history[history.length - 1];
    const openingPoint = todayFirstPoint || history[0];
    
    // Calculer les probabilités à partir des liquidités yes/no
    const openingTotal = (openingPoint.yes || 0) + (openingPoint.no || 0);
    const lastTotal = (lastPoint.yes || 0) + (lastPoint.no || 0);
    
    if (openingTotal <= 0 || lastTotal <= 0) return 0;
    
    const openingProbability = ((openingPoint.yes || 0) / openingTotal) * 100;
    const lastProbability = ((lastPoint.yes || 0) / lastTotal) * 100;
    
    const variation = lastProbability - openingProbability;
    return Math.round(variation * 10) / 10; // Arrondir à 1 décimale
  };

  const probabilityVariation = calculateProbabilityVariation();

  // Préparer les données pour le mini graphique (probabilité unique)
  const chartData = useMemo(() => {
    if (!courseHistory?.history?.length) return [];
    
    // Prendre les 15 derniers points pour le mini graphique
    const recentHistory = courseHistory.history.slice(-15);
    
    return recentHistory.map((point, index) => {
      const total = (point.yes || 0) + (point.no || 0);
      const probability = total > 0 ? ((point.yes || 0) / total) * 100 : 50;
      return {
        index,
        probability,
      };
    });
  }, [courseHistory]);

  // Récupérer la couleur de background et créer le gradient overlay
  const overlayGradient = useMemo(() => {
    if (typeof window === "undefined") return "";
    
    const bgColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--background")
      .trim();
    
    // Convertir hex en RGB
    const hexToRgb = (hex: string): [number, number, number] | null => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
          ]
        : null;
    };

    const rgb = hexToRgb(bgColor);
    if (!rgb) return "";

    const [r, g, b] = rgb;
    // Overlay plus fort en bas pour améliorer la lisibilité - gradient plus progressif et plus foncé en bas
    // Dégradé progressif : très foncé en bas (0.95), transparent en haut (0)
    // Plus de points de contrôle pour un gradient plus doux et progressif
    const opacities = [0.95, 0.92, 0.88, 0.82, 0.75, 0.65, 0.50, 0.35, 0.20, 0.10, 0.05, 0.02, 0];
    const stops = [0, 8, 15, 25, 35, 45, 55, 65, 75, 85, 92, 97, 100];

    return `linear-gradient(to top, ${opacities
      .map((opacity, i) => `rgba(${r}, ${g}, ${b}, ${opacity}) ${stops[i]}%`)
      .join(", ")})`;
  }, []);

  // Calculer le coût (en Seeds) et le prix actuel
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
  
  const currentPrice = selectedPosition ? calculateCurrentPrice(selectedPosition) : 0;
  const priceAfterPurchase = selectedPosition ? calculatePriceAfterPurchase(selectedPosition, partsNum) : 0;
  
  // 🎯 Calculer le multiplicateur théorique (100 / prix actuel)
  // C'est le multiplicateur max si l'événement se produit et que personne n'achète après
  const currentMultiplier = currentPrice > 0 && currentPrice < 100 ? 100 / currentPrice : 0;
  const multiplierAfterPurchase = priceAfterPurchase > 0 && priceAfterPurchase < 100 ? 100 / priceAfterPurchase : 0;

  // Calculer le temps ajouté pour cet achat (PROGRESSIF)
  const calculateTimeAdded = (sharesPurchased: number): number => {
    if (!tradingPools || sharesPurchased <= 0) return 0;
    
    // Formule progressive : +0.01h (36 secondes) par action
    // Le temps ajouté est directement proportionnel au nombre d'actions achetées
    const hoursAdded = sharesPurchased * 0.01; // Progressif : 1 action = 0.01h (36s), 10 actions = 0.1h (6min), 100 actions = 1h
    
    // Convertir en millisecondes
    return hoursAdded * 60 * 60 * 1000;
  };

  // Vérifier si la fenêtre d'investissement est expirée
  const isInvestmentExpired = timeRemaining?.isExpired ?? false;

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
    if (partsNum <= 0) {
      toast.error("Nombre de parts invalide");
      return;
    }
    setIsSubmitting(true);
    try {
      // Calculer le temps ajouté AVANT l'achat (basé sur l'état actuel)
      const timeAddedMs = calculateTimeAdded(partsNum);
      
      await buyShares({ decisionId, position, shares: partsNum });
      // Afficher le modal de succès
      setPurchaseData({
        decisionId,
        decisionTitle: decision?.title || question || "Décision",
        position,
        shares: partsNum,
        timeAddedMs,
      });
      setShowPurchaseSuccess(true);
      setPartsAmount("1");
      setSelectedPosition(null);
      setShowBuySheet(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "resolved") return null;

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Contenu principal - Panel de détails avec transparence légère pour voir l'image de cover */}
      <div className="relative h-full flex flex-col">
        {/* Fond semi-transparent progressif - Cover visible en haut - Utilise la couleur de bg - SANS FLOU */}
        {overlayGradient && (
          <div 
            className="absolute inset-0 z-10"
            style={{ background: overlayGradient }}
          />
        )}
        
        {/* Contenu du panel - Toujours visible, justifié vers le bas, tout tient dans l'écran */}
        <div className="relative z-20 flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Contenu principal - Justifié vers le bas, tout tient dans l'écran */}
          <div className="flex-1 flex flex-col justify-end px-4 pb-32 w-full min-h-0">
            {/* Titre */}
            <div className="w-full max-w-[calc(100%-80px)] relative z-30 mb-3">
              <h2 className="text-base font-bold text-foreground leading-tight">{question}</h2>
            </div>

            {/* Probabilité unique - Cliquable pour ouvrir le graphique */}
            <div className="w-full max-w-[calc(100%-80px)] relative z-30 mb-16">
              <button
                onClick={() => setShowChartSheet(true)}
                className="group relative w-full text-left"
              >
                <div className="space-y-3">
                  {/* Probabilité principale */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Probabilité</span>
                      {probability !== undefined ? (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-2xl font-bold",
                            probability >= 50 ? YES_COLORS.text.light : NO_COLORS.text.light
                          )}>
                            {probability.toFixed(1)}%
                          </span>
                          {probabilityVariation !== 0 && (
                            <span className={cn(
                              "text-sm font-semibold",
                              probabilityVariation > 0 ? "text-green-500" : "text-red-500"
                            )}>
                              ({probabilityVariation > 0 ? "+" : ""}{probabilityVariation.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      ) : (
                        <SolarIcon icon="loading" className="size-4 animate-spin" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">
                        {probability !== undefined && probability >= 50 
                          ? `${probability.toFixed(1)}% pensent que ça va arriver`
                          : probability !== undefined
                          ? `${(100 - probability).toFixed(1)}% pensent que ça n'arrivera pas`
                          : "Chargement..."}
                      </p>
                      <p className="text-[9px] text-muted-foreground/80 italic">
                        La probabilité reflète l'opinion de la communauté
                      </p>
                    </div>
                  </div>

                  {/* Mini graphique de tendance (probabilité OUI) */}
                  {chartData.length > 0 && (
                    <div className="h-12 mt-2">
                      <ChartContainer
                        className="w-full h-full"
                        config={{
                          probability: {
                            label: "Probabilité",
                            color: YES_COLORS.chart.light,
                          },
                        }}
                      >
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id={`gradient-prob-${decisionId}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={YES_COLORS.chart.light} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={YES_COLORS.chart.light} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="index" hide={true} />
                          <Area
                            dataKey="probability"
                            stroke={YES_COLORS.chart.light}
                            fill={`url(#gradient-prob-${decisionId})`}
                            fillOpacity={0.4}
                            strokeWidth={1.5}
                            type="monotone"
                          />
                        </AreaChart>
                      </ChartContainer>
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Description ou Indicateur de position sélectionnée - Full width - Hauteur fixe */}
            <div className="flex-shrink-0 w-full h-[72px] flex items-center">
              {selectedPosition ? (
                /* Indicateur visuel - Ouvre le Sheet au clic */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                >
                  <button
                    onClick={() => setShowBuySheet(true)}
                    className={cn(
                      "w-full flex items-center justify-between transition-all",
                      "p-3 rounded-xl",
                      selectedPosition === "yes"
                        ? cn(YES_COLORS.bg.medium, "hover:" + YES_COLORS.bg.dark)
                        : cn(NO_COLORS.bg.medium, "hover:" + NO_COLORS.bg.dark, "relative overflow-hidden")
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "size-10 rounded-xl flex items-center justify-center relative overflow-hidden",
                        selectedPosition === "yes"
                          ? cn(YES_COLORS.bg.dark, YES_COLORS.text.light)
                          : cn(NO_COLORS.bg.dark, NO_COLORS.text.light)
                      )}>
                        {selectedPosition === "no" && (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-slate-400/5 pointer-events-none" />
                        )}
                        <SolarIcon 
                          icon={selectedPosition === "yes" ? "check-circle-bold" : "close-circle-bold"} 
                          className="size-5" 
                        />
                      </div>
                      <p className="text-sm font-semibold">
                        {selectedPosition === "yes" ? "Position OUI" : "Position NON"}
                      </p>
                    </div>
                    <SolarIcon icon="arrow-right-bold" className="size-4 text-muted-foreground" />
                  </button>
                </motion.div>
              ) : (
                /* Description + Countdown FOMO - Affichée quand aucune position n'est sélectionnée */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full space-y-2"
                >
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
                  {decisionDescription && (
                    <p className="text-xs text-foreground/90 leading-relaxed">
                      {decisionDescription}
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Boutons d'action à droite (style reels) - Remontés et améliorés pour plus d'ergonomie */}
        <div className="absolute right-4 top-[45%] -translate-y-1/2 z-20 flex flex-col items-center gap-5">
          {/* Bouton OUI - Amélioré avec effets premium */}
          <motion.button
            whileHover={!isInvestmentExpired ? { scale: 1.08, y: -2 } : {}}
            whileTap={!isInvestmentExpired ? { scale: 0.95 } : {}}
            onClick={() => {
              if (isInvestmentExpired) {
                toast.error("La fenêtre d'investissement est fermée");
                return;
              }
              if (!isAuthenticated) {
                router.push("/sign-in");
                return;
              }
              if (selectedPosition === "yes") {
                setSelectedPosition(null);
                setShowBuySheet(false);
              } else {
                setSelectedPosition("yes");
                setShowBuySheet(true);
              }
            }}
            disabled={isInvestmentExpired}
            className={cn(
              "size-16 rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2 transition-all duration-300",
              "relative overflow-hidden group",
              isInvestmentExpired && "opacity-50 cursor-not-allowed",
              selectedPosition === "yes"
                ? cn(
                    "bg-gradient-to-br", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to,
                    "border-primary shadow-2xl shadow-primary/40",
                    "ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                  )
                : cn(
                    "bg-background/80 backdrop-blur-md border-border/50 text-muted-foreground",
                    !isInvestmentExpired && "hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/20",
                    !isInvestmentExpired && "hover:" + YES_COLORS.text.light
                  )
            )}
          >
            {/* Effet de glow au hover (non sélectionné) */}
            {!selectedPosition && (
              <motion.div
                className="absolute inset-0 bg-primary/0 rounded-2xl"
                whileHover={{ backgroundColor: "rgba(36, 107, 253, 0.1)" }}
                transition={{ duration: 0.3 }}
              />
            )}

            {/* Animation de brillance quand sélectionné */}
            {selectedPosition === "yes" && (
              <>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ 
                    x: ["-100%", "200%"],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut",
                    repeatDelay: 0.5,
                  }}
                />
                <motion.div
                  className="absolute inset-0 bg-white/15"
                  animate={{
                    opacity: [0.15, 0.35, 0.15],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "easeInOut",
                  }}
                />
                {/* Effet de pulse subtil */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-white/20"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  }}
                />
              </>
            )}

            {/* Pulse subtil même quand non sélectionné */}
            {selectedPosition !== "yes" && (
              <motion.div
                className="absolute inset-0 rounded-2xl border border-primary/20"
                animate={{
                  opacity: [0, 0.3, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
              />
            )}

            <SolarIcon 
              icon="check-circle-bold" 
              className={cn(
                "size-6 transition-all duration-300 relative z-10",
                selectedPosition === "yes" 
                  ? "text-white drop-shadow-xl" 
                  : "text-muted-foreground group-hover:text-primary"
              )} 
            />
            {probability !== undefined && (
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "text-[10px] font-semibold leading-tight relative z-10",
                  selectedPosition === "yes" ? "text-white/95 drop-shadow-md" : "text-muted-foreground group-hover:text-primary/80"
                )}
              >
                {probability.toFixed(1)}%
              </motion.span>
            )}
          </motion.button>

          {/* Bouton NON - Amélioré avec effets premium métalliques */}
          <motion.button
            whileHover={!isInvestmentExpired ? { scale: 1.08, y: -2 } : {}}
            whileTap={!isInvestmentExpired ? { scale: 0.95 } : {}}
            onClick={() => {
              if (isInvestmentExpired) {
                toast.error("La fenêtre d'investissement est fermée");
                return;
              }
              if (!isAuthenticated) {
                router.push("/sign-in");
                return;
              }
              if (selectedPosition === "no") {
                setSelectedPosition(null);
                setShowBuySheet(false);
              } else {
                setSelectedPosition("no");
                setShowBuySheet(true);
              }
            }}
            disabled={isInvestmentExpired}
            className={cn(
              "size-16 rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2 transition-all duration-300",
              "relative overflow-hidden group",
              isInvestmentExpired && "opacity-50 cursor-not-allowed",
              selectedPosition === "no"
                ? cn(
                    "bg-gradient-to-br", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to,
                    "border-zinc-400/50 shadow-2xl shadow-zinc-500/30",
                    "ring-2 ring-zinc-400/20 ring-offset-2 ring-offset-background",
                    "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/15 before:via-transparent before:to-zinc-400/10"
                  )
                : cn(
                    "bg-background/80 backdrop-blur-md border-border/50 text-muted-foreground",
                    "hover:border-zinc-400/40 hover:bg-zinc-500/5 hover:shadow-lg hover:shadow-zinc-500/15",
                    "hover:" + NO_COLORS.text.light
                  )
            )}
          >
            {/* Effet de glow au hover (non sélectionné) */}
            {!selectedPosition && (
              <motion.div
                className="absolute inset-0 bg-zinc-500/0 rounded-2xl"
                whileHover={{ backgroundColor: "rgba(113, 113, 122, 0.1)" }}
                transition={{ duration: 0.3 }}
              />
            )}

            {/* Animation de brillance métallique quand sélectionné */}
            {selectedPosition === "no" && (
              <>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ 
                    x: ["-100%", "200%"],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3.5,
                    ease: "easeInOut",
                    repeatDelay: 0.5,
                  }}
                />
                <motion.div
                  className="absolute inset-0 bg-white/12"
                  animate={{
                    opacity: [0.1, 0.3, 0.1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "easeInOut",
                  }}
                />
                {/* Effet métallique avec reflets */}
                <motion.div
                  className="absolute inset-0 rounded-2xl border-2 border-white/15"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.4, 0.7, 0.4],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  }}
                />
                {/* Reflet métallique supplémentaire */}
                <motion.div
                  className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl"
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  }}
                />
              </>
            )}

            {/* Pulse subtil même quand non sélectionné */}
            {selectedPosition !== "no" && (
              <motion.div
                className="absolute inset-0 rounded-2xl border border-zinc-400/20"
                animate={{
                  opacity: [0, 0.25, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
              />
            )}

            <SolarIcon 
              icon="close-circle-bold" 
              className={cn(
                "size-6 transition-all duration-300 relative z-10",
                selectedPosition === "no" 
                  ? "text-white drop-shadow-xl" 
                  : "text-muted-foreground group-hover:text-zinc-400"
              )} 
            />
            {probability !== undefined && (
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  "text-[10px] font-semibold leading-tight relative z-10",
                  selectedPosition === "no" ? "text-white/95 drop-shadow-md" : "text-muted-foreground group-hover:text-zinc-400/80"
                )}
              >
                {(100 - probability).toFixed(1)}%
              </motion.span>
            )}
          </motion.button>

          {/* Bouton Enregistrer */}
          <SaveButtonWrapper decisionId={decisionId} />

          {/* Bouton Partager */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              if (typeof window !== "undefined" && navigator.share && decision?.slug) {
                try {
                  await navigator.share({
                    title: question,
                    text: question,
                    url: `${window.location.origin}/${decision.slug}`,
                  });
                } catch (error) {
                  // L'utilisateur a annulé le partage ou erreur
                  if ((error as Error).name !== "AbortError") {
                    // Copier le lien dans le presse-papier en fallback
                    await navigator.clipboard.writeText(`${window.location.origin}/${decision.slug}`);
                    toast.success("Lien copié dans le presse-papier");
                  }
                }
              } else if (decision?.slug) {
                // Fallback : copier le lien
                await navigator.clipboard.writeText(`${window.location.origin}/${decision.slug}`);
                toast.success("Lien copié dans le presse-papier");
              }
            }}
            className="size-14 rounded-xl bg-background/60 backdrop-blur-sm border border-border/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-muted hover:border-border/60 hover:text-foreground transition-all duration-200"
          >
            <SolarIcon icon="share-bold" className="size-5" />
            <span className="text-[9px] font-medium">Partager</span>
          </motion.button>

          {/* Bouton Articles liés - Sheet par le bas */}
          <Sheet open={showNewsSheet} onOpenChange={setShowNewsSheet}>
            <motion.button
              onClick={() => setShowNewsSheet(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="size-14 rounded-xl bg-background/60 backdrop-blur-sm border border-border/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-muted hover:border-border/60 hover:text-foreground transition-all duration-200"
            >
              <SolarIcon icon="document-text-bold" className="size-5" />
              <span className="text-[9px] font-medium">Articles</span>
            </motion.button>
            <SheetContent 
              side="bottom" 
              className="h-[90vh] rounded-t-3xl p-0 overflow-hidden w-full max-w-full [&>button]:hidden"
            >
              <SheetTitle className="sr-only">Articles liés</SheetTitle>
              
              <div className="relative flex-1 flex flex-col overflow-hidden w-full max-w-full min-w-0 pointer-events-none">
                {decision?.imageUrl && (
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                      src={decision.imageUrl}
                      alt={decision.title || "Décision"}
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background from-20% via-background/95 to-background" />
                  </div>
                )}

                {/* Contenu avec z-index relatif */}
                <div className="relative z-5 flex flex-col flex-1 overflow-hidden max-w-full pointer-events-auto">
                  {/* Header compact */}
                  <div className="px-4 pt-3 pb-2 shrink-0">
                    <SheetHeader className="text-left p-0">
                      <div className="flex items-center gap-2 mb-2">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                          }}
                          className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                        >
                          <SolarIcon icon="document-text-bold" className="size-5 text-primary" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <SheetTitle className="text-sm font-bold">
                            Articles liés
                          </SheetTitle>
                        </div>
                      </div>
                    </SheetHeader>
                  </div>
                  
                  {/* Contenu scrollable */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-20 max-w-full">
                    <RelatedNewsClient decisionId={decisionId} autoExpand={true} />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Bouton Commentaire - Sheet par le bas style TikTok */}
          <Sheet open={showComments} onOpenChange={setShowComments}>
            <motion.button
              onClick={() => setShowComments(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="size-14 rounded-xl bg-background/60 backdrop-blur-sm border border-border/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-muted hover:border-border/60 hover:text-foreground transition-all duration-200"
            >
              <SolarIcon icon="chat-round-bold" className="size-5" />
              <span className="text-[9px] font-medium">
                {commentsCount > 0 ? commentsCount : "Commenter"}
              </span>
            </motion.button>
            <SheetContent 
              side="bottom" 
              className="h-[90vh] rounded-t-3xl p-0 overflow-hidden w-full max-w-full [&>button]:hidden flex flex-col"
            >
              <SheetTitle className="sr-only">
                {commentsCount} commentaire{commentsCount > 1 ? "s" : ""}
              </SheetTitle>
              
              <div className="relative flex-1 flex flex-col overflow-hidden w-full max-w-full min-w-0 h-full pointer-events-none">
                {/* Cover progressif partout */}
                {decision?.imageUrl && (
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                      src={decision.imageUrl}
                      alt={decision.title || "Décision"}
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background from-20% via-background/95 to-background" />
                  </div>
                )}

                {/* Contenu avec z-index relatif */}
                <div className="relative z-10 flex flex-col flex-1 overflow-hidden max-w-full h-full pointer-events-auto">
                  {/* Header compact */}
                  <div className="px-4 pt-3 pb-2 shrink-0">
                    <SheetHeader className="text-left p-0">
                      <div className="flex items-center gap-2 mb-2">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                          }}
                          className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                        >
                          <SolarIcon icon="chat-round-bold" className="size-5 text-primary" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <SheetTitle className="text-sm font-bold">
                            {commentsCount} commentaire{commentsCount > 1 ? "s" : ""}
                          </SheetTitle>
                        </div>
                        <SheetClose asChild>
                          <button
                            onClick={() => setShowComments(false)}
                            className="size-8 rounded-full flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors shrink-0"
                          >
                            <SolarIcon icon="close-circle-bold" className="size-4" />
                          </button>
                        </SheetClose>
                      </div>
                    </SheetHeader>
                  </div>
                  
                  {/* Liste des commentaires - Scrollable */}
                  <div className="flex-1 overflow-hidden max-w-full min-h-0">
                    <TopArgumentsList decisionId={decisionId} />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Sheet d'achat - Interface spacieuse et ergonomique */}
          <Sheet 
            open={showBuySheet && selectedPosition !== null} 
            onOpenChange={handleBuySheetOpenChange}
            side="bottom"
          >
            <SheetContent 
              side="bottom" 
              className="h-[90vh] rounded-t-3xl p-0 overflow-hidden w-full max-w-full [&>button]:hidden"
            >
              <SheetTitle className="sr-only">
                Prendre position - {selectedPosition === "yes" ? "Position OUI" : "Position NON"}
              </SheetTitle>
              
              <div className="relative flex-1 flex flex-col overflow-hidden w-full max-w-full min-w-0 pointer-events-none">
                {/* Cover progressif partout */}
                {decision?.imageUrl && (
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                      src={decision.imageUrl}
                      alt={decision.title || "Décision"}
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background from-20% via-background/95 to-background" />
                  </div>
                )}

                {/* Contenu avec z-index relatif */}
                <div className="relative z-10 flex flex-col flex-1 overflow-hidden max-w-full pointer-events-auto">
                  {/* Header compact */}
                  <div className="px-4 pt-3 pb-2 shrink-0">
                    <SheetHeader className="text-left p-0">
                      <div className="flex items-center gap-2 mb-2">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                          }}
                          className={cn(
                            "size-10 rounded-full flex items-center justify-center shrink-0",
                            selectedPosition === "yes" 
                              ? "bg-primary/10" 
                              : "bg-muted"
                          )}
                        >
                          <SolarIcon 
                            icon={selectedPosition === "yes" ? "check-circle-bold" : "close-circle-bold"} 
                            className={cn(
                              "size-5",
                              selectedPosition === "yes" ? "text-primary" : "text-muted-foreground"
                            )} 
                          />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <SheetTitle className="text-sm font-bold">
                            Prendre position
                          </SheetTitle>
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground">
                              {selectedPosition === "yes" ? "Position OUI" : "Position NON"}
                            </p>
                            {probability !== undefined && (
                              <p className="text-[9px] text-muted-foreground/80 italic">
                                {selectedPosition === "yes" 
                                  ? `Acheter OUI augmente la probabilité (actuellement ${probability.toFixed(1)}%)`
                                  : `Acheter NON diminue la probabilité (actuellement ${probability.toFixed(1)}%)`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </SheetHeader>
                  </div>

                  {/* Contenu scrollable */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-20 space-y-3 max-w-full flex flex-col">
                    {/* Probabilité actuelle - Compact */}
                    <div className="bg-muted/50 rounded-lg p-3 text-center border border-border/20 space-y-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1 font-medium">Probabilité actuelle</p>
                        <div className="text-lg font-bold">
                          {probability !== undefined ? (
                            <span className={selectedPosition === "yes" ? YES_COLORS.text.light : NO_COLORS.text.light}>
                              {selectedPosition === "yes" ? probability.toFixed(1) : (100 - probability).toFixed(1)}%
                            </span>
                          ) : (
                            <SolarIcon icon="loading" className="size-4 animate-spin mx-auto" />
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1">
                          {probability !== undefined && selectedPosition === "yes"
                            ? `${probability.toFixed(1)}% pensent que ça va arriver`
                            : probability !== undefined && selectedPosition === "no"
                            ? `${(100 - probability).toFixed(1)}% pensent que ça n'arrivera pas`
                            : ""}
                        </p>
                      </div>
                      {/* Coût estimé en Seeds - Plus visible */}
                      {estimatedCost > 0 && (
                        <div className="pt-2 border-t border-border/30">
                          <p className="text-[9px] text-muted-foreground mb-1">Coût estimé</p>
                          <div className="flex items-center justify-center gap-1.5">
                            <SeedDisplay 
                              amount={estimatedCost} 
                              variant="default" 
                              className="text-base font-bold"
                              iconSize="size-3"
                            />
                          </div>
                          <p className="text-[9px] text-muted-foreground mt-1">
                            pour {partsNum} part{partsNum > 1 ? "s" : ""}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Contrôle nombre de parts - Compact */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-muted-foreground font-medium block">Nombre de parts</label>
                      <div className="flex items-center justify-center gap-3">
                        <motion.button
                          onClick={() => {
                            const newValue = Math.max(1, partsNum - 1);
                            setPartsAmount(newValue.toString());
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
                            setPartsAmount(newValue.toString());
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

                    {/* Prix total - Compact avec explication */}
                    <div className="bg-background/60 backdrop-blur-sm border border-border/20 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-medium">Probabilité</span>
                        <span className="text-[10px] font-semibold">
                          {probability !== undefined ? (
                            <span className={selectedPosition === "yes" ? YES_COLORS.text.light : NO_COLORS.text.light}>
                              {selectedPosition === "yes" ? probability.toFixed(1) : (100 - probability).toFixed(1)}%
                            </span>
                          ) : (
                            "-"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-medium">Quantité</span>
                        <span className="text-[10px] font-semibold">{partsNum} part{partsNum > 1 ? "s" : ""}</span>
                      </div>
                      {/* Temps ajouté dynamique - Progressif selon le nombre de parts */}
                      {partsNum > 0 && (() => {
                        const timeAddedMs = calculateTimeAdded(partsNum);
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
                        const timeAddedText = formatTimeAdded(timeAddedMs);
                        return (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground font-medium">Temps ajouté</span>
                            <span className="text-[10px] font-semibold text-primary">
                              +{timeAddedText}
                            </span>
                          </div>
                        );
                      })()}
                      {/* 🎯 Multiplicateur théorique */}
                      {currentPrice > 0 && currentPrice < 100 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground font-medium">Multiplicateur max</span>
                          <span className="text-[10px] font-semibold text-primary">
                            {currentMultiplier.toFixed(2)}x
                          </span>
                        </div>
                      )}
                      {priceAfterPurchase > 0 && priceAfterPurchase < 100 && partsNum > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground font-medium">Après votre achat</span>
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {multiplierAfterPurchase.toFixed(2)}x
                          </span>
                        </div>
                      )}
                      {currentPrice > 0 && currentPrice < 100 && (
                        <p className="text-[9px] text-muted-foreground/80 italic">
                          Si l'événement se produit et que personne n'achète après
                        </p>
                      )}
                      <div className="border-t border-border/30 pt-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">Coût total</span>
                          <div className="text-base font-bold">
                            {estimatedCost > 0 ? (
                              <SeedDisplay
                                amount={estimatedCost}
                                variant="default"
                                className="text-foreground"
                                iconSize="size-3"
                              />
                            ) : (
                              <SolarIcon icon="loading" className="size-3.5 animate-spin" />
                            )}
                          </div>
                        </div>
                        <p className="text-[9px] text-muted-foreground/80 italic">
                          Vous payez en Seeds, pas en probabilité
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer avec bouton d'achat */}
                  <SheetFooter className="px-4 pb-4 pt-3 shrink-0 border-t border-border/20">
                    <Button
                      onClick={() => {
                        if (selectedPosition) {
                          handleBuy(selectedPosition);
                        }
                      }}
                      disabled={isSubmitting || partsNum <= 0 || !selectedPosition}
                      className={cn(
                        "w-full h-11 text-xs font-bold rounded-lg transition-all",
                        selectedPosition === "yes"
                          ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "hover:opacity-90 text-white")
                          : selectedPosition === "no"
                          ? cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "hover:opacity-90 text-white relative overflow-hidden", "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-slate-400/10")
                          : "bg-muted",
                        (isSubmitting || partsNum <= 0 || !selectedPosition || isInvestmentExpired) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <SolarIcon icon="loading" className="size-3.5 mr-2 animate-spin" />
                          Achat en cours...
                        </>
                      ) : (
                        <>
                          <SolarIcon icon="cart-bold" className="size-3.5 mr-2" />
                          Prendre position ({partsNum} part{partsNum > 1 ? "s" : ""})
                        </>
                      )}
                    </Button>
                  </SheetFooter>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Sheet Graphique détaillé - Uniquement le graphique */}
          <Sheet open={showChartSheet} onOpenChange={setShowChartSheet}>
            <SheetContent 
              side="bottom" 
              className="h-[90vh] rounded-t-3xl p-0 overflow-hidden w-full max-w-full [&>button]:hidden"
            >
              <SheetTitle className="sr-only">Graphique détaillé</SheetTitle>
              
              <div className="relative flex-1 flex flex-col overflow-hidden w-full max-w-full min-w-0 pointer-events-none">
                {/* Cover progressif partout */}
                {decision?.imageUrl && (
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <Image
                      src={decision.imageUrl}
                      alt={decision.title || "Décision"}
                      fill
                      className="object-cover"
                      sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-background from-20% via-background/95 to-background" />
                  </div>
                )}

                {/* Contenu avec z-index relatif */}
                <div className="relative z-10 flex flex-col flex-1 overflow-hidden max-w-full pointer-events-auto">
                  {/* Header compact */}
                  <div className="px-4 pt-3 pb-2 shrink-0">
                    <SheetHeader className="text-left p-0">
                      <div className="flex items-center gap-2 mb-2">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                          }}
                          className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                        >
                          <SolarIcon icon="chart-bold" className="size-5 text-primary" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <SheetTitle className="text-sm font-bold">
                            Graphique détaillé
                          </SheetTitle>
                        </div>
                      </div>
                    </SheetHeader>
                  </div>

                  {/* Graphique uniquement - Plein écran */}
                  <div className="flex-1 overflow-hidden">
                    <OpinionCourseChart 
                      decisionId={decisionId} 
                      compact={false} 
                      hideLabels={false} 
                      hideBottomElements={false} 
                      fullHeight={true}
                    />
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>

      {/* Modal de succès d'achat */}
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


