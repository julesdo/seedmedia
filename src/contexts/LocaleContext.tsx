"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { routing } from '@/i18n/routing';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from './UserContext';

interface LocaleContextType {
  locale: string;
  changeLocale: (locale: string) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Cache par défaut pour les messages chargés (si non fourni)
const defaultMessagesCache: Record<string, any> = {};

export function LocaleProvider({ 
  children, 
  initialLocale,
  onLocaleChange,
  messagesCache: externalCache
}: { 
  children: ReactNode;
  initialLocale: string;
  onLocaleChange: (locale: string, messages: any) => void;
  messagesCache?: Record<string, any>;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const cache = externalCache || defaultMessagesCache;
  const { user, isAuthenticated } = useUser();
  const updateUserProfile = useMutation(api.users.updateUserProfile);

  const changeLocale = async (newLocale: string) => {
    if (newLocale === locale || !routing.locales.includes(newLocale as any)) {
      return;
    }

    // Définir le cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Sauvegarder dans localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredLanguage", newLocale);
      localStorage.setItem("NEXT_LOCALE", newLocale);
    }

    // Sauvegarder dans Convex si l'utilisateur est connecté
    if (isAuthenticated) {
      try {
        await updateUserProfile({ preferredLanguage: newLocale });
      } catch (error) {
        console.error('Failed to save language preference to Convex:', error);
        // Continuer même si la sauvegarde échoue
      }
    }

    // Si les messages sont déjà en cache, les utiliser
    if (cache[newLocale]) {
      setLocale(newLocale);
      onLocaleChange(newLocale, cache[newLocale]);
      return;
    }

    // Sinon, charger les messages dynamiquement
    try {
      const newMessages = (await import(`../../messages/${newLocale}.json`)).default;
      cache[newLocale] = newMessages;
      setLocale(newLocale);
      onLocaleChange(newLocale, newMessages);
    } catch (error) {
      console.error(`Failed to load messages for locale ${newLocale}:`, error);
      // Fallback sur la locale par défaut
      if (newLocale !== routing.defaultLocale) {
        await changeLocale(routing.defaultLocale);
      }
    }
  };

  // Charger la langue depuis Convex si l'utilisateur est connecté
  useEffect(() => {
    if (isAuthenticated && user?.preferredLanguage && user.preferredLanguage !== locale) {
      // Si l'utilisateur a une langue préférée dans Convex, l'utiliser
      if (routing.locales.includes(user.preferredLanguage as any)) {
        // Ne pas sauvegarder dans Convex (déjà sauvegardé)
        const loadLocaleFromConvex = async (newLocale: string) => {
          // Définir le cookie
          document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
          
          // Sauvegarder dans localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem("preferredLanguage", newLocale);
            localStorage.setItem("NEXT_LOCALE", newLocale);
          }

          // Si les messages sont déjà en cache, les utiliser
          if (cache[newLocale]) {
            setLocale(newLocale);
            onLocaleChange(newLocale, cache[newLocale]);
            return;
          }

          // Sinon, charger les messages dynamiquement
          try {
            const newMessages = (await import(`../../messages/${newLocale}.json`)).default;
            cache[newLocale] = newMessages;
            setLocale(newLocale);
            onLocaleChange(newLocale, newMessages);
          } catch (error) {
            console.error(`Failed to load messages for locale ${newLocale}:`, error);
          }
        };
        
        loadLocaleFromConvex(user.preferredLanguage);
      }
    }
  }, [isAuthenticated, user?.preferredLanguage]);

  return (
    <LocaleContext.Provider value={{ locale, changeLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocaleContext() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocaleContext must be used within a LocaleProvider');
  }
  return context;
}

