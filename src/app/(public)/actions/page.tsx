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
import { Skeleton } from "@/components/ui/skeleton";

const ACTION_TYPE_LABELS = {
  petition: "Pétition",
  contribution: "Contribution",
  event: "Événement",
} as const;

const STATUS_LABELS = {
  active: "Active",
  completed: "Terminée",
  cancelled: "Annulée",
} as const;

export default function PublicActionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "deadline">("recent");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Récupérer toutes les actions
  const allActions = useQuery(api.actions.getActions, { limit: 100 });

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

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (action) =>
          action.title.toLowerCase().includes(query) ||
          action.summary.toLowerCase().includes(query) ||
          action.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filtre par type
    if (selectedType) {
      filtered = filtered.filter((action) => action.type === selectedType);
    }

    // Filtre par statut
    if (selectedStatus) {
      filtered = filtered.filter((action) => action.status === selectedStatus);
    }

    // Tri
    switch (sortBy) {
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
  }, [allActions, searchQuery, selectedType, selectedStatus, sortBy]);

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
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-12 space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold">Actions</h1>
          <p className="text-lg text-muted-foreground">
            Rejoignez les actions de la communauté Seed : pétitions, contributions et événements
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className="mb-8 space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <SolarIcon icon="magnifer-bold" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-4">
            <Select value={selectedType || "all"} onValueChange={(value) => setSelectedType(value === "all" ? null : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="petition">Pétitions</SelectItem>
                <SelectItem value="contribution">Contributions</SelectItem>
                <SelectItem value="event">Événements</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus || "all"} onValueChange={(value) => setSelectedStatus(value === "all" ? null : value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="cancelled">Annulées</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récentes</SelectItem>
                <SelectItem value="popular">Plus populaires</SelectItem>
                <SelectItem value="deadline">Date limite</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Résultats */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredActions.length} action{filteredActions.length > 1 ? "s" : ""} trouvée{filteredActions.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Grille d'actions - 2 colonnes */}
        {filteredActions.length === 0 ? (
          <div className="text-center py-12">
            <SolarIcon icon="document-text-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Aucune action trouvée</p>
            <p className="text-sm text-muted-foreground">
              Essayez de modifier vos critères de recherche ou de filtres
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredActions.map((action) => (
              <Link key={action._id} href={`/actions/${action.slug}`}>
                <article className="group cursor-pointer">
                  {/* Image placeholder ou gradient */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg mb-4 bg-muted">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                      <SolarIcon
                        icon={
                          action.type === "petition"
                            ? "pen-new-square-bold"
                            : action.type === "contribution"
                            ? "hand-stars-bold"
                            : "calendar-mark-bold"
                        }
                        className="h-12 w-12 text-muted-foreground"
                      />
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="space-y-3">
                    {/* Type et statut */}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {ACTION_TYPE_LABELS[action.type]}
                      </Badge>
                      <Badge
                        variant={
                          action.status === "active"
                            ? "default"
                            : action.status === "completed"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {STATUS_LABELS[action.status]}
                      </Badge>
                      {action.featured && (
                        <Badge variant="outline" className="text-xs">
                          <SolarIcon icon="star-bold" className="h-3 w-3 mr-1" />
                          En vedette
                        </Badge>
                      )}
                    </div>

                    {/* Titre */}
                    <h2 className="text-2xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {action.title}
                    </h2>

                    {/* Résumé */}
                    <p className="text-sm text-muted-foreground line-clamp-3">{action.summary}</p>

                    {/* Tags et métadonnées */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex flex-wrap gap-2">
                        {action.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="users-group-two-rounded-bold" className="h-3 w-3" />
                          <span>{action.participants}</span>
                        </div>
                        {action.deadline && (
                          <div className="flex items-center gap-1">
                            <SolarIcon icon="calendar-bold" className="h-3 w-3" />
                            <span>{new Date(action.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

