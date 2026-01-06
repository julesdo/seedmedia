"use client";

import { Suspense } from "react";
import { EventsMap } from "@/components/map/EventsMap";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function MapPageContent() {
  // Récupérer toutes les décisions pour la carte (limité à 100 pour la performance)
  const decisions = useQuery(api.decisions.getDecisions, {
    limit: 100,
  });

  return (
    <div className="fixed inset-0 bg-background lg:left-[244px]">
      {/* Header minimaliste */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <SolarIcon icon="map-point-bold" className="size-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Carte des événements</h1>
            {decisions && (
              <span className="text-sm text-muted-foreground">
                {decisions.length} événement{decisions.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Carte en plein écran */}
      <div className="absolute inset-0 pt-16">
        {decisions === undefined ? (
          <div className="flex items-center justify-center h-full">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <EventsMap decisions={decisions || []} className="h-full w-full rounded-none" />
        )}
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-background lg:left-[244px]">
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  );
}

