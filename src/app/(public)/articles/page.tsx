"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useState, useMemo } from "react";
import { Id } from "../../../../convex/_generated/dataModel";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Author } from "@/components/articles/Author";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicArticlesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "quality" | "popular" | "verified">("recent");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Récupérer tous les articles publiés
  const allArticles = useQuery(api.content.getLatestArticles, { limit: 100 });

  // Extraire tous les tags uniques
  const allTags = useMemo(() => {
    if (!allArticles) return [];
    const tagsSet = new Set<string>();
    allArticles.forEach((article) => {
      article.tags?.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [allArticles]);

  // Filtrer et trier les articles
  const filteredArticles = useMemo(() => {
    if (!allArticles) return [];

    let filtered = [...allArticles];

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.summary.toLowerCase().includes(query) ||
          article.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filtre par tag
    if (selectedTag) {
      filtered = filtered.filter((article) => article.tags.includes(selectedTag));
    }

    // Tri
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt));
        break;
      case "quality":
        filtered.sort((a, b) => b.qualityScore - a.qualityScore);
        break;
      case "popular":
        filtered.sort((a, b) => b.views - a.views);
        break;
      case "verified":
        filtered.sort((a, b) => {
          const aVerified = a.verifiedClaimsCount / Math.max(a.totalClaimsCount, 1);
          const bVerified = b.verifiedClaimsCount / Math.max(b.totalClaimsCount, 1);
          return bVerified - aVerified;
        });
        break;
    }

    return filtered.map((article) => ({
      ...article,
      author: {
        _id: article.authorId as Id<"users">,
        name: "Auteur",
      },
    }));
  }, [allArticles, searchQuery, selectedTag, sortBy]);

  if (allArticles === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <div className="space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <h1 className="text-4xl md:text-5xl font-bold">Articles</h1>
          <p className="text-lg text-muted-foreground">
            Explorez tous les articles publiés sur Seed
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className="mb-8 space-y-4">
          {/* Barre de recherche */}
          <div className="relative">
            <SolarIcon
              icon="magnifer-bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-4">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récents</SelectItem>
                <SelectItem value="quality">Meilleure qualité</SelectItem>
                <SelectItem value="popular">Plus populaires</SelectItem>
                <SelectItem value="verified">Mieux vérifiés</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedTag || "all"}
              onValueChange={(value) => setSelectedTag(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Résultats */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredArticles.length} article{filteredArticles.length > 1 ? "s" : ""} trouvé
            {filteredArticles.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Grille d'articles - 2 colonnes */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <SolarIcon icon="document-text-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Aucun article trouvé</p>
            <p className="text-sm text-muted-foreground">
              Essayez de modifier vos critères de recherche ou de filtres
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredArticles.map((article) => {
              const publishedDate = article.publishedAt
                ? new Date(article.publishedAt)
                : new Date(article.createdAt);

              return (
                <Link key={article._id} href={`/articles/${article.slug}`}>
                  <article className="group cursor-pointer">
                    {/* Image */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg mb-4 bg-muted">
                      {article.coverImage ? (
                        <Image
                          src={article.coverImage}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                          <SolarIcon icon="document-text-bold" className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="space-y-3">
                      {/* Métadonnées */}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {article.author && (
                          <Author
                            author={article.author}
                            variant="default"
                            size="sm"
                            showDate
                            date={publishedDate}
                          />
                        )}
                      </div>

                      {/* Titre */}
                      <h2 className="text-2xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h2>

                      {/* Résumé */}
                      {article.summary && (
                        <p className="text-sm text-muted-foreground line-clamp-3">{article.summary}</p>
                      )}

                      {/* Catégories, Tags et métriques */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          {article.categories && article.categories.length > 0 && (
                            <>
                              {article.categories.slice(0, 2).map((category) => (
                                <span key={category._id} className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                                  {category.icon && (
                                    <SolarIcon icon={category.icon} className="h-3 w-3 shrink-0" />
                                  )}
                                  {category.name}
                                </span>
                              ))}
                            </>
                          )}
                          {article.tags && article.tags.length > 0 && (
                            <>
                              {article.categories && article.categories.length > 0 && <span className="text-xs text-muted-foreground">•</span>}
                              {article.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-xs text-muted-foreground">
                                  #{tag}
                                </span>
                              ))}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <SolarIcon icon="star-bold" className="h-3 w-3" />
                            <span>{article.qualityScore}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <SolarIcon icon="eye-bold" className="h-3 w-3" />
                            <span>{article.views}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {filteredArticles.length >= 20 && (
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg">
              Charger plus d'articles
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
