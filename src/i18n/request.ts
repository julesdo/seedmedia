import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { cookies, headers } from 'next/headers';

export default getRequestConfig(async () => {
  // Get locale from cookie first, then localStorage (via cookie), then header, then default
  const cookieStore = await cookies();
  const headersList = await headers();
  
  // Priorité : NEXT_LOCALE cookie > preferredLanguage cookie > accept-language header > default
  let locale = 
    cookieStore.get('NEXT_LOCALE')?.value || 
    cookieStore.get('preferredLanguage')?.value ||
    headersList.get('accept-language')?.split(',')[0]?.split('-')[0] ||
    routing.defaultLocale;

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  try {
    return {
      locale,
      messages: (await import(`../../messages/${locale}.json`)).default,
      timeZone: 'Europe/Paris' // Timezone par défaut pour éviter les mismatches
    };
  } catch (error) {
    // Fallback to French if locale file doesn't exist
    return {
      locale: routing.defaultLocale,
      messages: (await import(`../../messages/${routing.defaultLocale}.json`)).default,
      timeZone: 'Europe/Paris'
    };
  }
});

