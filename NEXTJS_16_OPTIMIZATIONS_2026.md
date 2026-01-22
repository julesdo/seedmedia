# Guide d'Optimisation Next.js 16 App Router 2026

## 🎯 Objectifs
- **CLS < 0.1** (actuellement 0.937) - Stabilité visuelle
- **LCP < 2.5s** (actuellement 6.6s) - Vitesse de chargement
- **TBT < 200ms** (actuellement 4,660ms) - Réactivité
- **INP < 200ms** - Fluidité des interactions

---

## 📋 Optimisations Prioritaires (par impact)

### 1. **Corriger le CLS (Cumulative Layout Shift)** - PRIORITÉ #1

#### Problème actuel : 0.937 (très mauvais, objectif < 0.1)

#### Solutions à implémenter :

**A. Dimensions fixes pour toutes les images**
```typescript
// ❌ MAUVAIS
<Image src={url} alt="..." />

// ✅ BON
<Image 
  src={url} 
  alt="..." 
  width={400} 
  height={300}
  style={{ aspectRatio: '4/3' }}
/>
```

**B. Placeholders avec dimensions**
```typescript
// ✅ Utiliser aspect-ratio CSS
<div style={{ aspectRatio: '16/9' }}>
  <Image ... />
</div>
```

**C. Réserver l'espace pour les composants asynchrones**
```typescript
// ✅ Réserver l'espace avant le chargement
<div className="min-h-[400px]">
  <Suspense fallback={<Skeleton className="h-[400px]" />}>
    <AsyncComponent />
  </Suspense>
</div>
```

**D. Fonts avec font-display: swap**
```typescript
// ✅ Déjà fait dans layout.tsx
display: "swap"
```

---

### 2. **Optimiser le LCP (Largest Contentful Paint)** - PRIORITÉ #2

#### Problème actuel : 6.6s (objectif < 2.5s)

#### Solutions à implémenter :

**A. Précharger l'image LCP**
```typescript
// Dans layout.tsx ou page.tsx
<link 
  rel="preload" 
  as="image" 
  href="/hero-image.jpg"
  fetchPriority="high"
/>
```

**B. Priority sur l'image LCP**
```typescript
<Image 
  src={lcpImage}
  priority // ✅ Déjà fait dans TradingInterface
  fetchPriority="high"
/>
```

**C. Resource Hints avancés**
```typescript
// DNS prefetch + preconnect pour ressources critiques
<link rel="dns-prefetch" href="https://cdn.example.com" />
<link rel="preconnect" href="https://cdn.example.com" crossOrigin="anonymous" />
<link rel="preload" href="/critical.css" as="style" />
```

**D. Streaming SSR optimisé**
```typescript
// ✅ Déjà fait avec Suspense boundaries
<Suspense fallback={<OptimizedSkeleton />}>
  <CriticalContent />
</Suspense>
```

---

### 3. **Réduire le TBT (Total Blocking Time)** - PRIORITÉ #3

#### Problème actuel : 4,660ms (objectif < 200ms)

#### Solutions à implémenter :

**A. Décomposer les tâches longues avec yield**
```typescript
// ✅ Pattern à implémenter
async function processLargeData(data: any[]) {
  const CHUNK_SIZE = 50;
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    processChunk(chunk);
    
    // Yield au thread principal toutes les 50ms
    if (i % CHUNK_SIZE === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}
```

**B. Lazy loading agressif**
```typescript
// ✅ Déjà fait pour Framer Motion, MarketHero, etc.
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  ssr: false,
  loading: () => <Skeleton />
});
```

**C. Code splitting par route**
```typescript
// ✅ Déjà configuré dans next.config.ts
// Webpack splitChunks optimisé
```

**D. Déferrer les scripts non critiques**
```typescript
// Scripts tiers avec defer
<script src="analytics.js" defer />
```

---

### 4. **Optimiser l'INP (Interaction to Next Paint)** - PRIORITÉ #4

#### Solutions à implémenter :

**A. Debounce/Throttle des handlers**
```typescript
import { useCallback } from 'react';
import { debounce } from 'lodash-es';

const handleSearch = useCallback(
  debounce((query: string) => {
    // Search logic
  }, 300),
  []
);
```

**B. Optimiser les event listeners**
```typescript
// Utiliser passive: true pour scroll
useEffect(() => {
  const handleScroll = () => { /* ... */ };
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

**C. Utiliser requestIdleCallback pour tâches non urgentes**
```typescript
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Tâches non critiques
  });
}
```

---

## 🚀 Optimisations Next.js 16 Spécifiques

### 1. **Partial Prerendering (PPR)** - Si disponible
```typescript
// next.config.ts
experimental: {
  ppr: true, // Si disponible en Next.js 16
}
```

### 2. **Server Components par défaut**
```typescript
// ✅ Déjà fait - Utiliser Server Components autant que possible
// Client Components uniquement pour interactivité
'use client' // Uniquement si nécessaire
```

### 3. **Streaming SSR avec Suspense**
```typescript
// ✅ Déjà implémenté
<Suspense fallback={<OptimizedFallback />}>
  <ServerComponent />
</Suspense>
```

### 4. **Optimize Package Imports**
```typescript
// ✅ Déjà configuré dans next.config.ts
experimental: {
  optimizePackageImports: [
    'echarts',
    'framer-motion',
    // ...
  ]
}
```

### 5. **Webpack Memory Optimizations**
```typescript
// ✅ Déjà activé
experimental: {
  webpackMemoryOptimizations: true,
  optimizeCss: true,
  optimizeServerReact: true,
}
```

---

## 🎨 Optimisations Images

### 1. **Next.js Image avec toutes les optimisations**
```typescript
<Image
  src={url}
  alt="..."
  width={400}
  height={300}
  priority={isLCP}
  loading={isLCP ? "eager" : "lazy"}
  decoding="async"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  quality={80}
  placeholder="blur"
  blurDataURL={blurDataUrl}
/>
```

### 2. **Responsive images avec sizes**
```typescript
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
```

### 3. **WebP/AVIF avec fallback**
```typescript
// Next.js le fait automatiquement
// Mais on peut forcer avec un loader custom
```

---

## 📦 Optimisations Bundle

### 1. **Tree Shaking agressif**
```typescript
// ✅ Déjà fait avec optimizePackageImports
// Importer uniquement ce qui est nécessaire
import { debounce } from 'lodash-es'; // ✅
// import _ from 'lodash'; // ❌
```

### 2. **Dynamic Imports pour routes**
```typescript
// ✅ Déjà fait
const AdminPage = dynamic(() => import('./AdminPage'), {
  ssr: false
});
```

### 3. **Code Splitting par feature**
```typescript
// ✅ Déjà configuré dans webpack
// Bundles séparés pour echarts, framer-motion, etc.
```

---

## 🔧 Optimisations Fonts

### 1. **Font Subsetting**
```typescript
// ✅ Déjà fait
subsets: ["latin"]
```

### 2. **Font Display Swap**
```typescript
// ✅ Déjà fait
display: "swap"
```

### 3. **Preload fonts critiques**
```typescript
// ✅ Déjà fait
preload: true
```

### 4. **Font Fallback optimisé**
```typescript
// ✅ Déjà fait
fallback: ["monospace"],
adjustFontFallback: true
```

---

## 🌐 Optimisations Réseau

### 1. **DNS Prefetch**
```typescript
// ✅ Déjà fait dans layout.tsx
<link rel="dns-prefetch" href="https://..." />
```

### 2. **Preconnect pour domaines critiques**
```typescript
// ✅ Déjà fait
<link rel="preconnect" href="https://..." crossOrigin="anonymous" />
```

### 3. **Prefetch pour routes probables**
```typescript
// ✅ Déjà fait dans BottomNav
router.prefetch(href);
```

---

## 📊 Monitoring et Mesure

### 1. **Web Vitals en production**
```typescript
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Envoyer à votre analytics
}

onCLS(sendToAnalytics);
onLCP(sendToAnalytics);
onFID(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

### 2. **Lighthouse CI**
```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse CI
  run: lhci autorun
```

---

## ✅ Checklist d'Implémentation

### Phase 1 : CLS (Priorité #1)
- [ ] Ajouter dimensions fixes à toutes les images
- [ ] Utiliser aspect-ratio CSS pour réserver l'espace
- [ ] Ajouter placeholders avec dimensions
- [ ] Réserver l'espace pour composants asynchrones
- [ ] Tester avec Chrome DevTools Layout Shift

### Phase 2 : LCP (Priorité #2)
- [ ] Identifier l'élément LCP
- [ ] Précharger l'image LCP
- [ ] Ajouter priority sur l'image LCP
- [ ] Optimiser le rendu initial
- [ ] Réduire le temps de chargement des ressources critiques

### Phase 3 : TBT (Priorité #3)
- [ ] Identifier les tâches longues (>50ms)
- [ ] Implémenter yield pattern
- [ ] Lazy load agressif des composants lourds
- [ ] Déferrer les scripts non critiques
- [ ] Optimiser les requêtes Convex (✅ déjà fait)

### Phase 4 : INP (Priorité #4)
- [ ] Debounce/Throttle des handlers
- [ ] Optimiser les event listeners
- [ ] Utiliser requestIdleCallback
- [ ] Réduire le JavaScript exécuté lors des interactions

---

## 📚 Ressources

- [Next.js 16 Documentation](https://nextjs.org/docs)
- [Web.dev Core Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)

---

## 🎯 Objectifs Finaux

| Métrique | Actuel | Objectif | Priorité |
|----------|--------|----------|----------|
| **CLS** | 0.937 | < 0.1 | 🔴 Critique |
| **LCP** | 6.6s | < 2.5s | 🔴 Critique |
| **TBT** | 4,660ms | < 200ms | 🟠 Haute |
| **INP** | ? | < 200ms | 🟡 Moyenne |
| **FCP** | 1.4s | < 1.8s | ✅ Bon |
| **SI** | 5.0s | < 3.4s | 🟡 Moyenne |

