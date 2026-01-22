# Implémentation Cache Next.js 16 - Guide d'Utilisation

## 🎯 Optimisations Implémentées

### 1. **Cache Components avec "use cache"** ✅

Les Server Components sont automatiquement mis en cache par Next.js 16 avec PPR. Les composants suivants utilisent cette optimisation :

- `CachedHomePageHeader` : Header de la homepage mis en cache
- `CachedTrendingHeader` : Header de la page trending mis en cache

**Bénéfice** : Réduction des re-renders inutiles, meilleur LCP

---

### 2. **API Routes avec revalidateTag()** ✅

#### Routes API créées :

1. **`/api/revalidate/decisions`**
   - Invalide le cache des décisions
   - Usage :
     ```bash
     POST /api/revalidate/decisions?slug=decision-slug&secret=YOUR_SECRET
     POST /api/revalidate/decisions?all=true&secret=YOUR_SECRET
     ```

2. **`/api/revalidate/news`**
   - Invalide le cache des actualités RSS
   - Usage :
     ```bash
     POST /api/revalidate/news?query=search-query&secret=YOUR_SECRET
     POST /api/revalidate/news?all=true&secret=YOUR_SECRET
     ```

#### Routes API optimisées :

1. **`/api/news-rss`**
   - Utilise `unstable_cache` avec tags
   - Cache 5 minutes avec tags `news-rss` et `news-rss-{query}`
   - Permet l'invalidation granulaire

---

### 3. **Utilitaires de Cache** ✅

Fichier : `src/lib/cache-utils.ts`

#### Tags de cache disponibles :

```typescript
CACHE_TAGS = {
  DECISIONS: 'decisions',
  DECISION: (slug: string) => `decision-${slug}`,
  DECISION_ID: (id: string) => `decision-id-${id}`,
  CATEGORIES: 'categories',
  CATEGORY: (slug: string) => `category-${slug}`,
  ARTICLES: 'articles',
  ARTICLE: (slug: string) => `article-${slug}`,
  USERS: 'users',
  USER: (id: string) => `user-${id}`,
  TRENDING: 'trending',
  HOT_DECISIONS: 'hot-decisions',
  MARKET_GRID: 'market-grid',
}
```

#### Fonctions utilitaires :

- `revalidateDecision(slug, id?)` : Invalide le cache d'une décision
- `revalidateAllDecisions()` : Invalide toutes les décisions
- `revalidateCategories()` : Invalide les catégories
- `revalidateArticle(slug)` : Invalide un article
- `revalidateUser(userId)` : Invalide un utilisateur

---

## 🔧 Configuration

### Variable d'environnement

Ajoutez dans `.env.local` :

```bash
REVALIDATE_SECRET=your-secret-key-here
```

Cette clé est utilisée pour sécuriser les routes de revalidation.

---

## 📝 Utilisation dans Convex Mutations

Pour invalider le cache après une mutation Convex, ajoutez un appel HTTP :

```typescript
// Dans une mutation Convex après update
await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate/decisions?slug=${slug}&secret=${process.env.REVALIDATE_SECRET}`, {
  method: 'POST',
});
```

---

## 🚀 Exemples d'Utilisation

### 1. Invalider une décision après mise à jour

```typescript
// Dans une mutation Convex
import { revalidateDecision } from '@/lib/cache-utils';

// Après avoir mis à jour une décision
await revalidateDecision(decision.slug, decision._id);
```

### 2. Invalider toutes les décisions

```typescript
import { revalidateAllDecisions } from '@/lib/cache-utils';

// Après une mise à jour globale
await revalidateAllDecisions();
```

### 3. Utiliser unstable_cache dans une API Route

```typescript
import { unstable_cache } from 'next/cache';

const getCachedData = unstable_cache(
  async (param: string) => {
    // Logique de récupération des données
    return data;
  },
  ['cache-key', param], // Cache key
  {
    tags: ['tag1', 'tag2'], // Tags pour invalidation
    revalidate: 300, // 5 minutes
  }
);
```

---

## 📊 Impact Attendu

### Performance
- **LCP** : Amélioration de 10-15% grâce au cache des composants
- **TBT** : Réduction de 5-10% grâce à la réduction des re-renders
- **Cache Hit Rate** : 70-90% pour les pages fréquemment visitées

### Expérience Utilisateur
- **Temps de chargement** : Réduction de 20-30% pour les pages mises en cache
- **Réactivité** : Amélioration de la réactivité grâce à l'invalidation granulaire

---

## ⚠️ Notes Importantes

1. **PPR Mode** : Les composants Server sont automatiquement mis en cache avec PPR `'incremental'`
2. **Tags** : Utilisez des tags spécifiques pour une invalidation granulaire
3. **Secret** : Protégez vos routes de revalidation avec `REVALIDATE_SECRET`
4. **Revalidation** : Les tags permettent une invalidation précise sans revalider tout le cache

---

## 🔄 Prochaines Étapes

1. Intégrer les appels de revalidation dans les mutations Convex
2. Ajouter plus de composants avec cache
3. Monitorer les métriques de cache (hit rate, miss rate)
4. Optimiser les stratégies de revalidation selon l'usage

