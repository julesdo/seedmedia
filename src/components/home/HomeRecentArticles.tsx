"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "next-view-transitions";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Author } from "@/components/articles/Author";
import { Id } from "../../../convex/_generated/dataModel";

interface Article {
  _id: Id<"articles">;
  title: string;
  summary: string;
  slug: string;
  coverImage?: string;
  author?: {
    _id: Id<"users">;
    name: string;
    image?: string;
  };
  tags: string[];
  categories?: Array<{
    _id: Id<"categories">;
    name: string;
    slug: string;
    icon?: string;
    color?: string;
  }>;
  qualityScore: number;
  views: number;
  publishedAt?: number;
  createdAt: number;
  totalClaimsCount: number;
}

interface HomeRecentArticlesProps {
  articles: Article[];
}

export function HomeRecentArticles({ articles }: HomeRecentArticlesProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucun article pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => {
        const publishedDate = article.publishedAt
          ? new Date(article.publishedAt)
          : new Date(article.createdAt);

        return (
          <Card key={article._id} className="group border-t-2 border-transparent hover:border-primary transition-colors">
            <Link href={`/articles/${article.slug}`}>
              {article.coverImage && (
                <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                  <OptimizedImage
                    src={article.coverImage}
                    alt={article.title}
                    className="object-cover transition-transform group-hover:scale-105"
                    fill
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  {article.author && (
                    <Author
                      author={article.author}
                      variant="compact"
                      size="sm"
                    />
                  )}
                </div>
                <CardTitle className="line-clamp-2 group-hover:opacity-80 transition-opacity">
                  {article.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">{article.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4 items-center">
                  {article.categories && article.categories.length > 0 && (
                    <>
                      {article.categories.slice(0, 2).map((category) => (
                        <span key={category._id} className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                          {category.icon && (
                            <SolarIcon icon={category.icon as any} className="h-3 w-3 shrink-0" />
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
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <SolarIcon icon="star-bold" className="h-3 w-3" />
                    <span>{article.qualityScore}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <SolarIcon icon="eye-bold" className="h-3 w-3" />
                    <span>{article.views}</span>
                  </div>
                  {article.totalClaimsCount > 0 && (
                    <div className="flex items-center gap-1">
                      <SolarIcon icon="document-text-bold" className="h-3 w-3" />
                      <span>{article.totalClaimsCount} sources</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(publishedDate, { addSuffix: true, locale: fr })}
                </span>
              </CardFooter>
            </Link>
          </Card>
        );
      })}
    </div>
  );
}

