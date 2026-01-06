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
 * Vue publique - Style Instagram avec activité complète
 */
function PublicProfileView({ user, userId }: { user: any; userId: string }) {
  const t = useTranslations('profile');
  const tErrors = useTranslations('errors');
  const [activeTab, setActiveTab] = useState("resolved");
  const [resolvedLimit, setResolvedLimit] = useState(20);
  const [correctLimit, setCorrectLimit] = useState(20);
  const [savedLimit, setSavedLimit] = useState(20);
  
  // Réinitialiser les limites quand on change d'onglet (optionnel, pour optimiser)
  // On garde les limites pour éviter de recharger à chaque changement d'onglet
  const { user: currentUser, isAuthenticated } = useUser();
  const router = useRouter();
  
  // Condition pour déterminer si on doit vérifier le follow
  const shouldCheckFollow = isAuthenticated && currentUser?._id !== userId;
  
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
  const allAnticipations = useQuery(
    api.anticipations.getUserAnticipations,
    userId ? { userId: userId as Id<"users">, limit: 1000 } : "skip" // Récupérer toutes pour filtrer
  );
  const resolvedAnticipations = useQuery(
    api.anticipations.getUserResolvedAnticipations,
    userId ? { userId: userId as Id<"users">, limit: resolvedLimit } : "skip"
  );
  const correctAnticipations = useQuery(
    api.anticipations.getUserCorrectAnticipations,
    userId ? { userId: userId as Id<"users">, limit: correctLimit } : "skip"
  );

  // Filtrer les anticipations EN COURS (non résolues) pour l'onglet "En cours"
  const pendingAnticipations = allAnticipations?.filter((a) => !a.resolved) || [];
  
  // Calculer les stats depuis les données réelles
  const resolvedAnticipationsList = allAnticipations?.filter((a) => a.resolved) || [];
  const correctAnticipationsList = resolvedAnticipationsList.filter((a) => a.result === a.issue) || [];
  
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

  return (
    <div className="bg-background pb-16 lg:pb-0">
      <div className="max-w-[614px] mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Header Profil - COMPACT avec toutes les infos + Tabs */}
        {/* Mobile: top-14 (3.5rem) pour SimplifiedHeader h-14 */}
        {/* Desktop: top-14 (3.5rem) pour DesktopTopBar h-14 (fixed) + breaking news height */}
        <div 
          className="sticky z-20 bg-background/95 backdrop-blur-xl border-b border-border/50"
          style={{
            top: "calc(56px + var(--breaking-news-height, 0px))"
          }}
        >
            <div className="px-4 py-4">
              <div className="flex flex-col gap-4">
                {/* Ligne 1: Avatar + Nom + Niveau + Bouton Suivre */}
                <div className="flex items-start gap-3">
                  <Avatar className="size-12 shrink-0">
                    <AvatarImage src={user.image || undefined} alt={user.name || user.username || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
                      {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="font-semibold truncate text-base">
                        {user.name || user.username || user.email}
                      </h1>
                      {/* Progress circulaire du niveau */}
                      <div className="shrink-0">
                        <CircularProgress
                          value={levelProgress}
                          size={32}
                          strokeWidth={3}
                        >
                          <span className="text-xs font-semibold text-foreground">
                            {user.level || 1}
                          </span>
                        </CircularProgress>
                      </div>
                    </div>
                    
                    {/* Bio - Ligne séparée */}
                    {user.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {user.bio}
                      </p>
                    )}
                  </div>
                  
                  {/* Bouton Suivre - Seulement si ce n'est pas son propre profil */}
                  {isAuthenticated && currentUser?._id !== userId && (
                    <div className="shrink-0">
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
                        className="text-xs"
                      >
                        {isFollowingUser ? t('unfollow') : t('follow')}
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Ligne 2: Stats - Séparées visuellement */}
                {userProfile === undefined ? (
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 flex-wrap">
                    {/* Stats principales - Avec séparateurs visuels */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-base font-bold text-foreground">{stats.resolvedAnticipations}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('stats.inProgress')}</span>
                    </div>
                    <div className="h-8 w-px bg-border/50" />
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-base font-bold text-foreground">{stats.correctAnticipations}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('stats.correct')}</span>
                    </div>
                    {stats.resolvedAnticipations > 0 && (
                      <>
                        <div className="h-8 w-px bg-border/50" />
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-base font-bold text-foreground">{stats.accuracy}%</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('stats.accuracy')}</span>
                        </div>
                      </>
                    )}
                    <div className="h-8 w-px bg-border/50" />
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <SolarIcon icon="leaf-bold" className="size-3.5 text-primary" />
                        <span className="text-base font-bold text-foreground">{user.seedsBalance || 0}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('stats.seeds')}</span>
                    </div>
                    
                    {/* Stats sociales - Sur la même ligne */}
                    {followersCount !== undefined && (
                      <>
                        <div className="h-8 w-px bg-border/50" />
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-base font-bold text-foreground">{followersCount}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('stats.followers')}</span>
                        </div>
                      </>
                    )}
                    {followingCount !== undefined && (
                      <>
                        <div className="h-8 w-px bg-border/50" />
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-base font-bold text-foreground">{followingCount}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t('stats.following')}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                    
                {/* Ligne 3: Infos supplémentaires - Discrètes */}
                <div className="flex flex-col gap-2 pt-2 border-t border-border/30">
                  {user.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      {t('memberSince')} {new Date(user.createdAt).toLocaleDateString("fr-FR", { 
                        year: "numeric", 
                        month: "long" 
                      })}
                    </p>
                  )}
                  
                  {user.links && user.links.length > 0 && (
                    <div className="flex items-center gap-3 flex-wrap">
                      {user.links.map((link: any, idx: number) => (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/50"
                        >
                          <SolarIcon icon="link-bold" className="size-3" />
                          <span className="truncate max-w-[150px]">{link.type}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Onglets - Style Instagram */}
            <TabsList className="w-full h-auto p-0 bg-transparent border-t border-border/50 rounded-none">
              <TabsTrigger
                value="resolved"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent py-3"
              >
                {t('tabs.inProgress')}
              </TabsTrigger>
              <TabsTrigger
                value="correct"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent py-3"
              >
                {t('tabs.correct')}
              </TabsTrigger>
              <TabsTrigger
                value="saved"
                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent py-3"
              >
                {t('tabs.saved')}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Contenu scrollable des tabs - en dehors du div sticky */}
          {/* Tab En cours */}
          <TabsContent value="resolved" className="px-4 pt-4 md:pt-16 pb-6">
            {allAnticipations === undefined ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : pendingAnticipations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <SolarIcon icon="check-circle-bold" className="size-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('empty.inProgress')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('empty.inProgressDescription')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                {pendingAnticipations.slice(0, resolvedLimit).map((anticipation) => {
                  if (!anticipation.decision) return null;
                  const decision = anticipation.decision as any;
                  return (
                    <Link
                      key={anticipation._id}
                      href={`/${decision.slug}`}
                      className="group relative aspect-square overflow-hidden bg-muted rounded-lg"
                    >
                      {decision.imageUrl ? (
                        <Image
                          src={decision.imageUrl}
                          alt={decision.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 33vw, 200px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <SolarIcon icon="document-text-bold" className="size-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Badge emoji en haut à gauche - Toujours visible */}
                      {decision.emoji && (
                        <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-xs">
                          {decision.emoji}
                        </div>
                      )}
                      
                      {/* Badge statut en bas - Toujours visible */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-1.5">
                        <div className="flex items-center justify-between gap-1">
                          {!anticipation.resolved ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-background/90 border-white/20 text-white">
                              <SolarIcon icon="clock-circle-bold" className="size-2.5 mr-0.5" />
                              {t('status.pending')}
                            </Badge>
                          ) : (
                            <Badge
                              variant={anticipation.result === anticipation.issue ? "default" : "outline"}
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-4",
                                anticipation.result === anticipation.issue 
                                  ? "bg-green-500/90 text-white border-0" 
                                  : "bg-background/90 border-white/20 text-white"
                              )}
                            >
                              {anticipation.result === anticipation.issue ? (
                                <SolarIcon icon="check-circle-bold" className="size-2.5 mr-0.5" />
                              ) : (
                                <SolarIcon icon="close-circle-bold" className="size-2.5 mr-0.5" />
                              )}
                            </Badge>
                          )}
                          {decision.anticipationsCount > 0 && (
                            <div className="flex items-center gap-0.5 text-[10px] text-white/90">
                              <SolarIcon icon="users-group-two-rounded-bold" className="size-2.5" />
                              <span>{decision.anticipationsCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Overlay au hover pour voir le titre */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2 text-center">
                          <p className="text-xs font-medium text-white line-clamp-2 drop-shadow-lg">
                            {decision.title}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {pendingAnticipations.length > resolvedLimit && (
                  <div className="col-span-3 flex justify-center pt-4">
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

          {/* Tab Correctes */}
          <TabsContent value="correct" className="px-4 pt-4 md:pt-16 pb-6">
            {correctAnticipations === undefined ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : correctAnticipations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <SolarIcon icon="trophy-bold" className="size-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('empty.correct')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('empty.correctDescription')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                {correctAnticipations.map((anticipation) => {
                  if (!anticipation.decision) return null;
                  const decision = anticipation.decision as any;
                  return (
                    <Link
                      key={anticipation._id}
                      href={`/${decision.slug}`}
                      className="group relative aspect-square overflow-hidden bg-muted rounded-lg"
                    >
                      {decision.imageUrl ? (
                        <Image
                          src={decision.imageUrl}
                          alt={decision.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 33vw, 200px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <SolarIcon icon="document-text-bold" className="size-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Badge emoji en haut à gauche - Toujours visible */}
                      {decision.emoji && (
                        <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-xs">
                          {decision.emoji}
                        </div>
                      )}
                      
                      {/* Badge Correct en bas - Toujours visible */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-green-500/90 text-white border-0">
                            <SolarIcon icon="check-circle-bold" className="size-2.5 mr-0.5" />
                            {t('status.correct')}
                          </Badge>
                          {decision.anticipationsCount > 0 && (
                            <div className="flex items-center gap-0.5 text-[10px] text-white/90">
                              <SolarIcon icon="users-group-two-rounded-bold" className="size-2.5" />
                              <span>{decision.anticipationsCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Overlay au hover pour voir le titre */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2 text-center">
                          <p className="text-xs font-medium text-white line-clamp-2 drop-shadow-lg">
                            {decision.title}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {correctAnticipations.length === correctLimit && correctLimit >= 20 && (
                  <div className="col-span-3 flex justify-center pt-4">
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

          {/* Tab Sauvegardées */}
          <TabsContent value="saved" className="px-4 pt-4 md:pt-16 pb-6">
            {savedFavorites === undefined ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : savedDecisions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <SolarIcon icon="bookmark-bold" className="size-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('empty.saved')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('empty.savedDescription')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                {savedDecisions.map((favorite) => {
                  if (!favorite.content) return null;
                  const decision = favorite.content as any;
                  const imageUrl = decision.coverImage || decision.imageUrl;
                  return (
                    <Link
                      key={favorite._id}
                      href={`/${decision.slug}`}
                      className="group relative aspect-square overflow-hidden bg-muted rounded-lg"
                    >
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={decision.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 33vw, 200px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <SolarIcon icon="bookmark-bold" className="size-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Badge emoji en haut à gauche - Toujours visible */}
                      {decision.emoji && (
                        <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-xs">
                          {decision.emoji}
                        </div>
                      )}
                      
                      {/* Badge Sauvegardé en bas - Toujours visible */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-background/90 border-white/20 text-white">
                            <SolarIcon icon="bookmark-bold" className="size-2.5 mr-0.5" />
                            {t('status.saved')}
                          </Badge>
                          {decision.anticipationsCount > 0 && (
                            <div className="flex items-center gap-0.5 text-[10px] text-white/90">
                              <SolarIcon icon="users-group-two-rounded-bold" className="size-2.5" />
                              <span>{decision.anticipationsCount}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Overlay au hover pour voir le titre */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2 text-center">
                          <p className="text-xs font-medium text-white line-clamp-2 drop-shadow-lg">
                            {decision.title}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                    {savedDecisions.length >= savedLimit && (
                      <div className="col-span-3 flex justify-center pt-4">
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
          </Tabs>
      
        {/* Espace pour la bottom nav mobile */}
        <div className="h-16 lg:hidden" />
      </div>
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

