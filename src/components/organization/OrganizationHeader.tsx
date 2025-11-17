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
  // Toujours appeler useQuery (règle des hooks React)
  const storageFileUrl = useQuery(
    api.storage.getFileUrl,
    storageIdToQuery ? { storageId: storageIdToQuery } : "skip"
  );

  if (!imageUrl) return null;

  // Si c'est déjà une URL complète, on la retourne telle quelle
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Si on a un storageId et une URL signée, l'utiliser
  if (storageIdToQuery && storageFileUrl) {
    return storageFileUrl;
  }

  // Sinon, on retourne tel quel (pourrait être une URL relative ou un storageId non encore chargé)
  return imageUrl;
}

interface OrganizationHeaderProps {
  organization: {
    _id: Id<"organizations">;
    name: string;
    description: string;
    logo?: string | null;
    coverImage?: string | null;
    verified: boolean;
    premiumTier: "free" | "starter" | "pro" | "impact";
    tags: string[];
    location?: {
      address?: string;
      city?: string;
      region?: string;
      country?: string;
      postalCode?: string;
    } | null;
    seedRegion?: string | null;
    organizationType?: "association" | "entreprise" | "collectif" | "institution" | "autre" | null;
    sector?: "tech" | "environnement" | "social" | "education" | "culture" | "sante" | "autre" | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    website?: string | null;
    languages?: string[] | null;
    reachRadius?: number | null;
  };
  stats?: {
    followersCount: number;
    articlesCount: number;
    projectsCount: number;
    actionsCount: number;
    membersCount: number;
  } | null;
  isMember?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

export function OrganizationHeader({ organization, stats, isMember, canEdit, onEdit, activeTab, onTabChange }: OrganizationHeaderProps) {
  const [isPending, setIsPending] = useState(false);
  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null);

  const premiumTierLabels: Record<string, string> = {
    free: "Gratuit",
    starter: "Starter",
    pro: "Pro",
    impact: "Impact",
  };

  const organizationTypeLabels: Record<string, string> = {
    association: "Association",
    entreprise: "Entreprise",
    collectif: "Collectif",
    institution: "Institution",
    autre: "Autre",
  };

  const sectorLabels: Record<string, string> = {
    tech: "Tech",
    environnement: "Environnement",
    social: "Social",
    education: "Éducation",
    culture: "Culture",
    sante: "Santé",
    autre: "Autre",
  };

  const seedRegionLabels: Record<string, string> = {
    ARA: "Auvergne-Rhône-Alpes",
    BFC: "Bourgogne-Franche-Comté",
    BR: "Bretagne",
    CVL: "Centre-Val de Loire",
    COR: "Corse",
    GE: "Grand Est",
    HDF: "Hauts-de-France",
    IDF: "Île-de-France",
    NA: "Nouvelle-Aquitaine",
    OCC: "Occitanie",
    PDL: "Pays de la Loire",
    PAC: "Provence-Alpes-Côte d'Azur",
    DOM: "Outre-Mer",
  };

  const languageLabels: Record<string, string> = {
    fr: "FR",
    en: "EN",
    es: "ES",
    de: "DE",
    it: "IT",
  };

  // Détecter si coverImage et logo sont des storageId Convex
  const isCoverImageStorageId = organization.coverImage && 
    !organization.coverImage.startsWith("http") && 
    /^[a-z0-9]{20,}$/.test(organization.coverImage);
  const isLogoStorageId = organization.logo && 
    !organization.logo.startsWith("http") && 
    /^[a-z0-9]{20,}$/.test(organization.logo);

  // Convertir coverImage et logo en URLs signées si ce sont des storageId
  // On utilise le même storageId pour les deux appels pour satisfaire les règles des hooks
  const coverStorageId = isCoverImageStorageId ? organization.coverImage as Id<"_storage"> : null;
  const logoStorageId = isLogoStorageId ? organization.logo as Id<"_storage"> : null;
  
  // Appeler useImageUrl pour les deux (toujours appelé pour respecter les règles des hooks)
  const coverImageUrl = useImageUrl(organization.coverImage, coverStorageId);
  const logoUrl = useImageUrl(organization.logo, logoStorageId);

  // Suivi de l'organisation
  const isFollowing = useQuery(api.follows.isFollowing, {
    targetType: "organization",
    targetId: organization._id,
  });
  const toggleFollow = useMutation(api.follows.toggleFollow);

  const handleFollow = async () => {
    if (isPending || isFollowing === undefined) return;

    setIsPending(true);
    const currentFollowing = optimisticFollowing ?? isFollowing;
    setOptimisticFollowing(!currentFollowing);

    try {
      const result = await toggleFollow({
        targetType: "organization",
        targetId: organization._id,
      });
      setOptimisticFollowing(null);
      toast.success(
        result.following
          ? "Vous suivez maintenant cette organisation"
          : "Vous ne suivez plus cette organisation"
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
          title: "Découvrez cette organisation",
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
      {/* Image de couverture en arrière-plan */}
      {coverImageUrl && (
        <>
          <div className="relative h-48 sm:h-64 md:h-80 w-full">
            <OptimizedImage
              src={coverImageUrl}
              alt={`Couverture de ${organization.name}`}
              className="w-full h-full object-cover"
              quality="auto"
              priority={true}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              placeholder="blur"
            />
            {/* Overlay gradient subtil pour la lisibilité en bas */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/70 pointer-events-none" />
            
            {/* Boutons d'action en haut à droite */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              {!isMember && (
                <Button
                  variant={following ? "outline" : "accent"}
                  size="sm"
                  onClick={handleFollow}
                  disabled={isPending || isFollowing === undefined}
                  icon={following ? "user-check-bold" : "user-plus-bold"}
                  className="backdrop-blur-sm bg-background/90 hover:bg-background"
                >
                  {following ? "Suivi" : "Suivre"}
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="glass" 
                    size="sm"
                    icon="share-bold"
                    className="backdrop-blur-sm bg-background/90 hover:bg-background"
                  >
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

              {canEdit && onEdit && (
                <Button 
                  variant="glass" 
                  size="sm"
                  onClick={onEdit} 
                  icon="settings-bold"
                  className="backdrop-blur-sm bg-background/90 hover:bg-background"
                >
                  Paramètres
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Contenu principal - positionné en bas */}
      <div className={`relative ${coverImageUrl ? "-mt-16 sm:-mt-20 md:-mt-24" : ""} px-6 sm:px-8 md:px-12 pb-8 sm:pb-10 md:pb-12`}>
        {/* Boutons d'action si pas de cover image */}
        {!coverImageUrl && (
          <div className="flex items-center justify-end gap-2 mb-4">
            {!isMember && (
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

            {canEdit && onEdit && (
              <Button variant="glass" size="sm" onClick={onEdit} icon="settings-bold">
                Paramètres
              </Button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* Avatar/Logo et infos principales */}
          <div className="flex items-end gap-6">
            {/* Avatar/Logo qui chevauche la cover par le bas */}
            <Avatar
              className={`h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 ${coverImageUrl ? "bg-background/95 backdrop-blur-sm ring-4 ring-background shadow-xl" : "bg-background ring-4 ring-border/50"} shrink-0 transition-all`}
            >
              <AvatarImage src={logoUrl || undefined} alt={organization.name} />
              <AvatarFallback className="text-4xl sm:text-5xl bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light">
                {organization.name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Nom, badges et informations */}
            <div className="flex-1 flex flex-col gap-2 sm:gap-3 pb-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient-light leading-tight">
                  {organization.name}
                </h1>
                {organization.verified && (
                  <Badge
                    variant="outline"
                    className="bg-green-500/20 text-green-500 border-green-500/30 backdrop-blur-sm shrink-0"
                  >
                    <SolarIcon icon="verified-check-bold" className="h-3 w-3 mr-1" />
                    Vérifiée
                  </Badge>
                )}
                <Badge variant="outline" className="backdrop-blur-sm shrink-0">
                  {premiumTierLabels[organization.premiumTier]}
                </Badge>
              </div>

              {/* Localisation, rayon, langues sur une même ligne */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground/90">
                {organization.location?.city && (
                  <div className="flex items-center gap-1.5">
                    <SolarIcon icon="map-point-bold" className="h-4 w-4 shrink-0" />
                    <span>
                      {[
                        organization.location.city,
                        organization.location.postalCode,
                        organization.seedRegion ? seedRegionLabels[organization.seedRegion] : organization.location.region,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {organization.seedRegion && !organization.location?.city && (
                  <div className="flex items-center gap-1.5">
                    <SolarIcon icon="map-point-bold" className="h-4 w-4 shrink-0" />
                    <span>{seedRegionLabels[organization.seedRegion] || organization.seedRegion}</span>
                  </div>
                )}
                {organization.reachRadius !== null && organization.reachRadius !== undefined && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <div className="flex items-center gap-1.5">
                      <SolarIcon icon="radar-2-bold" className="h-4 w-4 shrink-0" />
                      <span>{organization.reachRadius === 0 ? "Local" : `${organization.reachRadius} km`}</span>
                    </div>
                  </>
                )}
                {organization.languages && organization.languages.length > 0 && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <div className="flex items-center gap-1.5">
                      <SolarIcon icon="globe-bold" className="h-4 w-4 shrink-0" />
                      <span>{organization.languages.map((lang) => languageLabels[lang] || lang).join(", ")}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Description et liens sur la même ligne */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {organization.description && (
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground/95 leading-relaxed max-w-3xl">
                {organization.description}
              </p>
            )}
            {/* Contact et liens */}
            {(organization.website || organization.contactEmail || organization.contactPhone) && (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm shrink-0">
                {organization.website && (
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-muted-foreground/90 hover:text-primary transition-colors"
                  >
                    <SolarIcon icon="global-bold" className="h-4 w-4 shrink-0" />
                    <span>Site web</span>
                  </a>
                )}
                {organization.contactEmail && (
                  <>
                    {organization.website && <span className="text-muted-foreground/40">•</span>}
                    <a
                      href={`mailto:${organization.contactEmail}`}
                      className="flex items-center gap-1.5 text-muted-foreground/90 hover:text-primary transition-colors"
                    >
                      <SolarIcon icon="letter-bold" className="h-4 w-4 shrink-0" />
                      <span>Email</span>
                    </a>
                  </>
                )}
                {organization.contactPhone && (
                  <>
                    {(organization.website || organization.contactEmail) && <span className="text-muted-foreground/40">•</span>}
                    <a
                      href={`tel:${organization.contactPhone}`}
                      className="flex items-center gap-1.5 text-muted-foreground/90 hover:text-primary transition-colors"
                    >
                      <SolarIcon icon="phone-bold" className="h-4 w-4 shrink-0" />
                      <span>Téléphone</span>
                    </a>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hashtags cliquables */}
          {organization.tags.length > 0 && (
            <HashtagList 
              tags={organization.tags} 
              variant="default"
              size="md"
            />
          )}

          {/* Stats et Onglets sur la même ligne */}
          <div className="pt-2 border-t border-border/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Stats intégrées avec icônes et meilleur design - tout sur une ligne */}
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
                  {stats.membersCount > 0 && (
                    <div className="flex items-center gap-1.5 group cursor-default">
                      <SolarIcon icon="users-group-two-rounded-bold" className="h-3.5 w-3.5 icon-gradient-light shrink-0" />
                      <span className="text-sm sm:text-base font-semibold text-gradient-light">
                        {stats.membersCount.toLocaleString("fr-FR")}
                      </span>
                      <span className="text-xs text-muted-foreground/70">Membres</span>
                    </div>
                  )}
                </div>
              )}

              {/* Onglets intégrés */}
              {activeTab !== undefined && onTabChange && (
                <TabsList className="h-auto bg-transparent rounded-none p-0 gap-0 flex-wrap">
                  <TabsTrigger 
                    value="feed" 
                    className="rounded-md border-b-0 data-[state=active]:bg-background/50 data-[state=active]:shadow-sm"
                  >
                    Actualité
                  </TabsTrigger>
                  <TabsTrigger 
                    value="articles" 
                    className="rounded-md border-b-0 data-[state=active]:bg-background/50 data-[state=active]:shadow-sm"
                  >
                    Articles
                  </TabsTrigger>
                  <TabsTrigger 
                    value="projects" 
                    className="rounded-md border-b-0 data-[state=active]:bg-background/50 data-[state=active]:shadow-sm"
                  >
                    Projets
                  </TabsTrigger>
                  <TabsTrigger 
                    value="actions" 
                    className="rounded-md border-b-0 data-[state=active]:bg-background/50 data-[state=active]:shadow-sm"
                  >
                    Actions
                  </TabsTrigger>
                  {isMember && (
                    <TabsTrigger 
                      value="members" 
                      className="rounded-md border-b-0 data-[state=active]:bg-background/50 data-[state=active]:shadow-sm"
                    >
                      Membres
                    </TabsTrigger>
                  )}
                </TabsList>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

