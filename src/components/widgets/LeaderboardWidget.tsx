"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useTranslations } from 'next-intl';

/**
 * Widget Leaderboard - Design sobre et professionnel
 * Affiche le top 5 des utilisateurs de la semaine
 */
export function LeaderboardWidget() {
  const { user, isAuthenticated } = useUser();
  const t = useTranslations('widgets.leaderboard');
  const leaderboard = useQuery(api.gamification.getWeeklyLeaderboard, { limit: 5 });

  // Ne pas afficher si pas de données
  if (!leaderboard || leaderboard.length === 0) {
    return null;
  }

  // Trouver la position de l'utilisateur actuel
  const userRank = user && isAuthenticated
    ? leaderboard.findIndex((entry) => entry.userId === user._id) + 1
    : null;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SolarIcon icon="cup-star" className="size-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {t('title')}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {leaderboard.slice(0, 5).map((entry, index) => {
          const isCurrentUser = user && entry.userId === user._id;
          
          return (
            <div
              key={entry.userId}
              className={cn(
                "flex items-center gap-3 p-2 rounded-md transition-colors",
                isCurrentUser && "bg-primary/5 border border-primary/20"
              )}
            >
              <div className="flex items-center justify-center w-6 h-6 shrink-0">
                {index < 3 ? (
                  <span className="text-base">{medals[index]}</span>
                ) : (
                  <span className="text-xs font-semibold text-muted-foreground">
                    {entry.rank}
                  </span>
                )}
              </div>

              <Avatar className="size-6 shrink-0">
                <AvatarImage src={entry.image || undefined} />
                <AvatarFallback className="text-[10px] bg-muted">
                  {entry.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">
                  {entry.username ? `@${entry.username}` : entry.name || t('user')}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <SolarIcon icon="leaf-bold" className="size-3 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {entry.totalSeeds}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {userRank && userRank > 5 && (
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('yourPosition')}</span>
            <span className="font-semibold text-foreground">#{userRank}</span>
          </div>
        </div>
      )}
    </div>
  );
}

