# Guide d'utilisation de next-intl

## ✅ Installation et configuration terminées

**next-intl** est maintenant installé et configuré dans votre projet. C'est la solution recommandée pour l'internationalisation avec Next.js App Router en 2025.

## 📁 Structure créée

```
src/
  i18n/
    routing.ts      # Configuration des locales
    request.ts      # Configuration serveur
middleware.ts       # Middleware pour détection de locale
messages/
  fr.json          # Traductions françaises
  en.json          # Traductions anglaises
```

## 🚀 Utilisation dans vos composants

### Composant client

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');
  
  return (
    <div>
      <button>{t('save')}</button>
      <button>{t('cancel')}</button>
    </div>
  );
}
```

### Composant serveur

```tsx
import { useTranslations } from 'next-intl';

export async function MyServerComponent() {
  const t = await useTranslations('common');
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
    </div>
  );
}
```

### Changer la langue

```tsx
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  
  const switchLanguage = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };
  
  return (
    <select value={locale} onChange={(e) => switchLanguage(e.target.value)}>
      <option value="fr">Français</option>
      <option value="en">English</option>
    </select>
  );
}
```

## 📝 Ajouter des traductions

Éditez les fichiers dans `messages/` :

```json
// messages/fr.json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler"
  },
  "studio": {
    "dashboard": "Tableau de bord"
  }
}
```

## 🔄 Migration progressive

1. **Remplacez `useLanguage()` par `useTranslations()`** dans vos composants
2. **Remplacez les textes hardcodés** par des clés de traduction
3. **Ajoutez les traductions** dans les fichiers JSON

## 🌐 Traduction automatique

Pour générer automatiquement les traductions manquantes, vous pouvez créer un script qui :
- Lit `messages/fr.json` (source)
- Utilise LibreTranslate/MyMemory pour traduire
- Génère les autres fichiers de langue

## ⚙️ Configuration actuelle

- **Locales supportées** : fr, en, es, de, it, pt, nl, pl
- **Locale par défaut** : fr
- **Pas de préfixe dans l'URL** : Compatible avec votre structure actuelle
- **Détection automatique** : Via cookies/headers

## 📚 Documentation

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Exemples](https://github.com/amannn/next-intl/tree/main/examples)

