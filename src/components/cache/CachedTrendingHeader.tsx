import { getTranslations } from 'next-intl/server';
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Badge } from "@/components/ui/badge";

/**
 * Server Component avec cache pour le header de la page trending
 * Utilise le cache Next.js 16 pour optimiser les performances
 */
export async function CachedTrendingHeader() {
  const t = await getTranslations('trending');
  
  return (
    <div className="hidden lg:sticky lg:top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-xl">
      <div className="max-w-[614px] mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <SolarIcon icon="fire-bold" className="size-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {t('badge')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {t('description')}
        </p>
      </div>
    </div>
  );
}

