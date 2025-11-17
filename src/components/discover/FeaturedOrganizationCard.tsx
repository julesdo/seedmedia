"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

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

interface FeaturedOrganizationCardProps {
  organization: {
    _id: Id<"organizations">;
    name: string;
    description: string;
    logo?: string | null;
    coverImage?: string | null;
    verified: boolean;
    premiumTier: "free" | "starter" | "pro" | "impact";
    tags: string[];
    seedRegion?: string | null;
    organizationType?: "association" | "entreprise" | "collectif" | "institution" | "autre" | null;
    sector?: "tech" | "environnement" | "social" | "education" | "culture" | "sante" | "autre" | null;
    membersCount: number;
    followersCount: number;
  };
}

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

export function FeaturedOrganizationCard({ organization }: FeaturedOrganizationCardProps) {
  // Détecter si coverImage et logo sont des storageId Convex
  const isCoverImageStorageId = organization.coverImage && 
    !organization.coverImage.startsWith("http") && 
    /^[a-z0-9]{20,}$/.test(organization.coverImage);
  const isLogoStorageId = organization.logo && 
    !organization.logo.startsWith("http") && 
    /^[a-z0-9]{20,}$/.test(organization.logo);

  // Convertir coverImage et logo en URLs signées si ce sont des storageId
  const coverStorageId = isCoverImageStorageId ? organization.coverImage as Id<"_storage"> : null;
  const logoStorageId = isLogoStorageId ? organization.logo as Id<"_storage"> : null;
  
  // Appeler useImageUrl pour les deux (toujours appelé pour respecter les règles des hooks)
  const coverImageUrl = useImageUrl(organization.coverImage, coverStorageId);
  const logoUrl = useImageUrl(organization.logo, logoStorageId);

  const hasCoverImage = !!organization.coverImage;

  return (
    <Link href={`/discover/organizations/${organization._id}`}>
      <Card className="group relative overflow-hidden hover:border-primary/30 transition-all duration-300 cursor-pointer p-0">
        {/* Image de couverture en arrière-plan */}
        {hasCoverImage ? (
          <div className="relative w-full overflow-hidden">
            <OptimizedImage
              src={organization.coverImage || undefined}
              storageId={coverStorageId}
              alt={`Couverture de ${organization.name}`}
              className="w-full h-[320px] object-cover group-hover:scale-105 transition-transform duration-500"
              quality="high"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
            {/* Overlay gradient pour meilleure lisibilité - plus visible */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/30 to-black/80" />
            
            {/* Contenu positionné sur l'image */}
            <div className="absolute inset-0 flex flex-col justify-end pb-5 px-5">
              {/* Badges en haut */}
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3 z-10">
                <div className="flex items-center gap-3 flex-wrap">
                  {organization.seedRegion && (
                    <Badge variant="outline" className="backdrop-blur-md bg-background/90 border-background/50">
                      {seedRegionLabels[organization.seedRegion] || organization.seedRegion}
                    </Badge>
                  )}
                  {organization.organizationType && (
                    <Badge variant="outline" className="backdrop-blur-md bg-background/90 border-background/50">
                      {organization.organizationType}
                    </Badge>
                  )}
                </div>
                {organization.verified && (
                  <Badge
                    variant="outline"
                    className="bg-green-500/20 text-green-500 border-green-500/30 backdrop-blur-md shrink-0"
                  >
                    <SolarIcon icon="verified-check-bold" className="h-3 w-3 mr-1" />
                    Vérifiée
                  </Badge>
                )}
              </div>

              {/* Logo, nom et description en bas */}
              <div className="space-y-3 relative z-10">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 ring-3 ring-background shadow-xl shrink-0">
                    <AvatarImage src={logoUrl || undefined} alt={organization.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light text-2xl font-bold">
                      {organization.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 pt-1">
                    <h2 className="text-xl md:text-2xl font-bold text-white group-hover:text-primary transition-colors mb-2 line-clamp-2 drop-shadow-lg">
                      {organization.name}
                    </h2>
                    <p className="text-sm md:text-base text-white/90 line-clamp-2 leading-relaxed drop-shadow-md">
                      {organization.description}
                    </p>
                  </div>
                </div>

                {/* Tags et stats en bas */}
                <div className="flex items-center justify-between pt-3 border-t border-white/20">
                  <div className="flex flex-wrap gap-1.5">
                    {organization.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs bg-background/90 backdrop-blur-md border-background/50 text-foreground">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/90">
                    <div className="flex items-center gap-1.5 backdrop-blur-md bg-background/50 px-2.5 py-1 rounded-full">
                      <SolarIcon icon="users-group-two-rounded-bold" className="h-3.5 w-3.5" />
                      <span className="font-medium">{organization.membersCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 backdrop-blur-md bg-background/50 px-2.5 py-1 rounded-full">
                      <SolarIcon icon="user-bold" className="h-3.5 w-3.5" />
                      <span className="font-medium">{organization.followersCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
            ) : (
              /* Version sans image de couverture */
              <div className="relative p-5 space-y-4 bg-gradient-to-br from-background to-background/50">
                {/* Badges en haut */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {organization.seedRegion && (
                      <Badge variant="outline" className="backdrop-blur-sm bg-background/80 text-xs">
                        {seedRegionLabels[organization.seedRegion] || organization.seedRegion}
                      </Badge>
                    )}
                    {organization.organizationType && (
                      <Badge variant="outline" className="backdrop-blur-sm bg-background/80 text-xs">
                        {organization.organizationType}
                      </Badge>
                    )}
                  </div>
                  {organization.verified && (
                    <Badge
                      variant="outline"
                      className="bg-green-500/20 text-green-500 border-green-500/30 backdrop-blur-sm shrink-0 text-xs"
                    >
                      <SolarIcon icon="verified-check-bold" className="h-3 w-3 mr-1" />
                      Vérifiée
                    </Badge>
                  )}
                </div>

                {/* Logo et nom */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 ring-3 ring-background shadow-lg shrink-0">
                    <AvatarImage src={logoUrl || undefined} alt={organization.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light text-2xl font-bold">
                      {organization.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 pt-1">
                    <h2 className="text-xl md:text-2xl font-bold text-gradient-light group-hover:text-primary transition-colors mb-2 line-clamp-2">
                      {organization.name}
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground/90 line-clamp-2 leading-relaxed">
                      {organization.description}
                    </p>
                  </div>
                </div>

            {/* Tags et stats */}
            <div className="flex items-center justify-between pt-3 border-t border-border/30">
              <div className="flex flex-wrap gap-1.5">
                {organization.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs bg-background/50 backdrop-blur-sm">
                    #{tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
                <div className="flex items-center gap-1.5">
                  <SolarIcon icon="users-group-two-rounded-bold" className="h-3.5 w-3.5" />
                  <span className="font-medium">{organization.membersCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <SolarIcon icon="user-bold" className="h-3.5 w-3.5" />
                  <span className="font-medium">{organization.followersCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </Link>
  );
}

