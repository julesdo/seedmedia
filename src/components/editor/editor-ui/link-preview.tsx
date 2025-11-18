"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";

interface LinkPreviewProps {
  url: string;
  text?: string;
  className?: string;
  onDelete?: () => void;
}

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  url: string;
}

export function LinkPreview({ url, text, className, onDelete }: LinkPreviewProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!url) return;

      setIsLoading(true);
      setError(null);

      try {
        // Appeler une fonction Convex pour récupérer les métadonnées OG
        // Pour l'instant, on utilise une API publique
        const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch metadata");
        }

        const data = await response.json();
        setMetadata({
          title: data.title || new URL(url).hostname,
          description: data.description,
          image: data.image,
          siteName: data.siteName || new URL(url).hostname,
          url: url,
        });
      } catch (err) {
        console.error("Error fetching link metadata:", err);
        setError("Failed to load preview");
        // Fallback: utiliser l'URL comme titre
        setMetadata({
          title: text || new URL(url).hostname,
          description: url,
          url: url,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetadata();
  }, [url, text]);

  if (isLoading) {
    return (
      <Card className={cn("border-0 bg-gradient-to-br from-background/70 to-background/30 backdrop-blur-lg overflow-hidden", className)}>
        <CardContent className="p-2">
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 bg-muted/50 rounded animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-muted/50 rounded animate-pulse" />
              <div className="h-2.5 bg-muted/30 rounded animate-pulse w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !metadata) {
    // Fallback: afficher un lien simple
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("text-primary hover:underline inline-flex items-center gap-1", className)}
      >
        <SolarIcon icon="link-bold" className="h-3 w-3" />
        {text || url}
      </a>
    );
  }

  return (
    <div className={cn("inline-block w-full relative group/link", className)}>
      <Card className="border-0 bg-gradient-to-br from-background/70 to-background/30 backdrop-blur-lg overflow-hidden group hover:shadow-lg hover:shadow-primary/5 transition-all duration-200">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <CardContent className="p-0">
            <div className="flex items-center gap-2 p-2">
              {metadata.image && (
                <div className="relative h-12 w-12 overflow-hidden rounded bg-muted/20 shrink-0">
                  <Image
                    src={metadata.image}
                    alt={metadata.title || ""}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    unoptimized
                    onError={(e) => {
                      // Cacher l'image en cas d'erreur
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-0.5">
                {metadata.siteName && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                    <SolarIcon icon="link-bold" className="h-2.5 w-2.5" />
                    <span className="truncate">{metadata.siteName}</span>
                  </div>
                )}
                {metadata.title && (
                  <h4 className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {metadata.title}
                  </h4>
                )}
                {metadata.description && (
                  <p className="text-[10px] text-muted-foreground/80 line-clamp-1">
                    {metadata.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </a>
      </Card>
      {/* Bouton de suppression */}
      {onDelete && (
        <Button
          type="button"
          variant="glass"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover/link:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive hover:border-destructive/30 z-10"
          title="Supprimer le lien"
        >
          <SolarIcon icon="trash-bin-trash-bold" className="h-3 w-3" />
        </Button>
      )}
      {/* Ligne invisible pour permettre la continuation de l'écriture */}
      <div className="h-0" aria-hidden="true" />
    </div>
  );
}

