import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { cookies, headers } from 'next/headers';

export default getRequestConfig(async () => {
  // Get locale from cookie first, then header, then default
  const cookieStore = await cookies();
  const headersList = await headers();
  
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
      messages: (await import(`../../messages/${locale}.json`)).default
    };
  } catch (error) {
    // Fallback to French if locale file doesn't exist
    return {
      locale: routing.defaultLocale,
      messages: (await import(`../../messages/${routing.defaultLocale}.json`)).default
    };
  }
});

