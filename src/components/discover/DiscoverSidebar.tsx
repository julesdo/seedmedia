"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Id } from "../../../convex/_generated/dataModel";
import { DiscoverFilters } from "./DiscoverFilters";

interface RecentOrganization {
  _id: Id<"organizations">;
  name: string;
  logo?: string | null;
  seedRegion?: string | null;
  createdAt: number;
}

interface DiscoverSidebarProps {
  recentOrganizations?: RecentOrganization[];
  // Props pour les filtres
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  seedRegion: string | undefined;
  setSeedRegion: (value: string | undefined) => void;
  organizationType: string | undefined;
  setOrganizationType: (value: string | undefined) => void;
  sector: string | undefined;
  setSector: (value: string | undefined) => void;
  verified: boolean | undefined;
  setVerified: (value: boolean | undefined) => void;
  sortBy: "relevance" | "createdAt" | "membersCount" | "followersCount";
  setSortBy: (value: "relevance" | "createdAt" | "membersCount" | "followersCount") => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
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

export function DiscoverSidebar({
  recentOrganizations = [],
  searchQuery,
  setSearchQuery,
  seedRegion,
  setSeedRegion,
  organizationType,
  setOrganizationType,
  sector,
  setSector,
  verified,
  setVerified,
  sortBy,
  setSortBy,
  onClearFilters,
  hasActiveFilters,
}: DiscoverSidebarProps) {
  return (
    <div className="space-y-4">
      {/* Filtres */}
      <DiscoverFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        seedRegion={seedRegion}
        setSeedRegion={setSeedRegion}
        organizationType={organizationType}
        setOrganizationType={setOrganizationType}
        sector={sector}
        setSector={setSector}
        verified={verified}
        setVerified={setVerified}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onClearFilters={onClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Actualités récentes */}
      {recentOrganizations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gradient-light">
              Organisations et utilisateurs récents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {recentOrganizations.slice(0, 5).map((org) => (
              <Link
                key={org._id}
                href={`/discover/organizations/${org._id}`}
                className="block group"
              >
                <div className="flex items-start gap-2.5 p-1.5 rounded-lg bg-transparent hover:bg-background/40 transition-all duration-200 cursor-pointer">
                  <Avatar className="h-8 w-8 ring-1 ring-border/50 shrink-0 group-hover:ring-primary/30 transition-all duration-200">
                    <AvatarImage src={org.logo || undefined} alt={org.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light text-xs">
                      {org.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-gradient-light group-hover:text-primary transition-colors duration-200 line-clamp-2">
                      {org.name}
                    </h4>
                    {org.seedRegion && (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {seedRegionLabels[org.seedRegion] || org.seedRegion}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {new Date(org.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Newsletter / Abonnement */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-background group hover:border-primary/30 transition-all duration-300">
        {/* Effet de brillance au survol */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:via-primary/5 group-hover:to-primary/0 transition-all duration-500 pointer-events-none" />
        
        <CardContent className="p-4 relative">
          <div className="space-y-3">
            {/* Header avec icône */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 ring-2 ring-primary/20 group-hover:ring-primary/30 transition-all duration-300 group-hover:scale-105">
                <SolarIcon icon="bell-bold" className="h-5 w-5 icon-gradient-active" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-base font-bold text-gradient-light mb-1">
                  Restez informé
                </h3>
                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                  Recevez les dernières actualités et découvertes directement dans votre boîte mail
                </p>
              </div>
            </div>

            {/* Formulaire d'abonnement */}
            <div className="space-y-2 pt-1">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  className="bg-background/90 backdrop-blur-sm border-border/50 focus:border-primary/50 h-9 pr-9 text-sm"
                />
                <SolarIcon 
                  icon="mailbox-bold" 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" 
                />
              </div>
              <Button 
                variant="accent" 
                size="sm"
                className="w-full h-9 font-medium shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300" 
                icon="arrow-right-bold"
              >
                S'abonner
              </Button>
            </div>

            {/* Badge de confiance */}
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/30">
              <SolarIcon icon="shield-check-bold" className="h-3.5 w-3.5 text-primary/70 shrink-0" />
              <p className="text-xs text-muted-foreground/70">
                Sans spam, désinscription à tout moment
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* À propos */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2.5">
            <h3 className="text-base font-semibold text-gradient-light">À propos de Seed</h3>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Seed est la plateforme qui connecte les acteurs de l'impact en Nouvelle-Aquitaine. 
              Découvrez les organisations, projets et actions qui façonnent notre région.
            </p>
            <Link href="/about">
              <Button variant="glass" size="sm" className="w-full mt-3 h-8 text-xs">
                En savoir plus
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

