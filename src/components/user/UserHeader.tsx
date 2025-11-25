"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HashtagList } from "@/components/ui/Hashtag";
import { Id } from "../../../convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Hook pour obtenir l'URL d'une image (convertit storageId en URL si nécessaire)
 */
function useImageUrl(imageUrl: string | null | undefined, storageIdToQuery: Id<"_storage"> | null): string | null | undefined {
  const storageFileUrl = useQuery(
    api.storage.getFileUrl,
    storageIdToQuery ? { storageId: storageIdToQuery } : "skip"
  );

  if (!imageUrl) return null;

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  if (storageIdToQuery && storageFileUrl) {
    return storageFileUrl;
  }

  return imageUrl;
}

interface UserHeaderProps {
  user: {
    _id: Id<"users">;
    name: string;
    email?: string;
    image?: string | null;
    bio?: string | null;
    tags: string[];
    links: Array<{ type: string; url: string }>;
    location?: {
      lat: number;
      lng: number;
      city?: string;
      region?: string;
      country?: string;
    } | null;
    region?: string | null;
    level: number;
    reachRadius: number;
    credibilityScore: number;
    role: "explorateur" | "contributeur" | "editeur";
    expertiseDomains?: string[];
    premiumTier: "free" | "starter" | "pro" | "impact";
  };
  stats?: {
    followersCount: number;
    articlesCount: number;
    projectsCount: number;
    actionsCount: number;
    correctionsCount: number;
    credibilityScore: number;
  } | null;
  isOwnProfile?: boolean;
  onEdit?: () => void;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

const premiumTierLabels: Record<string, string> = {
  free: "Gratuit",
  starter: "Starter",
  pro: "Pro",
  impact: "Impact",
};

const roleLabels: Record<string, string> = {
  explorateur: "Explorateur",
  contributeur: "Contributeur",
  editeur: "Éditeur",
};

export function UserHeader({ user, stats, isOwnProfile, onEdit, activeTab, onTabChange }: UserHeaderProps) {
  const [isPending, setIsPending] = useState(false);
  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null);

  // Détecter si image est un storageId Convex
  const isImageStorageId = user.image && 
    !user.image.startsWith("http") && 
    /^[a-z0-9]{20,}$/.test(user.image);

  const imageStorageId = isImageStorageId ? user.image as Id<"_storage"> : null;
  const imageUrl = useImageUrl(user.image, imageStorageId);

  // Suivi de l'utilisateur (seulement si ce n'est pas son propre profil)
  const isFollowing = useQuery(api.follows.isFollowing, {
    targetType: "user",
    targetId: user._id,
  });
  const toggleFollow = useMutation(api.follows.toggleFollow);

  const handleFollow = async () => {
    if (isPending || isFollowing === undefined || isOwnProfile) return;

    setIsPending(true);
    const currentFollowing = optimisticFollowing ?? isFollowing;
    setOptimisticFollowing(!currentFollowing);

    try {
      const result = await toggleFollow({
        targetType: "user",
        targetId: user._id,
      });
      setOptimisticFollowing(null);
      toast.success(
        result.following
          ? "Vous suivez maintenant cet utilisateur"
          : "Vous ne suivez plus cet utilisateur"
      );
    } catch (error: any) {
      setOptimisticFollowing(null);
      toast.error(error.message || "Erreur lors de la modification du suivi");
    } finally {
      setIsPending(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Profil de ${user.name}`,
          url,
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          await navigator.clipboard.writeText(url);
          toast.success("Lien copié dans le presse-papiers");
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papiers");
    }
  };

  const following = optimisticFollowing ?? isFollowing ?? false;

  return (
    <div className="relative w-full rounded-xl overflow-hidden">
      {/* Contenu principal */}
      <div className="relative px-6 sm:px-8 md:px-12 pb-8 sm:pb-10 md:pb-12">
        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-2 mb-4">
          {!isOwnProfile && (
            <Button
              variant={following ? "outline" : "accent"}
              size="sm"
              onClick={handleFollow}
              disabled={isPending || isFollowing === undefined}
              icon={following ? "user-check-bold" : "user-plus-bold"}
            >
              {following ? "Suivi" : "Suivre"}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="glass" size="sm" icon="share-bold">
                Partager
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                <SolarIcon icon="link-bold" className="h-4 w-4 mr-2" />
                Copier le lien
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const url = window.location.href;
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, "_blank");
                }}
              >
                <SolarIcon icon="twitter-bold" className="h-4 w-4 mr-2" />
                Partager sur Twitter
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const url = window.location.href;
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
                }}
              >
                <SolarIcon icon="linkedin-bold" className="h-4 w-4 mr-2" />
                Partager sur LinkedIn
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isOwnProfile && onEdit && (
            <Button variant="glass" size="sm" onClick={onEdit} icon="settings-bold">
              Paramètres
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {/* Avatar et infos principales */}
          <div className="flex items-end gap-6">
            <Avatar
              className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 bg-background ring-4 ring-border/50 shrink-0 transition-all"
            >
              <AvatarImage src={imageUrl || undefined} alt={user.name} />
              <AvatarFallback className="text-4xl sm:text-5xl bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light">
                {user.name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 flex flex-col gap-2 sm:gap-3 pb-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-light leading-tight">
                  {user.name}
                </h1>
                <Badge variant="outline" className="shrink-0">
                  {roleLabels[user.role]}
                </Badge>
                <Badge variant="outline" className="shrink-0">
                  {premiumTierLabels[user.premiumTier]}
                </Badge>
                {user.credibilityScore > 0 && (
                  <Badge variant="outline" className="shrink-0 bg-primary/20 text-primary border-primary/30">
                    <SolarIcon icon="star-bold" className="h-3 w-3 mr-1" />
                    {user.credibilityScore}/100
                  </Badge>
                )}
              </div>

              {/* Localisation, niveau, rayon */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground/90">
                {user.location?.city && (
                  <div className="flex items-center gap-1.5">
                    <SolarIcon icon="map-point-bold" className="h-4 w-4 shrink-0" />
                    <span>
                      {[user.location.city, user.location.region, user.location.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {user.region && !user.location?.city && (
                  <div className="flex items-center gap-1.5">
                    <SolarIcon icon="map-point-bold" className="h-4 w-4 shrink-0" />
                    <span>{user.region}</span>
                  </div>
                )}
                {user.reachRadius !== null && user.reachRadius !== undefined && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <div className="flex items-center gap-1.5">
                      <SolarIcon icon="radar-2-bold" className="h-4 w-4 shrink-0" />
                      <span>{user.reachRadius === 0 ? "Local" : `${user.reachRadius} km`}</span>
                    </div>
                  </>
                )}
                <span className="text-muted-foreground/40">•</span>
                <div className="flex items-center gap-1.5">
                  <SolarIcon icon="rank-bold" className="h-4 w-4 shrink-0" />
                  <span>Niveau {user.level}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio et liens */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {user.bio && (
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground/95 leading-relaxed max-w-3xl">
                {user.bio}
              </p>
            )}
            {user.links && user.links.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm shrink-0">
                {user.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-muted-foreground/90 hover:text-primary transition-colors"
                  >
                    <SolarIcon icon="global-bold" className="h-4 w-4 shrink-0" />
                    <span>{link.type}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          {user.tags.length > 0 && (
            <HashtagList 
              tags={user.tags} 
              variant="default"
              size="md"
            />
          )}

          {/* Stats et Onglets */}
          <div className="pt-2 border-t border-border/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Stats intégrées */}
              {stats && (
                <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2">
                  {stats.followersCount > 0 && (
                    <div className="flex items-center gap-1.5 group cursor-default">
                      <SolarIcon icon="user-bold" className="h-3.5 w-3.5 icon-gradient-light shrink-0" />
                      <span className="text-sm sm:text-base font-semibold text-gradient-light">
                        {stats.followersCount.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-xs text-muted-foreground/70">Abonnés</span>
                    </div>
                  )}
                  {stats.articlesCount > 0 && (
                    <div className="flex items-center gap-1.5 group cursor-default">
                      <SolarIcon icon="document-text-bold" className="h-3.5 w-3.5 icon-gradient-light shrink-0" />
                      <span className="text-sm sm:text-base font-semibold text-gradient-light">
                        {stats.articlesCount.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-xs text-muted-foreground/70">Articles</span>
                    </div>
                  )}
                  {stats.projectsCount > 0 && (
                    <div className="flex items-center gap-1.5 group cursor-default">
                      <SolarIcon icon="folder-bold" className="h-3.5 w-3.5 icon-gradient-light shrink-0" />
                      <span className="text-sm sm:text-base font-semibold text-gradient-light">
                        {stats.projectsCount.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-xs text-muted-foreground/70">Projets</span>
                    </div>
                  )}
                  {stats.actionsCount > 0 && (
                    <div className="flex items-center gap-1.5 group cursor-default">
                      <SolarIcon icon="hand-stars-bold" className="h-3.5 w-3.5 icon-gradient-light shrink-0" />
                      <span className="text-sm sm:text-base font-semibold text-gradient-light">
                        {stats.actionsCount.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-xs text-muted-foreground/70">Actions</span>
                    </div>
                  )}
                  {stats.correctionsCount > 0 && (
                    <div className="flex items-center gap-1.5 group cursor-default">
                      <SolarIcon icon="verified-check-bold" className="h-3.5 w-3.5 icon-gradient-light shrink-0" />
                      <span className="text-sm sm:text-base font-semibold text-gradient-light">
                        {stats.correctionsCount.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-xs text-muted-foreground/70">Corrections</span>
                    </div>
                  )}
                </div>
              )}

              {/* Onglets intégrés */}
              {activeTab !== undefined && onTabChange && (
                <TabsList className="h-auto bg-transparent rounded-none p-0 gap-0 flex-wrap">
                  <TabsTrigger 
                    value="articles" 
                    className="rounded-md border-b-0 data-[state=active]:bg-background/50 data-[state=active]:shadow-sm"
                  >
                    Articles
                  </TabsTrigger>
                  <TabsTrigger 
                    value="contributions" 
                    className="rounded-md border-b-0 data-[state=active]:bg-background/50 data-[state=active]:shadow-sm"
                  >
                    Contributions
                  </TabsTrigger>
                </TabsList>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

