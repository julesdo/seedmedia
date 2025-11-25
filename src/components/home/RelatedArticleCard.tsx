"use client";

import { Link } from "next-view-transitions";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Id } from "../../../convex/_generated/dataModel";

interface RelatedArticleCardProps {
  article: {
    _id: Id<"articles">;
    title: string;
    slug: string;
    coverImage?: string;
    publishedAt?: number;
    createdAt: number;
  };
}

export function RelatedArticleCard({ article }: RelatedArticleCardProps) {
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt)
    : new Date(article.createdAt);

  return (
    <Link href={`/articles/${article.slug}`}>
      <div className="group flex gap-4 hover:bg-muted/50 transition-colors p-3 rounded-lg -mx-3 cursor-pointer">
        {/* Image */}
        {article.coverImage ? (
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-muted/50" />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(publishedDate, {
              addSuffix: true,
              locale: fr,
            })}
          </p>
        </div>
      </div>
    </Link>
  );
}

