"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedAnswer, setExpandedAnswer] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

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

  // Calculer les stats
  const totalAnticipations = anticipations?.length || 0;
  const stats = {
    works: anticipations?.filter((a) => a.issue === "works").length || 0,
    partial: anticipations?.filter((a) => a.issue === "partial").length || 0,
    fails: anticipations?.filter((a) => a.issue === "fails").length || 0,
  };

  const percentages = {
    works: totalAnticipations > 0 ? Math.round((stats.works / totalAnticipations) * 100) : 0,
    partial: totalAnticipations > 0 ? Math.round((stats.partial / totalAnticipations) * 100) : 0,
    fails: totalAnticipations > 0 ? Math.round((stats.fails / totalAnticipations) * 100) : 0,
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
    setExpandedAnswer(null);

    try {
      await createAnticipation({
        decisionId,
        issue: answer,
        seedsEngaged: 10,
      });

      toast.success("Réponse enregistrée !", {
        description: "Vous avez gagné 10 Seeds",
      });
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue.",
      });
      setSelectedAnswer(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "resolved") {
    return null; // Ne pas afficher le quizz pour les décisions résolues
  }

  const t = useTranslations('quiz');
  
  const answers = [
    { 
      key: "works" as const, 
      label: t('works'), 
      text: answer1, 
      icon: "check-circle-bold", 
      color: "green",
      bgColor: "bg-green-500/10 dark:bg-green-500/20",
      borderColor: "border-green-500/50 dark:border-green-400/50",
      textColor: "text-green-600 dark:text-green-400",
      hoverBg: "hover:bg-green-500/20 dark:hover:bg-green-500/30",
      activeBg: "active:bg-green-500/30 dark:active:bg-green-500/40",
      gradient: "from-green-500/20 to-green-600/10"
    },
    { 
      key: "partial" as const, 
      label: t('partial'), 
      text: answer2, 
      icon: "minus-circle-bold", 
      color: "yellow",
      bgColor: "bg-yellow-500/10 dark:bg-yellow-500/20",
      borderColor: "border-yellow-500/50 dark:border-yellow-400/50",
      textColor: "text-yellow-600 dark:text-yellow-400",
      hoverBg: "hover:bg-yellow-500/20 dark:hover:bg-yellow-500/30",
      activeBg: "active:bg-yellow-500/30 dark:active:bg-yellow-500/40",
      gradient: "from-yellow-500/20 to-yellow-600/10"
    },
    { 
      key: "fails" as const, 
      label: t('fails'), 
      text: answer3, 
      icon: "close-circle-bold", 
      color: "red",
      bgColor: "bg-red-500/10 dark:bg-red-500/20",
      borderColor: "border-red-500/50 dark:border-red-400/50",
      textColor: "text-red-600 dark:text-red-400",
      hoverBg: "hover:bg-red-500/20 dark:hover:bg-red-500/30",
      activeBg: "active:bg-red-500/30 dark:active:bg-red-500/40",
      gradient: "from-red-500/20 to-red-600/10"
    },
  ];

  return (
    <div className="space-y-3">
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
                  answer.bgColor,
                  answer.borderColor,
                  !isSubmitting && answer.hoverBg,
                  !isSubmitting && answer.activeBg,
                  isExpanded && "ring-1 ring-primary/50",
                  isSelected && "ring-1 ring-primary",
                  isSubmitting && "opacity-60 cursor-not-allowed",
                  userAnticipation && isUserAnswer && "ring-1 ring-green-500/50"
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              >
                <div className="flex items-start gap-3 relative z-10">
                  {/* Icône compacte */}
                  <div className={cn(
                    "size-10 rounded-lg flex items-center justify-center shrink-0 border",
                    answer.bgColor,
                    answer.borderColor,
                    isExpanded && "scale-105"
                  )}>
                    <SolarIcon 
                      icon={answer.icon} 
                      className={cn("size-5", answer.textColor)} 
                    />
                  </div>

                  {/* Contenu principal */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className={cn("font-semibold text-sm mb-0.5", answer.textColor)}>
                          {answer.label}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {answer.text}
                        </p>
                      </div>
                      {totalAnticipations > 0 && (
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className={cn("text-sm font-bold", answer.textColor)}>
                            {percentage}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {count}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Barre de progression compacte */}
                    {totalAnticipations > 0 && (
                      <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            answer.color === "green" && "bg-green-500",
                            answer.color === "yellow" && "bg-yellow-500",
                            answer.color === "red" && "bg-red-500"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.1 }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Indicateur expand/collapse avec check intégré si déjà répondu */}
                  <div className="shrink-0 pt-0.5 relative">
                    {userAnticipation && isUserAnswer && (
                      <div className="absolute -top-1 -right-1 size-3 rounded-full bg-green-500 border-2 border-background z-10" />
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
                {isExpanded && (
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
                            <span className={cn("text-sm font-bold", answer.textColor)}>
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Bouton de confirmation (seulement si pas encore répondu) */}
                      {!userAnticipation && (
                        <Button
                          onClick={() => handleConfirmSelection(answer.key)}
                          disabled={isSubmitting}
                          size="default"
                          className={cn(
                            "w-full h-10 text-sm font-semibold",
                            answer.color === "green" && "bg-green-600 hover:bg-green-700",
                            answer.color === "yellow" && "bg-yellow-600 hover:bg-yellow-700",
                            answer.color === "red" && "bg-red-600 hover:bg-red-700"
                          )}
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
                          <SolarIcon icon="seedling-bold" className="size-3.5 text-primary" />
                          <span>
                            <span className="font-semibold text-primary">10 Seeds</span> engagés
                          </span>
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
                    <div className="size-7 rounded-full bg-green-500 flex items-center justify-center">
                      <SolarIcon icon="check-bold" className="size-3.5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Réponse enregistrée !</p>
                      <p className="text-xs text-muted-foreground">+10 Seeds</p>
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

