"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useState, useMemo } from "react";
import { Link } from "next-view-transitions";
import Image from "next/image";

const STAGE_LABELS = {
  idea: "Idée",
  prototype: "Prototype",
  beta: "Bêta",
  production: "Production",
} as const;

export default function PublicProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "featured">("recent");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [openSourceOnly, setOpenSourceOnly] = useState(false);

  // Récupérer tous les projets
  const allProjects = useQuery(api.projects.getProjects, { limit: 100 });

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

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.summary.toLowerCase().includes(query) ||
          project.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filtre par stade
    if (selectedStage) {
      filtered = filtered.filter((project) => project.stage === selectedStage);
    }

    // Filtre open source
    if (openSourceOnly) {
      filtered = filtered.filter((project) => project.openSource);
    }

    // Tri
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "popular":
        filtered.sort((a, b) => b.views - a.views);
        break;
      case "featured":
        filtered.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return b.views - a.views;
        });
        break;
    }

    return filtered;
  }, [allProjects, searchQuery, selectedStage, openSourceOnly, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gradient-light">Projets</h1>
          <p className="text-lg text-muted-foreground">
            Découvrez les projets innovants de la communauté Seed
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className="mb-8 space-y-4">
          {/* Barre de recherche */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <SolarIcon
                icon="magnifer-bold"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
              />
              <Input
                type="text"
                placeholder="Rechercher des projets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récents</SelectItem>
                <SelectItem value="popular">Plus populaires</SelectItem>
                <SelectItem value="featured">En vedette</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtres rapides */}
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant={selectedStage === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStage(null)}
            >
              Tous les stades
            </Button>
            {Object.entries(STAGE_LABELS).map(([value, label]) => (
              <Button
                key={value}
                variant={selectedStage === value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStage(selectedStage === value ? null : value)}
              >
                {label}
              </Button>
            ))}
            <Button
              variant={openSourceOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setOpenSourceOnly(!openSourceOnly)}
            >
              <SolarIcon icon="code-bold" className="h-4 w-4 mr-2" />
              Open Source
            </Button>
          </div>

          {/* Résultats */}
          {filteredProjects.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {filteredProjects.length} projet{filteredProjects.length > 1 ? "s" : ""} trouvé
              {selectedStage && ` en stade "${STAGE_LABELS[selectedStage as keyof typeof STAGE_LABELS]}"`}
            </div>
          )}
        </div>

        {/* Liste des projets */}
        {filteredProjects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card key={project._id} className="overflow-hidden border-t-2 border-transparent hover:border-primary transition-colors">
                <Link href={`/projets/${project.slug}`}>
                  {project.images && project.images.length > 0 && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={project.images[0]}
                        alt={project.title}
                        fill
                        className="object-cover"
                      />
                      {project.featured && (
                        <Badge className="absolute top-2 right-2" variant="default">
                          <SolarIcon icon="star-bold" className="h-3 w-3 mr-1" />
                          En vedette
                        </Badge>
                      )}
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-xl font-semibold line-clamp-2">{project.title}</h3>
                        <Badge variant="outline">
                          {STAGE_LABELS[project.stage]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.summary}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {project.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {project.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{project.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <SolarIcon icon="eye-bold" className="h-4 w-4" />
                            <span>{project.views || 0}</span>
                          </div>
                          {project.openSource && (
                            <div className="flex items-center gap-1">
                              <SolarIcon icon="code-bold" className="h-4 w-4" />
                              <span>Open Source</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <SolarIcon icon="folder-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Aucun projet trouvé</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || selectedStage
                  ? "Essayez de modifier vos critères de recherche"
                  : "Aucun projet n'a encore été publié"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

