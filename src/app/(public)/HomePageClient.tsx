"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MarketGrid } from "@/components/decisions/MarketGrid";
import { HomePageFilters } from "@/components/decisions/HomePageFilters";
import { useUser } from "@/contexts/UserContext";
import { useSearchParams } from "next/navigation";
import { useMemo, lazy, Suspense } from "react";
import dynamic from "next/dynamic";

// Lazy load les composants lourds pour réduire le bundle initial
const MarketHero = dynamic(() => import("@/components/decisions/MarketHero").then(mod => ({ default: mod.MarketHero })), {
  ssr: true, // SSR pour le SEO
  loading: () => <div className="h-32 bg-muted/30 animate-pulse rounded-lg" />,
});

const DecisionStories = dynamic(() => import("@/components/decisions/DecisionStories").then(mod => ({ default: mod.DecisionStories })), {
  ssr: false, // Pas besoin de SSR pour les stories
  loading: () => <div className="h-24 bg-muted/30 animate-pulse" />,
});

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
  // Mémoriser pour éviter les re-renders inutiles
  const categories = useQuery(api.categories.getActiveCategories, {
    appliesTo: "decisions",
  });

  // Convertir les slugs de catégories en IDs (non utilisé actuellement mais conservé pour compatibilité future)
  // const categoryIds = useMemo(() => {
  //   if (!categories || categorySlugs.length === 0) return undefined;
  //   const ids = categories
  //     .filter((cat) => categorySlugs.includes(cat.slug))
  //     .map((cat) => cat._id);
  //   return ids.length > 0 ? ids : undefined;
  // }, [categories, categorySlugs]);

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
  let decisions = searchQuery ? searchResults : filteredDecisions;
  
  // Trier les décisions : ouvertes (tracking + announced) en premier, puis fermées (resolved)
  if (decisions) {
    decisions = [...decisions].sort((a, b) => {
      const aIsOpen = a.status !== "resolved";
      const bIsOpen = b.status !== "resolved";
      
      // Si l'une est ouverte et l'autre fermée, mettre l'ouverte en premier
      if (aIsOpen && !bIsOpen) return -1;
      if (!aIsOpen && bIsOpen) return 1;
      
      // Sinon, garder l'ordre par date (déjà trié par date décroissante)
      return 0;
    });
  }

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

  // Enrichir les décisions avec isSaved - Mémorisé pour éviter les re-renders
  const enrichedDecisions = useMemo(() => {
    if (!decisions) return undefined;
    return decisions.map((decision) => ({
      ...decision,
      isSaved: favoriteIds?.has(decision._id),
    }));
  }, [decisions, favoriteIds]);

  return (
    <>
      {/* Hero section - Bandeaux promotionnels style Polymarket */}
      {/* Masquer MarketHero quand des filtres sont actifs pour laisser plus de place */}
      {!hasActiveFilters && (
        <Suspense fallback={<div className="h-32 bg-muted/30 animate-pulse rounded-lg" />}>
          <MarketHero />
        </Suspense>
      )}

      {/* Stories horizontales - Style Instagram (mobile uniquement) */}
      {/* Masquer DecisionStories quand des filtres sont actifs pour laisser plus de place */}
      {!hasActiveFilters && (
        <div className="lg:hidden border-b border-border/50">
          <Suspense fallback={<div className="h-24 bg-muted/30 animate-pulse" />}>
            <DecisionStories />
          </Suspense>
        </div>
      )}

      {/* Filtres avancés */}
      <HomePageFilters />

      {/* Grille de marchés - Desktop 3 colonnes, Mobile 1 colonne */}
      {/* Suspense boundary séparé pour streamer les données */}
      <Suspense
        fallback={
          <div className="w-full max-w-full px-4 md:px-6 lg:px-8 py-6 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full max-w-full">
              {Array.from({ length: 3 }).map((_, i) => (
                <div 
                  key={i} 
                  className="flex flex-col overflow-hidden bg-background border border-border/50 rounded-lg"
                >
                  <div className="w-full aspect-[16/9] min-h-[180px] bg-muted/30 animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-full bg-muted/30 animate-pulse" />
                    <div className="h-4 w-3/4 bg-muted/30 animate-pulse" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-16 rounded-lg bg-muted/30 animate-pulse" />
                      <div className="h-16 rounded-lg bg-muted/30 animate-pulse" />
                    </div>
                    <div className="h-4 w-1/2 bg-muted/30 animate-pulse" />
                    <div className="h-4 w-2/3 bg-muted/30 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <div className="w-full max-w-full px-4 md:px-6 lg:px-8 py-6 overflow-hidden">
          <MarketGrid
            decisions={enrichedDecisions || []}
            isLoading={decisions === undefined}
            variant="grid"
          />
        </div>
      </Suspense>
    </>
  );
}

