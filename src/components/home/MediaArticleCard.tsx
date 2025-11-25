"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Author } from "@/components/articles/Author";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface MediaArticleCardProps {
  article: {
    _id: Id<"articles">;
    title: string;
    summary?: string;
    slug: string;
    coverImage?: string;
    tags?: string[];
    author?: {
      _id: Id<"users">;
      name: string;
      image?: string;
    };
    publishedAt?: number;
    createdAt: number;
    category?: string;
  };
  className?: string;
}

export function MediaArticleCard({ article, className }: MediaArticleCardProps) {
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt)
    : new Date(article.createdAt);

  const getCategoryLabel = (tag?: string) => {
    if (!tag) return null;
    
    const categoryMap: Record<string, string> = {
      "lost-chronicles": "CHRONIQUES PERDUES",
      "wars-of-ideas": "GUERRES D'IDÉES",
      "philosopher": "PHILOSOPHE",
      "rewrite-history": "RÉÉCRIRE L'HISTOIRE",
    };

    return categoryMap[tag.toLowerCase()] || tag.toUpperCase();
  };

  const category = article.category || article.tags?.[0];
  const categoryLabel = getCategoryLabel(category);

  return (
    <Link href={`/articles/${article.slug}`}>
      <Card
        className={cn(
          "group hover:shadow-lg transition-all cursor-pointer border-border/40",
          className
        )}
      >
        <div className="flex gap-4 p-4">
          {/* Image */}
          {article.coverImage && (
            <div className="relative w-32 h-24 md:w-40 md:h-28 flex-shrink-0 overflow-hidden rounded-md">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Category Badge */}
            {categoryLabel && (
              <div className="flex items-center gap-2">
                {category?.toLowerCase() === "lost-chronicles" && (
                  <SolarIcon icon="flash-bold" className="h-3 w-3 text-yellow-500" />
                )}
                <Badge variant="secondary" className="text-xs font-semibold">
                  {categoryLabel}
                </Badge>
              </div>
            )}

            {/* Title */}
            <h3 className="text-base md:text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>

            {/* Summary */}
            {article.summary && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {article.summary}
              </p>
            )}

            {/* Footer: Author + Date */}
            <div className="flex items-center gap-2 pt-1">
              {article.author && (
                <>
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={article.author.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {article.author.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">
                    {article.author.name}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                </>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(publishedDate, { addSuffix: true, locale: fr })}
              </span>
              <SolarIcon
                icon="arrow-right-bold"
                className="h-3 w-3 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"
              />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

