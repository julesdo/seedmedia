"use client";

import { Suspense, useState, useEffect } from "react";
import { EventsMap } from "@/components/map/EventsMap";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Note: Cette page est client-side uniquement, l'ISR ne s'applique pas
// Mais on peut optimiser avec Suspense et loading states

function MapPageContent() {
  // Récupérer toutes les décisions pour la carte (limité à 100 pour la performance)
  const decisions = useQuery(api.decisions.getDecisions, {
    limit: 100,
  });

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  return (
    <div 
      className="fixed left-0 right-0 bottom-[64px] lg:left-[244px] lg:right-[319px] lg:bottom-0"
      style={{
        // Mobile: positionné en dessous des headers et au-dessus de la bottom nav
        // Desktop: positionné en dessous du breaking news et top bar
        top: isDesktop 
          ? "calc(var(--breaking-news-height, 0px) + 56px)"
          : "calc(var(--breaking-news-height, 0px) + var(--header-height, 56px) + 56px)",
      }}
    >
      {decisions === undefined ? (
        <div className="flex items-center justify-center h-full w-full">
          <Skeleton className="w-full h-full" />
        </div>
      ) : (
        <EventsMap decisions={decisions || []} className="h-full w-full rounded-none" />
      )}
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div 
          className="fixed left-0 right-0 bottom-[64px] lg:left-[244px] lg:right-[319px] lg:bottom-0"
          style={{
            top: "calc(var(--breaking-news-height, 0px) + var(--header-height, 56px) + 56px)",
          }}
        >
          <div className="flex items-center justify-center h-full w-full">
            <Skeleton className="w-full h-full" />
          </div>
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  );
}

