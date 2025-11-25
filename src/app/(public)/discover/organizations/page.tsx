"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Link } from "next-view-transitions";
import { Separator } from "@/components/ui/separator";

const REGIONS = [
  "Nouvelle-Aquitaine",
  "Île-de-France",
  "Auvergne-Rhône-Alpes",
  "Provence-Alpes-Côte d'Azur",
  "Occitanie",
  "Hauts-de-France",
  "Grand Est",
  "Normandie",
  "Bretagne",
  "Pays de la Loire",
  "Centre-Val de Loire",
  "Bourgogne-Franche-Comté",
] as const;

const ORGANIZATION_TYPES = [
  { value: "association", label: "Association" },
  { value: "entreprise", label: "Entreprise" },
  { value: "collectif", label: "Collectif" },
  { value: "institution", label: "Institution" },
  { value: "autre", label: "Autre" },
] as const;


const SORT_OPTIONS = [
  { value: "relevance", label: "Pertinence" },
  { value: "createdAt", label: "Plus récentes" },
  { value: "membersCount", label: "Plus de membres" },
  { value: "followersCount", label: "Plus de followers" },
] as const;

export default function DiscoverOrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [seedRegion, setSeedRegion] = useState<string | undefined>(undefined);
  const [organizationType, setOrganizationType] = useState<string | undefined>(undefined);
  const [verified, setVerified] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"relevance" | "createdAt" | "membersCount" | "followersCount">("relevance");
  const [showFilters, setShowFilters] = useState(false);

  // Toujours faire une recherche, même sans filtres (pour afficher toutes les organisations)
  const organizations = useQuery(api.organizations.searchOrganizations, {
    searchQuery: searchQuery || undefined,
    seedRegion: seedRegion || undefined,
    organizationType: organizationType as any,
    verified: verified,
    sortBy: sortBy,
    limit: 50,
  });

  const hasActiveFilters = useMemo(() => {
    return !!(
      searchQuery ||
      seedRegion ||
      organizationType ||
      verified !== undefined
    );
  }, [searchQuery, seedRegion, organizationType, verified]);

  const clearFilters = () => {
    setSearchQuery("");
    setSeedRegion(undefined);
    setOrganizationType(undefined);
    setVerified(undefined);
    setSortBy("relevance");
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gradient-light">Découvrir des organisations</h1>
          <p className="text-muted-foreground mt-2">
            Explorez et rejoignez des organisations qui partagent vos valeurs
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <SolarIcon
                  icon="magnifer-bold"
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, description ou tags..."
                  className="pl-10 h-11"
                />
              </div>

              {/* Quick Filters Row */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sort" className="text-sm font-medium whitespace-nowrap">
                    Trier par :
                  </Label>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger id="sort" className="w-[180px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator orientation="vertical" className="h-6" />

                <div className="flex items-center gap-2">
                  <Switch
                    id="verified"
                    checked={verified === true}
                    onCheckedChange={(checked) => setVerified(checked ? true : undefined)}
                  />
                  <Label htmlFor="verified" className="text-sm font-medium cursor-pointer">
                    Vérifiées uniquement
                  </Label>
                </div>

                {hasActiveFilters && (
                  <>
                    <Separator orientation="vertical" className="h-6" />
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      <SolarIcon icon="close-circle-bold" className="h-4 w-4 mr-2" />
                      Réinitialiser
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="ml-auto"
                >
                  <SolarIcon
                    icon={showFilters ? "alt-arrow-up-bold" : "alt-arrow-down-bold"}
                    className="h-4 w-4 mr-2"
                  />
                  {showFilters ? "Masquer" : "Afficher"} les filtres
                </Button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="pt-4 border-t space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Région Seed</Label>
                      <Select
                        value={seedRegion || ""}
                        onValueChange={(value) => setSeedRegion(value || undefined)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Toutes les régions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Toutes les régions</SelectItem>
                          {REGIONS.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Type d'organisation</Label>
                      <Select
                        value={organizationType || ""}
                        onValueChange={(value) => setOrganizationType(value || undefined)}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Tous les types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Tous les types</SelectItem>
                          {ORGANIZATION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {organizations === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : organizations.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SolarIcon icon="buildings-bold" className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>Aucune organisation trouvée</EmptyTitle>
              <EmptyDescription>
                {hasActiveFilters
                  ? "Essayez de modifier vos critères de recherche ou réinitialisez les filtres."
                  : "Il n'y a pas encore d'organisations publiques sur Seed."}
              </EmptyDescription>
            </EmptyHeader>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Réinitialiser les filtres
              </Button>
            )}
          </Empty>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {organizations.length} organisation{organizations.length > 1 ? "s" : ""} trouvée
                {organizations.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizations.map((org) => (
                <Link key={org._id} href={`/discover/organizations/${org._id}`}>
                  <Card className="hover:scale-[1.02] transition-transform cursor-pointer h-full flex flex-col">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 ring-2 ring-border/50 shrink-0">
                          <AvatarImage src={org.logo || undefined} alt={org.name} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light">
                            {org.name[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <CardTitle className="text-base truncate text-gradient-light">{org.name}</CardTitle>
                            {org.verified && (
                              <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30 shrink-0">
                                <SolarIcon icon="verified-check-bold" className="h-3 w-3 mr-1" />
                                Vérifiée
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {org.organizationType && (
                              <Badge variant="secondary" className="text-xs">
                                {ORGANIZATION_TYPES.find((t) => t.value === org.organizationType)?.label || org.organizationType}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <CardDescription className="line-clamp-2 mb-4 flex-1">
                        {org.description || "Aucune description"}
                      </CardDescription>
                      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <SolarIcon icon="users-group-two-rounded-bold" className="h-4 w-4" />
                            <span>{(org as any).membersCount || 0}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <SolarIcon icon="heart-bold" className="h-4 w-4" />
                            <span>{(org as any).followersCount || 0}</span>
                          </div>
                        </div>
                        {org.seedRegion && (
                          <div className="flex items-center gap-1.5">
                            <SolarIcon icon="map-point-bold" className="h-4 w-4" />
                            <span className="text-xs">{org.seedRegion}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

