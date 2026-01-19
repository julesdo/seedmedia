"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Plus } from "lucide-react";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

/**
 * Formate un nombre avec abréviations (K, M, B) si nécessaire
 * Limite l'affichage pour éviter le dépassement
 */
function formatSeedsAmount(value: number): string {
  const absVal = Math.abs(value);
  
  // Si le nombre a plus de 9 chiffres (milliards), utiliser B
  if (absVal >= 1000000000) {
    const bValue = value / 1000000000;
    if (absVal >= 10000000000) {
      return `${bValue.toFixed(1)}B`;
    }
    return `${bValue.toFixed(2)}B`;
  }
  
  // Si le nombre a plus de 6 chiffres (millions), utiliser M
  if (absVal >= 1000000) {
    const mValue = value / 1000000;
    if (absVal >= 10000000) {
      return `${mValue.toFixed(1)}M`;
    }
    return `${mValue.toFixed(2)}M`;
  }
  
  // Si le nombre a plus de 3 chiffres (milliers), utiliser K
  if (absVal >= 1000) {
    const kValue = value / 1000;
    if (absVal >= 100000) {
      return `${kValue.toFixed(1)}K`;
    }
    return `${kValue.toFixed(2)}K`;
  }
  
  // Moins de 1K : afficher tel quel
  return value.toLocaleString('fr-FR');
}

interface SeedsDisplayWithShopProps {
  /**
   * Variant d'affichage
   * - "reel": Style pour le mode reel (texte blanc, sans fond, drop-shadow)
   * - "default": Style pour les headers normaux (texte foreground, avec fond subtil)
   */
  variant?: "reel" | "default";
  /**
   * Taille du bouton +
   * - "sm": size-8 (pour mobile/reel)
   * - "md": size-9 (pour desktop)
   */
  buttonSize?: "sm" | "md";
  /**
   * Classe CSS supplémentaire pour le conteneur
   */
  className?: string;
  /**
   * Si true, utilise motion.div pour les animations (reel mode)
   */
  animated?: boolean;
}

export function SeedsDisplayWithShop({
  variant = "default",
  buttonSize = "sm",
  className,
  animated = false,
}: SeedsDisplayWithShopProps) {
  const { user: currentUser, isAuthenticated } = useUser();
  const router = useRouter();
  const previousBalanceRef = useRef<number>(0);
  const isInitialMountRef = useRef(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayText, setDisplayText] = useState("0");

  // Motion value pour l'animation de compteur
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 100,
    damping: 20,
  });
  const roundedValue = useTransform(spring, (value) => Math.round(value));

  useEffect(() => {
    if (!currentUser?.seedsBalance) {
      previousBalanceRef.current = 0;
      isInitialMountRef.current = true;
      motionValue.set(0);
      setDisplayText("0");
      return;
    }

    const currentBalance = currentUser.seedsBalance;

    // Ignorer le premier rendu
    if (isInitialMountRef.current) {
      previousBalanceRef.current = currentBalance;
      isInitialMountRef.current = false;
      motionValue.set(currentBalance);
      setDisplayText(formatSeedsAmount(currentBalance));
      return;
    }

    // Si la balance a changé, animer vers la nouvelle valeur
    if (currentBalance !== previousBalanceRef.current) {
      const isGain = currentBalance > previousBalanceRef.current;
      
      if (isGain) {
        setIsAnimating(true);
      }
      
      motionValue.set(currentBalance);
      setDisplayText(formatSeedsAmount(currentBalance));
      previousBalanceRef.current = currentBalance;
    }
  }, [currentUser?.seedsBalance, motionValue]);

  // Réinitialiser l'animation après un délai
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  const isReelVariant = variant === "reel";
  const isSmallButton = buttonSize === "sm";

  const Container = animated ? motion.div : "div";
  const containerProps = animated
    ? {
        initial: { opacity: 0, y: -5 },
        animate: { opacity: 1, y: 0 },
      }
    : {};

  const content = (
    <Container
      {...containerProps}
      className={cn("flex items-center gap-2 min-w-0", className)}
    >
      {/* Petit bouton + en bleu pour le shop */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/shop")}
        className={cn(
          "rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 border border-blue-400/50 flex items-center justify-center shadow-md shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 shrink-0",
          isSmallButton ? "size-6 sm:size-8" : "size-9"
        )}
      >
        <Plus
          className={cn(
            "text-white font-bold",
            isSmallButton ? "size-3 sm:size-4" : "size-[18px]"
          )}
          strokeWidth={3}
        />
      </motion.button>

      {/* Solde de Seeds avec animation de compteur */}
      <motion.div 
        className="flex items-center gap-1.5 min-w-0 flex-1"
        animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <span
          className={cn(
            "font-bold tracking-tight truncate min-w-0 max-w-[80px] sm:max-w-[120px]",
            isReelVariant
              ? "text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              : "text-sm font-semibold text-foreground"
          )}
          title={currentUser?.seedsBalance?.toLocaleString('fr-FR')}
        >
          {displayText}
        </span>
        <motion.div
          className="shrink-0"
          animate={isAnimating ? { rotate: [0, -15, 15, -15, 0], scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <SolarIcon
            icon="leaf-bold"
            className={cn(
              "shrink-0",
              isReelVariant
                ? "size-4 text-primary drop-shadow-[0_0_3px_rgba(var(--primary),0.6)]"
                : "size-4 text-primary"
            )}
          />
        </motion.div>
      </motion.div>
    </Container>
  );

  return content;
}

