"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { EventBadge } from "@/components/decisions/EventBadge";
import { useTranslations } from 'next-intl';

// ✅ Échelle d'Impact Décisionnel Combinée (EIDC)
const impactLabels = {
  1: { label: "Local", icon: "map-point-bold" },
  2: { label: "National", icon: "flag-bold" },
  3: { label: "Régional", icon: "global-bold" },
  4: { label: "International", icon: "planet-bold" },
  5: { label: "Global", icon: "earth-bold" },
};

interface Decision {
  _id: Id<"decisions">;
  title: string;
  slug: string;
  decider: string;
  date: number;
  type: string;
  status: "announced" | "tracking" | "resolved";
  impactLevel?: 1 | 2 | 3 | 4 | 5; // ✅ Échelle d'impact décisionnel
  emoji?: string; // ⚠️ Déprécié - fallback pour compatibilité
  badgeColor: string;
  imageUrl?: string;
  sentiment?: "positive" | "negative" | "neutral";
  heat?: number;
}

interface MapDecisionCardProps {
  decision: Decision;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  canNavigateLeft?: boolean;
  canNavigateRight?: boolean;
  className?: string;
}

export function MapDecisionCard({
  decision,
  onSwipeLeft,
  onSwipeRight,
  onNavigateLeft,
  onNavigateRight,
  canNavigateLeft = false,
  canNavigateRight = false,
  className,
}: MapDecisionCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const SWIPE_THRESHOLD = 50;
  const SWIPE_VELOCITY_THRESHOLD = 0.3;
  const VERTICAL_THRESHOLD = 30;

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setIsSwiping(false);
    setSwipeOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Ignorer si le mouvement vertical est plus important
    if (Math.abs(deltaY) > Math.abs(deltaX) + VERTICAL_THRESHOLD) {
      return;
    }

    setIsSwiping(true);
    setSwipeOffset(deltaX);

    // Empêcher le scroll pendant le swipe horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current) {
      setIsSwiping(false);
      setSwipeOffset(0);
      return;
    }

    const deltaX = swipeOffset;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(deltaX) / deltaTime;

    const isSwipeLongEnough = Math.abs(deltaX) > SWIPE_THRESHOLD;
    const isSwipeFastEnough = velocity > SWIPE_VELOCITY_THRESHOLD;

    if (isSwipeLongEnough || isSwipeFastEnough) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    touchStartRef.current = null;
    setIsSwiping(false);
    setSwipeOffset(0);
  };

  const t = useTranslations('decisions');
  const decisionDate = new Date(decision.date);
  const timeAgo = formatDistanceToNow(decisionDate, { addSuffix: true, locale: fr });

  const statusLabels: Record<string, string> = {
    resolved: t('resolved'),
    tracking: t('tracking'),
    announced: t('announced'),
  };

  const statusColors: Record<string, string> = {
    announced: "text-blue-600 dark:text-blue-400",
    tracking: "text-orange-600 dark:text-orange-400",
    resolved: "text-green-600 dark:text-green-400",
  };

  const typeLabels: Record<string, string> = {
    law: t('types.law'),
    sanction: t('types.sanction'),
    tax: t('types.tax'),
    agreement: t('types.agreement'),
    policy: t('types.policy'),
    regulation: t('types.regulation'),
    crisis: t('types.crisis'),
    disaster: t('types.disaster'),
    conflict: t('types.conflict'),
    discovery: t('types.discovery'),
    election: t('types.election'),
    economic_event: t('types.economic_event'),
    other: t('types.other'),
  };

  return (
    <div className="relative">
      {/* Boutons de navigation desktop */}
      <div className="hidden lg:flex absolute -left-12 top-1/2 -translate-y-1/2 z-10 gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onNavigateLeft}
          disabled={!canNavigateLeft}
          className="h-10 w-10 rounded-full bg-background/95 backdrop-blur-md border-border/50 shadow-lg hover:bg-background disabled:opacity-30"
        >
          <SolarIcon icon="alt-arrow-left-bold" className="size-5" />
        </Button>
      </div>
      <div className="hidden lg:flex absolute -right-12 top-1/2 -translate-y-1/2 z-10 gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onNavigateRight}
          disabled={!canNavigateRight}
          className="h-10 w-10 rounded-full bg-background/95 backdrop-blur-md border-border/50 shadow-lg hover:bg-background disabled:opacity-30"
        >
          <SolarIcon icon="alt-arrow-right-bold" className="size-5" />
        </Button>
      </div>

      {/* Card principale - Format horizontal compact */}
      <article
        ref={cardRef}
        className={cn(
          "group relative flex items-stretch overflow-hidden bg-card border border-border/50 rounded-lg shadow-sm",
          "transition-transform duration-200 ease-out",
          isSwiping && "transition-none",
          className
        )}
        style={{
          transform: isSwiping ? `translateX(${swipeOffset}px)` : "translateX(0)",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image à gauche - Format compact - Hauteur complète */}
        {decision.imageUrl ? (
          <div className="relative w-24 sm:w-28 shrink-0 overflow-hidden bg-muted self-stretch">
            <Image
              src={decision.imageUrl}
              alt={decision.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 96px, 112px"
            />
          </div>
        ) : (
          <div 
            className="relative w-24 sm:w-28 shrink-0 flex items-center justify-center self-stretch"
            style={{ backgroundColor: decision.badgeColor }}
          >
            {/* ✅ Afficher l'icône d'impact au lieu de l'emoji */}
            {decision.impactLevel ? (
              <SolarIcon 
                icon={impactLabels[decision.impactLevel]?.icon || "document-bold"} 
                className="size-8 text-white"
              />
            ) : decision.emoji ? (
              <span className="text-3xl">{decision.emoji}</span>
            ) : null}
          </div>
        )}

        {/* Contenu à droite - Compact */}
        <div className="flex-1 flex flex-col min-w-0 px-3 sm:px-4 py-3">
          {/* Header avec EventBadge et status */}
          <div className="flex items-center gap-2 mb-1.5">
            <EventBadge
              impactLevel={decision.impactLevel}
              emoji={decision.emoji} // Fallback pour compatibilité
              heat={decision.heat || 50}
              sentiment={decision.sentiment || "neutral"}
              badgeColor={decision.badgeColor}
              size="sm"
            />
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs px-1.5 py-0.5",
                statusColors[decision.status]
              )}
            >
              {statusLabels[decision.status]}
            </Badge>
            {decision.type && (
              <Badge 
                variant="outline" 
                className="text-xs px-1.5 py-0.5"
              >
                {typeLabels[decision.type] || decision.type}
              </Badge>
            )}
          </div>

          {/* Titre */}
          <h3 className="font-semibold text-sm sm:text-base leading-tight text-foreground line-clamp-2 mb-1.5 flex-1">
            {decision.title}
          </h3>

          {/* Métadonnées et bouton */}
          <div className="flex items-center justify-between gap-2 mt-auto">
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
              <span className="truncate">{decision.decider}</span>
              <span>•</span>
              <span className="shrink-0">{timeAgo}</span>
            </div>
            <Button
              onClick={() => router.push(`/${decision.slug}`)}
              variant="default"
              size="sm"
              className="h-7 px-3 text-xs font-medium shrink-0"
            >
              Voir
              <SolarIcon icon="arrow-right-bold" className="size-3 ml-1" />
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
