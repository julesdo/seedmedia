"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@/contexts/UserContext";

/**
 * Bandeau de top prédictions défilant
 * Affiche les prédictions les plus actives basées sur la liquidité
 */
export function BreakingNewsBanner() {
  const router = useRouter();
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // Récupérer les top prédictions basées sur la liquidité
  const topPredictions = useQuery(api.decisions.getTopPredictions, {
    limit: 3,
    minLiquidity: 100, // Minimum 100 Seeds de liquidité
  });

  // Mettre à jour la variable CSS pour ajuster le top des autres éléments
  useEffect(() => {
    const shouldShow = topPredictions && topPredictions.length > 0 && (user?.showBreakingNews !== false);
    if (shouldShow) {
      document.documentElement.style.setProperty("--breaking-news-height", "40px");
    } else {
      document.documentElement.style.setProperty("--breaking-news-height", "0px");
    }
  }, [topPredictions, user?.showBreakingNews]);

  // Si pas de top prédictions ou si l'utilisateur a désactivé l'affichage, ne rien afficher
  if (!topPredictions || topPredictions.length === 0) {
    return null;
  }

  // Vérifier la préférence utilisateur (défaut: true si non défini)
  if (user?.showBreakingNews === false) {
    return null;
  }

  // Prendre la première top prédiction
  const prediction = topPredictions[0];

  // Formater la liquidité
  const formatLiquidity = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return Math.round(amount).toLocaleString();
  };

  return (
    <>
      <div
        className={cn(
          "sticky top-0 left-0 right-0 z-50 h-10 border-b border-primary/20 bg-gradient-to-r",
          "from-primary/90 via-primary/80 to-primary/70",
          "backdrop-blur-sm supports-[backdrop-filter]:bg-primary/95",
          "lg:fixed lg:left-[244px] lg:right-[319px]"
        )}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onClick={() => router.push(`/${prediction.slug}`)}
      >
        <div className="flex items-center h-full overflow-hidden cursor-pointer group">
          {/* Badge "TOP PRÉDICTION" */}
          <div className="flex items-center gap-2 px-4 h-full bg-black/20 shrink-0">
            <div className="flex items-center gap-1.5">
              <SolarIcon icon="chart-2-bold" className="size-4 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Top Prédiction
              </span>
            </div>
          </div>

          {/* Texte défilant avec liquidité */}
          <div className="flex-1 relative overflow-hidden">
            <div
              ref={scrollRef}
              className={cn(
                "flex items-center gap-3 text-sm font-medium text-white whitespace-nowrap",
                !isPaused && "animate-scroll"
              )}
            >
              <span className="ml-4">{prediction.title}</span>
              <span className="text-white/70">•</span>
              <span className="text-white/90 text-xs">{prediction.decider}</span>
              <span className="text-white/70">•</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20">
                <SolarIcon icon="wallet-bold" className="size-3 text-white" />
                <span className="text-xs font-semibold text-white">
                  {formatLiquidity(prediction.totalLiquidity)} Seeds
                </span>
              </div>
              {/* Dupliquer pour effet de boucle continue */}
              <span className="ml-8">{prediction.title}</span>
              <span className="text-white/70">•</span>
              <span className="text-white/90 text-xs">{prediction.decider}</span>
              <span className="text-white/70">•</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20">
                <SolarIcon icon="wallet-bold" className="size-3 text-white" />
                <span className="text-xs font-semibold text-white">
                  {formatLiquidity(prediction.totalLiquidity)} Seeds
                </span>
              </div>
            </div>
          </div>

          {/* Flèche droite */}
          <div className="px-4 shrink-0">
            <SolarIcon
              icon="arrow-right-bold"
              className="size-4 text-white/80 group-hover:text-white transition-colors"
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll-left 30s linear infinite;
        }
      `}</style>
    </>
  );
}

