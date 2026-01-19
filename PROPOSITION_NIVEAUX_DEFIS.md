# 🎯 PROPOSITION : SYSTÈME DE NIVEAUX BASÉ SUR DES DÉFIS

## Date : 2025-01-27

---

## 🔴 PROBLÈME ACTUEL

### Système actuel : Niveaux basés sur les Seeds

**Formule actuelle** :
```
level = floor(sqrt(seedsBalance / 100)) + 1
```

**Problèmes identifiés** :
- ❌ Les utilisateurs peuvent acheter des packs pour monter de niveau rapidement
- ❌ Les traders habiles peuvent s'enrichir et monter de niveau sans effort réel
- ❌ Le niveau ne reflète pas l'engagement ou la compétence de l'utilisateur
- ❌ Pas de motivation à accomplir des actions spécifiques
- ❌ Les Seeds devraient rester une monnaie, pas un système de progression

---

## ✅ SOLUTION PROPOSÉE : NIVEAUX BASÉS SUR DES DÉFIS

### Concept

Le niveau devrait refléter **l'engagement réel** et **les compétences** de l'utilisateur, pas sa richesse en Seeds.

**Principe** : Chaque niveau nécessite de compléter des **défis spécifiques** (missions, actions, accomplissements).

---

## 📋 STRUCTURE PROPOSÉE

### Niveaux et Défis Requis

#### **NIVEAU 1** : Débutant (Démarrage automatique)
- ✅ Aucun défi requis (niveau de départ)
- 🎁 Récompense : Accès de base à l'app

#### **NIVEAU 2** : Explorateur
**Défis requis** (3 sur 5) :
- ✅ Se connecter 7 jours consécutifs
- ✅ Créer 5 anticipations
- ✅ Commenter 10 décisions
- ✅ Suivre 5 utilisateurs
- ✅ Sauvegarder 10 décisions

**🎁 Récompense** :
- Badge "Explorateur"
- Accès aux statistiques de base
- +100 Seeds bonus

#### **NIVEAU 3** : Analyste
**Défis requis** (4 sur 6) :
- ✅ Avoir 10 anticipations correctes (précision > 50%)
- ✅ Partager 20 décisions
- ✅ Ajouter 5 sources validées
- ✅ Avoir 20 followers
- ✅ Trader sur 10 décisions différentes
- ✅ Gagner 500 Seeds via trading

**🎁 Récompense** :
- Badge "Analyste"
- Accès aux statistiques avancées
- +500 Seeds bonus
- Réduction 5% sur les packs

#### **NIVEAU 4** : Stratège
**Défis requis** (5 sur 7) :
- ✅ Avoir 25 anticipations correctes (précision > 60%)
- ✅ Gagner 2000 Seeds via trading
- ✅ Avoir 50 followers
- ✅ Créer 3 décisions populaires (heat > 70)
- ✅ Partager 50 décisions
- ✅ Ajouter 10 sources validées
- ✅ Avoir un streak de 30 jours

**🎁 Récompense** :
- Badge "Stratège"
- Accès aux statistiques premium
- +2000 Seeds bonus
- Réduction 10% sur les packs
- Accès anticipé aux nouvelles fonctionnalités

#### **NIVEAU 5** : Maître
**Défis requis** (6 sur 8) :
- ✅ Avoir 50 anticipations correctes (précision > 70%)
- ✅ Gagner 10000 Seeds via trading
- ✅ Avoir 100 followers
- ✅ Créer 5 décisions populaires (heat > 80)
- ✅ Partager 100 décisions
- ✅ Ajouter 20 sources validées
- ✅ Avoir un streak de 60 jours
- ✅ Gagner un tournoi ou événement spécial

**🎁 Récompense** :
- Badge "Maître"
- Accès VIP à toutes les fonctionnalités
- +10000 Seeds bonus
- Réduction 15% sur les packs
- Accès exclusif aux événements
- Statut spécial dans l'app

#### **NIVEAU 6+** : Légende
**Défis requis** (progressifs) :
- Niveau 6 : 100 anticipations correctes (précision > 75%)
- Niveau 7 : 200 anticipations correctes (précision > 80%)
- Niveau 8 : 500 anticipations correctes (précision > 85%)
- Niveau 9 : 1000 anticipations correctes (précision > 90%)
- Niveau 10 : 2000 anticipations correctes (précision > 95%)

**🎁 Récompenses** :
- Badges exclusifs "Légende"
- Statut permanent dans l'app
- Réductions progressives jusqu'à 25%
- Accès exclusif aux fonctionnalités beta
- Mentions spéciales dans l'app

---

## 🎮 MÉCANISME DE PROGRESSION

### Système de Points de Défi

Chaque défi complété donne des **Points de Défi** (PD) :

| Défi | Points de Défi |
|------|----------------|
| Connexion quotidienne | 1 PD |
| Anticipation créée | 2 PD |
| Anticipation correcte | 5 PD |
| Commentaire | 1 PD |
| Partage | 2 PD |
| Source ajoutée | 3 PD |
| Follower gagné | 1 PD |
| Trade réussi | 2 PD |
| Streak de 7 jours | 10 PD |
| Streak de 30 jours | 50 PD |

### Calcul du Niveau

**Formule proposée** :
```
level = floor(sqrt(totalChallengePoints / 50)) + 1
```

**Exemples** :
- Niveau 1 : 0-50 PD
- Niveau 2 : 50-200 PD
- Niveau 3 : 200-450 PD
- Niveau 4 : 450-800 PD
- Niveau 5 : 800-1250 PD

**MAIS** : Pour monter de niveau, il faut aussi **compléter les défis requis** du niveau suivant.

---

## 🔄 TRANSITION DEPUIS LE SYSTÈME ACTUEL

### Migration des Utilisateurs Existants

**Stratégie** : Convertir les Seeds en Points de Défi initiaux

**Formule de conversion** :
```
initialChallengePoints = floor(seedsBalance / 10)
```

**Exemples** :
- 1000 Seeds → 100 PD → Niveau 2
- 5000 Seeds → 500 PD → Niveau 3
- 20000 Seeds → 2000 PD → Niveau 4

**MAIS** : Les utilisateurs doivent quand même compléter les défis requis pour monter de niveau.

---

## 💡 AVANTAGES DU SYSTÈME

### 1. Engagement Réel
- ✅ Les utilisateurs doivent **agir** pour monter de niveau
- ✅ Encourage la participation active
- ✅ Récompense les compétences (précision, trading)

### 2. Équité
- ✅ Tous les utilisateurs partent sur un pied d'égalité
- ✅ Pas d'avantage pour ceux qui achètent des packs
- ✅ Les Seeds restent une monnaie, pas un système de progression

### 3. Motivation Long Terme
- ✅ Objectifs clairs et atteignables
- ✅ Progression visible et satisfaisante
- ✅ Défis variés pour tous les types d'utilisateurs

### 4. FOMO et Rareté
- ✅ Les niveaux élevés sont difficiles à atteindre
- ✅ Crée de la rareté (peu d'utilisateurs niveau 5+)
- ✅ Statut social (badges, mentions)

### 5. Revenus Préservés
- ✅ Les Seeds restent nécessaires pour trader
- ✅ Les packs restent attractifs (Seeds pour trading)
- ✅ Les réductions sur packs récompensent l'engagement

---

## 🎯 DÉFIS PROPOSÉS PAR CATÉGORIE

### Catégorie : Engagement
- Se connecter X jours consécutifs
- Créer X anticipations
- Commenter X décisions
- Partager X décisions
- Suivre X utilisateurs

### Catégorie : Compétence
- Avoir X anticipations correctes
- Avoir une précision > X%
- Gagner X Seeds via trading
- Trader sur X décisions différentes

### Catégorie : Social
- Avoir X followers
- Recevoir X likes sur commentaires
- Être mentionné X fois

### Catégorie : Contribution
- Ajouter X sources validées
- Créer X décisions populaires (heat > X)
- Modérer X contenus (si applicable)

### Catégorie : Événements
- Participer à X tournois
- Gagner X tournois
- Participer à X événements spéciaux

---

## 📊 EXEMPLE DE PROGRESSION

### Utilisateur Actif (30 jours)

**Actions** :
- Connexions : 30 jours → 30 PD
- Anticipations : 20 créées → 40 PD
- Anticipations correctes : 12 (60% précision) → 60 PD
- Commentaires : 50 → 50 PD
- Partages : 30 → 60 PD
- Sources : 5 validées → 15 PD
- Followers : 25 → 25 PD
- Trades : 15 réussis → 30 PD
- Streak 30 jours : 50 PD

**Total** : 360 PD → **Niveau 3** (200-450 PD)

**Défis complétés pour niveau 3** :
- ✅ 10 anticipations correctes (12)
- ✅ Précision > 50% (60%)
- ✅ 20 followers (25)
- ✅ 5 sources validées (5)

**Résultat** : **Niveau 3 atteint** ✅

---

## 🔧 IMPLÉMENTATION TECHNIQUE

### Nouveaux Champs dans le Schéma

```typescript
users: {
  // ... champs existants
  level: number; // Niveau actuel (basé sur défis)
  challengePoints: number; // Points de défi totaux
  completedChallenges: string[]; // IDs des défis complétés
  levelProgress: {
    currentLevel: number;
    pointsForCurrentLevel: number;
    pointsForNextLevel: number;
    challengesCompleted: number;
    challengesRequired: number;
  };
}
```

### Nouvelles Tables

```typescript
challenges: {
  id: string;
  name: string;
  description: string;
  category: "engagement" | "skill" | "social" | "contribution" | "event";
  points: number;
  levelRequired: number; // Niveau minimum pour débloquer
  requirements: {
    // Ex: { type: "anticipations_correct", count: 10, precision: 0.5 }
  };
}

userChallenges: {
  userId: Id<"users">;
  challengeId: string;
  progress: number; // Progression actuelle
  completed: boolean;
  completedAt?: number;
}
```

### Fonctions à Créer

```typescript
// Calculer le niveau basé sur les points de défi
function calculateLevelFromChallenges(challengePoints: number): number {
  return Math.floor(Math.sqrt(challengePoints / 50)) + 1;
}

// Vérifier si un défi est complété
function checkChallengeCompletion(userId: Id<"users">, challengeId: string): boolean {
  // Logique de vérification
}

// Mettre à jour les points de défi
function updateChallengePoints(userId: Id<"users">, points: number): void {
  // Mettre à jour challengePoints et recalculer le niveau
}
```

---

## 🎁 RÉCOMPENSES PAR NIVEAU

### Récompenses Uniques

Chaque niveau débloque des **récompenses uniques** qui ne peuvent pas être achetées :

| Niveau | Récompenses |
|--------|-------------|
| 2 | Badge + 100 Seeds |
| 3 | Badge + 500 Seeds + Stats avancées + 5% réduction |
| 4 | Badge + 2000 Seeds + Stats premium + 10% réduction |
| 5 | Badge + 10000 Seeds + Accès VIP + 15% réduction |
| 6+ | Badges exclusifs + Réductions progressives |

### Réductions sur Packs

Les réductions s'appliquent uniquement aux **packs payants** :
- Niveau 3 : 5% de réduction
- Niveau 4 : 10% de réduction
- Niveau 5 : 15% de réduction
- Niveau 6+ : 20-25% de réduction

**Impact** :
- ✅ Encourage l'engagement pour obtenir des réductions
- ✅ Les Seeds restent nécessaires (pour trader)
- ✅ Les packs restent attractifs (même avec réduction)

---

## ✅ CONCLUSION

### Avantages Majeurs

1. **Équité** : Tous les utilisateurs partent sur un pied d'égalité
2. **Engagement** : Encourage les actions réelles, pas juste l'achat
3. **Motivation** : Objectifs clairs et atteignables
4. **Rareté** : Les niveaux élevés sont difficiles à atteindre
5. **Revenus** : Les Seeds restent nécessaires, les packs restent attractifs

### Prochaines Étapes

1. **Définir les défis précis** pour chaque niveau
2. **Créer le système de tracking** des défis
3. **Implémenter la migration** des utilisateurs existants
4. **Tester la progression** avec des utilisateurs beta
5. **Ajuster les points** selon les retours

---

**FIN DE LA PROPOSITION**

