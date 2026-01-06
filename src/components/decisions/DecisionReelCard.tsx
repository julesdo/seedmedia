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
import { QuizSimple } from "./QuizSimple";
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
    emoji: string;
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
        <div className="absolute inset-0">
          <Image
            src={decision.imageUrl}
            alt={decision.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Overlay gradient pour lisibilité */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        </div>
      )}

      {/* Contenu Superposé */}
      <div className="relative h-full flex flex-col">
        {/* Header Minimaliste - Sticky Top */}
        <header className="sticky top-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 via-black/40 to-transparent backdrop-blur-sm pointer-events-none">
          {/* Bouton Retour - Toujours visible */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack || (() => router.back())}
            className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border-0 pointer-events-auto"
          >
            <SolarIcon icon="alt-arrow-left-bold" className="size-5" />
          </Button>

          {/* Badge Statut */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <EventBadge
              emoji={decision.emoji}
              heat={decision.heat}
              sentiment={decision.sentiment}
              badgeColor={decision.badgeColor}
              size="sm"
            />
            <Badge
              variant="secondary"
              className="bg-black/40 backdrop-blur-md text-white border-0 text-xs"
            >
              {statusLabels[decision.status]}
            </Badge>
          </div>

          {/* Save Button */}
          <div className="pointer-events-auto">
            <SaveButton
              decisionId={decision._id}
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border-0"
            />
          </div>
        </header>

        {/* Contenu Principal - Scrollable */}
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

          {/* Quiz Compact Intégré */}
          {decision.status !== "resolved" && (
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <QuizSimple
                decisionId={decision._id}
                question={decision.question}
                answer1={decision.answer1}
                answer2={decision.answer2}
                answer3={decision.answer3}
                status={decision.status}
                compact
              />
            </div>
          )}

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

        {/* Actions Bar - Sticky Bottom */}
        <footer className="sticky bottom-0 z-20 flex items-center justify-between p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-md mt-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border-0"
            >
              <SolarIcon icon="heart-bold" className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border-0"
              onClick={() => router.push(`/${decision.slug}`)}
            >
              <SolarIcon icon="share-bold" className="size-5" />
            </Button>
          </div>
          <div className="text-xs text-white/60">
            {decision.anticipationsCount} anticipations
          </div>
        </footer>
      </div>
    </div>
  );
}

