"use client";

import { useAutoTranslation } from "./useTranslation";

const DEFAULT_LANGUAGE = "fr";

/**
 * Hook simple pour traduire du texte
 * Usage: const t = useT(); t("Bonjour")
 */
export function useT(sourceLanguage: string = DEFAULT_LANGUAGE) {
  return (text: string): string => {
    // Pour l'instant, on retourne le texte tel quel
    // La traduction se fera via useAutoTranslation dans le composant T
    return text;
  };
}

/**
 * Composant simple pour traduire du texte
 * Usage: <T>Bonjour</T>
 */
export function T({ 
  children, 
  sourceLanguage = DEFAULT_LANGUAGE 
}: { 
  children: string;
  sourceLanguage?: string;
}) {
  const { translatedText, isLoading } = useAutoTranslation(children, sourceLanguage);
  
  if (isLoading) {
    return <>{children}</>; // Afficher le texte original pendant le chargement
  }
  
  return <>{translatedText}</>;
}

