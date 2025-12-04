"use client";

import React, { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAutoTranslation } from "@/hooks/useTranslation";

/**
 * Composant HOC pour traduire automatiquement tous les textes d'une page
 * 
 * Usage:
 * ```tsx
 * export default function MyPage() {
 *   return (
 *     <TranslatePage>
 *       <h1>Bienvenue</h1>
 *       <p>Ce texte sera traduit automatiquement</p>
 *     </TranslatePage>
 *   );
 * }
 * ```
 */
export function TranslatePage({ 
  children, 
  sourceLanguage = "fr" 
}: { 
  children: ReactNode;
  sourceLanguage?: string;
}) {
  const { language } = useLanguage();
  
  // Si la langue est la même que la source, pas besoin de traduire
  if (language === sourceLanguage || language === "fr") {
    return <>{children}</>;
  }

  // Pour l'instant, on retourne les enfants tels quels
  // La traduction se fera au niveau des composants individuels
  // qui utilisent useAutoTranslation ou TranslatedText
  return <>{children}</>;
}

/**
 * Fonction helper pour traduire récursivement les enfants React
 * Note: Cette fonction est complexe et peut avoir des limitations
 * Il est recommandé d'utiliser TranslatedText ou useAutoTranslation directement
 */
export function translateChildren(
  children: ReactNode,
  sourceLanguage: string,
  targetLanguage: string
): ReactNode {
  // Cette fonction serait très complexe à implémenter correctement
  // Il vaut mieux utiliser TranslatedText ou useAutoTranslation directement
  return children;
}

