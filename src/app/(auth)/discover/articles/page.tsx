"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";

const SORT_OPTIONS = [
  { value: "quality", label: "Par qualité" },
  { value: "recent", label: "Plus récents" },
  { value: "popular", label: "Plus populaires" },
  { value: "verified", label: "Plus vérifiés" },
];

const ARTICLE_TYPES = [
  { value: "all", label: "Tous les types" },
  { value: "scientific", label: "Scientifique" },
  { value: "expert", label: "Expert" },
  { value: "opinion", label: "Opinion" },
  { value: "news", label: "Actualité" },
  { value: "tutorial", label: "Tutoriel" },
  { value: "other", label: "Autre" },
];

const articleTypeLabels: Record<string, string> = {
  scientific: "Scientifique",
  expert: "Expert",
  opinion: "Opinion",
  news: "Actualité",
  tutorial: "Tutoriel",
  other: "Autre",
};

export default function ArticlesPage() {
  const [sortBy, setSortBy] = useState<"quality" | "recent" | "popular" | "verified">("quality");
  const [articleType, setArticleType] = useState<string | undefined>(undefined);
  const [minQualityScore, setMinQualityScore] = useState<number>(0);

  const articles = useQuery(api.articles.getArticles, {
    limit: 20,
    sortBy,
    articleType: articleType && articleType !== "all" ? articleType as any : undefined,
    minQualityScore,
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-1.5">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gradient-light mb-1.5">Articles</h1>
            <p className="text-sm text-muted-foreground/80">
              Découvrez des articles vérifiés et de qualité sur l'impact en Nouvelle-Aquitaine
            </p>
          </div>
          <Button asChild>
            <Link href="/discover/articles/nouveau">
              <Plus className="h-4 w-4 mr-2" />
              Créer un article
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
          <SelectTrigger className="w-[180px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={articleType || "all"}
          onValueChange={(value) => setArticleType(value === "all" ? undefined : value)}
        >
          <SelectTrigger className="w-[180px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ARTICLE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={minQualityScore.toString()}
          onValueChange={(value) => setMinQualityScore(parseInt(value))}
        >
          <SelectTrigger className="w-[200px]" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Tous les articles</SelectItem>
            <SelectItem value="50">Qualité ≥ 50</SelectItem>
            <SelectItem value="70">Qualité ≥ 70</SelectItem>
            <SelectItem value="85">Qualité ≥ 85</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des articles */}
      {articles === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SolarIcon icon="document-bold" className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Aucun article trouvé</EmptyTitle>
            <EmptyDescription>
              {minQualityScore > 0
                ? "Essayez de réduire le filtre de qualité minimum."
                : "Il n'y a pas encore d'articles publiés."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <Link key={article._id} href={`/discover/articles/${article.slug}`}>
              <Card className="group hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    {/* Header avec type et score */}
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="text-xs">
                        {articleTypeLabels[article.articleType]}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <SolarIcon icon="verified-check-bold" className="h-3.5 w-3.5 text-primary/70" />
                        <span className="text-xs font-medium text-muted-foreground">
                          {article.qualityScore}
                        </span>
                      </div>
                    </div>

                    {/* Titre */}
                    <h3 className="text-base font-bold text-gradient-light group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>

                    {/* Résumé */}
                    <p className="text-sm text-muted-foreground/80 line-clamp-3 flex-1">
                      {article.summary}
                    </p>

                    {/* Tags */}
                    {article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Footer avec auteur et métriques */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={article.author?.image || undefined} />
                          <AvatarFallback className="text-xs">
                            {article.author?.name?.[0]?.toUpperCase() || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground/70">
                          {article.author?.name || "Auteur"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground/60">
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="eye-bold" className="h-3 w-3" />
                          <span>{article.views}</span>
                        </div>
                        {article.totalClaimsCount > 0 && (
                          <div className="flex items-center gap-1">
                            <SolarIcon icon="verified-check-bold" className="h-3 w-3" />
                            <span>
                              {article.verifiedClaimsCount}/{article.totalClaimsCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

