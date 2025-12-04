"use client";

import { Link } from "next-view-transitions";
import Image from "next/image";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Author } from "@/components/articles/Author";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ArticleCardProps {
  article: {
    _id: string;
    slug: string;
    title: string;
    summary?: string | null;
    coverImage?: string | null;
    author?: {
      _id: string;
      name?: string | null;
      image?: string | null;
    } | null;
    categories?: Array<{
      _id: string;
      name: string;
      icon?: string | null;
    }> | null;
    tags?: string[] | null;
    publishedAt?: number | null;
    createdAt: number;
  };
  variant?: "default" | "compact";
}

export function ArticleCard({ article, variant = "default" }: ArticleCardProps) {
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt)
    : new Date(article.createdAt);

  return (
    <Link href={`/articles/${article.slug}`}>
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
        <div className="space-y-2.5">
          {/* Métadonnées */}
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
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

          {/* Titre */}
          <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>

          {/* Résumé */}
          {article.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {article.summary}
            </p>
          )}

          {/* Catégories et Tags */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {article.categories && article.categories.length > 0 && (
              <>
                {article.categories.slice(0, 2).map((category) => (
                  <span key={category?._id} className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    {category?.icon && (
                      <SolarIcon icon={category?.icon} className="h-3 w-3 shrink-0" />
                    )}
                    {category?.name}
                  </span>
                ))}
              </>
            )}
            {article.tags && article.tags.length > 0 && (
              <>
                {article.categories && article.categories.length > 0 && (
                  <span className="text-[11px] text-muted-foreground">•</span>
                )}
                {article.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[11px] text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

