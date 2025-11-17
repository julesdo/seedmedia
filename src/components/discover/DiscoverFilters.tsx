"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { SolarIcon } from "@/components/icons/SolarIcon";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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

interface DiscoverFiltersProps {
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

export function DiscoverFilters({
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
}: DiscoverFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-background/50 transition-colors py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gradient-light flex items-center gap-2">
                <SolarIcon icon="filter-bold" className="h-4 w-4" />
                Filtres
                {hasActiveFilters && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                )}
              </CardTitle>
              <SolarIcon
                icon={isOpen ? "alt-arrow-up-bold" : "alt-arrow-down-bold"}
                className="h-4 w-4 text-muted-foreground transition-transform"
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0 pb-4">
            {/* Barre de recherche */}
            <div className="relative">
              <SolarIcon
                icon="magnifer-bold"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50"
              />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {/* Filtres */}
            <div className="space-y-2.5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground/80">Région Seed</label>
                <Select value={seedRegion || "all"} onValueChange={(value) => setSeedRegion(value === "all" ? undefined : value)}>
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="Toutes les régions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {SEED_REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground/80">Type d'organisation</label>
                <Select
                  value={organizationType || "all"}
                  onValueChange={(value) => setOrganizationType(value === "all" ? undefined : value)}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {ORGANIZATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground/80">Secteur</label>
                <Select value={sector || "all"} onValueChange={(value) => setSector(value === "all" ? undefined : value)}>
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="Tous les secteurs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les secteurs</SelectItem>
                    {SECTORS.map((sec) => (
                      <SelectItem key={sec.value} value={sec.value}>
                        {sec.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground/80">Trier par</label>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as any)}
                >
                  <SelectTrigger size="sm" className="w-full">
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

              <div className="space-y-1.5">
                <Button
                  variant={verified === true ? "accent" : "glass"}
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={() => setVerified(verified === true ? undefined : true)}
                  icon="verified-check-bold"
                >
                  {verified ? "Vérifiées uniquement" : "Toutes"}
                </Button>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="glass"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={onClearFilters}
                  icon="close-circle-bold"
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

