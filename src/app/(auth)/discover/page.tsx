"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { OrganizationSearchCard } from "@/components/organization/OrganizationSearchCard";
import { FeaturedOrganizationCard } from "@/components/discover/FeaturedOrganizationCard";
import { DiscoverSidebar } from "@/components/discover/DiscoverSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Card, CardContent } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";

const SEED_REGIONS = [
  { value: "ARA", label: "Auvergne-Rhône-Alpes" },
  { value: "BFC", label: "Bourgogne-Franche-Comté" },
  { value: "BR", label: "Bretagne" },
  { value: "CVL", label: "Centre-Val de Loire" },
  { value: "COR", label: "Corse" },
  { value: "GE", label: "Grand Est" },
  { value: "HDF", label: "Hauts-de-France" },
  { value: "IDF", label: "Île-de-France" },
  { value: "NA", label: "Nouvelle-Aquitaine" },
  { value: "OCC", label: "Occitanie" },
  { value: "PDL", label: "Pays de la Loire" },
  { value: "PAC", label: "Provence-Alpes-Côte d'Azur" },
  { value: "DOM", label: "Outre-Mer" },
];

const ORGANIZATION_TYPES = [
  { value: "association", label: "Association" },
  { value: "entreprise", label: "Entreprise" },
  { value: "collectif", label: "Collectif" },
  { value: "institution", label: "Institution" },
  { value: "autre", label: "Autre" },
];

const SECTORS = [
  { value: "tech", label: "Technologie" },
  { value: "environnement", label: "Environnement" },
  { value: "social", label: "Social" },
  { value: "education", label: "Éducation" },
  { value: "culture", label: "Culture" },
  { value: "sante", label: "Santé" },
  { value: "autre", label: "Autre" },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Pertinence" },
  { value: "createdAt", label: "Plus récentes" },
  { value: "membersCount", label: "Plus de membres" },
  { value: "followersCount", label: "Plus de followers" },
];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [seedRegion, setSeedRegion] = useState<string | undefined>(undefined);
  const [organizationType, setOrganizationType] = useState<string | undefined>(undefined);
  const [sector, setSector] = useState<string | undefined>(undefined);
  const [verified, setVerified] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"relevance" | "createdAt" | "membersCount" | "followersCount">("relevance");

  // Construire les arguments de recherche
  const searchArgs = useMemo(() => {
    const args: any = {
      sortBy,
      limit: 50,
    };

    if (searchQuery.trim()) {
      args.searchQuery = searchQuery.trim();
    }
    if (seedRegion) {
      args.seedRegion = seedRegion;
    }
    if (organizationType) {
      args.organizationType = organizationType as any;
    }
    if (sector) {
      args.sector = sector as any;
    }
    if (verified !== undefined) {
      args.verified = verified;
    }

    return args;
  }, [searchQuery, seedRegion, organizationType, sector, verified, sortBy]);

  const organizations = useQuery(api.organizations.searchOrganizations, searchArgs);
  const recentOrganizations = useQuery(api.organizations.getRecentOrganizations, { limit: 5 });

  const hasActiveFilters = seedRegion || organizationType || sector || verified !== undefined;

  const clearFilters = () => {
    setSeedRegion(undefined);
    setOrganizationType(undefined);
    setSector(undefined);
    setVerified(undefined);
    setSearchQuery("");
    setSortBy("relevance");
  };

  // Organisation en vedette (la première si pas de filtres actifs)
  const showFeatured = !hasActiveFilters && !searchQuery;
  const featuredOrg = showFeatured && organizations && organizations.length > 0 ? organizations[0] : null;
  // Autres organisations (sans la featured si elle existe)
  const otherOrgs = featuredOrg && organizations && organizations.length > 1 
    ? organizations.slice(1) 
    : organizations || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gradient-light mb-1.5">Découvrir</h1>
        <p className="text-sm text-muted-foreground/80">
          Explorez les organisations, projets et actions qui façonnent la Nouvelle-Aquitaine
        </p>
      </div>

      {/* Layout principal avec sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Colonne principale - Fil d'actualité */}
        <div className="lg:col-span-8">
          {/* Organisation en vedette (grand format) */}
          {organizations === undefined ? (
            <Card>
              <CardContent className="p-8">
                <Skeleton className="h-96 w-full rounded-lg mb-6" />
                <div className="space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ) : featuredOrg ? (
            <FeaturedOrganizationCard organization={featuredOrg} />
          ) : null}

          {/* Section "À la Une" - Grille d'organisations */}
          <div className="mt-8">
          {organizations === undefined ? (
            <div className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : otherOrgs.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SolarIcon icon="folder-search-bold" className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Aucune organisation trouvée</EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters || searchQuery
                    ? "Essayez de modifier vos critères de recherche ou vos filtres."
                    : "Il n'y a pas encore d'organisations sur la plateforme."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gradient-light">À la Une</h2>
                <p className="text-xs text-muted-foreground">
                  {otherOrgs.length} organisation{otherOrgs.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherOrgs.map((org) => (
                  <OrganizationSearchCard key={org._id} organization={org} />
                ))}
              </div>
            </div>
          )}
          </div>

          {/* TODO: Ajouter ici les projets, articles, actions quand ils seront disponibles */}
          {/* Ils s'afficheront dans le même fil d'actualité, mélangés avec les organisations */}
        </div>

        {/* Sidebar avec filtres */}
        <div className="lg:col-span-4">
          <DiscoverSidebar
            recentOrganizations={recentOrganizations || []}
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
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      </div>
    </div>
  );
}
