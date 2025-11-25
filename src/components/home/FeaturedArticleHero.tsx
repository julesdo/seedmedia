"use client";

import { Link } from "next-view-transitions";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Author } from "@/components/articles/Author";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Id } from "../../../convex/_generated/dataModel";

interface FeaturedArticleHeroProps {
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
}

export function FeaturedArticleHero({ article }: FeaturedArticleHeroProps) {
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt)
    : new Date(article.createdAt);

  return (
    <Link href={`/articles/${article.slug}`}>
      <div className="group relative h-[500px] md:h-[600px] overflow-hidden rounded-2xl cursor-pointer">
        {/* Image de fond */}
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-muted" />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Contenu */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-12 text-white">
          <div className="max-w-3xl space-y-4">
            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Titre */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight group-hover:text-primary transition-colors">
              {article.title}
            </h1>

            {/* Résumé */}
            {article.summary && (
              <p className="text-lg md:text-xl text-white/90 line-clamp-2">
                {article.summary}
              </p>
            )}

            {/* Footer: Auteur + Date + Score */}
            <div className="flex items-center gap-4 pt-2">
              {article.author && (
                <Author
                  author={article.author}
                  variant="hero"
                  size="lg"
                  showDate
                  date={publishedDate}
                  textColor="white"
                />
              )}
              {article.qualityScore !== undefined && (
                <div className="ml-auto flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                  <SolarIcon icon="star-bold" className="h-4 w-4" />
                  <span className="font-semibold">{article.qualityScore}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

