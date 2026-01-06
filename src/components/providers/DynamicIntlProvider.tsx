"use client";

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode, useState, useEffect } from 'react';
import { LocaleProvider } from '@/contexts/LocaleContext';

interface DynamicIntlProviderProps {
  children: ReactNode;
  initialLocale: string;
  initialMessages: any;
}

// Cache global pour les messages
const messagesCache: Record<string, any> = {};

export function DynamicIntlProvider({ 
  children, 
  initialLocale, 
  initialMessages 
}: DynamicIntlProviderProps) {
  const [locale, setLocale] = useState(initialLocale);
  const [messages, setMessages] = useState(initialMessages);

  // Initialiser le cache avec les messages initiaux
  useEffect(() => {
    messagesCache[initialLocale] = initialMessages;
  }, [initialLocale, initialMessages]);

  const handleLocaleChange = (newLocale: string, newMessages: any) => {
    // Mettre à jour le cache
    messagesCache[newLocale] = newMessages;
    setLocale(newLocale);
    setMessages(newMessages);
  };

  return (
    <LocaleProvider 
      initialLocale={initialLocale} 
      onLocaleChange={handleLocaleChange}
      messagesCache={messagesCache}
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleProvider>
  );
}

