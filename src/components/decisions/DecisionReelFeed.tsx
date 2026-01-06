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
  onBack?: () => void;
}

export function DecisionReelFeed({
  initialDecisionId,
  onBack,
}: DecisionReelFeedProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [allLoadedDecisions, setAllLoadedDecisions] = useState<any[]>([]);

  // Récupérer les décisions pour le feed
  const decisions = useQuery(api.decisions.getDecisions, {
    limit: displayLimit,
  });

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
          setDisplayLimit((prev) => prev + 20);
        }
      }
    };

    const container = containerRef.current;
    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [allLoadedDecisions.length, decisions, displayLimit, enrichedDecisions]);

  if (decisions === undefined) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-screen w-full rounded-none" />
        </div>
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
      {allLoadedDecisions.length > 0 && (
        <div className="h-screen snap-start flex items-center justify-center">
          <Skeleton className="h-screen w-full rounded-none" />
        </div>
      )}
    </div>
  );
}
