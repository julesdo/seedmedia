"use client";

import { Link } from "next-view-transitions";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface FullPageHeroProps {
  featuredArticle?: {
    _id: Id<"articles">;
    title: string;
    summary?: string;
    slug: string;
    coverImage?: string;
    tags?: string[];
  };
}

export function FullPageHero({ featuredArticle }: FullPageHeroProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/articles?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="relative h-screen w-full flex flex-col justify-end overflow-hidden">
      {/* Image de fond */}
      {featuredArticle?.coverImage ? (
        <Image
          src={featuredArticle.coverImage}
          alt={featuredArticle.title || "Seed Media"}
          fill
          className="object-cover z-0"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-muted z-0" />
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

      {/* Contenu */}
      <div className="relative z-20 container mx-auto px-4 md:px-6 lg:px-8 pb-16 md:pb-24 lg:pb-32">
        <div className="max-w-4xl space-y-6 md:space-y-8">
          {/* Badge + Tag */}
          {featuredArticle?.tags && featuredArticle.tags.length > 0 && (
            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm glass-panel"
              >
                Article populaire
              </Badge>
              <Badge
                variant="secondary"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm glass-panel"
              >
                {featuredArticle.tags[0]}
              </Badge>
            </div>
          )}

          {/* Titre principal */}
          {featuredArticle ? (
            <Link href={`/articles/${featuredArticle.slug}`}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight hover:text-primary transition-colors cursor-pointer max-w-4xl">
                {featuredArticle.title}
              </h1>
            </Link>
          ) : (
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight max-w-4xl">
              Le média social de la résilience technologique
            </h1>
          )}

          {/* Résumé */}
          {featuredArticle?.summary && (
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 leading-relaxed max-w-3xl">
              {featuredArticle.summary}
            </p>
          )}

          {/* Barre de recherche avec effet glass */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl pt-4">
            <div className="flex-1 relative">
              <SolarIcon
                icon="magnifer-bold"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10"
              />
              <Input
                type="text"
                placeholder="Rechercher des articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 bg-background/80 backdrop-blur-md border-border/50 text-lg placeholder:text-muted-foreground/70 glass-panel focus-visible:ring-primary/50"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-14 px-6 button-glass text-base"
            >
              <span>Rechercher</span>
              <SolarIcon icon="alt-arrow-right-bold" className="h-5 w-5 ml-2" />
            </Button>
          </form>

          {/* Bouton Explore More */}
          <div className="flex items-center gap-4 pt-4">
            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 hover:text-white glass-panel"
              asChild
            >
              <Link href="#content">
                <span>Explorer plus</span>
                <SolarIcon icon="alt-arrow-down-bold" className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

