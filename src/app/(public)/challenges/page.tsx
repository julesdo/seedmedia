"use client";

import { useUser } from "@/contexts/UserContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, CheckCircle2, Circle, Trophy, Crown, Medal } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DailyLoginWidget } from "@/components/widgets/DailyLoginWidget";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

/**
 * Composant pour afficher la feuille de route des défis et la progression des niveaux
 */
function ChallengesRoadmap({
  user,
  levelProgress,
  stats,
}: {
  user: any;
  levelProgress: number;
  stats: {
    resolvedAnticipations: number;
    correctAnticipations: number;
    accuracy: number;
  };
}) {
  const currentLevel = user.level || 1;
  const seedsBalance = user.seedsBalance || 0;
  
  // Calculer les Seeds nécessaires pour le niveau suivant
  const seedsForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
  const seedsForNextLevel = Math.pow(currentLevel, 2) * 100;
  const seedsNeeded = Math.max(0, seedsForNextLevel - seedsBalance);
  
  // Défis disponibles pour progresser
  const challenges = [
    {
      id: 'daily_login',
      label: 'Connexion quotidienne',
      description: 'Connecte-toi chaque jour pour gagner des Seeds',
      progress: user.loginStreak || 0,
      target: 7,
      icon: '🔥',
      reward: 'Seeds bonus',
    },
    {
      id: 'anticipations',
      label: 'Anticipations créées',
      description: 'Crée des anticipations pour gagner de l\'expérience',
      progress: stats.resolvedAnticipations + stats.correctAnticipations,
      target: 10,
      icon: '🎯',
      reward: 'Seeds + expérience',
    },
    {
      id: 'correct_predictions',
      label: 'Prédictions correctes',
      description: 'Améliore ta précision pour monter de niveau',
      progress: stats.correctAnticipations,
      target: 5,
      icon: '✅',
      reward: 'Seeds + crédibilité',
    },
    {
      id: 'accuracy',
      label: 'Précision',
      description: 'Maintiens une précision élevée',
      progress: stats.accuracy,
      target: 60,
      icon: '📊',
      reward: 'Bonus de niveau',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header avec niveau actuel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="size-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Niveau {currentLevel}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Progression vers le niveau {currentLevel + 1}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progression</p>
              <p className="text-2xl font-bold">{levelProgress.toFixed(0)}%</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Barre de progression */}
          <div className="mb-4">
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-muted-foreground">
                <SeedDisplay amount={seedsBalance} variant="compact" />
              </p>
              <p className="text-sm text-muted-foreground">
                {seedsNeeded > 0 ? (
                  <>
                    <SeedDisplay amount={seedsNeeded} variant="compact" /> pour le niveau {currentLevel + 1}
                  </>
                ) : (
                  'Niveau max atteint'
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des défis */}
      <Card>
        <CardHeader>
          <CardTitle>Feuille de route</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {challenges.map((challenge) => {
              const isCompleted = challenge.progress >= challenge.target;
              const progressPercent = Math.min(100, (challenge.progress / challenge.target) * 100);
              
              return (
                <div
                  key={challenge.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                    isCompleted
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted/30 border-border/50"
                  )}
                >
                  <div className="shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="size-5 text-primary" />
                    ) : (
                      <Circle className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{challenge.icon}</span>
                      <p className={cn(
                        "text-sm font-semibold",
                        isCompleted ? "text-primary" : "text-foreground"
                      )}>
                        {challenge.label}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {challenge.description}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            isCompleted ? "bg-primary" : "bg-primary/50"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                        {challenge.progress}/{challenge.target}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ChallengesPage() {
  const { user, isAuthenticated, isLoading } = useUser();
  const t = useTranslations('challenges');

  // Récupérer les stats de l'utilisateur
  const userProfile = useQuery(
    api.users.getUserProfile,
    user?._id ? { userId: user._id } : "skip"
  );

  // Récupérer le leaderboard global (toujours appelé pour respecter l'ordre des hooks)
  const leaderboard = useQuery(api.gamification.getWeeklyLeaderboard, { limit: 50 });

  // Calculer la progression vers le prochain niveau basé sur les Seeds
  const calculateLevelProgress = (level: number, seedsBalance: number): number => {
    const seedsForCurrentLevel = Math.pow(level - 1, 2) * 100;
    const seedsForNextLevel = Math.pow(level, 2) * 100;
    
    if (seedsBalance >= seedsForNextLevel) {
      return 100;
    }
    
    const progress = ((seedsBalance - seedsForCurrentLevel) / (seedsForNextLevel - seedsForCurrentLevel)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Connectez-vous pour voir vos défis et votre progression.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/sign-in">Se connecter</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/sign-up">S'inscrire</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculer les stats
  const stats = {
    resolvedAnticipations: 0,
    correctAnticipations: 0,
    accuracy: 0,
  };

  if (userProfile?.stats) {
    stats.resolvedAnticipations = userProfile.stats.resolvedAnticipations || 0;
    stats.correctAnticipations = userProfile.stats.correctAnticipations || 0;
    stats.accuracy = userProfile.stats.accuracy || 0;
  }

  const levelProgress = calculateLevelProgress(user.level || 1, user.seedsBalance || 0);
  
  // Trouver la position de l'utilisateur actuel
  const userRank = user && isAuthenticated && leaderboard
    ? leaderboard.findIndex((entry) => entry.userId === user._id) + 1
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mes Défis</h1>
        <p className="text-muted-foreground">
          Suivez votre progression et complétez des défis pour monter de niveau
        </p>
      </div>

      {/* Daily Login Widget */}
      <DailyLoginWidget />

      {/* Feuille de route */}
      {userProfile === undefined ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <ChallengesRoadmap 
          user={user}
          levelProgress={levelProgress}
          stats={stats}
        />
      )}

      {/* Leaderboard stylé */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-primary" />
            <CardTitle>Classement hebdomadaire</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Top utilisateurs par Seeds gagnés cette semaine
          </p>
        </CardHeader>
        <CardContent>
          {leaderboard === undefined ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="size-12 mx-auto mb-3 opacity-50" />
              <p>Aucun classement disponible</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => {
                const isCurrentUser = user && entry.userId === user._id;
                const isTopThree = index < 3;
                const rank = index + 1;
                
                // Calculer le niveau depuis totalSeeds (plus fiable que user.level)
                const calculatedLevel = Math.floor(Math.sqrt((entry.totalSeeds || 0) / 100)) + 1;
                
                return (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      isCurrentUser
                        ? "bg-primary/10 border-primary/30"
                        : "bg-card/50 border-border/50 hover:bg-card/80",
                      isTopThree && "bg-gradient-to-r from-primary/5 to-primary/10"
                    )}
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-8 h-8 shrink-0">
                      {index === 0 ? (
                        <Crown className="size-5 text-yellow-500 fill-yellow-500" />
                      ) : index === 1 ? (
                        <Medal className="size-5 text-gray-400 fill-gray-400" />
                      ) : index === 2 ? (
                        <Medal className="size-5 text-amber-600 fill-amber-600" />
                      ) : (
                        <div className={cn(
                          "size-7 rounded-full flex items-center justify-center text-xs font-bold",
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {rank}
                        </div>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar className={cn(
                      "size-10 shrink-0",
                      isCurrentUser && "ring-2 ring-primary"
                    )}>
                      <AvatarImage src={entry.image || undefined} />
                      <AvatarFallback className={cn(
                        "text-xs font-semibold",
                        isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}>
                        {entry.name?.[0]?.toUpperCase() || entry.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm font-semibold truncate",
                          isCurrentUser && "text-primary"
                        )}>
                          {entry.username ? `@${entry.username}` : entry.name || "Utilisateur"}
                        </p>
                        {isCurrentUser && (
                          <Badge variant="default" className="text-[9px] px-1.5 py-0">
                            Vous
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Seeds - Mise en avant */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <SeedDisplay 
                        amount={entry.totalSeeds || 0} 
                        variant="compact"
                        className="text-sm font-bold"
                        iconSize="size-3.5"
                      />
                    </div>
                  </motion.div>
                );
              })}

              {/* Position de l'utilisateur si pas dans le top */}
              {userRank && userRank > leaderboard.length && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: leaderboard.length * 0.05 }}
                  className="pt-3 mt-3 border-t border-border/50"
                >
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-center w-8 h-8 shrink-0">
                      <div className="size-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {userRank}
                      </div>
                    </div>
                    <Avatar className="size-10 shrink-0 ring-2 ring-primary">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate text-primary">
                          {user.username ? `@${user.username}` : user.name || "Vous"}
                        </p>
                        <Badge variant="default" className="text-[9px] px-1.5 py-0">
                          Vous
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <SeedDisplay 
                        amount={0} 
                        variant="compact"
                        className="text-sm font-bold"
                        iconSize="size-3.5"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

