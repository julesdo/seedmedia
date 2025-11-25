"use client";

import { Link } from "next-view-transitions";
import Image from "next/image";

interface MediaHeroProps {
  coverImage?: string;
  title: string;
  subtitle: string;
  tags?: string[];
}

export function MediaHero({ coverImage, title, subtitle, tags = [] }: MediaHeroProps) {
  const defaultTags = [
    "Esprits curieux",
    "Chroniques perdues",
    "Philosophe",
    "Réécrire l'histoire",
    "Guerres d'idées",
  ];

  const displayTags = tags.length > 0 ? tags : defaultTags;

  return (
    <div className="relative h-screen w-full flex flex-col">
      {/* Hero Image avec overlay */}
      <div className="relative flex-1 w-full overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        )}
        
        {/* Overlay sombre pour la lisibilité */}
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Texte overlay */}
        <div className="absolute inset-0 flex items-center justify-start p-8 md:p-12 lg:p-16">
          <div className="max-w-2xl text-white space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight">
              {title}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-white/90 font-light leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Tags/Navigation */}
      {displayTags.length > 0 && (
        <div className="bg-background/95 backdrop-blur-sm border-t border-border/40 px-8 md:px-12 lg:px-16 py-4">
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            {displayTags.map((tag, index) => (
              <Link
                key={index}
                href={`/articles?tag=${encodeURIComponent(tag)}`}
                className="text-sm md:text-base font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

