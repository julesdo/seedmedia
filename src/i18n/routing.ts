import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl'],

  // Used when no locale matches
  defaultLocale: 'fr',
  
  // Don't use locale prefix in URL (compatible with current structure)
  localePrefix: 'never'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

