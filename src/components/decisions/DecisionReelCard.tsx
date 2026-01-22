"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { SaveButton } from "./SaveButton";
import { EventBadge } from "./EventBadge";
import { TradingInterfaceReels } from "./TradingInterfaceReels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DecisionReelCardProps {
  decision: {
    _id: Id<"decisions">;
    title: string;
    slug: string;
    decider: string;
    deciderType: "country" | "institution" | "leader" | "organization";
    date: number;
    type: string;
    impactedDomains: string[];
    imageUrl?: string;
    status: "announced" | "tracking" | "resolved";
    anticipationsCount: number;
    question: string;
    answer1: string;
    answer2: string;
    answer3: string;
    sentiment: "positive" | "negative" | "neutral";
    heat: number;
    impactLevel?: 1 | 2 | 3 | 4 | 5; // ✅ Échelle d'impact décisionnel
    emoji?: string; // ⚠️ Déprécié - fallback pour compatibilité
    badgeColor: string;
    description?: string;
  };
  onBack?: () => void;
  className?: string;
}

const statusLabels: Record<string, string> = {
  announced: "Annoncée",
  tracking: "En suivi",
  resolved: "Résolue",
};

export function DecisionReelCard({
  decision,
  onBack,
  className,
}: DecisionReelCardProps) {
  const router = useRouter();
  const mainContentRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const decisionDate = new Date(decision.date);
  const timeAgo = formatDistanceToNow(decisionDate, { addSuffix: true });

  // Réinitialiser le scroll quand l'ID change (immédiatement)
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [decision._id]);

  // Réinitialiser aussi quand la card devient visible (pour le scroll vers le haut)
  useEffect(() => {
    if (!cardRef.current || !mainContentRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Quand la card est visible (60%+), réinitialiser le scroll
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            // Utiliser un petit délai pour laisser le snap se terminer
            setTimeout(() => {
              if (mainContentRef.current) {
                mainContentRef.current.scrollTop = 0;
              }
            }, 150); // 150ms pour laisser le snap se terminer complètement
          }
        });
      },
      {
        threshold: [0.6, 0.8, 1.0], // Déclencher à 60%, 80% et 100%
        rootMargin: "0px",
      }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, [decision._id]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative h-screen w-full snap-start snap-always flex flex-col",
        className
      )}
    >
      {/* Image Background avec Overlay Gradient */}
      {decision.imageUrl && (
        <div className="absolute inset-0" style={{ aspectRatio: '9/16', minHeight: '400px' }}>
          <Image
            src={decision.imageUrl}
            alt={decision.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={80}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
          {/* Overlay gradient progressif style TikTok - Plus foncé vers le bas - Utilise la couleur de bg */}
          {/* Au niveau du titre (50-60%), overlay suffisamment sombre pour la lecture, puis de plus en plus foncé */}
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, 
                hsl(var(--background) / 0.95) 0%,
                hsl(var(--background) / 0.92) 15%,
                hsl(var(--background) / 0.85) 30%,
                hsl(var(--background) / 0.75) 45%,
                hsl(var(--background) / 0.70) 55%,
                hsl(var(--background) / 0.60) 65%,
                hsl(var(--background) / 0.45) 75%,
                hsl(var(--background) / 0.30) 85%,
                hsl(var(--background) / 0.15) 95%,
                hsl(var(--background) / 0.05) 100%
              )`
            }}
          />
        </div>
      )}

      {/* Contenu Superposé - Sans header spécial */}
      <div className="relative h-full flex flex-col">

        {/* Trading Interface Style Reels - Fullscreen (remplace le contenu principal si non résolu) */}
        {decision.status !== "resolved" ? (
          <div className="flex-1 min-h-0 relative">
            <TradingInterfaceReels
              decisionId={decision._id}
              question={decision.question}
              answer1={decision.answer1}
              status={decision.status}
              description={decision.description}
            />
          </div>
        ) : (
          <main ref={mainContentRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 min-h-0">
            {/* Titre + Décideur */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight drop-shadow-lg">
                {decision.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span>{decision.decider}</span>
                <span>•</span>
                <span>{timeAgo}</span>
              </div>
            </div>

            {/* Détails - Toujours affichés */}
            <div className="space-y-3">
              {decision.description && (
                <p className="text-sm text-white/90 leading-relaxed">
                  {decision.description}
                </p>
              )}
              {decision.impactedDomains.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {decision.impactedDomains.map((domain) => (
                    <Badge
                      key={domain}
                      variant="outline"
                      className="bg-black/30 backdrop-blur-md text-white border-white/20 text-xs"
                    >
                      {domain}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </main>
        )}

        {/* Pas de footer spécial - On utilise la BottomNav classique */}
      </div>
    </div>
  );
}

