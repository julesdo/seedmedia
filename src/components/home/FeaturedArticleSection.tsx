"use client";

import { Link } from "next-view-transitions";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Author } from "@/components/articles/Author";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Id } from "../../../convex/_generated/dataModel";

interface FeaturedArticleSectionProps {
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

export function FeaturedArticleSection({ article }: FeaturedArticleSectionProps) {
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt)
    : new Date(article.createdAt);

  return (
    <div className="space-y-6">
      {/* Métadonnées */}
      <div className="flex items-center gap-4 text-sm">
        {article.tags && article.tags.length > 0 && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            {article.tags[0]}
          </Badge>
        )}
        <span className="text-muted-foreground">
          {new Date(publishedDate).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </span>
      </div>

      {/* Titre */}
      <Link href={`/articles/${article.slug}`}>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight hover:text-primary transition-colors">
          {article.title}
        </h1>
      </Link>

      {/* Résumé */}
      {article.summary && (
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl">
          {article.summary}
        </p>
      )}

      {/* Image principale */}
      {article.coverImage && (
        <Link href={`/articles/${article.slug}`}>
          <div className="relative w-full aspect-video md:aspect-[16/9] rounded-2xl overflow-hidden bg-muted group cursor-pointer">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
            />
          </div>
        </Link>
      )}

      {/* Footer: Auteur + Score */}
      {article.author && (
        <div className="flex items-center gap-4 pt-4">
          <Author
            author={article.author}
            variant="hero"
            size="lg"
            showDate
            date={publishedDate}
          />
          {article.qualityScore !== undefined && (
            <div className="ml-auto flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
              <SolarIcon icon="star-bold" className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">{article.qualityScore}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

