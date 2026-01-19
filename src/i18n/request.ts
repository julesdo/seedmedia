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
    const messages = (await import(`../../messages/${locale}.json`)).default;
    return {
      locale,
      messages,
      timeZone: 'Europe/Paris' // Timezone par défaut pour éviter les mismatches
    };
  } catch (error) {
    // Fallback to French if locale file doesn't exist
    console.error(`Error loading locale ${locale}, falling back to ${routing.defaultLocale}:`, error);
    try {
      const fallbackMessages = (await import(`../../messages/${routing.defaultLocale}.json`)).default;
      return {
        locale: routing.defaultLocale,
        messages: fallbackMessages,
        timeZone: 'Europe/Paris'
      };
    } catch (fallbackError) {
      // Last resort: return empty messages to prevent 404
      console.error(`Error loading fallback locale ${routing.defaultLocale}:`, fallbackError);
      return {
        locale: routing.defaultLocale,
        messages: {},
        timeZone: 'Europe/Paris'
      };
    }
  }
});

