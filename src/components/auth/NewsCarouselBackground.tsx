"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * Carousel de news en arrière-plan pour les pages d'authentification
 * Affiche les dernières décisions importantes en défilement automatique
 * Mobile-first avec indicateurs tactiles
 */
export function NewsCarouselBackground() {
  const decisions = useQuery(api.decisions.getDecisions, { limit: 10 });
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filtrer et mémoriser les décisions avec des images
  const decisionsWithImages = useMemo(() => {
    if (!decisions) return [];
    return decisions.filter(
      (d) => d.imageUrl && d.imageUrl.trim() !== ""
    ).slice(0, 5); // Limiter à 5 pour la performance
  }, [decisions]);

  // Rotation automatique toutes les 6 secondes
  // IMPORTANT: Tous les hooks doivent être appelés avant tout return conditionnel
  useEffect(() => {
    if (decisionsWithImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % decisionsWithImages.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [decisionsWithImages.length]);

  // Si pas de décisions avec images, ne rien afficher
  if (decisionsWithImages.length === 0) {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-gradient-to-br from-primary/20 via-background to-background" />
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Overlay gradient sombre pour la lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70 z-10" />
      
      {/* Carousel avec transition fluide */}
      <div className="absolute inset-0">
        {decisionsWithImages.map((decision, index) => (
          <Link
            key={decision._id}
            href={`/${decision.slug}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              index === currentIndex ? "opacity-100 z-0" : "opacity-0 z-0"
            )}
            aria-label={decision.title}
          >
            {decision.imageUrl && (
              <Image
                src={decision.imageUrl}
                alt={decision.title}
                fill
                className="object-cover scale-105"
                priority={index === 0}
                sizes="100vw"
                quality={85}
              />
            )}
          </Link>
        ))}
      </div>

    </div>
  );
}

