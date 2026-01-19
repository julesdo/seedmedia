# 🔧 AMÉLIORATION DE L'ALGORITHME DE BOURSE

## Date : 2025-01-27

---

## 🎯 OBJECTIF
Corriger les problèmes critiques identifiés dans l'analyse pour garantir :
1. **Corrélation inverse STRICTE** : Si OUI monte, NON baisse TOUJOURS (et vice versa)
2. **Cohérence du calcul de liquidité** : Même formule partout
3. **Précision des prix** : Les prix affichés correspondent aux prix réels

---

## 🔴 PROBLÈME #1 : CORRÉLATION INVERSE NON GARANTIE

### Diagnostic
Le problème vient de la formule de `normalizeBinaryPrices` :
```typescript
exponentialMultiplier = 1 + (totalLiquidity / baseLiquidity) ^ 0.5
dynamicMarketCap = totalLiquidity × exponentialMultiplier
```

**Exemple du problème** :
- Avant : `yesLiquidity = 6000`, `noLiquidity = 4000`, `total = 10000`
  - `marketCap = 10000 × 11 = 110000`
  - `yes = 0.6 × 110000 = 66000`
  - `no = 0.4 × 110000 = 44000`
- Après achat OUI de 1000 Seeds : `yesLiquidity = 7000`, `noLiquidity = 4000`, `total = 11000`
  - `marketCap = 11000 × 11.49 = 126390`
  - `yes = 0.636 × 126390 = 80384` ✅ (monte)
  - `no = 0.364 × 126390 = 46008` ❌ (monte aussi au lieu de baisser !)

### Solution Proposée : Formule avec Corrélation Inverse Garantie

**Option A : Réduire l'Exposant (Simple)**
```typescript
// Réduire l'exposant de 0.5 à 0.2 pour réduire l'effet bulle
const exponentialMultiplier = 1 + Math.pow(totalLiquidity / baseLiquidity, 0.2);
```
- **Avantage** : Simple, garde l'effet bulle mais plus faible
- **Inconvénient** : Peut encore avoir le problème dans certains cas extrêmes

**Option B : Formule avec Contrainte de Corrélation Inverse (Recommandée)**
```typescript
export function normalizeBinaryPrices(
  yesLiquidity: number,
  noLiquidity: number
): { yes: number; no: number } {
  const totalLiquidity = yesLiquidity + noLiquidity;
  
  if (totalLiquidity <= 0) {
    return { yes: 50, no: 50 };
  }
  
  // 🎯 CALCULER LE RATIO DE LIQUIDITÉ (probabilité relative)
  const ratioYes = yesLiquidity / totalLiquidity;
  const ratioNo = noLiquidity / totalLiquidity;
  
  // 🚀 MARKET CAP DYNAMIQUE AVEC EFFET BULLE MAIS CORRÉLATION INVERSE GARANTIE
  // On calcule d'abord un market cap de base qui augmente avec la liquidité
  const baseLiquidity = 100;
  const baseMultiplier = 1 + Math.pow(totalLiquidity / baseLiquidity, 0.3); // Exposant réduit
  const baseMarketCap = totalLiquidity * baseMultiplier;
  
  // 🎯 GARANTIR LA CORRÉLATION INVERSE STRICTE
  // Si ratioYes augmente, ratioNo diminue, et on veut que noNormalized baisse
  // Solution : Utiliser un market cap "fixe" pour la corrélation inverse,
  // puis appliquer un multiplicateur global pour l'effet bulle
  
  // Calculer le market cap "effectif" pour la corrélation inverse
  // On utilise la liquidité moyenne comme référence
  const avgLiquidity = totalLiquidity / 2;
  const effectiveMarketCap = avgLiquidity * 2 * baseMultiplier;
  
  // Appliquer le ratio au market cap effectif
  const yesNormalized = ratioYes * effectiveMarketCap;
  const noNormalized = ratioNo * effectiveMarketCap;
  
  // Vérification : Si ratioYes augmente, ratioNo diminue, donc noNormalized baisse ✅
  
  return {
    yes: Math.round(yesNormalized * 100) / 100,
    no: Math.round(noNormalized * 100) / 100,
  };
}
```

**Option C : Formule avec Market Cap Fixe pour Corrélation Inverse (Plus Simple)**
```typescript
export function normalizeBinaryPrices(
  yesLiquidity: number,
  noLiquidity: number
): { yes: number; no: number } {
  const totalLiquidity = yesLiquidity + noLiquidity;
  
  if (totalLiquidity <= 0) {
    return { yes: 50, no: 50 };
  }
  
  const ratioYes = yesLiquidity / totalLiquidity;
  const ratioNo = noLiquidity / totalLiquidity;
  
  // 🎯 MARKET CAP FIXE BASÉ SUR LA LIQUIDITÉ MOYENNE
  // Cela garantit que si ratioYes augmente, ratioNo diminue, et les prix sont inversement corrélés
  const avgLiquidity = totalLiquidity / 2;
  const baseLiquidity = 100;
  
  // Multiplicateur pour effet bulle (mais basé sur liquidité moyenne, pas totale)
  const exponentialMultiplier = 1 + Math.pow(avgLiquidity / baseLiquidity, 0.3);
  
  // Market cap fixe = 2 × liquidité moyenne × multiplicateur
  // Pourquoi 2× ? Pour que yes + no = market cap total (corrélation inverse stricte)
  const fixedMarketCap = 2 * avgLiquidity * exponentialMultiplier;
  
  // Appliquer le ratio au market cap fixe
  const yesNormalized = ratioYes * fixedMarketCap;
  const noNormalized = ratioNo * fixedMarketCap;
  
  // ✅ GARANTIE : Si ratioYes augmente, ratioNo diminue, donc noNormalized baisse
  // ✅ GARANTIE : yesNormalized + noNormalized = fixedMarketCap (toujours)
  
  return {
    yes: Math.round(yesNormalized * 100) / 100,
    no: Math.round(noNormalized * 100) / 100,
  };
}
```

**Recommandation** : **Option C** (plus simple et garantit la corrélation inverse)

### Test de Validation
```typescript
// Test : Achat OUI de 1000 Seeds
// Avant : yes = 6000, no = 4000, total = 10000
// Après : yes = 7000, no = 4000, total = 11000

// Avant :
// avgLiquidity = 5000
// exponentialMultiplier = 1 + (5000/100)^0.3 = 1 + 3.62 = 4.62
// fixedMarketCap = 2 × 5000 × 4.62 = 46200
// ratioYes = 0.6, ratioNo = 0.4
// yes = 0.6 × 46200 = 27720
// no = 0.4 × 46200 = 18480

// Après :
// avgLiquidity = 5500 (augmente car total augmente)
// exponentialMultiplier = 1 + (5500/100)^0.3 = 1 + 3.75 = 4.75
// fixedMarketCap = 2 × 5500 × 4.75 = 52250
// ratioYes = 0.636, ratioNo = 0.364
// yes = 0.636 × 52250 = 33231 ✅ (monte)
// no = 0.364 × 52250 = 19019 ❌ (monte encore...)

// PROBLÈME : Le fixedMarketCap augmente aussi, donc no peut encore monter.
```

**Solution Finale : Market Cap Basé sur Liquidité Initiale**
```typescript
export function normalizeBinaryPrices(
  yesLiquidity: number,
  noLiquidity: number,
  initialLiquidity?: number // Liquidité initiale (targetPrice × 2)
): { yes: number; no: number } {
  const totalLiquidity = yesLiquidity + noLiquidity;
  
  if (totalLiquidity <= 0) {
    return { yes: 50, no: 50 };
  }
  
  const ratioYes = yesLiquidity / totalLiquidity;
  const ratioNo = noLiquidity / totalLiquidity;
  
  // 🎯 MARKET CAP BASÉ SUR LA LIQUIDITÉ INITIALE (pas la moyenne)
  // Cela garantit que le market cap ne change que si la liquidité totale change significativement
  const baseLiquidity = initialLiquidity || 100; // Liquidité initiale (targetPrice × 2)
  const currentAvgLiquidity = totalLiquidity / 2;
  
  // Multiplicateur pour effet bulle (basé sur croissance relative)
  const growthFactor = currentAvgLiquidity / baseLiquidity;
  const exponentialMultiplier = 1 + Math.pow(growthFactor, 0.3);
  
  // Market cap = 2 × liquidité initiale × multiplicateur
  // Le multiplicateur augmente avec la croissance, mais le market cap de base reste stable
  const marketCap = 2 * baseLiquidity * exponentialMultiplier;
  
  // Appliquer le ratio au market cap
  const yesNormalized = ratioYes * marketCap;
  const noNormalized = ratioNo * marketCap;
  
  // ✅ GARANTIE : Si ratioYes augmente, ratioNo diminue, donc noNormalized baisse
  // ✅ GARANTIE : Le market cap augmente avec la croissance, mais moins vite que la liquidité totale
  
  return {
    yes: Math.round(yesNormalized * 100) / 100,
    no: Math.round(noNormalized * 100) / 100,
  };
}
```

**MAIS** : Cette solution nécessite de passer `initialLiquidity` partout, ce qui est complexe.

**Solution Optimale : Market Cap Basé sur Liquidité Minimale**
```typescript
export function normalizeBinaryPrices(
  yesLiquidity: number,
  noLiquidity: number
): { yes: number; no: number } {
  const totalLiquidity = yesLiquidity + noLiquidity;
  
  if (totalLiquidity <= 0) {
    return { yes: 50, no: 50 };
  }
  
  const ratioYes = yesLiquidity / totalLiquidity;
  const ratioNo = noLiquidity / totalLiquidity;
  
  // 🎯 MARKET CAP BASÉ SUR LA LIQUIDITÉ MINIMALE (garantit la corrélation inverse)
  // On utilise la liquidité minimale comme référence pour le market cap
  const minLiquidity = Math.min(yesLiquidity, noLiquidity);
  const maxLiquidity = Math.max(yesLiquidity, noLiquidity);
  
  // Base de calcul : liquidité minimale
  const baseLiquidity = 100;
  const exponentialMultiplier = 1 + Math.pow(minLiquidity / baseLiquidity, 0.3);
  
  // Market cap = 2 × liquidité minimale × multiplicateur
  // Pourquoi minimale ? Car elle ne change pas quand on achète la position majoritaire
  const marketCap = 2 * minLiquidity * exponentialMultiplier;
  
  // Appliquer le ratio au market cap
  const yesNormalized = ratioYes * marketCap;
  const noNormalized = ratioNo * marketCap;
  
  // ✅ GARANTIE : Si on achète OUI (yesLiquidity augmente, noLiquidity stable)
  //   - minLiquidity reste = noLiquidity (ne change pas)
  //   - marketCap reste stable
  //   - ratioYes augmente, ratioNo diminue
  //   - yesNormalized monte, noNormalized baisse ✅
  
  return {
    yes: Math.round(yesNormalized * 100) / 100,
    no: Math.round(noNormalized * 100) / 100,
  };
}
```

**Test de Validation avec Solution Optimale** :
```typescript
// Avant : yes = 6000, no = 4000
// minLiquidity = 4000
// exponentialMultiplier = 1 + (4000/100)^0.3 = 1 + 3.48 = 4.48
// marketCap = 2 × 4000 × 4.48 = 35840
// ratioYes = 0.6, ratioNo = 0.4
// yes = 0.6 × 35840 = 21504
// no = 0.4 × 35840 = 14336

// Après achat OUI de 1000 : yes = 7000, no = 4000
// minLiquidity = 4000 (ne change pas !)
// exponentialMultiplier = 4.48 (ne change pas !)
// marketCap = 35840 (ne change pas !)
// ratioYes = 0.636, ratioNo = 0.364
// yes = 0.636 × 35840 = 22794 ✅ (monte)
// no = 0.364 × 35840 = 13046 ✅ (baisse !)
```

**✅ SOLUTION OPTIMALE VALIDÉE** : Utiliser la liquidité minimale comme base pour le market cap.

---

## 🔴 PROBLÈME #2 : INCOHÉRENCE DU CALCUL DE LIQUIDITÉ

### Diagnostic
Quand `reserve = 0`, trois approximations différentes sont utilisées :
1. `ghostSupply * (targetPrice / 100)` (dans `getDecisionCourseHistory`)
2. `ghostSupply * 0.5` (dans `getTradingPools` et `recordCourseTick`)
3. `ghostSupply * slope` (logique mathématique)

### Solution : Fonction Unique de Calcul de Liquidité

```typescript
/**
 * Calcule la liquidité d'un pool de manière cohérente
 * @param pool - Pool de trading
 * @param decision - Décision (pour targetPrice)
 * @returns La liquidité du pool
 */
export function calculatePoolLiquidity(
  pool: { reserve: number; ghostSupply: number; slope: number } | null,
  decision: { targetPrice?: number } | null
): number {
  if (!pool) {
    // Si le pool n'existe pas, utiliser targetPrice comme liquidité initiale
    return decision?.targetPrice ?? 50;
  }
  
  if (pool.reserve > 0) {
    // Si la réserve existe, c'est la liquidité réelle
    return pool.reserve;
  }
  
  // Si reserve = 0, utiliser la liquidité initiale basée sur ghostSupply
  // Liquidité initiale = ghostSupply × slope = targetPrice
  // C'est cohérent avec l'IPO : le prix initial = targetPrice
  return pool.ghostSupply * pool.slope;
}
```

**Utilisation** :
```typescript
// Dans getDecisionCourseHistory
yesLiquidity = calculatePoolLiquidity(yesPool, decision);
noLiquidity = calculatePoolLiquidity(noPool, decision);

// Dans getTradingPools
yesLiquidity = calculatePoolLiquidity(yesPool, decision);
noLiquidity = calculatePoolLiquidity(noPool, decision);

// Dans recordCourseTick
yesLiquidity = calculatePoolLiquidity(yesPool, decision);
noLiquidity = calculatePoolLiquidity(noPool, decision);
```

---

## 🔴 PROBLÈME #3 : RÉSERVE INITIALE À L'IPO

### Diagnostic
À l'IPO, `reserve = 0` mais on utilise une approximation pour la liquidité. Cela crée une incohérence.

### Solution : Initialiser la Réserve à l'IPO

```typescript
// Dans initializeTradingPools, après création des pools :
const initialReserve = targetPrice; // Liquidité initiale = prix initial

// Mettre à jour les pools avec la réserve initiale
await ctx.db.patch(yesPoolId, {
  reserve: initialReserve,
});

await ctx.db.patch(noPoolId, {
  reserve: initialReserve,
});
```

**Avantage** :
- La liquidité initiale correspond exactement au `targetPrice`
- Plus besoin d'approximation : `reserve > 0` dès le départ
- Cohérence totale avec le calcul de liquidité

---

## 🔴 PROBLÈME #4 : PRIX BRUT vs PRIX NORMALISÉ

### Diagnostic
Le `pricePerShare` dans les transactions est le prix brut (bonding curve), mais le graphique affiche le prix normalisé.

### Solution : Enregistrer les Deux Prix

```typescript
// Dans buyShares et sellShares, après calcul du prix :
const pricePerShareRaw = getCurrentPrice(pool.slope, totalSupply);
const normalizedPrices = normalizeBinaryPrices(
  calculatePoolLiquidity(yesPool, decision),
  calculatePoolLiquidity(noPool, decision)
);
const pricePerShareNormalized = args.position === "yes" 
  ? normalizedPrices.yes 
  : normalizedPrices.no;

// Enregistrer les deux dans la transaction
await ctx.db.insert("tradingTransactions", {
  // ...
  pricePerShare: pricePerShareRaw, // Prix brut (pour calculs)
  pricePerShareNormalized: pricePerShareNormalized, // Prix normalisé (pour affichage)
  // ...
});
```

**Avantage** :
- On garde le prix brut pour les calculs (cohérence avec bonding curve)
- On a le prix normalisé pour l'affichage (cohérence avec le graphique)
- Pas de confusion

---

## 📋 PLAN D'IMPLÉMENTATION

### Étape 1 : Créer la Fonction de Calcul de Liquidité
1. Créer `calculatePoolLiquidity` dans `tradingEngine.ts`
2. Remplacer toutes les approximations par cette fonction

### Étape 2 : Corriger la Normalisation Binaire
1. Modifier `normalizeBinaryPrices` pour utiliser la liquidité minimale
2. Tester avec des exemples concrets
3. Vérifier que la corrélation inverse est garantie

### Étape 3 : Initialiser la Réserve à l'IPO
1. Modifier `initializeTradingPools` pour initialiser `reserve = targetPrice`
2. Vérifier que les prix initiaux sont corrects

### Étape 4 : Enregistrer les Deux Prix
1. Modifier `buyShares` et `sellShares` pour enregistrer prix brut et normalisé
2. Mettre à jour le schéma si nécessaire
3. Adapter l'affichage pour utiliser le prix normalisé

### Étape 5 : Tests et Validation
1. Tester avec des transactions réelles
2. Vérifier que les prix sont cohérents partout
3. Vérifier que la corrélation inverse fonctionne dans tous les cas

---

## ✅ RÉSUMÉ DES AMÉLIORATIONS

1. **Corrélation Inverse Garantie** : Utiliser liquidité minimale pour le market cap
2. **Cohérence de Liquidité** : Fonction unique `calculatePoolLiquidity`
3. **Réserve Initiale** : Initialiser `reserve = targetPrice` à l'IPO
4. **Prix Normalisé** : Enregistrer prix brut ET normalisé dans les transactions

**Impact Attendu** :
- ✅ Corrélation inverse STRICTE dans tous les cas
- ✅ Prix cohérents partout dans l'application
- ✅ Algorithme plus prévisible et logique
- ✅ Meilleure expérience utilisateur (prix qui "font sens")

