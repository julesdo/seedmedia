# 📊 ANALYSE DES PARAMÈTRES ÉCONOMIQUES ACTUELS

## Date : 2025-01-27

---

## 🎯 PARAMÈTRES ACTUELS

### 1. Taxes de vente (PROGRESSIVE - DÉJÀ IMPLÉMENTÉE ✅)

| Durée de détention | Taxe actuelle | Impact |
|-------------------|---------------|--------|
| < 24h | **20%** | Décourage trading rapide |
| 24h - 7j | **15%** | Encourage positions court terme |
| 7j - 30j | **10%** | Encourage positions moyen terme |
| > 30j | **5%** | Récompense positions long terme |

**✅ BON** : Système progressif déjà en place, encourage les positions long terme.

**⚠️ POSSIBLE AMÉLIORATION** :
- Augmenter la taxe < 24h à **25-30%** pour vraiment décourager le day trading
- Augmenter la taxe 24h-7j à **18-20%** pour renforcer l'encouragement long terme

---

### 2. Récompenses passives

#### A. Daily Login
- **Base** : 10 Seeds/jour
- **Streak bonus** : +5 Seeds par jour consécutif (max +50/jour)
- **Variable reward** : 10% de chance de x2
- **Maximum possible** : 10 + 50 + (10+50) = **120 Seeds/jour** (avec chance x2)

**Analyse** :
- ✅ **BON** : Montants raisonnables, encourage la rétention
- ⚠️ **POSSIBLE AJUSTEMENT** : Réduire le maximum à 80-100 Seeds/jour pour ralentir la progression

#### B. Participation (par décision)
- **Base** : 2 Seeds
- **Premier anticipateur** : +3 Seeds bonus
- **Décision "hot" (heat > 70)** : +5 Seeds bonus
- **Maximum** : 2 + 3 + 5 = **10 Seeds par décision**

**Analyse** :
- ✅ **BON** : Montants faibles, encourage la participation sans enrichir
- ✅ **PAS BESOIN DE MODIFIER**

#### C. Actions sociales
- **Follow** : 2 Seeds
- **Comment** : 3 Seeds
- **Share** : 5 Seeds
- **Source ajoutée** : 5-10 Seeds (selon validation)

**Analyse** :
- ✅ **BON** : Montants faibles, encourage l'engagement social
- ✅ **PAS BESOIN DE MODIFIER**

---

### 3. Bonding Curve (Coûts d'achat)

**Formule** : `P(S) = m × S` où `m = 100 / depthFactor`

**Paramètres actuels** :
- `depthFactor` : Variable (500-10000 selon la décision)
- `slope` : Calculé automatiquement (0.01 à 0.2)

**Analyse** :
- ✅ **BON** : Le prix augmente avec chaque achat (coût croissant)
- ✅ **PAS BESOIN DE MODIFIER** (mécanisme fondamental)

---

### 4. Packs de Seeds (Shop)

| Pack | Seeds | Prix | Ratio Seeds/€ | Niveau équivalent |
|------|-------|------|---------------|-------------------|
| Survie | 1200 | 1.99€ | **603 Seeds/€** | Niveau 3-4 |
| Stratège | 6000 | 9.99€ | **601 Seeds/€** | Niveau 7-8 |
| Whale | 30000 | 49.99€ | **600 Seeds/€** | Niveau 17-18 |

**Analyse** :
- ✅ **BON** : Ratio cohérent (~600 Seeds/€)
- ⚠️ **POSSIBLE AJUSTEMENT** : Augmenter légèrement les Seeds pour rendre les packs plus attractifs (ex: 650-700 Seeds/€)

---

### 5. Système de niveaux

**Formule actuelle** : `level = floor(sqrt(seedsBalance / 100)) + 1`

**Exemples** :
- Niveau 1 : 0-100 Seeds
- Niveau 2 : 100-400 Seeds (+300)
- Niveau 3 : 400-900 Seeds (+500)
- Niveau 10 : 8100-10000 Seeds (+1900)
- Niveau 50 : 240100-250000 Seeds (+9900)

**Analyse** :
- ✅ **BON** : Progression exponentielle (de plus en plus difficile)
- ⚠️ **POSSIBLE AJUSTEMENT** : Augmenter le diviseur de 100 à 120-150 pour ralentir la progression

---

## 🔍 PROBLÈMES IDENTIFIÉS

### Problème #1 : Taxe < 24h peut être insuffisante
- **Actuel** : 20% de taxe pour ventes < 24h
- **Impact** : Un trader peut encore faire des profits rapides
- **Solution** : Augmenter à **25-30%** pour vraiment décourager

### Problème #2 : Daily login peut être trop généreux
- **Actuel** : Maximum 120 Seeds/jour (avec chance x2)
- **Impact** : Un utilisateur très actif peut gagner 3600 Seeds/mois juste en se connectant
- **Solution** : Réduire le maximum à **80-100 Seeds/jour**

### Problème #3 : Progression de niveaux peut être trop rapide
- **Actuel** : Diviseur de 100 dans la formule
- **Impact** : Un trader habile peut atteindre niveau 10 en quelques jours
- **Solution** : Augmenter le diviseur à **120-150**

---

## 💡 RECOMMANDATIONS D'AJUSTEMENTS (SANS NOUVELLES FEATURES)

### 🔴 PRIORITÉ 1 : Augmenter les taxes de vente rapide

**Changements proposés** :
```typescript
// AVANT
if (holdingDurationDays < 1) {
  taxRate = 0.20; // 20%
} else if (holdingDurationDays < 7) {
  taxRate = 0.15; // 15%
}

// APRÈS
if (holdingDurationDays < 1) {
  taxRate = 0.30; // 30% (au lieu de 20%)
} else if (holdingDurationDays < 7) {
  taxRate = 0.20; // 20% (au lieu de 15%)
}
```

**Impact** :
- Réduction de 50% des gains sur ventes < 24h
- Réduction de 33% des gains sur ventes < 7j
- Encourage vraiment les positions long terme

**Effort** : ⭐ Très faible (modification de 2 valeurs)

---

### 🟡 PRIORITÉ 2 : Réduire les récompenses daily login

**Changements proposés** :
```typescript
// AVANT
const baseSeeds = 10;
const streakBonus = Math.min(newStreak * 5, 50); // Max 50

// APRÈS
const baseSeeds = 8; // Réduit de 10 à 8
const streakBonus = Math.min(newStreak * 4, 40); // Max 40 (au lieu de 50)
```

**Impact** :
- Maximum quotidien : 8 + 40 + (8+40) = **96 Seeds/jour** (au lieu de 120)
- Réduction de 20% des gains passifs
- Encourage plus les achats

**Effort** : ⭐ Très faible (modification de 2 valeurs)

---

### 🟡 PRIORITÉ 3 : Ralentir la progression de niveaux

**Changements proposés** :
```typescript
// AVANT
level = floor(sqrt(seedsBalance / 100)) + 1

// APRÈS
level = floor(sqrt(seedsBalance / 130)) + 1  // Diviseur augmenté de 100 à 130
```

**Impact** :
- Niveau 2 : 130-520 Seeds (au lieu de 100-400) = +30% plus difficile
- Niveau 10 : 10530-13000 Seeds (au lieu de 8100-10000) = +30% plus difficile
- Ralentit la progression sans changer la courbe

**Effort** : ⭐ Très faible (modification de 1 valeur)

---

### 🟢 PRIORITÉ 4 : Augmenter légèrement les Seeds dans les packs

**Changements proposés** :
```typescript
// AVANT
pack_survie: { seeds: 1200, price: 199 }
pack_strategie: { seeds: 6000, price: 999 }
pack_whale: { seeds: 30000, price: 4999 }

// APRÈS
pack_survie: { seeds: 1300, price: 199 }      // +100 Seeds (+8%)
pack_strategie: { seeds: 6500, price: 999 }   // +500 Seeds (+8%)
pack_whale: { seeds: 32000, price: 4999 }    // +2000 Seeds (+7%)
```

**Impact** :
- Ratio passe de ~600 Seeds/€ à ~650 Seeds/€
- Rendre les packs plus attractifs par rapport au trading
- Encourage les achats

**Effort** : ⭐ Très faible (modification de 3 valeurs)

---

## 📊 SIMULATION D'IMPACT GLOBAL

### Scénario actuel (sans modifications)

**Utilisateur actif qui trade** :
- Achat : 1000 parts à 10 Seeds = 5000 Seeds
- Vente après +50% (< 24h) : 1000 parts à 15 Seeds = 12000 Seeds (après 20% taxe)
- **Gain net : +7000 Seeds**
- Daily login (30 jours) : 120 × 30 = 3600 Seeds
- **Total mensuel : +10600 Seeds**
- **Niveau atteint : ~10**

### Scénario avec modifications

**Utilisateur actif qui trade** :
- Achat : 1000 parts à 10 Seeds = 5000 Seeds
- Vente après +50% (< 24h) : 1000 parts à 15 Seeds = 10500 Seeds (après 30% taxe)
- **Gain net : +5500 Seeds** (réduction de 21%)
- Daily login (30 jours) : 96 × 30 = 2880 Seeds (réduction de 20%)
- **Total mensuel : +8380 Seeds** (réduction de 21%)
- **Niveau atteint : ~8-9** (ralenti par diviseur 130)

**Résultat** :
- ✅ Gains réduits de ~20%
- ✅ Progression ralentie
- ✅ Les packs deviennent plus attractifs (ratio amélioré)
- ✅ Encore possible de progresser, mais plus lentement

---

## ✅ PLAN D'ACTION RECOMMANDÉ

### Phase 1 : Ajustements immédiats (5 minutes)

1. **Augmenter taxes de vente rapide** :
   - < 24h : 20% → **30%**
   - 24h-7j : 15% → **20%**

2. **Réduire daily login** :
   - Base : 10 → **8**
   - Streak max : 50 → **40**

### Phase 2 : Ajustements secondaires (2 minutes)

3. **Ralentir progression niveaux** :
   - Diviseur : 100 → **130**

4. **Augmenter Seeds dans packs** :
   - Survie : 1200 → **1300**
   - Stratège : 6000 → **6500**
   - Whale : 30000 → **32000**

---

## 🎯 OBJECTIF FINAL

**Créer un équilibre où** :
- ✅ Les utilisateurs peuvent encore gagner, mais **plus lentement**
- ✅ Les achats dans le shop sont **plus attractifs** (ratio amélioré)
- ✅ La progression est **satisfaisante** mais **plus difficile**
- ✅ Le trading rapide est **vraiment découragé** (30% taxe)
- ✅ Les positions long terme sont **vraiment récompensées** (5% taxe)

**Sans ajouter de nouvelles features** - Juste des ajustements de paramètres ! 🎯

---

**FIN DE L'ANALYSE**

