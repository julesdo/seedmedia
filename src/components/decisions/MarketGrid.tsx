"use client";

import { MarketCard } from "./MarketCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect, useRef } from "react";

interface MarketGridProps {
  decisions: any[];
  isLoading?: boolean;
  className?: string;
  variant?: "grid" | "list";
}

// Nombre de cartes à charger initialement (réduit pour améliorer TBT)
const INITIAL_LOAD = 3;
// Nombre de cartes à charger à chaque intersection
const LOAD_MORE = 3;
// Gap entre les cartes (en pixels)
const GAP = 16;

/**
 * Grille responsive de Market Cards avec chargement progressif
 * Desktop : 3 colonnes | Tablet : 2 colonnes | Mobile : 1 colonne
 * Optimisé pour réduire CLS, LCP et TBT
 */
export function MarketGrid({
  decisions,
  isLoading = false,
  className,
  variant = "grid",
}: MarketGridProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Réinitialiser le compteur quand les décisions changent
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD);
    setCardHeight(null); // Réinitialiser la hauteur mesurée
  }, [decisions]);

  // Callback ref pour mesurer la hauteur de la première carte
  const measureFirstCard = (element: HTMLDivElement | null) => {
    if (element && cardHeight === null) {
      // Attendre que la carte soit rendue
      setTimeout(() => {
        const height = element.offsetHeight;
        if (height > 0) {
          setCardHeight(height);
        }
      }, 100);
    }
  };

  // Mémoriser les décisions visibles AVANT les early returns (règle des hooks React)
  // Toujours retourner un tableau même si decisions est undefined
  const visibleDecisions = useMemo(() => {
    if (!decisions || decisions.length === 0) return [];
    return decisions.slice(0, visibleCount);
  }, [decisions, visibleCount]);

  // Mémoriser les décisions restantes pour le skeleton
  const hasMore = useMemo(() => {
    if (!decisions || decisions.length === 0) return false;
    return visibleCount < decisions.length;
  }, [decisions, visibleCount]);

  // Observer pour charger plus de cartes progressivement
  useEffect(() => {
    if (isLoading || !decisions || decisions.length === 0) return;
    if (visibleCount >= decisions.length) return;

    // Nettoyer l'observer précédent
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Créer un nouvel observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleCount((prev) => Math.min(prev + LOAD_MORE, decisions.length));
          }
        });
      },
      {
        rootMargin: "200px", // Charger 200px avant d'arriver au sentinel
        threshold: 0.1,
      }
    );

    // Observer le sentinel
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleCount, decisions, isLoading]);

  if (isLoading) {
    return (
      <div className={cn(
        "grid gap-4",
        variant === "grid"
          ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          : "grid-cols-1",
        className
      )}>
        {Array.from({ length: 6 }).map((_, i) => (
          <MarketCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!decisions || decisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Aucun marché disponible pour le moment
        </p>
      </div>
    );
  }

  // Calculer le nombre total de cartes à afficher (visibles + skeletons pour réserver l'espace)
  const totalCards = decisions.length;
  const remainingCards = totalCards - visibleCount;
  // Afficher des skeletons pour réserver l'espace et éviter le layout shift
  const skeletonCount = Math.min(LOAD_MORE, remainingCards);

  return (
    <div 
      className={cn(
        "grid gap-4 w-full max-w-full",
        variant === "grid"
          ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
          : "grid-cols-1",
        className
      )}
      style={{ 
        contentVisibility: 'auto', // Optimisation pour les cartes non visibles
      }}
    >
      {/* Afficher les cartes visibles */}
      {visibleDecisions.map((decision, index) => (
        <div
          key={decision._id}
          ref={index === 0 ? measureFirstCard : null}
          style={{
            contentVisibility: index >= INITIAL_LOAD ? 'auto' : 'visible', // Optimiser les cartes non visibles
            ...(cardHeight && { containIntrinsicSize: `auto ${cardHeight}px` }), // Réserver l'espace avec hauteur mesurée
          }}
        >
          <MarketCard
            decision={decision}
            variant={variant}
            // Priorité pour les 3 premières cartes (LCP)
            priority={index < 3}
          />
        </div>
      ))}
      
      {/* Skeleton pour réserver l'espace des cartes non encore chargées */}
      {/* La hauteur est calculée dynamiquement à partir des 3 premières cartes préchargées */}
      {skeletonCount > 0 && Array.from({ length: skeletonCount }).map((_, i) => (
        <div
          key={`skeleton-placeholder-${visibleCount + i}`}
          style={{
            contentVisibility: 'auto',
            ...(cardHeight && { containIntrinsicSize: `auto ${cardHeight}px` }),
          }}
        >
          <MarketCardSkeleton cardHeight={cardHeight} />
        </div>
      ))}
      
      {/* Sentinel invisible pour déclencher le chargement de plus de cartes */}
      {hasMore && remainingCards > LOAD_MORE && (
        <div
          ref={sentinelRef}
          className="w-full h-1 col-span-full"
          aria-hidden="true"
          style={{ gridColumn: '1 / -1' }}
        />
      )}
    </div>
  );
}

function MarketCardSkeleton({ cardHeight }: { cardHeight?: number | null }) {
  // Skeleton avec hauteur calculée dynamiquement à partir des cartes réelles
  // Si cardHeight n'est pas encore mesuré, laisser Tailwind gérer automatiquement
  return (
    <div 
      className="flex flex-col overflow-hidden bg-background border border-border/50 rounded-lg"
      style={cardHeight ? { height: `${cardHeight}px` } : undefined}
    >
      <Skeleton className="w-full aspect-[16/9] min-h-[180px]" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

