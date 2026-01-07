"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { useTranslations } from "next-intl";

/**
 * Widget Daily Login - Design sobre et professionnel
 * Affiche le streak et permet de réclamer le bonus quotidien
 */
export function DailyLoginWidget() {
  const { isAuthenticated } = useUser();
  const t = useTranslations('widgets.dailyLogin');
  const canClaim = useQuery(api.gamification.canClaimDailyLogin);
  const claimDailyLogin = useMutation(api.gamification.claimDailyLogin);

  // Ne pas afficher si non authentifié
  if (!isAuthenticated || canClaim === undefined) {
    return null;
  }

  const handleClaim = async () => {
    try {
      const result = await claimDailyLogin();
      
      if (result.claimed) {
        // Notification sobre (pas de sonnerie, pas d'animation flashy)
        toast.success(
          t('seedsEarned', { seeds: result.seedsEarned }),
          {
            description: result.luckyBonus 
              ? `${t('streakDays', { streak: result.streak })} - ${t('luckyBonus')}`
              : t('streakDays', { streak: result.streak }),
            duration: 3000,
          }
        );

        // Notification discrète pour level up
        if (result.levelUp) {
          setTimeout(() => {
            toast.info(
              t('levelReached', { level: result.newLevel }),
              {
                duration: 2000,
              }
            );
          }, 500);
        }
      } else if (result.reason === "already_claimed_today") {
        toast.info(t('alreadyClaimed'), {
          duration: 2000,
        });
      }
    } catch (error) {
      toast.error(t('errorClaiming'), {
        duration: 2000,
      });
    }
  };

  const streak = canClaim.streak || 0;
  const canClaimToday = canClaim.canClaim;

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SolarIcon 
            icon="calendar-bold" 
            className={cn(
              "size-4",
              canClaimToday ? "text-primary" : "text-muted-foreground"
            )} 
          />
          <span className="text-sm font-semibold text-foreground">
            {t('title')}
          </span>
        </div>
      </div>

      {streak > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{t('streak')}</span>
          <span className="font-semibold text-foreground">{streak} {t('days')}</span>
        </div>
      )}

      {canClaimToday ? (
        <Button
          onClick={handleClaim}
          size="sm"
          className="w-full h-8 text-xs font-medium"
          variant="default"
        >
          {t('claimBonus')}
        </Button>
      ) : (
        <div className="text-xs text-muted-foreground text-center py-1">
          {t('alreadyClaimed')}
        </div>
      )}
    </div>
  );
}

