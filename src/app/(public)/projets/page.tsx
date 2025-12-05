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
import { ProjectCard } from "@/components/projects/ProjectCard";

function PublicProjectsPageContent() {
  // Utiliser nuqs pour gérer les search params
  const [sortBy, setSortBy] = useQueryState<"recent" | "popular" | "featured">("sort", {
    defaultValue: "recent",
    parse: (value) => {
      if (["recent", "popular", "featured"].includes(value)) {
        return value as "recent" | "popular" | "featured";
      }
      return "recent";
    },
  });
  
  const [selectedStage, setSelectedStage] = useQueryState<"idea" | "prototype" | "beta" | "production">("stage", {
    defaultValue: null,
    parse: (value) => {
      if (["idea", "prototype", "beta", "production"].includes(value)) {
        return value as "idea" | "prototype" | "beta" | "production";
      }
      return null;
    },
  });
  
  const [openSourceOnly, setOpenSourceOnly] = useQueryState("openSource", {
    defaultValue: false,
    parse: (value) => value === "true",
    serialize: (value) => value ? "true" : null,
  });
  
  const [selectedCategory, setSelectedCategory] = useQueryState("category", {
    defaultValue: null,
  });

  // Récupérer tous les projets
  const allProjects = useQuery(api.projects.getProjects, { limit: 100 });
  
  // Récupérer les catégories actives pour projets
  const categories = useQuery(api.categories.getActiveCategories, { appliesTo: "projects" });

  // Extraire tous les tags uniques
  const allTags = useMemo(() => {
    if (!allProjects) return [];
    const tagsSet = new Set<string>();
    allProjects.forEach((project) => {
      project.tags?.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [allProjects]);

  // Filtrer et trier les projets
  const filteredProjects = useMemo(() => {
    if (!allProjects) return [];

    let filtered = [...allProjects];

    // Filtre par stade
    if (selectedStage) {
      filtered = filtered.filter((project) => project.stage === selectedStage);
    }

    // Filtre open source
    if (openSourceOnly) {
      filtered = filtered.filter((project) => project.openSource);
    }

    // Filtre par catégorie
    if (selectedCategory) {
      filtered = filtered.filter((project) =>
        project.categoryIds?.some((catId) => {
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
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "featured":
        filtered.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b.views || 0) - (a.views || 0);
        });
        break;
    }

    return filtered;
  }, [allProjects, selectedStage, openSourceOnly, selectedCategory, categories, sortBy]);

  if (allProjects === undefined) {
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
                Projets
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Découvrez les projets innovants de la communauté Seed
              </p>
            </div>
            {filteredProjects.length > 0 && (
              <Badge variant="secondary" className="h-7 px-3 text-xs font-semibold">
                {filteredProjects.length} résultat{filteredProjects.length > 1 ? "s" : ""}
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
                <SelectItem value="recent">Plus récents</SelectItem>
                <SelectItem value="popular">Plus populaires</SelectItem>
                <SelectItem value="featured">En vedette</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStage || "all"} onValueChange={(value) => setSelectedStage(value === "all" ? null : (value as any))}>
              <SelectTrigger className="w-[140px] h-9 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
                <SelectValue placeholder="Stade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les stades</SelectItem>
                <SelectItem value="idea">Idée</SelectItem>
                <SelectItem value="prototype">Prototype</SelectItem>
                <SelectItem value="beta">Bêta</SelectItem>
                <SelectItem value="production">Production</SelectItem>
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

            <Button
              variant={openSourceOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setOpenSourceOnly(!openSourceOnly)}
              className="h-9 text-xs"
            >
              <SolarIcon icon="code-bold" className="h-3.5 w-3.5 mr-1.5" />
              Open Source
            </Button>

            {(selectedStage || openSourceOnly || selectedCategory) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedStage(null);
                  setOpenSourceOnly(false);
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

        {/* Grille de projets */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16 border border-border/60 rounded-xl bg-muted/20">
            <SolarIcon icon="rocket-2-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-base font-semibold mb-2">Aucun projet trouvé</p>
            <p className="text-sm text-muted-foreground mb-4">
              Essayez de modifier vos critères de filtres
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStage(null);
                setOpenSourceOnly(false);
                setSelectedCategory(null);
                setSortBy(null);
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicProjectsPage() {
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
      <PublicProjectsPageContent />
    </Suspense>
  );
}

