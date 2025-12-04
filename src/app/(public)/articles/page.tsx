"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useMemo, Suspense } from "react";
import { useQueryState } from "nuqs";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { Author } from "@/components/articles/Author";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { ArticleCard } from "@/components/articles/ArticleCard";

const ARTICLE_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  scientific: { label: "Scientifique", icon: "atom-bold", color: "text-blue-500" },
  expert: { label: "Expert", icon: "user-check-rounded-bold", color: "text-purple-500" },
  opinion: { label: "Opinion", icon: "chat-round-bold", color: "text-orange-500" },
  news: { label: "Actualité", icon: "newspaper-bold", color: "text-red-500" },
  tutorial: { label: "Tutoriel", icon: "book-bookmark-bold", color: "text-green-500" },
  other: { label: "Autre", icon: "document-text-bold", color: "text-gray-500" },
};

function PublicArticlesPageContent() {
  // Utiliser nuqs pour gérer les search params
  const [sortBy, setSortBy] = useQueryState<"recent" | "quality" | "popular" | "verified">("sort", {
    defaultValue: "recent",
    parse: (value) => {
      if (["recent", "quality", "popular", "verified"].includes(value)) {
        return value as "recent" | "quality" | "popular" | "verified";
      }
      return "recent";
    },
  });
  
  const [selectedTag, setSelectedTag] = useQueryState("tag", {
    defaultValue: null,
  });
  
  const [selectedCategory, setSelectedCategory] = useQueryState("category", {
    defaultValue: null,
  });
  
  const [selectedType, setSelectedType] = useQueryState("type", {
    defaultValue: null,
  });

  // Récupérer tous les articles publiés
  const allArticles = useQuery(api.content.getLatestArticles, { limit: 200 });
  
  // Récupérer les catégories actives
  const categories = useQuery(api.categories.getActiveCategories, { appliesTo: "articles" });

  // Extraire tous les tags uniques
  const allTags = useMemo(() => {
    if (!allArticles) return [];
    const tagsSet = new Set<string>();
    allArticles.forEach((article) => {
      article.tags?.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [allArticles]);

  // Plus besoin de useEffect, nuqs gère automatiquement la synchronisation avec l'URL

  // Filtrer et trier les articles
  const filteredArticles = useMemo(() => {
    if (!allArticles) return [];

    let filtered = [...allArticles];

    // Filtre par tag
    if (selectedTag) {
      filtered = filtered.filter((article) => article.tags.includes(selectedTag));
    }

    // Filtre par catégorie
    if (selectedCategory) {
      filtered = filtered.filter((article) =>
        article.categories?.some((cat) => cat.slug === selectedCategory || cat._id === selectedCategory)
      );
    }

    // Filtre par type
    if (selectedType) {
      filtered = filtered.filter((article) => article.articleType === selectedType);
    }

    // Tri
    const currentSort = sortBy || "recent";
    switch (currentSort) {
      case "recent":
        filtered.sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt));
        break;
      case "quality":
        filtered.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
        break;
      case "popular":
        filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        break;
      case "verified":
        filtered.sort((a, b) => {
          const aVerified = (a.verifiedClaimsCount || 0) / Math.max(a.totalClaimsCount || 1, 1);
          const bVerified = (b.verifiedClaimsCount || 0) / Math.max(b.totalClaimsCount || 1, 1);
          return bVerified - aVerified;
        });
        break;
    }

    return filtered;
  }, [allArticles, selectedTag, selectedCategory, selectedType, sortBy]);

  // Déterminer si un article est "nouveau" (publié dans les 7 derniers jours)
  const isNewArticle = (article: any) => {
    const publishedDate = article.publishedAt || article.createdAt;
    const daysSincePublished = (Date.now() - publishedDate) / (1000 * 60 * 60 * 24);
    return daysSincePublished <= 7;
  };

  // Déterminer si un article est "populaire" (plus de 100 vues)
  const isPopularArticle = (article: any) => {
    return (article.views || 0) > 100;
  };

  // Déterminer si un article est "vérifié" (ratio de vérification > 80%)
  const isVerifiedArticle = (article: any) => {
    if (!article.totalClaimsCount || article.totalClaimsCount === 0) return false;
    const ratio = (article.verifiedClaimsCount || 0) / article.totalClaimsCount;
    return ratio >= 0.8;
  };

  if (allArticles === undefined) {
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

  // Séparer le premier article (hero) des autres
  const heroArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const otherArticles = filteredArticles.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 max-w-7xl">
        {/* Header amélioré */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Articles
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Explorez {allArticles.length} article{allArticles.length > 1 ? "s" : ""} vérifié{allArticles.length > 1 ? "s" : ""} par la communauté
              </p>
            </div>
            {filteredArticles.length > 0 && (
              <Badge variant="secondary" className="h-7 px-3 text-xs font-semibold">
                {filteredArticles.length} résultat{filteredArticles.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Filtres améliorés */}
        <div className="mb-8">
          {/* Filtres en ligne */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={sortBy || "recent"} onValueChange={(value: any) => setSortBy(value === "recent" ? null : (value as any))}>
              <SelectTrigger className="w-[160px] h-9 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
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
              value={selectedType || "all"}
              onValueChange={(value) => setSelectedType(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(ARTICLE_TYPE_LABELS).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedCategory || "all"}
              onValueChange={(value) => setSelectedCategory(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[160px] h-9 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
                <SelectValue placeholder="Catégorie" />
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

            <Select
              value={selectedTag || "all"}
              onValueChange={(value) => setSelectedTag(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
                <SelectValue placeholder="Tag">
                  {selectedTag ? `#${selectedTag}` : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    #{tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Bouton pour réinitialiser les filtres */}
            {(selectedTag || selectedCategory || selectedType) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTag(null);
                  setSelectedCategory(null);
                  setSelectedType(null);
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

        {/* Hero Article amélioré */}
        {heroArticle && (
          <div className="mb-10">
            <Link href={`/articles/${heroArticle.slug}`}>
              <article className="group relative h-[450px] md:h-[550px] overflow-hidden rounded-xl cursor-pointer border border-border/60 hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl">
                {/* Image de fond */}
                {heroArticle.coverImage ? (
                  <div className="absolute inset-0 h-full w-full">
                    <Image
                      src={heroArticle.coverImage}
                      alt={heroArticle.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      priority
                    />
                    {/* Overlay gradient amélioré */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-muted" />
                )}

                {/* Badges de statut */}
                <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                  {isNewArticle(heroArticle) && (
                    <Badge className="bg-emerald-500/90 text-white border-0 shadow-lg">
                      <SolarIcon icon="sparkle-bold" className="h-3 w-3 mr-1" />
                      Nouveau
                    </Badge>
                  )}
                  {isPopularArticle(heroArticle) && (
                    <Badge className="bg-orange-500/90 text-white border-0 shadow-lg">
                      <SolarIcon icon="fire-bold" className="h-3 w-3 mr-1" />
                      Populaire
                    </Badge>
                  )}
                  {isVerifiedArticle(heroArticle) && (
                    <Badge className="bg-blue-500/90 text-white border-0 shadow-lg">
                      <SolarIcon icon="verified-check-bold" className="h-3 w-3 mr-1" />
                      Vérifié
                    </Badge>
                  )}
                  {heroArticle.articleType && ARTICLE_TYPE_LABELS[heroArticle.articleType] && (
                    <Badge variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
                      <SolarIcon 
                        icon={ARTICLE_TYPE_LABELS[heroArticle.articleType].icon as any} 
                        className={cn("h-3 w-3 mr-1", ARTICLE_TYPE_LABELS[heroArticle.articleType].color)} 
                      />
                      {ARTICLE_TYPE_LABELS[heroArticle.articleType].label}
                    </Badge>
                  )}
                </div>

                {/* Contenu */}
                <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-10 text-white">
                  <div className="space-y-4">
                    {/* Catégories et Tags */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {heroArticle.categories && heroArticle.categories.length > 0 && (
                        <>
                          {heroArticle.categories.slice(0, 2).map((category) => (
                            <span key={category._id} className="text-xs text-white/80 inline-flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
                              {category.icon && (
                                <SolarIcon icon={category.icon} className="h-3.5 w-3.5 shrink-0" />
                              )}
                              {category.name}
                            </span>
                          ))}
                        </>
                      )}
                      {heroArticle.tags && heroArticle.tags.length > 0 && (
                        <>
                          {heroArticle.categories && heroArticle.categories.length > 0 && (
                            <span className="text-xs text-white/60">•</span>
                          )}
                          {heroArticle.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs text-white/70 bg-white/5 px-2 py-1 rounded-md">
                              #{tag}
                            </span>
                          ))}
                        </>
                      )}
                    </div>

                    {/* Titre */}
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-white group-hover:opacity-95 transition-opacity line-clamp-3 drop-shadow-lg">
                      {heroArticle.title}
                    </h2>

                    {/* Résumé */}
                    {heroArticle.summary && (
                      <p className="text-base md:text-lg text-white/90 line-clamp-2 drop-shadow-md">
                        {heroArticle.summary}
                      </p>
                    )}

                    {/* Footer: Auteur + Métriques */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/20">
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
                      <div className="flex items-center gap-3 text-xs text-white/90">
                        {heroArticle.qualityScore !== undefined && (
                          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-sm">
                            <SolarIcon icon="star-bold" className="h-3.5 w-3.5 text-yellow-300" />
                            <span className="font-semibold">{heroArticle.qualityScore}</span>
                          </div>
                        )}
                        {heroArticle.views !== undefined && (
                          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md backdrop-blur-sm">
                            <SolarIcon icon="eye-bold" className="h-3.5 w-3.5" />
                            <span className="font-semibold">{heroArticle.views}</span>
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

        {/* Grille d'articles améliorée */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 border border-border/60 rounded-xl bg-muted/20">
            <SolarIcon icon="document-text-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-base font-semibold mb-2">Aucun article trouvé</p>
            <p className="text-sm text-muted-foreground mb-4">
              Essayez de modifier vos critères de recherche ou de filtres
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTag(null);
                setSelectedCategory(null);
                setSelectedType(null);
                setSortBy("recent");
              }}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : otherArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherArticles.map((article) => (
              <ArticleCard key={article._id} article={article} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function PublicArticlesPage() {
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
      <PublicArticlesPageContent />
    </Suspense>
  );
}
