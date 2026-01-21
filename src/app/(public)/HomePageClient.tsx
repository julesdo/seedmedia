"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MarketGrid } from "@/components/decisions/MarketGrid";
import { MarketHero } from "@/components/decisions/MarketHero";
import { DecisionStories } from "@/components/decisions/DecisionStories";
import { HomePageFilters } from "@/components/decisions/HomePageFilters";
import { useUser } from "@/contexts/UserContext";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

/**
 * Client component pour la home page avec MarketGrid
 * Utilise la grille sur desktop, liste sur mobile
 */
export function HomePageClient() {
  const { isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const searchParams = useSearchParams();
  
  // Récupérer les filtres depuis les query params
  // Convertir null en undefined pour les valeurs optionnelles
  const searchQuery = searchParams?.get("q") || undefined;
  const categorySlugs = useMemo(() => {
    // Gérer à la fois "category" (singulier, depuis la top bar) et "categories" (pluriel, depuis les filtres)
    const singleCategory = searchParams?.get("category");
    const multipleCategories = searchParams?.get("categories");
    
    if (singleCategory) {
      // Si on a un paramètre "category" (singulier), l'utiliser
      return [singleCategory];
    } else if (multipleCategories) {
      // Sinon, utiliser "categories" (pluriel, séparés par des virgules)
      return multipleCategories.split(",");
    }
    return [];
  }, [searchParams]);
  const statusParam = searchParams?.get("status");
  const status = (statusParam === "announced" || statusParam === "tracking" || statusParam === "resolved")
    ? statusParam
    : undefined;
  const sentimentParam = searchParams?.get("sentiment");
  const sentiment = (sentimentParam === "positive" || sentimentParam === "negative" || sentimentParam === "neutral")
    ? sentimentParam
    : undefined;

  // Récupérer les catégories pour convertir les slugs en IDs
  const categories = useQuery(api.categories.getActiveCategories, {
    appliesTo: "decisions",
  });

  // Convertir les slugs de catégories en IDs
  const categoryIds = useMemo(() => {
    if (!categories || categorySlugs.length === 0) return undefined;
    const ids = categories
      .filter((cat) => categorySlugs.includes(cat.slug))
      .map((cat) => cat._id);
    return ids.length > 0 ? ids : undefined;
  }, [categories, categorySlugs]);

  // Appliquer les filtres par défaut de l'utilisateur si aucun filtre n'est actif
  const userFilters = user?.defaultFilters;
  const hasActiveFilters = searchQuery || categorySlugs.length > 0 || status || sentiment;

  // Récupérer les décisions avec recherche ou filtres
  // Si recherche textuelle, utiliser searchDecisions, sinon utiliser getDecisions avec filtres
  const searchResults = useQuery(
    api.decisions.searchDecisions,
    searchQuery
      ? {
          query: searchQuery,
          limit: 50,
          status: status,
        }
      : "skip"
  );

  const filteredDecisions = useQuery(
    api.decisions.getDecisions,
    !searchQuery
      ? {
          limit: 50,
          status: status,
          categorySlugs: categorySlugs.length > 0 ? categorySlugs : undefined,
          sentiments: sentiment ? [sentiment] : undefined,
          // Appliquer les filtres utilisateur si aucun filtre actif
          ...(!hasActiveFilters && {
            impactLevels: userFilters?.impactLevels,
            sentiments: userFilters?.sentiments,
            regions: userFilters?.regions,
            deciderTypes: userFilters?.deciderTypes,
          }),
        }
      : "skip"
  );

  // Utiliser les résultats de recherche si recherche active, sinon les décisions filtrées
  const decisions = searchQuery ? searchResults : filteredDecisions;

  // Récupérer les favoris en une seule requête
  const favoriteIdsArray = useQuery(
    api.favorites.getFavoritesForDecisions,
    isAuthenticated && decisions && decisions.length > 0
      ? {
          decisionIds: decisions.map((d) => d._id),
        }
      : "skip"
  );

  // Convertir en Map pour lookup rapide
  const favoriteIds = favoriteIdsArray ? new Set(favoriteIdsArray) : undefined;

  // Enrichir les décisions avec isSaved
  const enrichedDecisions = decisions?.map((decision) => ({
    ...decision,
    isSaved: favoriteIds?.has(decision._id),
  }));

  return (
    <>
      {/* Hero section - Bandeaux promotionnels style Polymarket */}
      <MarketHero />

      {/* Stories horizontales - Style Instagram (mobile uniquement) */}
      <div className="lg:hidden border-b border-border/50">
        <DecisionStories />
      </div>

      {/* Filtres avancés */}
      <HomePageFilters />

      {/* Grille de marchés - Desktop 3 colonnes, Mobile 1 colonne */}
      <div className="w-full max-w-full px-4 md:px-6 lg:px-8 py-6 overflow-hidden">
        <MarketGrid
          decisions={enrichedDecisions || []}
          isLoading={decisions === undefined}
          variant="grid"
        />
      </div>
    </>
  );
}

