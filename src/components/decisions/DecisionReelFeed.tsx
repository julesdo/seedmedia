"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DecisionReelCard } from "./DecisionReelCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

// Fonction pour calculer la couleur du badge (identique à celle dans generateDecision.ts)
function calculateBadgeColor(heat: number, sentiment: "positive" | "negative" | "neutral"): string {
  const normalizedHeat = Math.max(0, Math.min(100, heat)) / 100;
  
  let hue: number;
  if (sentiment === "positive") {
    hue = 120 - (normalizedHeat * 30);
  } else if (sentiment === "negative") {
    hue = 0 + (normalizedHeat * 30);
  } else {
    hue = 210 - (normalizedHeat * 210);
  }
  
  const saturation = 60 + (normalizedHeat * 30);
  const lightness = 50 - (normalizedHeat * 10);
  
  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h * 6 < 1) {
    r = c; g = x; b = 0;
  } else if (h * 6 < 2) {
    r = x; g = c; b = 0;
  } else if (h * 6 < 3) {
    r = 0; g = c; b = x;
  } else if (h * 6 < 4) {
    r = 0; g = x; b = c;
  } else if (h * 6 < 5) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

interface DecisionReelFeedProps {
  initialDecisionId: Id<"decisions">;
  initialDecisions?: any[]; // Décisions préchargées côté serveur
  onBack?: () => void;
}

export function DecisionReelFeed({
  initialDecisionId,
  initialDecisions,
  onBack,
}: DecisionReelFeedProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [allLoadedDecisions, setAllLoadedDecisions] = useState<any[]>([]);

  // Si on a des données préchargées, on commence avec elles
  // Sinon, on charge depuis Convex
  const hasInitialData = initialDecisions && initialDecisions.length > 0;
  const shouldSkipQuery = hasInitialData && displayLimit <= initialDecisions.length;

  // Récupérer les décisions pour le feed
  const clientDecisions = useQuery(
    api.decisions.getDecisions,
    shouldSkipQuery ? "skip" : {
      limit: displayLimit,
    }
  );

  // Fusionner les données préchargées avec les données client
  const decisions = (() => {
    if (hasInitialData && displayLimit <= initialDecisions.length) {
      // Utiliser les données préchargées (plus rapide)
      return initialDecisions.slice(0, displayLimit);
    }
    // Utiliser les données client (chargées au scroll)
    return clientDecisions;
  })();

  // Enrichir les décisions avec les champs calculés si manquants
  const enrichedDecisions = useMemo(() => {
    if (!decisions) return [];
    
    return decisions.map((decision) => {
      // Calculer badgeColor si manquant
      const badgeColor = (decision as any).badgeColor || calculateBadgeColor(
        decision.heat || 50,
        decision.sentiment || "neutral"
      );
      
      // Utiliser emoji par défaut si manquant
      const emoji = (decision as any).emoji || "📰";
      
      // Calculer anticipationsCount si manquant
      const anticipationsCount = (decision as any).anticipationsCount || 0;
      
      return {
        ...decision,
        badgeColor,
        emoji,
        anticipationsCount,
      };
    });
  }, [decisions]);

  // Accumuler les décisions chargées pour créer une liste infinie
  useEffect(() => {
    if (enrichedDecisions.length > 0) {
      setAllLoadedDecisions((prev) => {
        // Éviter les doublons en vérifiant les IDs
        const existingIds = new Set(prev.map(d => d._id));
        const newDecisions = enrichedDecisions.filter(d => !existingIds.has(d._id));
        return [...prev, ...newDecisions];
      });
    }
  }, [enrichedDecisions]);

  // Trouver l'index de la décision initiale
  const initialIndex = allLoadedDecisions.findIndex(
    (d) => d._id === initialDecisionId
  );

  // Scroll vers la décision initiale au chargement
  useEffect(() => {
    if (allLoadedDecisions.length > 0 && initialIndex >= 0 && containerRef.current) {
      const targetCard = containerRef.current.children[initialIndex] as HTMLElement;
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }
  }, [allLoadedDecisions.length, initialIndex]);

  // Charger plus d'événements automatiquement quand on approche de la fin
  useEffect(() => {
    if (!containerRef.current || allLoadedDecisions.length === 0) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      // Si on approche de la fin (dans les 500px), charger plus d'événements
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      if (distanceFromBottom < 500) {
        // Si on a chargé tous les événements disponibles, ajouter les mêmes à la fin pour boucler
        if (decisions && decisions.length < displayLimit) {
          // On a tout chargé, ajouter les mêmes événements à la fin pour créer une boucle infinie
          setAllLoadedDecisions((prev) => [...prev, ...enrichedDecisions]);
        } else {
          // Sinon, charger plus d'événements
          // Si on utilise encore les données préchargées, continuer à les utiliser
          // Sinon, charger depuis Convex
          if (hasInitialData && initialDecisions && displayLimit < initialDecisions.length) {
            // On utilise encore les données préchargées, augmenter la limite pour en afficher plus
            setDisplayLimit((prev) => Math.min(prev + 20, initialDecisions.length));
          } else {
            // Charger plus depuis Convex (on a épuisé les données préchargées ou on n'en a pas)
            setDisplayLimit((prev) => prev + 20);
          }
        }
      }
    };

    const container = containerRef.current;
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [allLoadedDecisions.length, decisions, displayLimit, enrichedDecisions]);

  // Skeleton pour le feed reel qui ressemble exactement à l'UI finale (sans texte)
  function ReelCardSkeleton() {
    return (
      <div className="relative h-screen w-full snap-start snap-always flex flex-col">
        {/* Image de fond skeleton */}
        <div className="absolute inset-0">
          <Skeleton className="w-full h-full rounded-none" />
          {/* Overlay gradient comme dans l'UI réelle */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        </div>

        {/* Contenu superposé */}
        <div className="relative h-full flex flex-col">
          {/* Header skeleton - Exactement comme l'UI */}
          <header className="sticky top-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 via-black/40 to-transparent backdrop-blur-sm">
            {/* Bouton retour */}
            <Skeleton className="h-10 w-10 rounded-full bg-black/40" />
            
            {/* Badges au centre - Deux badges orange + badge gris */}
            <div className="flex items-center gap-2">
              {/* Badge orange avec icône */}
              <Skeleton className="h-6 w-12 rounded-full bg-orange-500/30" />
              {/* Badge orange avec icône */}
              <Skeleton className="h-6 w-12 rounded-full bg-orange-500/30" />
              {/* Badge gris "Annoncée" */}
              <Skeleton className="h-5 w-16 rounded-full bg-gray-500/30" />
            </div>
            
            {/* Save button */}
            <Skeleton className="h-10 w-10 rounded-full bg-black/40" />
          </header>

          {/* Contenu principal skeleton */}
          <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 min-h-0">
            {/* Titre + métadonnées */}
            <div className="space-y-3">
              {/* Titre principal - 2-3 lignes */}
              <div className="space-y-2">
                <Skeleton className="h-7 w-full rounded bg-white/20" />
                <Skeleton className="h-7 w-4/5 rounded bg-white/20" />
              </div>
              {/* Métadonnées (décideur • temps) */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20 rounded bg-white/20" />
                <Skeleton className="h-4 w-1 rounded bg-white/20" />
                <Skeleton className="h-4 w-24 rounded bg-white/20" />
              </div>
            </div>

            {/* Card Quiz - Semi-transparente avec bordure */}
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-4">
              {/* Icône bleue circulaire en haut centre */}
              <div className="flex justify-center">
                <Skeleton className="h-8 w-8 rounded-full bg-blue-500/30" />
              </div>
              
              {/* Question skeleton */}
              <Skeleton className="h-5 w-full rounded bg-white/20" />
              <Skeleton className="h-5 w-5/6 rounded bg-white/20" />
              
              {/* Trois sections de réponses */}
              <div className="space-y-3">
                {/* Section Rouge (en haut) */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                  <Skeleton className="h-8 w-8 rounded-full bg-red-500/40" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-24 rounded bg-white/20" />
                    <Skeleton className="h-3.5 w-full rounded bg-white/15" />
                    <Skeleton className="h-3.5 w-4/5 rounded bg-white/15" />
                  </div>
                  <Skeleton className="h-5 w-5 rounded bg-white/20" />
                </div>
                
                {/* Section Jaune (milieu) */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                  <Skeleton className="h-8 w-8 rounded-full bg-yellow-500/40" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-28 rounded bg-white/20" />
                    <Skeleton className="h-3.5 w-full rounded bg-white/15" />
                    <Skeleton className="h-3.5 w-3/4 rounded bg-white/15" />
                  </div>
                  <Skeleton className="h-5 w-5 rounded bg-white/20" />
                </div>
                
                {/* Section Verte (en bas) */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/20 border border-green-500/30">
                  <Skeleton className="h-8 w-8 rounded-full bg-green-500/40" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-20 rounded bg-white/20" />
                    <Skeleton className="h-3.5 w-full rounded bg-white/15" />
                    <Skeleton className="h-3.5 w-5/6 rounded bg-white/15" />
                  </div>
                  <Skeleton className="h-5 w-5 rounded bg-white/20" />
                </div>
              </div>
            </div>

            {/* Texte descriptif en dessous */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded bg-white/20" />
              <Skeleton className="h-4 w-full rounded bg-white/20" />
              <Skeleton className="h-4 w-3/4 rounded bg-white/20" />
            </div>
          </main>

          {/* Footer skeleton - Exactement comme l'UI */}
          <footer className="sticky bottom-0 z-20 flex items-center justify-between p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-md">
            <div className="flex items-center gap-4">
              {/* Logo 'N' */}
              <Skeleton className="h-10 w-10 rounded-full bg-black/40" />
              {/* Icône share */}
              <Skeleton className="h-10 w-10 rounded-full bg-black/40" />
            </div>
            {/* Compteur anticipations */}
            <Skeleton className="h-4 w-28 rounded bg-white/20" />
          </footer>
        </div>
      </div>
    );
  }

  if (decisions === undefined) {
    return (
      <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory">
        <ReelCardSkeleton />
      </div>
    );
  }

  if (allLoadedDecisions.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Aucune décision disponible</p>
          {onBack && (
            <button
              onClick={onBack}
              className="text-primary hover:underline"
            >
              Retour
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <style jsx global>{`
        .snap-y::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {allLoadedDecisions.map((decision, index) => (
        <DecisionReelCard
          key={`${decision._id}-${index}`}
          decision={decision as any}
          onBack={onBack}
        />
      ))}

      {/* Loading indicator - Toujours afficher pour permettre le chargement infini */}
      {allLoadedDecisions.length > 0 && <ReelCardSkeleton />}
    </div>
  );
}
