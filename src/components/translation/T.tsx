"use client";

import React from "react";
import { useAutoTranslation } from "@/hooks/useTranslation";

const DEFAULT_LANGUAGE = "fr";

interface TProps {
  children: string;
  sourceLanguage?: string;
  fallback?: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

/**
 * Composant simple pour traduire automatiquement du texte
 * 
 * Usage:
 * <T>Bonjour</T>
 * <T as="h1" className="text-2xl">Bienvenue</T>
 */
export function T({ 
  children, 
  sourceLanguage = DEFAULT_LANGUAGE,
  fallback,
  as: Component = "span",
  className
}: TProps) {
  const { translatedText, isLoading } = useAutoTranslation(children, sourceLanguage);
  
  if (isLoading && fallback) {
    return <>{fallback}</>;
  }
  
  return <Component className={className}>{translatedText}</Component>;
}

/**
 * Hook pour traduire dans les composants
 * 
 * Usage:
 * const { t } = useT();
 * <p>{t("Bonjour")}</p>
 */
export function useT(sourceLanguage: string = DEFAULT_LANGUAGE) {
  // Note: Ce hook ne peut pas retourner directement le texte traduit
  // car la traduction est asynchrone. Utilisez plutôt le composant <T> ou useAutoTranslation
  return {
    t: (text: string) => {
      // Cette fonction retourne le texte original
      // Pour la traduction, utilisez useAutoTranslation directement
      return text;
    }
  };
}

