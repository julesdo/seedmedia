'use client';

import { NextIntlClientProvider } from 'next-intl';
import { useLocale } from 'next-intl';
import { ReactNode } from 'react';

interface NextIntlProviderWrapperProps {
  children: ReactNode;
  messages: any;
}

export function NextIntlProviderWrapper({ 
  children,
  messages 
}: NextIntlProviderWrapperProps) {
  const locale = useLocale();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

