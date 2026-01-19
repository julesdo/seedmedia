# 🎯 AJUSTEMENT DU MULTIPLICATEUR SELON LA PROBABILITÉ

## Date : 2025-01-27

---

## 🔴 PROBLÈME IDENTIFIÉ

### Logique économique d'un marché prédictif

Dans un marché prédictif binaire, le **prix reflète la probabilité implicite** :
- Prix = 10 Seeds → 10% de probabilité → Multiplicateur max = 10x (100/10)
- Prix = 50 Seeds → 50% de probabilité → Multiplicateur max = 2x (100/50)
- Prix = 90 Seeds → 90% de probabilité → Multiplicateur max = 1.11x (100/90)

**Principe** : Plus la probabilité est élevée, moins le gain potentiel devrait être élevé.

### Problème actuel

Avec la bonding curve linéaire `P(S) = m × S` :
- Le prix monte de la même manière que la probabilité soit 10% ou 90%
- Pas d'ajustement du multiplicateur selon la probabilité actuelle
- Un achat à 90 Seeds peut donner le même gain qu'un achat à 10 Seeds (si le prix monte de +10 Seeds)

**Exemple problématique** :
- Achat à 10 Seeds : Prix monte à 20 Seeds → Gain de 2x ✅ (logique)
- Achat à 90 Seeds : Prix monte à 100 Seeds → Gain de 1.11x ✅ (logique)
- **MAIS** : Si le prix monte de +10 Seeds dans les deux cas, le gain est différent :
  - 10 → 20 : Gain de 2x
  - 90 → 100 : Gain de 1.11x
  - **Le problème** : La volatilité devrait être plus faible à 90 Seeds qu'à 10 Seeds

---

## ✅ SOLUTION : AJUSTER LA PENTE SELON LA PROBABILITÉ

### Concept

Ajuster la **pente effective** selon la **probabilité actuelle** (prix actuel) :
- Probabilité faible (prix bas) → Pente normale → Volatilité normale → Multiplicateur élevé
- Probabilité élevée (prix haut) → Pente réduite → Volatilité réduite → Multiplicateur faible

**Formule** :
```
probability = currentPrice / 100
volatilityFactor = 1 - (probability - 0.5)² × 2
effectiveSlope = baseSlope × volatilityFactor
```

**Comportement** :
- Prix = 10 Seeds (10%) → `volatilityFactor = 1 - (0.1 - 0.5)² × 2 = 1 - 0.32 = 0.68` → Pente réduite de 32%
- Prix = 50 Seeds (50%) → `volatilityFactor = 1 - (0.5 - 0.5)² × 2 = 1 - 0 = 1.0` → Pente normale
- Prix = 90 Seeds (90%) → `volatilityFactor = 1 - (0.9 - 0.5)² × 2 = 1 - 0.32 = 0.68` → Pente réduite de 32%

**MAIS** : Cette formule réduit aussi la volatilité aux extrêmes bas, ce qui n'est pas souhaitable.

### Formule améliorée (asymétrique)

**Principe** : Réduire la volatilité seulement quand la probabilité est **élevée** (prix haut).

```
probability = currentPrice / 100
if (probability > 0.5) {
  // Probabilité élevée : réduire la volatilité
  volatilityFactor = 1 - (probability - 0.5) × 0.8
} else {
  // Probabilité faible : volatilité normale
  volatilityFactor = 1.0
}
```

**Comportement** :
- Prix = 10 Seeds (10%) → `volatilityFactor = 1.0` → Pente normale
- Prix = 50 Seeds (50%) → `volatilityFactor = 1.0` → Pente normale
- Prix = 70 Seeds (70%) → `volatilityFactor = 1 - (0.7 - 0.5) × 0.8 = 0.84` → Pente réduite de 16%
- Prix = 90 Seeds (90%) → `volatilityFactor = 1 - (0.9 - 0.5) × 0.8 = 0.68` → Pente réduite de 32%

**Résultat** :
- Aux probabilités faibles/moyennes : Volatilité normale (multiplicateur élevé possible)
- Aux probabilités élevées : Volatilité réduite (multiplicateur faible, logique)

---

## 📐 FORMULE COMBINÉE : LIQUIDITÉ + PROBABILITÉ

### Formule finale

Combiner les deux ajustements :
1. **Ajustement liquidité** : Réduire la volatilité si peu de liquidité réelle
2. **Ajustement probabilité** : Réduire la volatilité si probabilité élevée

```
effectiveSlope = baseSlope × liquidityFactor × probabilityFactor
```

Où :
- `liquidityFactor = 0.3 + 0.7 × sqrt(liquidityRatio)` (comme avant)
- `probabilityFactor = 1.0` si `probability <= 0.5`, sinon `1 - (probability - 0.5) × 0.8`

---

## 🎯 IMPLÉMENTATION

### Fonction `getEffectiveSlope` améliorée

```typescript
/**
 * Calcule la pente effective ajustée selon la liquidité réelle ET la probabilité
 * @param slope - Pente de base
 * @param ghostSupply - Supply fantôme
 * @param realSupply - Supply réel
 * @param currentPrice - Prix actuel (pour calculer la probabilité)
 * @returns Pente effective ajustée
 */
export function getEffectiveSlope(
  slope: number,
  ghostSupply: number,
  realSupply: number,
  currentPrice?: number
): number {
  const totalSupply = ghostSupply + realSupply;
  if (totalSupply === 0) {
    return slope;
  }
  
  // 1. Ajustement selon la liquidité réelle
  const liquidityRatio = realSupply / totalSupply;
  const minRatio = 0.3;
  const maxRatio = 1.0;
  const liquidityFactor = minRatio + (maxRatio - minRatio) * Math.sqrt(liquidityRatio);
  
  // 2. Ajustement selon la probabilité (si prix fourni)
  let probabilityFactor = 1.0;
  if (currentPrice !== undefined && currentPrice > 0) {
    const probability = currentPrice / 100;
    if (probability > 0.5) {
      // Probabilité élevée : réduire la volatilité
      // Formule : 1 - (probability - 0.5) × 0.8
      // À 70% : 1 - 0.2 × 0.8 = 0.84 (16% de réduction)
      // À 90% : 1 - 0.4 × 0.8 = 0.68 (32% de réduction)
      probabilityFactor = 1 - (probability - 0.5) * 0.8;
    }
    // Si probability <= 0.5, probabilityFactor reste à 1.0
  }
  
  // Combiner les deux ajustements
  return slope * liquidityFactor * probabilityFactor;
}
```

---

## 📊 SIMULATION

### Scénario 1 : Probabilité faible (10 Seeds)

**Paramètres** :
- Prix actuel = 10 Seeds (10% de probabilité)
- `ghostSupply = 2500`, `realSupply = 0`
- `slope = 0.02`

**Calcul** :
- `liquidityFactor = 0.3` (peu de liquidité)
- `probabilityFactor = 1.0` (probabilité faible, pas de réduction)
- `effectiveSlope = 0.02 × 0.3 × 1.0 = 0.006`

**Résultat** :
- ✅ Volatilité réduite par la liquidité (protection)
- ✅ Pas de réduction supplémentaire par la probabilité (multiplicateur élevé possible)

---

### Scénario 2 : Probabilité élevée (90 Seeds)

**Paramètres** :
- Prix actuel = 90 Seeds (90% de probabilité)
- `ghostSupply = 2500`, `realSupply = 5000` (beaucoup de liquidité)
- `slope = 0.02`

**Calcul** :
- `liquidityFactor = 0.93` (beaucoup de liquidité)
- `probabilityFactor = 1 - (0.9 - 0.5) × 0.8 = 0.68` (probabilité élevée)
- `effectiveSlope = 0.02 × 0.93 × 0.68 = 0.0126`

**Résultat** :
- ✅ Volatilité réduite par la probabilité (logique économique)
- ✅ Multiplicateur faible (1.11x max), ce qui est logique

---

### Scénario 3 : Probabilité moyenne (50 Seeds)

**Paramètres** :
- Prix actuel = 50 Seeds (50% de probabilité)
- `ghostSupply = 2500`, `realSupply = 2500` (liquidité modérée)
- `slope = 0.02`

**Calcul** :
- `liquidityFactor = 0.79` (liquidité modérée)
- `probabilityFactor = 1.0` (probabilité moyenne, pas de réduction)
- `effectiveSlope = 0.02 × 0.79 × 1.0 = 0.0158`

**Résultat** :
- ✅ Volatilité modérée (ajustement liquidité uniquement)
- ✅ Multiplicateur moyen (2x max), logique

---

## ✅ AVANTAGES

### 1. Logique économique
- ✅ Probabilité élevée → Multiplicateur faible (logique)
- ✅ Probabilité faible → Multiplicateur élevé (logique)
- ✅ Respecte les principes d'un marché prédictif

### 2. Protection contre les envolées artificielles
- ✅ Peu de liquidité → Volatilité réduite
- ✅ Probabilité élevée → Volatilité réduite
- ✅ Double protection

### 3. FOMO préservée
- ✅ Aux probabilités faibles/moyennes, volatilité normale
- ✅ Envolées possibles mais justifiées
- ✅ Crée de la FOMO quand c'est logique

---

## 🔧 PARAMÈTRES AJUSTABLES

### Coefficient de réduction probabilité

**Valeur actuelle** : `0.8` (dans `(probability - 0.5) × 0.8`)

**Impact** :
- Plus bas (ex: 0.6) → Moins de réduction à probabilité élevée
- Plus haut (ex: 1.0) → Plus de réduction à probabilité élevée

### Seuil de probabilité

**Valeur actuelle** : `0.5` (50%)

**Impact** :
- Plus bas (ex: 0.4) → Réduction commence plus tôt
- Plus haut (ex: 0.6) → Réduction commence plus tard

---

## ✅ CONCLUSION

### Solution complète

La formule combinée :
- ✅ **Ajuste selon la liquidité réelle** (évite envolées artificielles)
- ✅ **Ajuste selon la probabilité** (logique économique)
- ✅ **Préserve la FOMO** aux probabilités faibles/moyennes
- ✅ **Réduit la volatilité** aux probabilités élevées (logique)

**Résultat** : Un marché juste, logique et équilibré ! 🎯

---

**FIN DE L'AJUSTEMENT**

