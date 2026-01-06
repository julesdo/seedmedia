"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@/contexts/UserContext";

/**
 * Bandeau de breaking news défilant
 * S'affiche au-dessus de la top bar pour les événements importants
 */
export function BreakingNewsBanner() {
  const router = useRouter();
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // Récupérer les breaking news importantes (heat >= 70 et récentes)
  const breakingNews = useQuery(api.decisions.getBreakingNews, {});

  // Mettre à jour la variable CSS pour ajuster le top des autres éléments
  useEffect(() => {
    const shouldShow = breakingNews && breakingNews.length > 0 && (user?.showBreakingNews !== false);
    if (shouldShow) {
      document.documentElement.style.setProperty("--breaking-news-height", "40px");
    } else {
      document.documentElement.style.setProperty("--breaking-news-height", "0px");
    }
  }, [breakingNews, user?.showBreakingNews]);

  // Si pas de breaking news ou si l'utilisateur a désactivé l'affichage, ne rien afficher
  if (!breakingNews || breakingNews.length === 0) {
    return null;
  }

  // Vérifier la préférence utilisateur (défaut: true si non défini)
  if (user?.showBreakingNews === false) {
    return null;
  }

  // Prendre la première breaking news
  const news = breakingNews[0];

  return (
    <>
      <div
        className={cn(
          "sticky top-0 left-0 right-0 z-50 h-10 border-b border-border/50 bg-gradient-to-r",
          "from-blue-900 via-blue-800 to-blue-700 dark:from-blue-950 dark:via-blue-900 dark:to-blue-800",
          "backdrop-blur-sm supports-[backdrop-filter]:bg-blue-900/95 dark:supports-[backdrop-filter]:bg-blue-950/95",
          "lg:fixed lg:left-[244px] lg:right-[319px]"
        )}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onClick={() => router.push(`/${news.slug}`)}
      >
        <div className="flex items-center h-full overflow-hidden cursor-pointer group">
          {/* Badge "BREAKING" */}
          <div className="flex items-center gap-2 px-4 h-full bg-black/20 dark:bg-black/40 shrink-0">
            <div className="flex items-center gap-1.5">
              <SolarIcon icon="fire-bold" className="size-4 text-white animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Breaking
              </span>
            </div>
          </div>

          {/* Texte défilant */}
          <div className="flex-1 relative overflow-hidden">
            <div
              ref={scrollRef}
              className={cn(
                "flex items-center gap-3 text-sm font-medium text-white whitespace-nowrap",
                !isPaused && "animate-scroll"
              )}
            >
              <span className="ml-4">{news.title}</span>
              <span className="text-white/70">•</span>
              <span className="text-white/90 text-xs">{news.decider}</span>
              {/* Dupliquer pour effet de boucle continue */}
              <span className="ml-8">{news.title}</span>
              <span className="text-white/70">•</span>
              <span className="text-white/90 text-xs">{news.decider}</span>
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

