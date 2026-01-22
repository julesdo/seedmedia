# Plan d'Optimisation NextFaster - Atteindre des Performances Ultra-Rapides

## 🎯 Objectif
Atteindre les performances de NextFaster (PageSpeed 95+) en appliquant leurs techniques d'optimisation.

## 📊 Techniques NextFaster à Implémenter

### 1. **Partial Prerendering (PPR)** - PRIORITÉ #1
**NextFaster utilise** : PPR pour précalculer les shells de pages, servis statiquement depuis l'edge

**Notre situation** : PPR désactivé car incompatible avec `revalidate`/`dynamic`

**Solution** :
- Retirer `revalidate` et `dynamic` des pages principales
- Utiliser `unstable_cache` avec tags à la place
- Activer `cacheComponents: true` dans `next.config.ts`
- Utiliser `revalidateTag()` pour l'invalidation granulaire

**Impact attendu** : LCP -30%, TBT -40%

---

### 2. **Server Actions pour Mutations** - PRIORITÉ #2
**NextFaster utilise** : Toutes les mutations via Server Actions

**Notre situation** : Mutations Convex directes côté client

**Solution** :
- Créer des Server Actions qui appellent Convex
- Réduire le JavaScript client
- Améliorer la sécurité (mutations côté serveur)

**Impact attendu** : Bundle JS -20%, TBT -15%

---

### 3. **Edge Runtime** - PRIORITÉ #3
**NextFaster utilise** : Edge Runtime pour routes API et pages statiques

**Notre situation** : Node.js runtime par défaut

**Solution** :
- Ajouter `export const runtime = 'edge'` aux routes API
- Utiliser Edge Runtime pour les pages statiques
- Réduire la latence (exécution plus proche de l'utilisateur)

**Impact attendu** : Latence -50%, TTFB -40%

---

### 4. **Streaming Optimisé avec Suspense** - PRIORITÉ #4
**NextFaster utilise** : Streaming des données dynamiques (panier, etc.)

**Notre situation** : Suspense déjà utilisé mais peut être optimisé

**Solution** :
- Créer des Suspense boundaries plus granulaires
- Streamer les données Convex progressivement
- Précharger les données critiques

**Impact attendu** : TTI -25%, LCP -20%

---

### 5. **Cache Agressif avec Tags** - PRIORITÉ #5
**NextFaster utilise** : ISR agressif avec invalidation granulaire

**Notre situation** : ISR avec revalidate, mais pas de tags

**Solution** :
- Utiliser `unstable_cache` avec tags partout
- Implémenter `revalidateTag()` dans les mutations
- Cache multi-niveaux (edge, server, client)

**Impact attendu** : Cache hit rate 90%+, TTFB -60%

---

### 6. **Optimisation Images CDN** - PRIORITÉ #6
**NextFaster utilise** : Images sur Vercel Blob

**Notre situation** : Images sur Convex/autres sources

**Solution** :
- Migrer les images vers Vercel Blob ou CDN similaire
- Utiliser `next/image` avec `priority` pour LCP
- Implémenter lazy loading agressif

**Impact attendu** : LCP -40%, Bandwidth -50%

---

## 🚀 Plan d'Implémentation

### Phase 1 : PPR et Cache (Impact Maximum)
1. Retirer `revalidate`/`dynamic` de la homepage
2. Utiliser `unstable_cache` avec tags
3. Activer `cacheComponents: true`
4. Tester et mesurer

### Phase 2 : Edge Runtime
1. Migrer les routes API vers Edge Runtime
2. Optimiser les pages statiques avec Edge
3. Tester la latence

### Phase 3 : Server Actions
1. Créer Server Actions pour mutations critiques
2. Migrer progressivement
3. Réduire le JavaScript client

### Phase 4 : Streaming et Images
1. Optimiser Suspense boundaries
2. Migrer images vers CDN
3. Optimiser LCP

---

## 📈 Métriques Cibles (Basées sur NextFaster)

| Métrique | Actuel | Cible | NextFaster |
|----------|--------|-------|------------|
| **Performance Score** | 16 | 90+ | 95+ |
| **LCP** | 16.3s | < 1.5s | < 1.0s |
| **TBT** | 3,994ms | < 200ms | < 100ms |
| **CLS** | 1.55 | < 0.1 | < 0.05 |
| **TTFB** | ? | < 200ms | < 100ms |

---

## ⚠️ Contraintes Actuelles

1. **Convex vs Postgres** : NextFaster utilise Postgres, nous utilisons Convex
   - Solution : Adapter les patterns (Server Actions → Convex)
   
2. **PPR Incompatibilité** : `revalidate`/`dynamic` bloquent PPR
   - Solution : Retirer ces configs et utiliser `unstable_cache`

3. **Images** : Pas encore sur CDN dédié
   - Solution : Migrer vers Vercel Blob ou Cloudinary

---

## 🔧 Fichiers à Modifier

### Priorité Haute
- `next.config.ts` : Activer `cacheComponents: true`
- `src/app/(public)/page.tsx` : Retirer `revalidate`/`dynamic`, utiliser `unstable_cache`
- `src/app/(public)/[slug]/page.tsx` : Même chose
- Routes API : Ajouter `runtime = 'edge'`

### Priorité Moyenne
- Créer Server Actions dans `src/app/actions/`
- Optimiser Suspense boundaries
- Migrer images vers CDN

---

## 📝 Notes Importantes

- **PPR nécessite** de retirer `revalidate`/`dynamic` des pages
- **Edge Runtime** a des limitations (pas de Node.js APIs)
- **Server Actions** nécessitent une refonte partielle
- **Images CDN** nécessitent une migration

---

## 🎯 Résultat Attendu

Avec ces optimisations, nous devrions atteindre :
- **Performance Score** : 90+ (vs 16 actuellement)
- **LCP** : < 1.5s (vs 16.3s)
- **TBT** : < 200ms (vs 3,994ms)
- **CLS** : < 0.1 (vs 1.55)

