"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { SolarIcon } from "@/components/icons/SolarIcon";

interface EventBadgeProps {
  impactLevel?: 1 | 2 | 3 | 4 | 5; // ✅ Échelle d'impact décisionnel (remplace emoji)
  emoji?: string; // ⚠️ Déprécié - utiliser impactLevel à la place (fallback pour compatibilité)
  heat: number; // 0-100
  sentiment: "positive" | "negative" | "neutral";
  badgeColor: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// ✅ Échelle d'Impact Décisionnel Combinée (EIDC)
const impactLabels = {
  1: { label: "Local", icon: "map-point-bold", color: "bg-gray-500" },
  2: { label: "National", icon: "flag-bold", color: "bg-blue-500" },
  3: { label: "Régional", icon: "global-bold", color: "bg-purple-500" },
  4: { label: "International", icon: "planet-bold", color: "bg-orange-500" },
  5: { label: "Global", icon: "earth-bold", color: "bg-red-500" },
};

export function EventBadge({
  impactLevel,
  emoji, // ⚠️ Déprécié - fallback pour compatibilité
  heat,
  sentiment,
  badgeColor,
  className,
  size = "md",
}: EventBadgeProps) {
  // ✅ Utiliser impactLevel si disponible, sinon fallback sur emoji (compatibilité)
  const finalImpactLevel = impactLevel || (emoji ? 3 : 3); // Défaut: Régional si non spécifié
  const impact = impactLabels[finalImpactLevel];
  
  // Déterminer l'intensité de l'animation selon le heat
  const isHot = heat >= 70;
  const isWarm = heat >= 40 && heat < 70;

  // Taille du badge
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-3 py-1 gap-1.5",
    lg: "text-base px-4 py-1.5 gap-2",
  };

  // Animation de pulsation pour les événements chauds
  const pulseAnimation = isHot
    ? {
        scale: [1, 1.05, 1],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }
    : {};

  // Animation subtile pour les événements tièdes
  const glowAnimation = isWarm
    ? {
        boxShadow: [
          `0 0 0 0 ${badgeColor}40`,
          `0 0 8px 2px ${badgeColor}60`,
          `0 0 0 0 ${badgeColor}40`,
        ],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }
    : {};

  return (
    <motion.div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold border-2",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: `${badgeColor}15`,
        borderColor: badgeColor,
        color: badgeColor,
      }}
      animate={{
        ...pulseAnimation,
        ...glowAnimation,
      }}
    >
      {/* ✅ Afficher l'icône d'impact au lieu de l'emoji */}
      <SolarIcon 
        icon={impact.icon} 
        className={cn(
          "leading-none",
          size === "sm" ? "size-3" : size === "md" ? "size-4" : "size-5"
        )}
      />
      <span className="leading-none">
        {impact.label}
      </span>
      {/* Indicateur de chaleur (conservé) */}
      <span className="leading-none ml-1">
        {isHot ? "🔥" : isWarm ? "⚡" : "❄️"}
      </span>
    </motion.div>
  );
}

