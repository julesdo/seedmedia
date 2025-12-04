"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLanguage } from "@/contexts/LanguageContext";

const DEFAULT_LANGUAGE = "fr";
const TRANSLATION_CACHE_LOCAL = new Map<string, string>();

/**
 * Hook pour traduire automatiquement du texte
 * Utilise le cache Convex, le cache local et l'API Next.js
 */
export function useTranslation() {
  const { language } = useLanguage();
  const saveTranslation = useMutation(api.translations.saveTranslation);

  const translate = async (text: string, sourceLanguage: string = DEFAULT_LANGUAGE): Promise<string> => {
    // Si la langue cible est la même que la source, retourner le texte original
    if (language === sourceLanguage || language === DEFAULT_LANGUAGE) {
      return text;
    }

    // Vérifier le cache local d'abord
    const cacheKey = `${sourceLanguage}_${language}_${text}`;
    if (TRANSLATION_CACHE_LOCAL.has(cacheKey)) {
      return TRANSLATION_CACHE_LOCAL.get(cacheKey)!;
    }

    // Si le texte est vide, retourner vide
    if (!text || text.trim() === "") {
      return text;
    }

    try {
      // Vérifier le cache Convex (via query)
      // Note: On ne peut pas utiliser useQuery ici car c'est dans une fonction async
      // On va directement appeler l'API Next.js et sauvegarder dans Convex après

      // Appeler l'API Next.js pour traduire
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          sourceLanguage,
          targetLanguage: language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const translated = data.translatedText || text;

        // Vérifier que la traduction est différente du texte original
        if (translated && translated !== text) {
          // Mettre en cache localement
          TRANSLATION_CACHE_LOCAL.set(cacheKey, translated);

          // Sauvegarder dans Convex (en arrière-plan, ne pas attendre)
          saveTranslation({
            text,
            translatedText: translated,
            sourceLanguage,
            targetLanguage: language,
          }).catch((err) => {
            console.error("Error saving translation to cache:", err);
          });

          return translated;
        }
      } else {
        console.error("Translation API error:", response.status, response.statusText);
      }

      return text;
    } catch (error) {
      console.error("Translation error:", error);
      return text; // Retourner le texte original en cas d'erreur
    }
  };

  const translateBatchTexts = async (
    texts: string[],
    sourceLanguage: string = DEFAULT_LANGUAGE
  ): Promise<string[]> => {
    if (language === sourceLanguage || language === DEFAULT_LANGUAGE) {
      return texts;
    }

    // Traduire en parallèle
    const translations = await Promise.all(
      texts.map((text) => translate(text, sourceLanguage))
    );

    return translations;
  };

  return { translate, translateBatch: translateBatchTexts, currentLanguage: language };
}

/**
 * Hook pour traduire automatiquement du texte avec état de chargement
 * Vérifie d'abord le cache Convex, puis appelle l'API si nécessaire
 */
export function useAutoTranslation(text: string, sourceLanguage: string = DEFAULT_LANGUAGE) {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const { translate } = useTranslation();
  
  // Vérifier le cache Convex d'abord
  const cachedTranslation = useQuery(
    api.translations.getCachedTranslation,
    language !== sourceLanguage && language !== DEFAULT_LANGUAGE && text
      ? {
          text,
          sourceLanguage,
          targetLanguage: language,
        }
      : "skip"
  );

  useEffect(() => {
    if (language === sourceLanguage || language === DEFAULT_LANGUAGE) {
      setTranslatedText(text);
      setIsLoading(false);
      return;
    }

    if (!text || text.trim() === "") {
      setTranslatedText(text);
      setIsLoading(false);
      return;
    }

    // Si on a une traduction en cache, l'utiliser
    if (cachedTranslation) {
      setTranslatedText(cachedTranslation);
      setIsLoading(false);
      return;
    }

    // Sinon, traduire via l'API
    setIsLoading(true);
    translate(text, sourceLanguage)
      .then((translated) => {
        setTranslatedText(translated);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Auto translation error:", error);
        setTranslatedText(text);
        setIsLoading(false);
      });
  }, [text, language, sourceLanguage, translate, cachedTranslation]);

  return { translatedText, isLoading };
}

