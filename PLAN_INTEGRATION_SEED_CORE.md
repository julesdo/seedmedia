# 📋 PLAN D'INTÉGRATION : SEED CORE ENGINE
## Transformation vers un Marché Prédictif Binaire avec Bonding Curve

**Version:** 1.0  
**Date:** 2025-01-XX  
**Objectif:** Transformer le système actuel (questions à 3 réponses) en un marché prédictif binaire (OUI/NON) avec AMM et Bonding Curve.

---

## 🔍 PARTIE 1 : ÉTAT DES LIEUX ACTUEL

### 1.1 Architecture Actuelle

#### **Backend (Convex)**
- **Table `decisions`**: Contient `question`, `answer1`, `answer2`, `answer3` (3 réponses)
- **Table `anticipations`**: Stocke les votes avec `issue: "works" | "partial" | "fails"` (3 positions)
- **Table `topArguments`**: Système d'enchères pour commentaires (déjà compatible avec le nouveau système)
- **Table `opinionSnapshots`**: Snapshots quotidiens avec `worksPrice`, `partialPrice`, `failsPrice`
- **Table `opinionCourseTicks`**: Ticks en temps réel avec les 3 prix
- **Fonction `calculatePositionPrice`**: Calcule le prix basé sur les votes (formule simple, pas de bonding curve)
- **Bot `generateDecision`**: Génère des questions avec 3 réponses via IA

#### **Frontend (React/Next.js)**
- **`QuizSimple.tsx`**: Affiche 3 boutons (works/partial/fails) avec styles de skin
- **`OpinionCourseChart.tsx`**: Graphique avec 3 lignes (OUI/PARTIEL/NON)
- **`TopArgumentsList.tsx`**: Liste de commentaires avec système d'enchères
- **`DecisionDetail.tsx`**: Page principale qui orchestre tous les composants

### 1.2 Ce qui doit être SUPPRIMÉ

#### **Backend**
1. ❌ **Champ `answer2` (PARTIEL)** dans `decisions` → À supprimer du schema
2. ❌ **Champ `answer3` (FAILS)** dans `decisions` → À supprimer du schema (garder seulement `answer1` = OUI)
3. ❌ **Position `"partial"`** dans `anticipations.issue` → Remplacer par union binaire
4. ❌ **Champ `partialPrice`** dans `opinionSnapshots` et `opinionCourseTicks` → À supprimer
5. ❌ **Fonction `calculatePositionPrice`** actuelle → Remplacer par bonding curve
6. ❌ **Génération de `answer2` et `answer3`** dans `generateDecision.ts` → Supprimer
7. ❌ **Logique de résolution avec 3 issues** → Simplifier en binaire

#### **Frontend**
1. ❌ **Bouton "PARTIEL"** dans `QuizSimple.tsx` → Supprimer
2. ❌ **Ligne "PARTIEL"** dans `OpinionCourseChart.tsx` → Supprimer
3. ❌ **Position `"partial"`** dans tous les composants → Supprimer
4. ❌ **Traductions `answer2` et `answer3`** dans `decisionTranslations` → Supprimer

### 1.3 Ce qui doit être MODIFIÉ

#### **Backend**
1. ✅ **Table `decisions`**: 
   - Renommer `question` → `prediction` (optionnel, ou garder `question`)
   - Supprimer `answer2`, `answer3`
   - Garder `answer1` comme "OUI" (ou renommer en `yesAnswer`)
   - Ajouter `targetPrice: number` (prix de départ voulu)
   - Ajouter `depthFactor: number` (volatilité)

2. ✅ **Table `anticipations`**: 
   - Changer `issue: "works" | "partial" | "fails"` → `position: "yes" | "no"`
   - Supprimer `seedsEngaged` (remplacé par le système de trading)
   - Ajouter `sharesOwned: number` (nombre d'actions possédées)
   - Ajouter `totalInvested: number` (Seeds investis au total)

3. ✅ **Nouvelle table `tradingPools`**:
   ```typescript
   {
     decisionId: Id<"decisions">,
     position: "yes" | "no",
     slope: number, // m (pente de la bonding curve)
     ghostSupply: number, // S_ghost (supply fantôme initial)
     realSupply: number, // Supply réel (actions utilisateurs)
     reserve: number, // Seeds dans la réserve
   }
   ```

4. ✅ **Nouvelle table `tradingTransactions`**:
   ```typescript
   {
     decisionId: Id<"decisions">,
     userId: Id<"users">,
     position: "yes" | "no",
     type: "buy" | "sell",
     shares: number, // Nombre d'actions achetées/vendues
     cost: number, // Coût en Seeds (pour buy) ou montant brut (pour sell)
     netAmount: number, // Montant net reçu (pour sell, après taxe)
     timestamp: number,
   }
   ```

5. ✅ **Fonctions de trading**:
   - `buyShares(decisionId, position, shares)` → Calcule coût via bonding curve, débite Seeds, crédite actions
   - `sellShares(decisionId, position, shares)` → Calcule montant brut, applique taxe 5%, crédite Seeds
   - `getCurrentPrice(decisionId, position)` → Retourne prix instantané P(S) = m × S
   - `initializePools(decisionId)` → Calcule m et S_ghost à la création

6. ✅ **Résolution**:
   - Quand `decision.status = "resolved"`, déterminer le gagnant (OUI ou NON)
   - Liquider le pool perdant (valeur = 0)
   - Transférer la réserve du perdant vers le gagnant
   - Calculer `finalPrice = (Reserve_YES + Reserve_NO) / RealSupply_WINNER`
   - Créditer les Seeds aux détenteurs d'actions du gagnant

#### **Frontend**
1. ✅ **`QuizSimple.tsx`**: 
   - Afficher 2 boutons seulement (OUI / NON)
   - Afficher le prix actuel de chaque position
   - Permettre d'acheter/vendre des actions (pas juste voter)
   - Afficher le portefeuille de l'utilisateur (actions possédées)

2. ✅ **`OpinionCourseChart.tsx`**: 
   - Afficher 2 lignes seulement (OUI / NON)
   - Utiliser les données de `tradingPools` pour le prix

3. ✅ **`TopArgumentsList.tsx`**: 
   - Supprimer la position `"partial"`
   - Garder seulement `"yes"` et `"no"`

4. ✅ **Nouveau composant `TradingInterface.tsx`**: 
   - Interface d'achat/vente d'actions
   - Affichage du portefeuille
   - Calcul en temps réel du coût selon le nombre d'actions

### 1.4 Ce qui doit être AJOUTÉ (Shop)

#### **Backend**
1. ✅ **Table `userDecisionUnlocks`** (ITEM 2: Rayon X):
   ```typescript
   {
     userId: Id<"users">,
     decisionId: Id<"decisions">,
     unlockedAt: number,
   }
   ```

2. ✅ **Champ `isFounderMember: boolean`** dans `users` (ITEM 3: Badge Fondateur)

3. ✅ **Champs dans `decisions`** (ITEM 1: Top Comment):
   - `topCommentId: Id<"topArguments">` (optionnel)
   - `currentBidPrice: number` (prix plancher actuel)

4. ✅ **Mutations**:
   - `unlockRayonX(decisionId)` → Débite 50 Seeds, crée entrée dans `userDecisionUnlocks`
   - `purchaseFounderBadge()` → Débite 5000 Seeds, met `isFounderMember = true`
   - `bidForTopComment(decisionId, commentId, bidAmount)` → Mise à jour du système existant

#### **Frontend**
1. ✅ **Composant `Shop.tsx`**: 
   - Bouton "Rayon X" (50 Seeds) → Affiche courbe Gold
   - Bouton "Badge Fondateur" (5000 Seeds) → Active badge
   - Bouton "Top Comment" → Intégré dans `TopArgumentsList`

2. ✅ **Affichage badge fondateur**: 
   - Pseudo en couleur Or + icône spéciale partout (feed, commentaires, leaderboard)

3. ✅ **Courbe Gold dans `OpinionCourseChart`**: 
   - Si `userDecisionUnlocks` existe, afficher 2ème courbe avec votes des Top 1%

---

## 📅 PARTIE 2 : PLAN D'INTÉGRATION STEP-BY-STEP

### **PHASE 1 : PRÉPARATION & NETTOYAGE** (2-3 jours)

#### **Étape 1.1 : Backup & Migration de données**
- [ ] Créer un script de backup de toutes les données existantes
- [ ] Créer une migration pour convertir les anticipations existantes :
  - `"works"` → `"yes"`
  - `"fails"` → `"no"`
  - `"partial"` → Supprimer ou convertir selon logique métier
- [ ] Créer une migration pour supprimer `answer2` et `answer3` des décisions existantes

#### **Étape 1.2 : Mise à jour du Schema**
- [ ] Modifier `convex/schema.ts` :
  - Supprimer `answer2`, `answer3` de `decisions`
  - Ajouter `targetPrice`, `depthFactor` à `decisions`
  - Changer `issue: "works" | "partial" | "fails"` → `position: "yes" | "no"` dans `anticipations`
  - Supprimer `partialPrice` de `opinionSnapshots` et `opinionCourseTicks`
  - Supprimer `position: "partial"` de `topArguments`
  - Ajouter table `tradingPools`
  - Ajouter table `tradingTransactions`
  - Ajouter table `userDecisionUnlocks`
  - Ajouter `isFounderMember` à `users`
  - Ajouter `topCommentId`, `currentBidPrice` à `decisions`

#### **Étape 1.3 : Suppression du code obsolète**
- [ ] Supprimer toutes les références à `"partial"` dans le backend
- [ ] Supprimer la génération de `answer2` et `answer3` dans `generateDecision.ts`
- [ ] Supprimer `calculatePositionPrice` actuel (sera remplacé)

---

### **PHASE 2 : CORE TRADING ENGINE** (5-7 jours)

#### **Étape 2.1 : Implémentation de la Bonding Curve**
- [ ] Créer `convex/tradingEngine.ts` avec :
  - Fonction `calculateSlope(targetPrice, depthFactor)` → `m = 100 / depthFactor`
  - Fonction `calculateGhostSupply(targetPrice, slope)` → `S_ghost = targetPrice / m`
  - Fonction `getCurrentPrice(slope, totalSupply)` → `P = m × S`
  - Fonction `calculateBuyCost(slope, currentSupply, shares)` → `Cost = (m/2) × (S_new² - S_current²)`
  - Fonction `calculateSellGross(slope, currentSupply, shares)` → `Gross = (m/2) × (S_current² - S_new²)`
  - Fonction `calculateSellNet(gross)` → `Net = Gross × 0.95`

#### **Étape 2.2 : Initialisation des Pools**
- [ ] Créer mutation `initializeTradingPools(decisionId)` :
  - Lire `targetPrice` et `depthFactor` de la décision
  - Calculer `m` et `S_ghost` pour OUI et NON
  - Créer 2 entrées dans `tradingPools` (une pour OUI, une pour NON)
  - Appeler automatiquement à la création d'une décision

#### **Étape 2.3 : Fonctions d'achat/vente**
- [ ] Créer mutation `buyShares(decisionId, position, shares)` :
  - Vérifier que l'utilisateur a assez de Seeds
  - Récupérer le pool correspondant
  - Calculer le coût via `calculateBuyCost`
  - Débiter les Seeds de l'utilisateur
  - Ajouter `shares` au `realSupply` du pool
  - Ajouter le coût à la `reserve` du pool
  - Créer entrée dans `tradingTransactions`
  - Mettre à jour `anticipations` (ou créer si n'existe pas) avec `sharesOwned` et `totalInvested`

- [ ] Créer mutation `sellShares(decisionId, position, shares)` :
  - Vérifier que l'utilisateur possède assez d'actions
  - Récupérer le pool correspondant
  - Calculer le montant brut via `calculateSellGross`
  - Calculer le montant net (après taxe 5%)
  - Retirer `shares` du `realSupply` du pool
  - Retirer le brut de la `reserve` du pool
  - Créditer le net à l'utilisateur
  - Créer entrée dans `tradingTransactions`
  - Mettre à jour `anticipations`

#### **Étape 2.4 : Queries pour le frontend**
- [ ] Créer query `getTradingPools(decisionId)` → Retourne les 2 pools avec prix actuels
- [ ] Créer query `getUserPortfolio(decisionId, userId)` → Retourne actions possédées
- [ ] Créer query `getCurrentPrice(decisionId, position)` → Retourne prix instantané
- [ ] Créer query `getTradingHistory(decisionId)` → Historique des transactions

---

### **PHASE 3 : RÉSOLUTION & LIQUIDATION** (2-3 jours)

#### **Étape 3.1 : Logique de résolution**
- [ ] Modifier la fonction de résolution existante :
  - Déterminer le gagnant (OUI ou NON) selon les indicateurs
  - Marquer `decision.status = "resolved"`

#### **Étape 3.2 : Liquidation des pools**
- [ ] Créer mutation `liquidatePools(decisionId, winner)` :
  - Récupérer les 2 pools
  - Pool perdant : `reserve = 0`, `realSupply = 0` (actions = 0)
  - Transférer `reserve` du perdant vers le gagnant
  - Calculer `finalPrice = (Reserve_YES + Reserve_NO) / RealSupply_WINNER`
  - Pour chaque utilisateur avec des actions du gagnant :
    - `payout = sharesOwned × finalPrice`
    - Créditer les Seeds
    - Créer transaction "earned"
  - Marquer toutes les anticipations comme résolues

---

### **PHASE 4 : MODIFICATION DU FRONTEND** (4-5 jours)

#### **Étape 4.1 : QuizSimple → TradingInterface**
- [ ] Renommer `QuizSimple.tsx` → `TradingInterface.tsx` (ou créer nouveau composant)
- [ ] Afficher 2 boutons seulement (OUI / NON)
- [ ] Afficher le prix actuel de chaque position (via `getCurrentPrice`)
- [ ] Ajouter input pour nombre d'actions à acheter
- [ ] Afficher le coût calculé en temps réel
- [ ] Implémenter `buyShares` au clic
- [ ] Afficher le portefeuille de l'utilisateur (actions possédées)
- [ ] Ajouter bouton "Vendre" avec input pour nombre d'actions

#### **Étape 4.2 : OpinionCourseChart**
- [ ] Supprimer la ligne "PARTIEL"
- [ ] Modifier les queries pour récupérer les prix depuis `tradingPools` (ou `tradingTransactions` pour l'historique)
- [ ] Afficher seulement 2 lignes (OUI / NON)

#### **Étape 4.3 : TopArgumentsList**
- [ ] Supprimer toutes les références à `position: "partial"`
- [ ] Filtrer pour afficher seulement `"yes"` et `"no"`

#### **Étape 4.4 : DecisionDetail**
- [ ] Remplacer `QuizSimple` par `TradingInterface`
- [ ] Mettre à jour les props et les appels de mutations

---

### **PHASE 5 : SHOP & FEATURES DOPAMINE** (3-4 jours)

#### **Étape 5.1 : Top Comment (King of the Hill)**
- [ ] Modifier `bidOnArgument` dans `convex/topArguments.ts` :
  - Vérifier que `bidAmount >= currentBidPrice + 10%`
  - Mettre à jour `decision.topCommentId` et `decision.currentBidPrice`
  - (Le système existant est déjà presque compatible)

#### **Étape 5.2 : Rayon X (Data Insider)**
- [ ] Créer mutation `unlockRayonX(decisionId)` :
  - Vérifier que l'utilisateur a 50 Seeds
  - Débiter 50 Seeds
  - Créer entrée dans `userDecisionUnlocks`
- [ ] Créer query `getTopUsersVotes(decisionId)` :
  - Filtrer les utilisateurs avec `credibilityScore > 20` (Top 1%)
  - Retourner leurs votes pour cette décision
- [ ] Modifier `OpinionCourseChart` :
  - Si `userDecisionUnlocks` existe, afficher courbe Gold
  - Utiliser `getTopUsersVotes` pour les données

#### **Étape 5.3 : Badge Fondateur**
- [ ] Créer mutation `purchaseFounderBadge()` :
  - Vérifier que l'utilisateur a 5000 Seeds
  - Débiter 5000 Seeds
  - Mettre `isFounderMember = true`
- [ ] Créer composant `FounderBadge.tsx` :
  - Afficher icône spéciale + couleur Or
- [ ] Intégrer dans :
  - Feed de décisions
  - Commentaires
  - Leaderboard
  - Profil utilisateur

#### **Étape 5.4 : Composant Shop**
- [ ] Créer `Shop.tsx` :
  - Bouton "Rayon X" (50 Seeds) → Appelle `unlockRayonX`
  - Bouton "Badge Fondateur" (5000 Seeds) → Appelle `purchaseFounderBadge`
  - Bouton "Top Comment" → Intégré dans `TopArgumentsList`
- [ ] Ajouter dans la page profil ou dans un menu dédié

---

### **PHASE 6 : NETTOYAGE & SIMPLIFICATION DES BOTS** (3-4 jours)

#### **Étape 6.1 : Analyse de l'état actuel des bots**
**Bots existants (5 bots)** :
1. **Détecteur** (`detecteur`) - Détecte les événements depuis les sources
2. **Générateur** (`generateur`) - Génère les Decision Cards avec questions et 3 réponses
3. **Résolveur** (`resolveur`) - Résout automatiquement les décisions
4. **Suiveur** (`suiveur`) - Suit les indicateurs économiques
5. **Agrégateur** (`agregateur`) - Agrège les actualités

**Bots nécessaires pour le nouveau système** :
- ✅ **Générateur** : Modifié pour créer des **prédictions binaires** (OUI/NON) directement depuis les news
- ✅ **Résolveur** : Garde pour vérifier la résolution et clôturer les prédictions
- ❓ **Suiveur** : Nécessaire pour la résolution (suivre les indicateurs)
- ❌ **Détecteur** : Peut être fusionné avec Générateur (le Générateur peut traiter directement les news)
- ❌ **Agrégateur** : Peut être supprimé si le Générateur traite directement les news

#### **Étape 6.2 : Simplification - Fusion Détecteur + Générateur**
- [ ] Modifier `generateDecision` pour :
  - Traiter directement les news (sans passer par `detectDecisions`)
  - Ou garder `detectDecisions` mais simplifier le flux
- [ ] Supprimer ou désactiver le bot "Détecteur" dans la table `bots`
- [ ] Mettre à jour les cron jobs pour appeler directement `generateDecision` sur les news

#### **Étape 6.3 : Modification de generateDecision pour prédictions binaires**
- [ ] Renommer conceptuellement : "question" → "prediction" (ou garder `question` mais changer le prompt)
- [ ] Supprimer la génération de `answer2` et `answer3`
- [ ] Modifier le prompt IA pour générer seulement :
  - `prediction` (prédiction binaire claire : "Est-ce que X va se passer ?")
  - `yesAnswer` (scénario OUI : description de ce qui se passe si la prédiction est vraie)
  - (Le scénario NON est implicite : l'inverse du OUI)
- [ ] Ajouter génération de `targetPrice` et `depthFactor` :
  - `targetPrice` : Basé sur la "chaleur" de l'événement (80 Seeds pour évidence, 5 Seeds pour rumeur)
  - `depthFactor` : Basé sur la volatilité attendue (10000 pour stable, 500 pour volatile)
- [ ] Modifier la description du bot "Générateur" :
  - Ancien : "Génère automatiquement les Decision Cards avec questions objectives et réponses factuelles"
  - Nouveau : "Génère automatiquement des prédictions binaires (OUI/NON) à partir des actualités"

#### **Étape 6.4 : Remplacement de l'Agrégateur par solution client-side légère**
**Problème actuel** :
- Le bot Agrégateur parcourt 100+ sources RSS
- Récupère les métadonnées (images) via API
- Sauvegarde tout en base (`newsItems`)
- Cron jobs toutes les heures/6h
- **Très gourmand** : requêtes HTTP, stockage, coûts API

**Solution proposée** : Affichage client-side sans stockage
- [ ] Créer composant `RelatedNewsClient.tsx` qui :
  - Utilise Google News RSS directement côté client (gratuit, pas d'API key)
  - Construit la requête RSS avec les mots-clés de la prédiction
  - Parse le RSS côté client (pas de backend)
  - Cache les résultats dans `localStorage` (évite requêtes répétées)
  - Lazy loading : charge seulement quand l'utilisateur clique sur "Voir les articles"
- [ ] Supprimer la table `newsItems` du schema (ou la garder pour rétrocompatibilité mais ne plus l'utiliser)
- [ ] Supprimer le bot "Agrégateur" et ses cron jobs
- [ ] Supprimer `convex/bots/aggregateNews.ts`
- [ ] Modifier `DecisionDetail.tsx` pour utiliser `RelatedNewsClient` au lieu de `decision.newsItems`
- [ ] Avantages :
  - ✅ **Zéro coût** : Pas d'API payante, pas de stockage
  - ✅ **Zéro backend** : Tout côté client
  - ✅ **Toujours à jour** : Les news sont récupérées en temps réel
  - ✅ **Léger** : Charge seulement si l'utilisateur demande

#### **Étape 6.5 : Mise à jour du Résolveur**
- [ ] Modifier `resolveDecision` pour :
  - Déterminer le gagnant binaire (OUI ou NON) au lieu de 3 issues
  - Appeler `liquidatePools` après résolution
  - Mettre à jour la description : "Résout automatiquement les prédictions en déterminant si OUI ou NON"

#### **Étape 6.6 : Appel automatique d'initialisation**
- [ ] Après création d'une prédiction, appeler automatiquement `initializeTradingPools`
- [ ] S'assurer que les pools sont initialisés avant que les utilisateurs puissent trader

#### **Étape 6.7 : Mise à jour des cron jobs**
- [ ] Modifier `convex/crons.ts` ou `convex/bots/scheduled.ts` :
  - Supprimer les cron jobs liés au Détecteur (si fusionné)
  - Mettre à jour les cron jobs pour le nouveau flux
  - Garder le cron job du Résolveur (quotidien)
  - Garder le cron job du Suiveur (si nécessaire pour la résolution)

---

### **PHASE 7 : TESTS & VALIDATION** (2-3 jours)

#### **Étape 7.1 : Tests unitaires**
- [ ] Tester toutes les formules de bonding curve
- [ ] Tester les calculs d'achat/vente
- [ ] Tester la liquidation

#### **Étape 7.2 : Tests d'intégration**
- [ ] Tester le flux complet : création → achat → vente → résolution
- [ ] Tester les 3 items du Shop
- [ ] Tester les migrations de données

#### **Étape 7.3 : Tests UI/UX**
- [ ] Vérifier que l'interface est intuitive
- [ ] Vérifier que les prix s'affichent correctement
- [ ] Vérifier que le graphique fonctionne avec 2 lignes

---

## 📊 RÉSUMÉ DES MODIFICATIONS

### **Fichiers à MODIFIER**
1. `convex/schema.ts` → Supprimer champs obsolètes, ajouter nouvelles tables
2. `convex/decisions.ts` → Supprimer `answer2`, `answer3`, ajouter `targetPrice`, `depthFactor`
3. `convex/anticipations.ts` → Changer `issue` → `position`, supprimer `partial`
4. `convex/trading.ts` → Remplacer par `tradingEngine.ts` avec bonding curve
5. `convex/bots/generateDecision.ts` → Supprimer génération de `answer2`, `answer3`, modifier pour prédictions binaires
6. `convex/bots/detectDecisions.ts` → Fusionner avec `generateDecision` ou simplifier
7. `convex/bots/resolveDecisions.ts` → Modifier pour résolution binaire (OUI/NON)
8. `convex/bots/scheduled.ts` → Mettre à jour les cron jobs après simplification
9. `convex/bots.ts` → Mettre à jour les descriptions des bots, désactiver/supprimer bots inutiles
10. `convex/topArguments.ts` → Supprimer `position: "partial"`
11. `src/components/decisions/QuizSimple.tsx` → Transformer en `TradingInterface.tsx`
12. `src/components/decisions/OpinionCourseChart.tsx` → Supprimer ligne PARTIEL
13. `src/components/decisions/TopArgumentsList.tsx` → Supprimer `partial`
14. `src/components/decisions/DecisionDetail.tsx` → Intégrer `TradingInterface`, remplacer `newsItems` par `RelatedNewsClient`

### **Fichiers à CRÉER**
1. `convex/tradingEngine.ts` → Nouvelles fonctions de trading
2. `convex/shop.ts` → Mutations pour Shop (Rayon X, Badge Fondateur)
3. `src/components/shop/Shop.tsx` → Interface du shop
4. `src/components/ui/FounderBadge.tsx` → Badge fondateur
5. `src/components/decisions/TradingInterface.tsx` → Nouvelle interface de trading
6. `src/components/decisions/RelatedNewsClient.tsx` → Affichage client-side des news (Google News RSS, pas de stockage)

### **Fichiers à SUPPRIMER ou DÉSACTIVER**
1. `convex/bots/aggregateNews.ts` → **SUPPRIMER** (remplacé par solution client-side)
2. `convex/news.ts` → **SUPPRIMER** ou garder pour rétrocompatibilité (mais ne plus utiliser)
3. Table `newsItems` dans schema → **SUPPRIMER** ou marquer comme dépréciée
4. Entrées dans table `bots` → Désactiver les bots "Détecteur" et "Agrégateur"
5. Cron jobs d'agrégation → **SUPPRIMER** de `convex/crons.ts` ou `convex/bots/scheduled.ts`

### **Résumé des bots après nettoyage**

**Bots finaux (2-3 bots)** :
1. ✅ **Générateur** (`generateur`) - Crée des prédictions binaires (OUI/NON) depuis les news
2. ✅ **Résolveur** (`resolveur`) - Vérifie la résolution et clôture les prédictions
3. ✅ **Suiveur** (`suiveur`) - Suit les indicateurs (nécessaire pour la résolution)

**Bots supprimés/désactivés** :
- ❌ **Détecteur** - Fusionné avec Générateur
- ❌ **Agrégateur** - Supprimé si non nécessaire

---

## ⚠️ POINTS D'ATTENTION

1. **Migration des données existantes** : Les anticipations avec `"partial"` doivent être gérées (supprimer ou convertir)
2. **Rétrocompatibilité** : Les décisions existantes doivent être migrées (supprimer `answer2`, `answer3`)
3. **Performance** : Les calculs de bonding curve doivent être optimisés (éviter les recalculs inutiles)
4. **Sécurité** : Vérifier que les utilisateurs ne peuvent pas tricher (acheter/vendre plus que possédé)
5. **UX** : L'interface de trading doit être simple et intuitive (éviter la complexité d'une vraie bourse)

---

## 🎯 ORDRE DE PRIORITÉ RECOMMANDÉ

1. **PHASE 1** (Préparation) → **CRITIQUE** : Doit être fait en premier
2. **PHASE 2** (Core Trading) → **CRITIQUE** : Cœur du système
3. **PHASE 3** (Résolution) → **IMPORTANT** : Nécessaire pour la complétude
4. **PHASE 4** (Frontend) → **CRITIQUE** : Interface utilisateur
5. **PHASE 5** (Shop) → **IMPORTANT** : Features dopamine
6. **PHASE 6** (Bots) → **IMPORTANT** : Nettoyage et simplification des bots, génération de prédictions
7. **PHASE 7** (Tests) → **CRITIQUE** : Validation finale

---

## 📝 NOTES FINALES

- **Durée estimée totale** : 23-32 jours (4.5-6 semaines)
- **Risques principaux** : Migration de données, complexité de la bonding curve, UX du trading
- **Dépendances** : Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5/6 (parallèles) → Phase 7

---

**Document créé le** : 2025-01-XX  
**Dernière mise à jour** : 2025-01-XX

