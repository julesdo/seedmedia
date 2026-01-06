"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface EventBadgeProps {
  emoji: string;
  heat: number; // 0-100
  sentiment: "positive" | "negative" | "neutral";
  badgeColor: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EventBadge({
  emoji,
  heat,
  sentiment,
  badgeColor,
  className,
  size = "md",
}: EventBadgeProps) {
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
      <motion.span
        className="text-lg leading-none"
        animate={
          isHot
            ? {
                rotate: [0, 5, -5, 0],
                transition: {
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                },
              }
            : {}
        }
      >
        {emoji}
      </motion.span>
      <span className="leading-none">
        {isHot ? "🔥" : isWarm ? "⚡" : "❄️"}
      </span>
    </motion.div>
  );
}

