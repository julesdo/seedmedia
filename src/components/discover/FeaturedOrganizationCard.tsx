"use client";

import { Link } from "next-view-transitions";
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
      <Card className="group relative overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer p-0 border-0 bg-gradient-to-br from-background/85 to-background/50 backdrop-blur-xl">
        {/* Image de couverture en arrière-plan */}
        {hasCoverImage ? (
          <div className="relative w-full overflow-hidden">
            {/* Effet de brillance au survol */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/6 group-hover:via-primary/3 group-hover:to-primary/0 transition-all duration-700 pointer-events-none z-20" />
            
            <OptimizedImage
              src={organization.coverImage || undefined}
              storageId={coverStorageId}
              alt={`Couverture de ${organization.name}`}
              className="w-full h-[400px] object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              quality="high"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
            {/* Overlay gradient élégant avec plus de profondeur */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/25 to-black/80 group-hover:via-black/28 transition-all duration-400" />
            
            {/* Contenu positionné sur l'image */}
            <div className="absolute inset-0 flex flex-col justify-end pb-6 px-6">
              {/* Badges en haut avec animation */}
              <div className="absolute top-5 left-5 right-5 flex items-start justify-between gap-3 z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  {organization.seedRegion && (
                    <Badge variant="outline" className="backdrop-blur-xl bg-background/80 border-background/40 shadow-lg group-hover:bg-background/90 transition-all duration-300">
                      <span className="text-xs font-medium">{seedRegionLabels[organization.seedRegion] || organization.seedRegion}</span>
                    </Badge>
                  )}
                  {organization.organizationType && (
                    <Badge variant="outline" className="backdrop-blur-xl bg-background/80 border-background/40 shadow-lg group-hover:bg-background/90 transition-all duration-300">
                      <span className="text-xs font-medium">{organization.organizationType}</span>
                    </Badge>
                  )}
                </div>
                {organization.verified && (
                  <Badge
                    variant="outline"
                    className="bg-green-500/25 text-green-400 border-green-500/40 backdrop-blur-xl shadow-lg shrink-0 group-hover:bg-green-500/30 transition-all duration-300"
                  >
                    <SolarIcon icon="verified-check-bold" className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-xs font-semibold">Vérifiée</span>
                  </Badge>
                )}
              </div>

              {/* Logo, nom et description en bas - design amélioré */}
              <div className="space-y-4 relative z-10">
                <div className="flex items-start gap-5">
                  <Avatar className="h-20 w-20 ring-4 ring-background/70 shadow-xl shrink-0 group-hover:ring-primary/30 group-hover:scale-102 transition-all duration-400">
                    <AvatarImage src={logoUrl || undefined} alt={organization.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-gradient-light text-3xl font-bold">
                      {organization.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 pt-1.5">
                    <h2 className="text-2xl md:text-3xl font-bold text-white transition-colors duration-300 mb-3 line-clamp-2 drop-shadow-2xl tracking-tight">
                      {organization.name}
                    </h2>
                    <p className="text-sm md:text-base text-white/95 line-clamp-3 leading-relaxed drop-shadow-lg font-medium">
                      {organization.description}
                    </p>
                  </div>
                </div>

                {/* Tags et stats en bas - design raffiné avec séparateur subtil */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10 group-hover:border-white/15 transition-colors duration-300">
                  <div className="flex flex-wrap gap-2">
                    {organization.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs bg-background/70 backdrop-blur-xl border-background/30 text-foreground shadow-md group-hover:bg-background/80 group-hover:border-primary/20 transition-all duration-300">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/95">
                    <div className="flex items-center gap-2 backdrop-blur-xl bg-background/60 px-3 py-1.5 rounded-full shadow-lg group-hover:bg-background/80 transition-all duration-300">
                      <SolarIcon icon="users-group-two-rounded-bold" className="h-4 w-4 text-primary/80" />
                      <span className="font-semibold">{organization.membersCount}</span>
                    </div>
                    <div className="flex items-center gap-2 backdrop-blur-xl bg-background/60 px-3 py-1.5 rounded-full shadow-lg group-hover:bg-background/80 transition-all duration-300">
                      <SolarIcon icon="user-bold" className="h-4 w-4 text-primary/80" />
                      <span className="font-semibold">{organization.followersCount}</span>
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

