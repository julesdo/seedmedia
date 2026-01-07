"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { DecisionCard } from "./DecisionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";

interface DecisionListProps {
  status?: "announced" | "tracking" | "resolved";
  type?: "law" | "sanction" | "tax" | "agreement" | "policy" | "regulation" | "other";
  decider?: string;
  impactedDomain?: string;
  limit?: number;
  className?: string;
}

function DecisionCardSkeleton() {
  return (
    <article className="flex flex-col overflow-hidden bg-background">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="p-6 md:p-8 space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-4/5" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <div className="flex gap-3 pt-4 border-t">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>
    </article>
  );
}

export function DecisionList({
  status,
  type,
  decider,
  impactedDomain,
  limit = 20,
  className,
}: DecisionListProps) {
  const [displayLimit, setDisplayLimit] = useState(limit);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useConvexAuth();

  const decisions = useQuery(
    api.decisions.getDecisions,
    {
      limit: displayLimit,
      status,
      type,
      decider,
      impactedDomain,
    }
  );

  // Récupérer tous les favoris en une seule requête au lieu de N requêtes
  const favoriteIdsArray = useQuery(
    api.favorites.getFavoritesForDecisions,
    isAuthenticated && decisions
      ? {
          decisionIds: decisions.map((d) => d._id),
        }
      : "skip"
  );

  // Convertir l'array en Set pour lookup rapide côté client
  const favoriteIds = favoriteIdsArray ? new Set(favoriteIdsArray) : undefined;

  // Infinite scroll avec Intersection Observer
  useEffect(() => {
    if (!decisions || decisions.length < displayLimit) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayLimit((prev) => prev + limit);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [decisions, displayLimit, limit]);

  if (decisions === undefined) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <DecisionCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <SolarIcon icon="document-text-bold" className="size-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Aucune décision trouvée</h3>
        <p className="text-sm text-muted-foreground">
          Il n'y a pas encore de décisions correspondant à vos critères.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Feed vertical - Style Instagram (une colonne) */}
      <div className="flex flex-col">
        {decisions.map((decision) => (
          <DecisionCard 
            key={decision._id} 
            decision={decision}
            isSaved={favoriteIds ? favoriteIds.has(decision._id) : undefined}
          />
        ))}
      </div>

      {/* Load more trigger */}
      {decisions.length >= displayLimit && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          <Button
            variant="outline"
            onClick={() => setDisplayLimit((prev) => prev + limit)}
            className="min-w-[200px]"
          >
            <SolarIcon name="arrow-down" className="size-4 mr-2" />
            Charger plus
          </Button>
        </div>
      )}

      {/* Loading more skeletons */}
      {decisions.length > 0 && decisions.length < displayLimit && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mt-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <DecisionCardSkeleton key={`loading-${i}`} />
          ))}
        </div>
      )}
    </div>
  );
}

