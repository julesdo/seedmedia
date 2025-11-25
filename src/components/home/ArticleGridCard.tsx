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

interface ArticleGridCardProps {
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
    qualityScore?: number;
  };
  variant?: "default" | "compact" | "large";
  className?: string;
}

export function ArticleGridCard({
  article,
  variant = "default",
  className,
}: ArticleGridCardProps) {
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt)
    : new Date(article.createdAt);

  if (variant === "compact") {
    return (
      <Link href={`/articles/${article.slug}`}>
        <Card
          className={cn(
            "group hover:shadow-lg transition-all cursor-pointer overflow-hidden",
            className
          )}
        >
          {article.coverImage && (
            <div className="relative aspect-video w-full overflow-hidden">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            </div>
          )}
          <div className="p-4 space-y-2">
            {article.tags && article.tags.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {article.tags[0]}
              </Badge>
            )}
            <h3 className="font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            {article.summary && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {article.summary}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/articles/${article.slug}`}>
      <Card
        className={cn(
          "group hover:shadow-lg transition-all cursor-pointer overflow-hidden h-full flex flex-col",
          className
        )}
      >
        {article.coverImage && (
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-5 flex-1 flex flex-col space-y-3">
          <div className="flex items-start justify-between gap-2">
            {article.tags && article.tags.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {article.tags[0]}
              </Badge>
            )}
            {article.qualityScore !== undefined && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <SolarIcon icon="star-bold" className="h-3 w-3" />
                <span>{article.qualityScore}</span>
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          {article.summary && (
            <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
              {article.summary}
            </p>
          )}
          <div className="flex items-center gap-3 pt-2 border-t border-border/50">
            {article.author && (
              <>
                <Author
                  author={article.author}
                  variant="hero"
                  size="md"
                  showDate
                  date={publishedDate}
                />
              </>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

