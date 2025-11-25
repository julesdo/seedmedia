"use client";

import { Link } from "next-view-transitions";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Author } from "@/components/articles/Author";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface LatestArticleHeroProps {
  article: {
    _id: Id<"articles">;
    title: string;
    summary?: string;
    slug: string;
    coverImage?: string;
    tags?: string[];
    categories?: Array<{
      _id: Id<"categories">;
      name: string;
      slug: string;
      icon?: string;
      color?: string;
    }>;
    author?: {
      _id: Id<"users">;
      name: string;
      image?: string | null | undefined;
    };
    publishedAt?: number;
    createdAt: number;
    qualityScore?: number;
    views?: number;
  };
}

export function LatestArticleHero({ article }: LatestArticleHeroProps) {
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt)
    : new Date(article.createdAt);

  return (
    <Link href={`/articles/${article.slug}`} className="block h-full">
      <div className="group relative h-full overflow-hidden rounded-lg cursor-pointer border border-border hover:border-primary transition-colors">
        {/* Image de fond */}
        {article.coverImage ? (
          <div className="absolute inset-0 h-full w-full">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
            />
            {/* Overlay gradient pour la lisibilité */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-muted" />
        )}

        {/* Contenu - positionné par-dessus avec z-index */}
        <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8 text-white">
          <div className="space-y-4">
            {/* Catégories et Tags */}
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-xs text-white/80 font-medium">Dernier article</span>
              {article.categories && article.categories.length > 0 && (
                <>
                  {article.categories.slice(0, 2).map((category) => (
                    <span key={category._id} className="text-xs text-white/70 inline-flex items-center gap-1.5">
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
                  {article.categories && article.categories.length > 0 && <span className="text-xs text-white/70">•</span>}
                  {article.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-xs text-white/70">
                      #{tag}
                    </span>
                  ))}
                </>
              )}
            </div>

            {/* Titre */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight text-white group-hover:opacity-90 transition-opacity line-clamp-3">
              {article.title}
            </h1>

            {/* Résumé */}
            {article.summary && (
              <p className="text-sm md:text-base text-white/90 line-clamp-2">
                {article.summary}
              </p>
            )}

            {/* Footer: Auteur + Métriques */}
            <div className="flex items-center justify-between pt-2">
              {article.author && (
                <Author
                  author={article.author}
                  variant="hero"
                  showDate
                  date={publishedDate}
                  textColor="white"
                />
              )}
              <div className="flex items-center gap-3 text-xs text-white/90">
                {article.qualityScore !== undefined && (
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md">
                    <SolarIcon icon="star-bold" className="h-4 w-4" />
                    <span>{article.qualityScore}</span>
                  </div>
                )}
                {article.views !== undefined && (
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md">
                    <SolarIcon icon="eye-bold" className="h-4 w-4" />
                    <span>{article.views}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

