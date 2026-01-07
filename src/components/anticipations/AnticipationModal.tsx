"use client";

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslations } from 'next-intl';

interface AnticipationModalProps {
  decisionId: Id<"decisions">;
  decisionTitle: string;
  question: string;
  answer1: string; // "ça marche"
  answer2: string; // "ça marche partiellement"
  answer3: string; // "ça ne marche pas"
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const DEFAULT_SEEDS = 10; // Seeds par défaut (pas de sélecteur)

export function AnticipationModal({
  decisionId,
  decisionTitle,
  question,
  answer1,
  answer2,
  answer3,
  open,
  onOpenChange,
  onSuccess,
}: AnticipationModalProps) {
  const t = useTranslations('anticipations');
  const tErrors = useTranslations('errors');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createAnticipation = useMutation(api.anticipations.createAnticipation);
  const awardParticipationReward = useAction(api.gamification.awardParticipationReward);
  const { user } = useUser();

  /**
   * Sélection directe = Confirmation automatique (2 clics max)
   * 1er clic : Ouvrir modal
   * 2ème clic : Choisir l'issue (confirmation automatique)
   */
  const handleSelectIssue = async (issue: "works" | "partial" | "fails") => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const anticipationId = await createAnticipation({
        decisionId,
        issue,
        seedsEngaged: DEFAULT_SEEDS,
      });

      // Récompense de participation (non bloquant)
      if (user?._id && anticipationId) {
        try {
          const rewardResult = await awardParticipationReward({
            userId: user._id,
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

      toast.success(t('modal.success.title'), {
        description: t('modal.success.description'),
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(tErrors('generic'), {
        description: error.message || tErrors('generic'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('modal.title')}</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {decisionTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm font-medium mb-3">{question}</p>
          </div>

          {/* 3 boutons pour choisir l'issue (confirmation automatique = 2 clics max) */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start h-auto py-4 px-4 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-500 transition-all",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => handleSelectIssue("works")}
              disabled={isSubmitting}
            >
              <SolarIcon
                name="check-circle"
                className="size-5 mr-3 text-red-600"
              />
              <div className="text-left flex-1">
                <p className="font-medium">{t('modal.works')}</p>
                <p className="text-xs text-muted-foreground">{answer1}</p>
              </div>
              {isSubmitting && (
                <SolarIcon name="loading" className="size-4 animate-spin" />
              )}
            </Button>

            <Button
              variant="outline"
              className={cn(
                "w-full justify-start h-auto py-4 px-4 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 hover:border-yellow-500 transition-all",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => handleSelectIssue("partial")}
              disabled={isSubmitting}
            >
              <SolarIcon
                name="minus-circle"
                className="size-5 mr-3 text-yellow-600"
              />
              <div className="text-left flex-1">
                <p className="font-medium">{t('modal.partial')}</p>
                <p className="text-xs text-muted-foreground">{answer2}</p>
              </div>
              {isSubmitting && (
                <SolarIcon name="loading" className="size-4 animate-spin" />
              )}
            </Button>

            <Button
              variant="outline"
              className={cn(
                "w-full justify-start h-auto py-4 px-4 hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-500 transition-all",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => handleSelectIssue("fails")}
              disabled={isSubmitting}
            >
              <SolarIcon
                name="close-circle"
                className="size-5 mr-3 text-green-600"
              />
              <div className="text-left flex-1">
                <p className="font-medium">{t('modal.fails')}</p>
                <p className="text-xs text-muted-foreground">{answer3}</p>
              </div>
              {isSubmitting && (
                <SolarIcon name="loading" className="size-4 animate-spin" />
              )}
            </Button>
          </div>

          {/* Info Seeds */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <SolarIcon name="seedling" className="size-4" />
            <span>{t('modal.seedsInfo', { count: DEFAULT_SEEDS })}</span>
          </div>
        </div>

        {/* Bouton Annuler uniquement */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            size="sm"
          >
            {t('modal.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

