'use client';

import { useTranslations } from 'next-intl';

/**
 * Exemple de composant utilisant next-intl
 * 
 * Utilisation :
 * ```tsx
 * import { useTranslations } from 'next-intl';
 * 
 * function MyComponent() {
 *   const t = useTranslations('common');
 *   
 *   return <button>{t('save')}</button>;
 * }
 * ```
 */
export function ExampleWithTranslation() {
  const t = useTranslations('common');
  const tStudio = useTranslations('studio');

  return (
    <div>
      <h1>{tStudio('dashboard')}</h1>
      <button>{t('save')}</button>
      <button>{t('cancel')}</button>
    </div>
  );
}

