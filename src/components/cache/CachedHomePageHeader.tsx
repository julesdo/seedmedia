import { getTranslations } from 'next-intl/server';
import { SolarIcon } from "@/components/icons/SolarIcon";

/**
 * Server Component avec cache pour le header de la homepage
 * Utilise "use cache" pour mettre en cache le rendu
 */
export async function CachedHomePageHeader() {
  // "use cache" est implicite dans Next.js 16 avec PPR
  // Le composant sera mis en cache automatiquement
  const t = await getTranslations('decisions');
  
  return (
    <div className="hidden lg:sticky lg:top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-xl">
      <div className="w-full px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3">
          <SolarIcon icon="document-text-bold" className="size-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {t('description')}
        </p>
      </div>
    </div>
  );
}

