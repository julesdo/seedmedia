"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useMemo, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryState } from "nuqs";
import { ActionCard } from "@/components/actions/ActionCard";

function PublicActionsPageContent() {
  // Utiliser nuqs pour gérer les search params
  const [sortBy, setSortBy] = useQueryState<"recent" | "popular" | "deadline">("sort", {
    defaultValue: "recent",
    parse: (value) => {
      if (["recent", "popular", "deadline"].includes(value)) {
        return value as "recent" | "popular" | "deadline";
      }
      return "recent";
    },
  });
  
  const [selectedType, setSelectedType] = useQueryState<"petition" | "contribution" | "event">("type", {
    defaultValue: null,
    parse: (value) => {
      if (["petition", "contribution", "event"].includes(value)) {
        return value as "petition" | "contribution" | "event";
      }
      return null;
    },
  });
  
  const [selectedStatus, setSelectedStatus] = useQueryState<"active" | "completed" | "cancelled">("status", {
    defaultValue: null,
    parse: (value) => {
      if (["active", "completed", "cancelled"].includes(value)) {
        return value as "active" | "completed" | "cancelled";
      }
      return null;
    },
  });
  
  const [selectedCategory, setSelectedCategory] = useQueryState("category", {
    defaultValue: null,
  });

  // Récupérer toutes les actions
  const allActions = useQuery(api.actions.getActions, { limit: 100 });
  
  // Récupérer les catégories actives pour actions
  const categories = useQuery(api.categories.getActiveCategories, { appliesTo: "actions" });

  // Extraire tous les tags uniques
  const allTags = useMemo(() => {
    if (!allActions) return [];
    const tagsSet = new Set<string>();
    allActions.forEach((action) => {
      action.tags?.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [allActions]);

  // Filtrer et trier les actions
  const filteredActions = useMemo(() => {
    if (!allActions) return [];

    let filtered = [...allActions];

    // Filtre par type
    if (selectedType) {
      filtered = filtered.filter((action) => action.type === selectedType);
    }

    // Filtre par statut
    if (selectedStatus) {
      filtered = filtered.filter((action) => action.status === selectedStatus);
    }

    // Filtre par catégorie
    if (selectedCategory) {
      filtered = filtered.filter((action) =>
        action.categoryIds?.some((catId) => {
          const category = categories?.find((cat) => cat._id === catId || cat.slug === selectedCategory);
          return category && (category.slug === selectedCategory || category._id === selectedCategory);
        })
      );
    }

    // Tri
    const currentSort = sortBy || "recent";
    switch (currentSort) {
      case "recent":
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "popular":
        filtered.sort((a, b) => b.participants - a.participants);
        break;
      case "deadline":
        filtered.sort((a, b) => {
          if (!a.deadline && !b.deadline) return b.createdAt - a.createdAt;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline - b.deadline;
        });
        break;
    }

    return filtered;
  }, [allActions, selectedType, selectedStatus, selectedCategory, categories, sortBy]);

  if (allActions === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <div className="space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 max-w-7xl">
        {/* Header */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Actions
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Rejoignez les actions de la communauté Seed : pétitions, contributions et événements
              </p>
            </div>
            {filteredActions.length > 0 && (
              <Badge variant="secondary" className="h-7 px-3 text-xs font-semibold">
                {filteredActions.length} résultat{filteredActions.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={sortBy || "recent"} onValueChange={(value: any) => setSortBy(value === "recent" ? null : value)}>
              <SelectTrigger className="w-[160px] h-9 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récentes</SelectItem>
                <SelectItem value="popular">Plus populaires</SelectItem>
                <SelectItem value="deadline">Date limite</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType || "all"} onValueChange={(value) => setSelectedType(value === "all" ? null : (value as any))}>
              <SelectTrigger className="w-[140px] h-9 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="petition">Pétitions</SelectItem>
                <SelectItem value="contribution">Contributions</SelectItem>
                <SelectItem value="event">Événements</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus || "all"} onValueChange={(value) => setSelectedStatus(value === "all" ? null : (value as any))}>
              <SelectTrigger className="w-[140px] h-9 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}>
              <SelectTrigger className="w-[160px] h-9 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
                <SelectValue placeholder="Catégorie">
                  {selectedCategory && categories?.find((cat) => cat.slug === selectedCategory || cat._id === selectedCategory)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem
                    key={category._id || category.slug}
                    value={category.slug || category._id || ""}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(selectedType || selectedStatus || selectedCategory) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedType(null);
                  setSelectedStatus(null);
                  setSelectedCategory(null);
                  setSortBy(null);
                }}
                className="h-9 text-xs"
              >
                <SolarIcon icon="refresh-bold" className="h-3.5 w-3.5 mr-1.5" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        {/* Résultats */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredActions.length} action{filteredActions.length > 1 ? "s" : ""} trouvée{filteredActions.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Grille d'actions */}
        {filteredActions.length === 0 ? (
          <div className="text-center py-16 border border-border/60 rounded-xl bg-muted/20">
            <SolarIcon icon="hand-stars-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-base font-semibold mb-2">Aucune action trouvée</p>
            <p className="text-sm text-muted-foreground mb-4">
              Essayez de modifier vos critères de filtres
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedType(null);
                setSelectedStatus(null);
                setSelectedCategory(null);
                setSortBy(null);
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActions.map((action) => (
              <ActionCard key={action._id} action={action} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicActionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <div className="space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <PublicActionsPageContent />
    </Suspense>
  );
}

