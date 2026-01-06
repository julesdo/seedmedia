"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * Composant client pour la page Profil
 * Affiche le profil utilisateur, niveau, Seeds et statistiques
 */
export function ProfileClient() {
  const { user, isAuthenticated, isLoading } = useUser();
  const userProfile = useQuery(
    api.users.getUserProfile,
    isAuthenticated && user?._id ? { userId: user._id } : "skip"
  );
  const transactions = useQuery(
    api.seedsTransactions.getUserTransactions,
    isAuthenticated && user?._id ? { userId: user._id, limit: 10 } : "skip"
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-48 w-full" />
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
              Connectez-vous pour voir votre profil.
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

  const level = user.level || 1;
  const seedsBalance = user.seedsBalance || 0;
  const seedsToNextLevel = user.seedsToNextLevel || 100;
  const stats = userProfile?.stats || {
    totalAnticipations: 0,
    resolvedAnticipations: 0,
    correctAnticipations: 0,
    accuracy: 0,
  };

  // Calculer le pourcentage de progression vers le niveau suivant
  const currentLevelSeeds = Math.pow(level - 1, 2) * 100;
  const nextLevelSeeds = Math.pow(level, 2) * 100;
  const progress =
    nextLevelSeeds > currentLevelSeeds
      ? ((seedsBalance - currentLevelSeeds) /
          (nextLevelSeeds - currentLevelSeeds)) *
        100
      : 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header Profil */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "Profil"}
                className="size-16 rounded-full"
              />
            ) : (
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <SolarIcon name="user" className="size-8 text-primary" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold mb-2">
                {user.name || user.email}
              </h1>
              {user.bio && (
                <p className="text-muted-foreground text-sm mb-3">{user.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="gap-1">
                  <SolarIcon name="star" className="size-3" />
                  Niveau {level}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <SolarIcon name="seedling" className="size-3" />
                  {seedsBalance} Seeds
                </Badge>
                {stats.accuracy > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <SolarIcon name="check-circle" className="size-3" />
                    {stats.accuracy}% précision
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Barre de progression niveau */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Progression vers le niveau {level + 1}
              </span>
              <span className="font-medium">
                {seedsBalance - currentLevelSeeds} / {nextLevelSeeds - currentLevelSeeds} Seeds
              </span>
            </div>
            <Progress value={Math.max(0, Math.min(100, progress))} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Anticipations
                </p>
                <p className="text-2xl font-bold">{stats.totalAnticipations}</p>
              </div>
              <SolarIcon
                name="star"
                className="size-8 text-primary opacity-20"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Résolues</p>
                <p className="text-2xl font-bold">
                  {stats.resolvedAnticipations}
                </p>
              </div>
              <SolarIcon
                name="check-circle"
                className="size-8 text-primary opacity-20"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Correctes</p>
                <p className="text-2xl font-bold">
                  {stats.correctAnticipations}
                </p>
              </div>
              <SolarIcon
                name="trophy"
                className="size-8 text-primary opacity-20"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historique des transactions récentes */}
      {transactions && transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transactions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-10 rounded-full flex items-center justify-center",
                        transaction.type === "earned"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      )}
                    >
                      <SolarIcon
                        name={
                          transaction.type === "earned"
                            ? "arrow-up"
                            : "arrow-down"
                        }
                        className="size-5"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "font-semibold",
                      transaction.type === "earned"
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {transaction.type === "earned" ? "+" : "-"}
                    {transaction.amount} Seeds
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/">Voir les décisions</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/rules">Règles de calcul</Link>
        </Button>
      </div>
    </div>
  );
}

