"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Composant pour réinitialiser le scroll en haut de page lors de la navigation
 * Résout le problème où le scroll est conservé entre les pages avec View Transitions
 */
export function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Réinitialiser le scroll en haut de page à chaque changement de route
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    
    // S'assurer que le scroll est bien réinitialisé même après les View Transitions
    const timeoutId = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}

