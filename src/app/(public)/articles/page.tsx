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

    return filtered;
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

  // Séparer le premier article (hero) des autres
  const heroArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const otherArticles = filteredArticles.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 space-y-1.5">
          <h1 className="text-2xl md:text-3xl font-bold">Articles</h1>
          <p className="text-xs text-muted-foreground">
            Explorez tous les articles publiés sur Seed
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {/* Barre de recherche */}
          <div className="relative flex-1 min-w-[200px]">
            <SolarIcon
              icon="search-bold"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70 pointer-events-none z-10"
            />
            <Input
              type="text"
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Filtres */}
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[140px] h-8 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
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
            <SelectTrigger className="w-[120px] h-8 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
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

        {/* Résultats */}
        {filteredArticles.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-muted-foreground">
              {filteredArticles.length} article{filteredArticles.length > 1 ? "s" : ""} trouvé{filteredArticles.length > 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Hero Article - Grand format */}
        {heroArticle && (
          <div className="mb-10">
            <Link href={`/articles/${heroArticle.slug}`}>
              <article className="group relative h-[400px] md:h-[500px] overflow-hidden rounded-lg cursor-pointer border border-border/60 hover:border-border/80 transition-colors">
                {/* Image de fond */}
                {heroArticle.coverImage ? (
                  <div className="absolute inset-0 h-full w-full">
                    <Image
                      src={heroArticle.coverImage}
                      alt={heroArticle.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-muted" />
                )}

                {/* Contenu */}
                <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8 text-white">
                  <div className="space-y-3">
                    {/* Catégories et Tags */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {heroArticle.categories && heroArticle.categories.length > 0 && (
                        <>
                          {heroArticle.categories.slice(0, 2).map((category) => (
                            <span key={category._id} className="text-[11px] text-white/70 inline-flex items-center gap-1">
                              {category.icon && (
                                <SolarIcon icon={category.icon} className="h-3 w-3 shrink-0" />
                              )}
                              {category.name}
                            </span>
                          ))}
                        </>
                      )}
                      {heroArticle.tags && heroArticle.tags.length > 0 && (
                        <>
                          {heroArticle.categories && heroArticle.categories.length > 0 && <span className="text-[11px] text-white/70">•</span>}
                          {heroArticle.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[11px] text-white/70">
                              #{tag}
                            </span>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Titre */}
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-white group-hover:opacity-90 transition-opacity line-clamp-3">
                      {heroArticle.title}
                    </h2>

                    {/* Résumé */}
                    {heroArticle.summary && (
                      <p className="text-sm md:text-base text-white/90 line-clamp-2">
                        {heroArticle.summary}
                      </p>
                    )}

                    {/* Footer: Auteur + Métriques */}
                    <div className="flex items-center justify-between pt-2">
                      {heroArticle.author && (
                        <Author
                          author={heroArticle.author}
                          variant="hero"
                          showDate
                          date={heroArticle.publishedAt ? new Date(heroArticle.publishedAt) : new Date(heroArticle.createdAt)}
                          textColor="white"
                          linkToProfile={false}
                        />
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-white/85">
                        {heroArticle.qualityScore !== undefined && (
                          <div className="flex items-center gap-1 bg-white/8 px-1.5 py-0.5 rounded">
                            <SolarIcon icon="star-bold" className="h-3 w-3" />
                            <span>{heroArticle.qualityScore}</span>
                          </div>
                        )}
                        {heroArticle.views !== undefined && (
                          <div className="flex items-center gap-1 bg-white/8 px-1.5 py-0.5 rounded">
                            <SolarIcon icon="eye-bold" className="h-3 w-3" />
                            <span>{heroArticle.views}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </div>
        )}

        {/* Grille d'articles variée */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 border border-border/60 rounded-lg bg-muted/20">
            <SolarIcon icon="document-text-bold" className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm font-semibold mb-1">Aucun article trouvé</p>
            <p className="text-xs text-muted-foreground">
              Essayez de modifier vos critères de recherche ou de filtres
            </p>
          </div>
        ) : otherArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherArticles.map((article, index) => {
              const publishedDate = article.publishedAt
                ? new Date(article.publishedAt)
                : new Date(article.createdAt);

              // Alterner les formats : grand pour les premiers, moyen pour les autres
              const isLargeFormat = index < 2 && otherArticles.length > 3;

              if (isLargeFormat) {
                // Format grand - 2 colonnes
                return (
                  <Link key={article._id} href={`/articles/${article.slug}`} className={index === 0 ? "md:col-span-2" : ""}>
                    <article className="group cursor-pointer h-full">
                      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg mb-3 bg-muted border border-border/60 hover:border-border/80 transition-colors">
                        {article.coverImage ? (
                          <Image
                            src={article.coverImage}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                            <SolarIcon icon="document-text-bold" className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {article.author && (
                            <Author
                              author={article.author}
                              variant="default"
                              size="sm"
                              showDate
                              date={publishedDate}
                              linkToProfile={false}
                            />
                          )}
                        </div>
                        <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        {article.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{article.summary}</p>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {article.categories && article.categories.length > 0 && (
                              <>
                                {article.categories.slice(0, 1).map((category) => (
                                  <span key={category._id} className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                                    {category.icon && (
                                      <SolarIcon icon={category.icon} className="h-3 w-3 shrink-0" />
                                    )}
                                    {category.name}
                                  </span>
                                ))}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
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
              }

              // Format moyen/compact - 1 colonne
              return (
                <Link key={article._id} href={`/articles/${article.slug}`}>
                  <article className="group cursor-pointer h-full flex flex-col">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg mb-3 bg-muted border border-border/60 hover:border-border/80 transition-colors">
                      {article.coverImage ? (
                        <Image
                          src={article.coverImage}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                          <SolarIcon icon="document-text-bold" className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {article.author && (
                          <Author
                            author={article.author}
                            variant="default"
                            size="sm"
                            showDate
                            date={publishedDate}
                            linkToProfile={false}
                          />
                        )}
                      </div>
                      <h3 className="text-base font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      {article.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{article.summary}</p>
                      )}
                      <div className="flex items-center justify-between pt-1 mt-auto">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {article.categories && article.categories.length > 0 && (
                            <>
                              {article.categories.slice(0, 1).map((category) => (
                                <span key={category._id} className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                                  {category.icon && (
                                    <SolarIcon icon={category.icon} className="h-3 w-3 shrink-0" />
                                  )}
                                  {category.name}
                                </span>
                              ))}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
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
        ) : null}

        {/* Load More */}
        {filteredArticles.length >= 20 && (
          <div className="mt-8 text-center">
            <Button variant="outline" size="sm">
              Charger plus d'articles
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
