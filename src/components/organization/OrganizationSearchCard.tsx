"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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

interface OrganizationSearchCardProps {
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

const premiumTierLabels: Record<string, string> = {
  free: "Gratuit",
  starter: "Starter",
  pro: "Pro",
  impact: "Impact",
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

export function OrganizationSearchCard({ organization }: OrganizationSearchCardProps) {
  // Détecter si coverImage et logo sont des storageId Convex
  const isCoverImageStorageId = organization.coverImage && 
    !organization.coverImage.startsWith("http") && 
    /^[a-z0-9]{20,}$/.test(organization.coverImage);
  const isLogoStorageId = organization.logo && 
    !organization.logo.startsWith("http") && 
    /^[a-z0-9]{20,}$/.test(organization.logo);

  const coverStorageId = isCoverImageStorageId ? organization.coverImage as Id<"_storage"> : null;
  const logoStorageId = isLogoStorageId ? organization.logo as Id<"_storage"> : null;
  
  const coverImageUrl = useImageUrl(organization.coverImage, coverStorageId);
  const logoUrl = useImageUrl(organization.logo, logoStorageId);

  return (
    <Link href={`/discover/organizations/${organization._id}`}>
      <Card className="group relative overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 h-full flex flex-col p-0">
        {/* Effet de brillance au survol */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/2 group-hover:to-primary/0 transition-all duration-500 pointer-events-none z-10" />
        
        {/* Image de couverture - design horizontal compact */}
        {organization.coverImage && (
          <div className="relative h-32 w-full overflow-hidden bg-muted/20">
            <OptimizedImage
              src={organization.coverImage || undefined}
              storageId={coverStorageId}
              alt={`Couverture de ${organization.name}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              quality="medium"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/40 pointer-events-none z-10" />
            
            {/* Badge vérifié en overlay si présent */}
            {organization.verified && (
              <div className="absolute top-3 right-3 z-20">
                <Badge
                  variant="outline"
                  className="bg-green-500/20 text-green-500 border-green-500/30 backdrop-blur-md shadow-lg"
                >
                  <SolarIcon icon="verified-check-bold" className="h-3 w-3 mr-1" />
                  Vérifiée
                </Badge>
              </div>
            )}
          </div>
        )}

            <CardContent className={cn(
              "p-4 relative flex-1 flex flex-col",
              !organization.coverImage && "pt-4"
            )}>
              <div className="flex flex-col gap-3 flex-1">
                {/* Header avec logo et nom - design compact */}
                <div className="flex items-start gap-3">
                  <Avatar className={cn(
                    "h-12 w-12 ring-2 ring-border/50 group-hover:ring-primary/40 transition-all duration-300 shrink-0 group-hover:scale-105",
                    organization.coverImage && "-mt-6"
                  )}>
                    <AvatarImage src={logoUrl || undefined} alt={organization.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light text-base font-bold">
                      {organization.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-1 pt-0.5">
                    <h3 className="text-base font-bold text-gradient-light group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {organization.name}
                    </h3>
                
                {/* Type et région - badges compacts */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {organization.organizationType && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 bg-background/60 backdrop-blur-sm">
                      {organization.organizationType}
                    </Badge>
                  )}
                  {organization.seedRegion && (
                    <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 bg-background/60 backdrop-blur-sm">
                      {seedRegionLabels[organization.seedRegion] || organization.seedRegion}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {organization.description && (
              <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed flex-1">
                {organization.description}
              </p>
            )}

            {/* Tags - design compact */}
            {organization.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {organization.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs px-2 py-0.5 bg-background/40 backdrop-blur-sm border-border/50"
                  >
                    #{tag}
                  </Badge>
                ))}
                {organization.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 bg-background/40 backdrop-blur-sm border-border/50">
                    +{organization.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}

            {/* Stats - design compact en bas */}
            <div className="flex items-center justify-between pt-3 mt-auto border-t border-border/30">
              <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
                <div className="flex items-center gap-1.5">
                  <SolarIcon icon="users-group-two-rounded-bold" className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                  <span className="font-medium">{organization.membersCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <SolarIcon icon="user-bold" className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                  <span className="font-medium">{organization.followersCount}</span>
                </div>
              </div>
              {!organization.coverImage && organization.verified && (
                <Badge
                  variant="outline"
                  className="bg-green-500/20 text-green-500 border-green-500/30 backdrop-blur-sm text-xs"
                >
                  <SolarIcon icon="verified-check-bold" className="h-3 w-3 mr-1" />
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

