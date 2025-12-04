# Migration vers next-intl

## ✅ Ce qui a été fait

1. **Installation de next-intl** - Bibliothèque moderne et recommandée pour Next.js App Router
2. **Configuration de base** :
   - `src/i18n/routing.ts` - Configuration des locales supportées
   - `src/i18n/request.ts` - Configuration du serveur
   - `middleware.ts` - Middleware pour la détection de locale
   - `messages/fr.json` et `messages/en.json` - Fichiers de traduction de base

## ⚠️ Problème identifié

Votre application utilise une structure avec des groupes de routes `(auth)`, `(public)`, etc. Pour utiliser next-intl avec le routing basé sur `[locale]`, il faudrait restructurer toute l'application, ce qui est très invasif.

## 💡 Solution recommandée : next-intl sans routing basé sur les segments

Au lieu d'utiliser `[locale]` dans l'URL, nous pouvons utiliser next-intl avec :
- La locale stockée dans les cookies/localStorage
- Pas de changement d'URL nécessaire
- Compatible avec votre structure actuelle

## 📋 Prochaines étapes

1. **Option A (Recommandée)** : Utiliser next-intl sans routing basé sur les segments
   - Modifier le middleware pour détecter la locale depuis les cookies
   - Garder la structure actuelle de l'application
   - Utiliser `useTranslations()` dans les composants

2. **Option B** : Restructurer complètement avec `[locale]` dans l'URL
   - Déplacer tous les dossiers sous `app/[locale]/`
   - Modifier tous les liens pour inclure la locale
   - Plus de travail mais meilleure SEO

3. **Traduction automatique** : Créer un script qui :
   - Scanne tous les fichiers de messages
   - Utilise LibreTranslate/MyMemory pour traduire automatiquement
   - Génère les fichiers manquants

Quelle option préférez-vous ?

