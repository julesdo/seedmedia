"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Composant de filtres avancés pour la page d'accueil
 * Inclut : recherche, catégories, statuts, sentiments
 */
export function HomePageFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Récupérer les catégories pour les filtres
  const categories = useQuery(api.categories.getActiveCategories, {
    appliesTo: "decisions",
  });

  // États des filtres depuis les query params
  // Gérer à la fois "category" (singulier, depuis la top bar) et "categories" (pluriel, depuis les filtres)
  const selectedCategories = useMemo(() => {
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

  const selectedStatus = useMemo(() => {
    return searchParams?.get("status") || undefined;
  }, [searchParams]);

  const selectedSentiment = useMemo(() => {
    return searchParams?.get("sentiment") || undefined;
  }, [searchParams]);

  const statuses = [
    { value: "announced", label: "Annoncée", icon: "bell-bold" },
    { value: "tracking", label: "En suivi", icon: "eye-bold" },
    { value: "resolved", label: "Résolue", icon: "check-circle-bold" },
  ];

  const sentiments = [
    { value: "positive", label: "Positif", icon: "smile-square-bold", color: "text-green-500" },
    { value: "negative", label: "Négatif", icon: "sad-circle-bold", color: "text-red-500" },
    { value: "neutral", label: "Neutre", icon: "minus-circle-bold", color: "text-gray-500" },
  ];

  // Mettre à jour l'URL avec les filtres
  const updateFilters = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`/?${params.toString()}`, { scroll: false });
  };

  // Gérer la recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ q: searchQuery.trim() || undefined });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Toggle catégorie
  const toggleCategory = (categorySlug: string) => {
    const newCategories = selectedCategories.includes(categorySlug)
      ? selectedCategories.filter((c) => c !== categorySlug)
      : [...selectedCategories, categorySlug];
    
    // Si une seule catégorie, utiliser "category" (singulier), sinon "categories" (pluriel)
    if (newCategories.length === 1) {
      updateFilters({
        category: newCategories[0],
        categories: undefined, // Supprimer le paramètre pluriel si présent
      });
    } else if (newCategories.length > 1) {
      updateFilters({
        category: undefined, // Supprimer le paramètre singulier si présent
        categories: newCategories.join(","),
      });
    } else {
      updateFilters({
        category: undefined,
        categories: undefined,
      });
    }
  };

  // Toggle statut
  const toggleStatus = (status: string) => {
    const newStatus = selectedStatus === status ? undefined : status;
    updateFilters({ status: newStatus });
  };

  // Toggle sentiment
  const toggleSentiment = (sentiment: string) => {
    const newSentiment = selectedSentiment === sentiment ? undefined : sentiment;
    updateFilters({ sentiment: newSentiment });
  };

  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setSearchQuery("");
    router.push("/", { scroll: false });
  };

  // Compter les filtres actifs
  const activeFiltersCount =
    selectedCategories.length +
    (selectedStatus ? 1 : 0) +
    (selectedSentiment ? 1 : 0);

  return (
    <div 
      className="sticky z-20 bg-background/95 backdrop-blur-xl border-b border-border/50 lg:top-[calc(var(--header-height,56px)+var(--breaking-news-height,0px))] top-[calc(var(--header-height,56px)+var(--breaking-news-height,0px)+var(--mobile-categories-height,48px))]"
      style={{ minHeight: '120px' }} // Hauteur minimale fixe pour éviter le layout shift
    >
      <div className="w-full px-4 md:px-6 lg:px-8 py-4">
        {/* Barre de recherche principale */}
        <div className="relative mb-4">
          <SolarIcon
            icon="magnifer-bold"
            className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none"
          />
          <Input
            type="text"
            placeholder="Rechercher une décision..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={cn(
              "pl-12 pr-12 h-11 text-base",
              isSearchFocused && "ring-2 ring-primary"
            )}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => {
                setSearchQuery("");
                updateFilters({ q: undefined });
              }}
            >
              <SolarIcon icon="close-circle-bold" className="size-4" />
            </Button>
          )}
        </div>

        {/* Filtres rapides */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Catégories */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={selectedCategories.length > 0 ? "default" : "outline"}
                size="sm"
                className="h-9 gap-2"
              >
                <SolarIcon icon="widget-4-bold" className="size-4" />
                <span>Catégories</span>
                {selectedCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                    {selectedCategories.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <ScrollArea className="h-[300px]">
                <div className="p-3 space-y-1">
                  {categories && categories.length > 0 ? (
                    categories.map((category) => {
                      const isSelected = selectedCategories.includes(category.slug);
                      return (
                        <button
                          key={category._id}
                          onClick={() => toggleCategory(category.slug)}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                        >
                          {category.icon && (
                            <SolarIcon
                              icon={category.icon}
                              className="size-4"
                              style={category.color ? { color: category.color } : undefined}
                            />
                          )}
                          <span className="flex-1">{category.name}</span>
                          {isSelected && (
                            <SolarIcon icon="check-circle-bold" className="size-4" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Aucune catégorie disponible
                    </div>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Statut */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={selectedStatus ? "default" : "outline"}
                size="sm"
                className="h-9 gap-2"
              >
                <SolarIcon icon="filter-bold" className="size-4" />
                <span>Statut</span>
                {selectedStatus && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                    1
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="start">
              <div className="p-3 space-y-1">
                {statuses.map((status) => {
                  const isSelected = selectedStatus === status.value;
                  return (
                    <button
                      key={status.value}
                      onClick={() => toggleStatus(status.value)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <SolarIcon icon={status.icon} className="size-4" />
                      <span className="flex-1">{status.label}</span>
                      {isSelected && (
                        <SolarIcon icon="check-circle-bold" className="size-4" />
                      )}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Sentiment */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={selectedSentiment ? "default" : "outline"}
                size="sm"
                className="h-9 gap-2"
              >
                <SolarIcon icon="heart-bold" className="size-4" />
                <span>Sentiment</span>
                {selectedSentiment && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                    1
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="start">
              <div className="p-3 space-y-1">
                {sentiments.map((sentiment) => {
                  const isSelected = selectedSentiment === sentiment.value;
                  return (
                    <button
                      key={sentiment.value}
                      onClick={() => toggleSentiment(sentiment.value)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <SolarIcon
                        icon={sentiment.icon}
                        className={cn("size-4", !isSelected && sentiment.color)}
                      />
                      <span className="flex-1">{sentiment.label}</span>
                      {isSelected && (
                        <SolarIcon icon="check-circle-bold" className="size-4" />
                      )}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Réinitialiser */}
          {activeFiltersCount > 0 && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 gap-2 text-muted-foreground hover:text-foreground"
              >
                <SolarIcon icon="refresh-bold" className="size-4" />
                <span>Réinitialiser</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

