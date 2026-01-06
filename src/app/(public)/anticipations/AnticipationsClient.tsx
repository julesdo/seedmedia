"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from 'next-intl';

/**
 * Composant client pour la page Anticipations
 * Affiche toutes les anticipations de l'utilisateur avec leur statut
 */
export function AnticipationsClient() {
  const t = useTranslations('anticipations');
  const { isAuthenticated, isLoading } = useConvexAuth();
  const anticipations = useQuery(
    api.anticipations.getMyAnticipations,
    isAuthenticated ? {} : "skip"
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="hidden lg:sticky lg:top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="max-w-[614px] mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="max-w-[614px] mx-auto px-4 py-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="hidden lg:sticky lg:top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="max-w-[614px] mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <SolarIcon icon="star-bold" className="size-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t('description')}
            </p>
          </div>
        </div>
        <div className="max-w-[614px] mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <SolarIcon icon="star-bold" className="size-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('notAuthenticated.title')}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('notAuthenticated.description')}
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/sign-in">{t('notAuthenticated.signIn')}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/sign-up">{t('notAuthenticated.signUp')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!anticipations || anticipations.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="hidden lg:sticky lg:top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-xl">
          <div className="max-w-[614px] mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <SolarIcon icon="star-bold" className="size-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t('description')}
            </p>
          </div>
        </div>
        <div className="max-w-[614px] mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <SolarIcon icon="star-bold" className="size-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
            <p className="text-sm text-muted-foreground mb-6">
              {t('empty.description')}
            </p>
            <Button asChild>
              <Link href="/">{t('empty.viewDecisions')}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Séparer les anticipations résolues et non résolues
  const resolved = anticipations.filter((a) => a.resolved);
  const pending = anticipations.filter((a) => !a.resolved);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Masqué en mobile */}
      <div className="hidden lg:sticky lg:top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="max-w-[614px] mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <SolarIcon icon="star-bold" className="size-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {anticipations.length}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {pending.length} {t('stats.inProgress')}{resolved.length > 0 && ` • ${resolved.length} ${resolved.length > 1 ? t('stats.resolvedPlural') : t('stats.resolved')}`}
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-[614px] mx-auto px-4 py-6">
        {/* Anticipations en cours */}
        {pending.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <SolarIcon icon="clock-circle-bold" className="size-5 text-muted-foreground" />
              {t('sections.inProgress')} ({pending.length})
            </h2>
            <div className="space-y-4">
              {pending.map((anticipation) => (
                <AnticipationCard
                  key={anticipation._id}
                  anticipation={anticipation}
                />
              ))}
            </div>
          </section>
        )}

        {/* Anticipations résolues */}
        {resolved.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <SolarIcon icon="check-circle-bold" className="size-5 text-muted-foreground" />
              {t('sections.resolved')} ({resolved.length})
            </h2>
            <div className="space-y-4">
              {resolved.map((anticipation) => (
                <AnticipationCard
                  key={anticipation._id}
                  anticipation={anticipation}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Espace pour la bottom nav mobile */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}

/**
 * Carte d'anticipation avec statut
 */
function AnticipationCard({ anticipation }: { anticipation: any }) {
  const t = useTranslations('anticipations');
  // L'anticipation contient déjà les données de la décision (enrichie côté serveur)
  const decision = anticipation.decision || anticipation;
  if (!decision || !decision.title) return null;

  const isCorrect =
    anticipation.resolved &&
    anticipation.result &&
    anticipation.result === anticipation.issue;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <Link
              href={`/${decision.slug}`}
              className="block hover:opacity-80 transition-opacity"
            >
              <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {decision.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {decision.decider} • {new Date(decision.date).toLocaleDateString("fr-FR")}
              </p>
            </Link>

            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge
                variant={
                  anticipation.issue === "works"
                    ? "default"
                    : anticipation.issue === "partial"
                      ? "secondary"
                      : "destructive"
                }
              >
                {anticipation.issue === "works"
                  ? t('issues.works')
                  : anticipation.issue === "partial"
                    ? t('issues.partial')
                    : t('issues.fails')}
              </Badge>

              {anticipation.resolved && (
                <Badge
                  variant={isCorrect ? "default" : "outline"}
                  className={cn(
                    isCorrect && "bg-green-500/10 text-green-600 dark:text-green-400"
                  )}
                >
                  {isCorrect ? (
                    <>
                      <SolarIcon icon="check-circle-bold" className="size-3 mr-1" />
                      {t('card.correct')}
                    </>
                  ) : (
                    <>
                      <SolarIcon icon="close-circle-bold" className="size-3 mr-1" />
                      {t('card.incorrect')}
                    </>
                  )}
                </Badge>
              )}

              {anticipation.seedsEarned !== undefined && (
                <Badge
                  variant={anticipation.seedsEarned > 0 ? "default" : "outline"}
                  className={cn(
                    anticipation.seedsEarned > 0 &&
                      "bg-green-500/10 text-green-600 dark:text-green-400"
                  )}
                >
                  <SolarIcon icon="leaf-bold" className="size-3 mr-1" />
                  {anticipation.seedsEarned > 0 ? "+" : ""}
                  {anticipation.seedsEarned} Seeds
                </Badge>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              {anticipation.seedsEngaged} {t('card.seedsEngaged')}
              {anticipation.resolved &&
                anticipation.result &&
                ` • ${t('card.result')} ${
                  anticipation.result === "works"
                    ? t('issues.works')
                    : anticipation.result === "partial"
                      ? t('issues.partial')
                      : t('issues.fails')
                }`}
            </div>
          </div>

          <Link
            href={`/${decision.slug}`}
            className="flex-shrink-0"
          >
            <Button variant="ghost" size="sm">
              <SolarIcon icon="arrow-right-bold" className="size-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
