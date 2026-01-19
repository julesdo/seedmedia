"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from 'next-intl';
import { useUser } from "@/contexts/UserContext";
import { SeedDisplay } from "@/components/ui/SeedDisplay";

interface QuizSimpleProps {
  decisionId: Id<"decisions">;
  question: string;
  answer1: string;
  answer2: string;
  answer3: string;
  status: "announced" | "tracking" | "resolved";
  compact?: boolean;
}

export function QuizSimple({
  decisionId,
  question,
  answer1,
  answer2,
  answer3,
  status,
}: QuizSimpleProps) {
  const { isAuthenticated } = useConvexAuth();
  const { user: currentUser } = useUser();
  const router = useRouter();
  
  // 🎯 FEATURE 5: LES SKINS DE VOTE - Récupérer le skin sélectionné
  const userSkins = useQuery(
    api.voteSkins.getUserSkins,
    isAuthenticated ? {} : "skip"
  );
  const selectedSkin = userSkins?.selectedSkin || "default";

  // Fonction pour obtenir les classes CSS selon le skin
  const getSkinClasses = (skinType: string) => {
    switch (skinType) {
      case "neon":
        return {
          button: "bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]",
          number: "bg-gradient-to-br from-cyan-500 to-purple-500 text-white border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.5)]",
          progress: "bg-gradient-to-r from-cyan-400 to-purple-400",
        };
      case "stamp":
        return {
          button: "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 ring-2 ring-red-200 dark:ring-red-900",
          number: "bg-red-600 text-white border-red-700 font-black text-lg",
          progress: "bg-red-600",
        };
      case "gold":
        return {
          button: "bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 dark:from-yellow-950/30 dark:via-amber-950/30 dark:to-yellow-950/30 border-yellow-400 dark:border-yellow-600 shadow-lg shadow-yellow-500/20",
          number: "bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-white border-yellow-500 shadow-lg shadow-yellow-500/50",
          progress: "bg-gradient-to-r from-yellow-400 to-amber-500",
        };
      default:
        return {
          button: "",
          number: "",
          progress: "",
        };
    }
  };

  const skinClasses = getSkinClasses(selectedSkin);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showClashFeedback, setShowClashFeedback] = useState(false);
  const [clashData, setClashData] = useState<{
    answer: "works" | "partial" | "fails";
    percentage: number;
    isMajority: boolean;
  } | null>(null);

  // Récupérer les stats des anticipations
  const anticipations = useQuery(
    api.anticipations.getAnticipationsForDecision,
    { decisionId }
  );

  // Récupérer l'anticipation de l'utilisateur actuel
  const myAnticipations = useQuery(
    api.anticipations.getMyAnticipations,
    isAuthenticated ? {} : "skip"
  );

  const userAnticipation = myAnticipations?.find(
    (a) => a.decision?._id === decisionId
  );

  const createAnticipation = useMutation(api.anticipations.createAnticipation);
  const awardParticipationReward = useAction(api.gamification.awardParticipationReward);

  // Optimistic update pour améliorer la réactivité
  const [optimisticAnswer, setOptimisticAnswer] = useState<"works" | "partial" | "fails" | null>(null);

  // Réinitialiser l'optimistic update quand l'anticipation utilisateur est disponible
  // OU quand l'anticipation apparaît dans la liste anticipations (pour éviter le double comptage)
  useEffect(() => {
    if (optimisticAnswer && currentUser?._id) {
      // Vérifier si l'anticipation est déjà dans la liste (mutation réussie)
      const anticipationExists = anticipations?.some(
        (a) => a.userId === currentUser._id && a.issue === optimisticAnswer
      );
      
      // Ou si userAnticipation existe maintenant
      if (userAnticipation || anticipationExists) {
        setOptimisticAnswer(null);
      }
    }
  }, [userAnticipation, optimisticAnswer, anticipations, currentUser?._id]);

  // Calculer les stats avec optimistic update
  // Ne pas ajouter l'optimistic update si l'utilisateur a déjà une anticipation (pour éviter le double comptage)
  // OU si l'anticipation est déjà dans la liste anticipations
  const totalAnticipations = anticipations?.length || 0;
  
  // Vérifier si l'anticipation optimistic est déjà dans la liste
  const optimisticAlreadyInList = optimisticAnswer && currentUser?._id && anticipations?.some(
    (a) => a.userId === currentUser._id && a.issue === optimisticAnswer
  );
  
  const shouldUseOptimistic = optimisticAnswer && !userAnticipation && !optimisticAlreadyInList;
  const optimisticTotal = shouldUseOptimistic ? totalAnticipations + 1 : totalAnticipations;
  
  const stats = {
    works: (anticipations?.filter((a) => a.issue === "works").length || 0) + (shouldUseOptimistic && optimisticAnswer === "works" ? 1 : 0),
    partial: (anticipations?.filter((a) => a.issue === "partial").length || 0) + (shouldUseOptimistic && optimisticAnswer === "partial" ? 1 : 0),
    fails: (anticipations?.filter((a) => a.issue === "fails").length || 0) + (shouldUseOptimistic && optimisticAnswer === "fails" ? 1 : 0),
  };

  const percentages = {
    works: optimisticTotal > 0 ? Math.round((stats.works / optimisticTotal) * 100) : 0,
    partial: optimisticTotal > 0 ? Math.round((stats.partial / optimisticTotal) * 100) : 0,
    fails: optimisticTotal > 0 ? Math.round((stats.fails / optimisticTotal) * 100) : 0,
  };

  // Toggle pour voir les détails d'une réponse (toujours accessible)
  const handleToggleDetails = (answerKey: string) => {
    if (isSubmitting) return;
    setExpandedAnswer(expandedAnswer === answerKey ? null : answerKey);
    setSelectedAnswer(null);
  };

  // Confirmation de la sélection (après avoir vu les détails)
  const handleConfirmSelection = async (answer: "works" | "partial" | "fails") => {
    if (status === "resolved" || userAnticipation || isSubmitting) return;

    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    setIsSubmitting(true);
    setSelectedAnswer(answer);
    setOptimisticAnswer(answer); // Optimistic update pour réactivité immédiate
    // Ne pas fermer le dropdown - le garder ouvert pour voir le message de succès

    try {
      const anticipationId = await createAnticipation({
        decisionId,
        issue: answer,
        seedsEngaged: 10,
      });

      // Récompense de participation (non bloquant)
      if (currentUser?._id && anticipationId) {
        try {
          const rewardResult = await awardParticipationReward({
            userId: currentUser._id,
            decisionId,
            anticipationId,
          });
          
          // Afficher un toast avec le nombre de seeds gagnés
          if (rewardResult.awarded && rewardResult.seedsEarned) {
            toast.success(`+${rewardResult.seedsEarned} seeds`, {
              description: rewardResult.firstBonus 
                ? "Participation + Premier anticipateur"
                : rewardResult.hotBonus 
                ? "Participation + Décision importante"
                : "Participation à la décision",
              duration: 3000,
            });
          }
        } catch (rewardError) {
          // Ne pas bloquer si la récompense échoue
          console.error("Error awarding participation reward:", rewardError);
        }
      }

      // 🎯 FEATURE 1: LE CLASH - Afficher le feedback subtil immédiatement
      // Calculer si le vote est majoritaire ou minoritaire (avec optimistic update)
      const userPercentage = percentages[answer];
      // Recalculer maxPercentage avec optimistic update inclus
      const maxPercentage = Math.max(percentages.works, percentages.partial, percentages.fails);
      // Le vote est majoritaire si c'est le pourcentage le plus élevé ET >= 50%
      const isMajority = userPercentage === maxPercentage && userPercentage >= 50;
      
      // Afficher le feedback subtil (sur le même écran)
      setClashData({
        answer,
        percentage: userPercentage,
        isMajority,
      });
      setShowClashFeedback(true);
      
      // Auto-fermeture après 4 secondes
      setTimeout(() => {
        setShowClashFeedback(false);
      }, 4000);

      toast.success("Réponse enregistrée !", {
        description: "Votre anticipation a été enregistrée",
      });
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue.",
      });
      setSelectedAnswer(null);
      setOptimisticAnswer(null); // Annuler l'optimistic update en cas d'erreur
    } finally {
      setIsSubmitting(false);
      // Garder optimisticAnswer jusqu'à ce que les queries se rechargent
      // Il sera automatiquement remplacé par les vraies données
    }
  };

  if (status === "resolved") {
    return null; // Ne pas afficher le quizz pour les décisions résolues
  }

  const t = useTranslations('quiz');
  
  // ✅ Couleurs neutres (gris/bleu) pour éviter l'impression de vrai/faux
  const answers = [
    { 
      key: "works" as const, 
      label: t('works'), // Gardé pour les stats mais pas affiché
      text: answer1, 
      number: 1, // ✅ Numérotation au lieu d'icône
      color: "neutral",
      bgColor: "bg-muted/50 dark:bg-muted/30",
      borderColor: "border-border/50 dark:border-border/50",
      textColor: "text-foreground",
      hoverBg: "hover:bg-muted dark:hover:bg-muted/50",
      activeBg: "active:bg-muted dark:active:bg-muted/70",
      gradient: "from-muted/30 to-muted/10"
    },
    { 
      key: "partial" as const, 
      label: t('partial'), // Gardé pour les stats mais pas affiché
      text: answer2, 
      number: 2, // ✅ Numérotation au lieu d'icône
      color: "neutral",
      bgColor: "bg-muted/50 dark:bg-muted/30",
      borderColor: "border-border/50 dark:border-border/50",
      textColor: "text-foreground",
      hoverBg: "hover:bg-muted dark:hover:bg-muted/50",
      activeBg: "active:bg-muted dark:active:bg-muted/70",
      gradient: "from-muted/30 to-muted/10"
    },
    { 
      key: "fails" as const, 
      label: t('fails'), // Gardé pour les stats mais pas affiché
      text: answer3, 
      number: 3, // ✅ Numérotation au lieu d'icône
      color: "neutral",
      bgColor: "bg-muted/50 dark:bg-muted/30",
      borderColor: "border-border/50 dark:border-border/50",
      textColor: "text-foreground",
      hoverBg: "hover:bg-muted dark:hover:bg-muted/50",
      activeBg: "active:bg-muted dark:active:bg-muted/70",
      gradient: "from-muted/30 to-muted/10"
    },
  ];

  return (
    <div className="space-y-3">
      {/* 🎯 FEATURE 1: LE CLASH - Feedback subtil intégré (pas de modale) */}
      <AnimatePresence>
        {showClashFeedback && clashData && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "relative rounded-xl p-4 border-2 overflow-hidden",
              clashData.isMajority
                ? "bg-blue-500/10 border-blue-400/50"
                : "bg-orange-500/10 border-orange-400/50"
            )}
          >
            {/* Effet de brillance subtil */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "size-8 rounded-full flex items-center justify-center",
                  clashData.isMajority
                    ? "bg-blue-500/20"
                    : "bg-orange-500/20"
                )}>
                  <SolarIcon
                    icon={clashData.isMajority ? "shield-check-bold" : "fire-bold"}
                    className={cn(
                      "size-4",
                      clashData.isMajority ? "text-blue-400" : "text-orange-400"
                    )}
                  />
                </div>
                <div>
                  <p className={cn(
                    "text-sm font-bold",
                    clashData.isMajority ? "text-blue-300" : "text-orange-300"
                  )}>
                    {clashData.isMajority ? "🛡️ Tendance" : "🦁 Contre-Courant"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {clashData.isMajority
                      ? "Tu suis la masse"
                      : "Tu es seul contre tous"}
                  </p>
                </div>
              </div>
              
              {/* Cours en temps réel */}
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <motion.div
                    key={clashData.percentage}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "text-lg font-bold",
                      clashData.isMajority ? "text-blue-400" : "text-orange-400"
                    )}
                  >
                    {clashData.percentage}%
                  </motion.div>
                  <p className="text-[10px] text-muted-foreground">
                    Cours actuel
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Question (compact style Instagram/Spotify) */}
      <div className="text-center space-y-1.5 px-2">
        <div className="size-10 mx-auto rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
          <SolarIcon icon="target-bold" className="size-5 text-primary" />
        </div>
        <h2 className="text-base font-bold leading-tight px-2">
          {question}
        </h2>
        {totalAnticipations > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <SolarIcon icon="users-group-rounded-bold" className="size-3.5" />
            <span>{totalAnticipations} anticipation{totalAnticipations > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Les 3 réponses - TOUJOURS VISIBLES (design compact Instagram/Spotify) */}
      <div className="space-y-2">
        {answers.map((answer, index) => {
          const isUserAnswer = userAnticipation?.issue === answer.key;
          const percentage = percentages[answer.key];
          const count = stats[answer.key];
          const isExpanded = expandedAnswer === answer.key;
          const isSelected = selectedAnswer === answer.key;

          return (
            <div key={answer.key} className="space-y-1.5">
              {/* Card principale de la réponse (compacte) */}
              <motion.button
                onClick={() => {
                  if (!isAuthenticated) {
                    router.push("/sign-in");
                    return;
                  }
                  if (isSubmitting) return;
                  handleToggleDetails(answer.key);
                }}
                disabled={isSubmitting}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden",
                  "min-h-[64px]",
                  selectedSkin !== "default" ? skinClasses.button : answer.bgColor,
                  selectedSkin !== "default" ? "" : answer.borderColor,
                  !isSubmitting && answer.hoverBg,
                  !isSubmitting && answer.activeBg,
                  isExpanded && "ring-1 ring-primary/50",
                  isSelected && "ring-1 ring-primary",
                  isSubmitting && "opacity-60 cursor-not-allowed",
                  userAnticipation && isUserAnswer && "ring-1 ring-primary/50" // ✅ Couleur neutre
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              >
                <div className="flex items-start gap-3 relative z-10">
                  {/* ✅ Numérotation au lieu d'icône - 🎯 FEATURE 5: Styles selon skin */}
                  <div className={cn(
                    "size-10 rounded-lg flex items-center justify-center shrink-0 border font-bold text-base",
                    selectedSkin !== "default" ? skinClasses.number : cn(answer.bgColor, answer.borderColor),
                    isExpanded && "scale-105"
                  )}>
                    <span className={selectedSkin !== "default" ? "text-white" : "text-foreground"}>
                      {answer.number}
                    </span>
                  </div>

                  {/* Contenu principal */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {/* ✅ Retirer le label, garder juste le texte */}
                        <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                          {answer.text}
                        </p>
                      </div>
                      {totalAnticipations > 0 && (
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          {/* 🎯 FEATURE 1: Cours en temps réel avec animation */}
                          <motion.span
                            key={percentage}
                            initial={{ scale: 1.1, color: "#fff" }}
                            animate={{ scale: 1, color: "inherit" }}
                            transition={{ duration: 0.3 }}
                            className="text-sm font-bold text-foreground"
                          >
                            {percentage}%
                          </motion.span>
                          <span className="text-[10px] text-muted-foreground">
                            {count} vote{count > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Barre de progression compacte - 🎯 FEATURE 5: Styles selon skin */}
                    {totalAnticipations > 0 && (
                      <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            selectedSkin !== "default" ? skinClasses.progress : "bg-primary/60"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.1 }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Indicateur expand/collapse avec check intégré si déjà répondu - Couleur neutre */}
                  <div className="shrink-0 pt-0.5 relative">
                    {userAnticipation && isUserAnswer && (
                      <div className="absolute -top-1 -right-1 size-3 rounded-full bg-primary border-2 border-background z-10" />
                    )}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SolarIcon 
                        icon="arrow-down-bold" 
                        className="size-4 text-muted-foreground" 
                      />
                    </motion.div>
                  </div>
                </div>
              </motion.button>

              {/* Zone de détails expandable (toujours accessible même après réponse) */}
              <AnimatePresence>
                {(isExpanded || (isSelected && selectedAnswer === answer.key)) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className={cn(
                      "p-3 rounded-xl border space-y-3 mt-1.5",
                      answer.bgColor,
                      answer.borderColor
                    )}>
                      {/* Description complète */}
                      <div>
                        <p className="text-xs font-semibold mb-1.5 text-foreground">
                          Description complète
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {answer.text}
                        </p>
                      </div>

                      {/* Stats détaillées */}
                      {totalAnticipations > 0 && (
                        <div className="pt-2 border-t border-border/50 space-y-1.5">
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                            Répartition
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <SolarIcon icon="users-group-rounded-bold" className="size-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium">
                                {count} personne{count > 1 ? "s" : ""}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-foreground">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Bouton de confirmation (seulement si pas encore répondu) - Couleur neutre */}
                      {!userAnticipation && (
                        <Button
                          onClick={() => handleConfirmSelection(answer.key)}
                          disabled={isSubmitting}
                          size="default"
                          className="w-full h-10 text-sm font-semibold bg-primary hover:bg-primary/90" // ✅ Couleur neutre (primary)
                        >
                          {isSubmitting && selectedAnswer === answer.key ? (
                            <>
                              <SolarIcon icon="loading" className="size-4 mr-2 animate-spin" />
                              Enregistrement...
                            </>
                          ) : (
                            <>
                              <SolarIcon icon="check-circle-bold" className="size-4 mr-2" />
                              {t('confirm')}
                            </>
                          )}
                        </Button>
                      )}

                      {/* Info Seeds */}
                      {!userAnticipation && (
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                          <SeedDisplay amount={10} variant="compact" iconSize="size-3.5" />
                          <span>engagés</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message de succès après sélection (compact) */}
              {isSelected && !isSubmitting && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "p-3 rounded-xl border mt-1.5",
                    answer.bgColor,
                    answer.borderColor,
                    "ring-1 ring-primary/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-7 rounded-full bg-primary flex items-center justify-center">
                      <SolarIcon icon="check-bold" className="size-3.5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Réponse enregistrée !</p>
                      <SeedDisplay amount={10} variant="inline" iconSize="size-2.5" className="text-xs" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <SolarIcon icon="users-group-rounded-bold" className="size-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {percentage}% comme vous
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <SolarIcon icon="seedling-bold" className="size-3.5 text-primary" />
                      <span className="text-xs font-semibold text-primary">+10</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Message si déjà répondu (compact) */}
      {userAnticipation && (
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <SolarIcon icon="check-circle-bold" className="size-4 text-primary" />
            <p className="font-semibold text-xs">
              Déjà anticipé
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {t('yourAnswer')}: <span className="font-medium">{answers.find(a => a.key === userAnticipation.issue)?.label}</span>
          </p>
        </div>
      )}

    </div>
  );
}

