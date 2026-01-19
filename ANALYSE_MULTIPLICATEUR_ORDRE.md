# 🎯 ANALYSE : MULTIPLICATEUR ET ORDRES FUTURS

## Date : 2025-01-27

---

## 🔴 PROBLÈME IDENTIFIÉ

### Question de l'utilisateur

1. **UI** : Le multiplicateur n'est pas affiché dans l'interface
2. **Logique** : Le calcul devrait se baser sur les prochains ordres (comme en bourse), pas juste sur le prix actuel

### Logique actuelle

**Bonding Curve** : `P(S) = m × S`
- Le prix est déterminé par le **supply actuel** (ghostSupply + realSupply)
- Pas de notion d'ordres futurs
- Le prix monte automatiquement avec chaque achat

**Exemple** :
- Prix actuel : 90 Seeds
- Achat de 100 actions → Prix monte à 92 Seeds (par exemple)
- **Multiplicateur max théorique** : 100 / 90 = 1.11x
- **MAIS** : Si personne n'achète après, le prix reste à 90 Seeds
- **RÉALITÉ** : Le multiplicateur dépend de si l'événement se produit ET du prix final

---

## 📐 LOGIQUE D'UN MARCHÉ PRÉDICTIF BINAIRE

### Multiplicateur théorique

Dans un marché prédictif binaire, le **multiplicateur max** est :
```
Multiplicateur max = 100 / prix_actuel
```

**Exemples** :
- Prix = 10 Seeds → Multiplicateur max = 10x (si l'événement se produit)
- Prix = 50 Seeds → Multiplicateur max = 2x (si l'événement se produit)
- Prix = 90 Seeds → Multiplicateur max = 1.11x (si l'événement se produit)

### Problème : Ordres futurs

**En bourse classique** :
- Le prix dépend des ordres en attente (order book)
- Si beaucoup d'ordres d'achat → Prix monte
- Si peu d'ordres → Prix stable

**Dans notre système (bonding curve)** :
- Pas d'ordres en attente
- Le prix monte **automatiquement** avec chaque achat
- Si personne n'achète après → Prix reste stable
- Si beaucoup d'achats → Prix monte rapidement

**Conséquence** :
- Le multiplicateur affiché (100 / prix_actuel) est **théorique**
- Il n'est garanti que si :
  1. L'événement se produit (résolution)
  2. Personne n'achète après (prix reste stable)

---

## ✅ SOLUTION PROPOSÉE

### 1. Afficher le multiplicateur théorique

**Formule** :
```
Multiplicateur max = 100 / prix_actuel
```

**Affichage** :
- "Multiplicateur max : 1.11x" (si prix = 90 Seeds)
- "Multiplicateur max : 10x" (si prix = 10 Seeds)

**Important** : Préciser que c'est le multiplicateur **si l'événement se produit** et **si personne n'achète après**.

### 2. Calculer le prix après l'achat

**Formule actuelle** :
```
Prix après achat = slope × (totalSupply + shares)
```

**Multiplicateur après achat** :
```
Multiplicateur après achat = 100 / prix_après_achat
```

**Exemple** :
- Prix actuel : 90 Seeds → Multiplicateur = 1.11x
- Achat de 100 actions → Prix monte à 92 Seeds
- Multiplicateur après achat = 100 / 92 = 1.09x
- **Gain réel** : Le multiplicateur diminue légèrement

### 3. Afficher les deux informations

**Avant achat** :
- Prix actuel : 90 Seeds
- Multiplicateur max : 1.11x (si événement se produit)

**Après achat (estimation)** :
- Prix après achat : 92 Seeds (estimé)
- Multiplicateur après achat : 1.09x (estimé)
- **Note** : "Le multiplicateur diminue si d'autres personnes achètent après vous"

---

## 🎯 IMPLÉMENTATION

### Calcul du multiplicateur

```typescript
function calculateMultiplier(currentPrice: number): number {
  if (currentPrice <= 0 || currentPrice >= 100) return 1;
  return 100 / currentPrice;
}

function calculatePriceAfterPurchase(
  slope: number,
  ghostSupply: number,
  currentRealSupply: number,
  shares: number
): number {
  const currentTotalSupply = ghostSupply + currentRealSupply;
  const newRealSupply = currentRealSupply + shares;
  const newTotalSupply = ghostSupply + newRealSupply;
  
  // Utiliser la pente effective ajustée
  const newBasePrice = slope * newTotalSupply;
  const newPrice = getCurrentPriceAdjusted(slope, ghostSupply, newRealSupply);
  
  return newPrice;
}
```

### Affichage dans l'UI

```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <span className="text-[10px] text-muted-foreground">Multiplicateur max</span>
    <span className="text-[10px] font-semibold text-primary">
      {currentPrice > 0 ? (100 / currentPrice).toFixed(2) : "-"}x
    </span>
  </div>
  <p className="text-[9px] text-muted-foreground/80 italic">
    Si l'événement se produit et que personne n'achète après
  </p>
  
  {estimatedPriceAfterPurchase > 0 && (
    <div className="pt-2 border-t border-border/30">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Après votre achat</span>
        <span className="text-[10px] font-semibold">
          {(100 / estimatedPriceAfterPurchase).toFixed(2)}x
        </span>
      </div>
      <p className="text-[9px] text-muted-foreground/80 italic">
        Le multiplicateur diminue si d'autres achètent après vous
      </p>
    </div>
  )}
</div>
```

---

## ✅ CONCLUSION

### Réponse à la question

**Le système actuel** :
- ✅ Calcule le prix basé sur le supply actuel (bonding curve)
- ✅ Le prix monte automatiquement avec chaque achat
- ❌ Ne prend pas en compte les ordres futurs (pas d'order book)

**C'est normal** car :
- Une bonding curve n'a pas d'ordres en attente
- Le prix est déterminé par le supply actuel
- Chaque achat fait monter le prix immédiatement

**Le multiplicateur** :
- Est **théorique** : 100 / prix_actuel
- N'est garanti que si l'événement se produit ET personne n'achète après
- Diminue si d'autres personnes achètent après

**Solution** :
- ✅ Afficher le multiplicateur théorique
- ✅ Afficher le multiplicateur après achat (estimé)
- ✅ Préciser que c'est théorique et dépend des achats futurs

---

**FIN DE L'ANALYSE**

