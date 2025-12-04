"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

type Language = "fr" | "en" | "es" | "de" | "it" | "pt" | "nl" | "pl";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const [isTranslating, setIsTranslating] = useState(false);
  
  const userLanguage = useQuery(api.translations.getUserLanguage);
  const updateUserLanguage = useMutation(api.translations.updateUserLanguage);

  // Détecter la langue du navigateur au premier chargement
  useEffect(() => {
    if (userLanguage !== undefined) {
      setLanguageState(userLanguage as Language);
    } else {
      // Détecter la langue du navigateur
      const browserLang = navigator.language.split("-")[0] as Language;
      const supportedLanguages: Language[] = ["fr", "en", "es", "de", "it", "pt", "nl", "pl"];
      if (supportedLanguages.includes(browserLang)) {
        setLanguageState(browserLang);
      }
    }
  }, [userLanguage]);

  // Sauvegarder dans localStorage pour persistance
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredLanguage", language);
    }
  }, [language]);

  // Charger depuis localStorage au démarrage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferredLanguage") as Language;
      if (saved && ["fr", "en", "es", "de", "it", "pt", "nl", "pl"].includes(saved)) {
        setLanguageState(saved);
      }
    }
  }, []);

  const setLanguage = async (lang: Language) => {
    // Changer immédiatement la langue pour que l'UI réagisse instantanément
    setLanguageState(lang);
    setIsTranslating(true);
    
    // Sauvegarder en arrière-plan
    updateUserLanguage({ language: lang })
      .catch((error) => {
        console.error("Error updating user language:", error);
      })
      .finally(() => {
        setIsTranslating(false);
      });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

