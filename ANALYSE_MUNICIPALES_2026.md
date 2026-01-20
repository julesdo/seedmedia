# 🗳️ Analyse d'Implémentation : Municipales 2026

**Date :** 20 janvier 2026  
**Objectif :** Implémenter une opération spéciale "Mairie 2026" sans complexifier l'interface

---

## ✅ Pourquoi c'est une excellente idée ?

### 1. Timing parfait (Money Time)
- **2 mois avant les élections** (mars 2026) = période de forte engagement
- Les Français suivent activement les municipales (scrutin préféré)
- Opportunité de mixer "Sérieux" (politique) + "Tribal" (ma ville, ma région)

### 2. Alignement avec la stratégie Seed
- **20% Géopolitique** : Les municipales entrent dans cette catégorie
- **Engagement communautaire** : Le côté "tribal" régional renforce l'engagement
- **Viralité potentielle** : Les duels Paris/Lyon/Marseille sont très partageables

### 3. Différenciation concurrentielle
- Peu d'apps de prédiction couvrent les municipales de manière engageante
- Opportunité de se positionner comme LA référence pour les élections locales

---

## 🎯 Stratégie d'Implémentation (Sans Complexifier l'UI)

### Principe : Utiliser l'Infrastructure Existante

**✅ Ce qui existe déjà :**
- `type: "election"` dans le schéma
- Système de badges (`badgeColor`, `emoji`)
- Filtres par type dans `getDecisions`
- Affichage via `DecisionCard` avec badges

**✅ Ce qu'on ajoute (minimal) :**
- 1 champ optionnel : `specialEvent` (pour identifier les événements spéciaux)
- 1 badge visuel spécial dans `DecisionCard` (uniquement si `specialEvent === "municipales_2026"`)
- 1 système de gamification régionale (dans le profil utilisateur, invisible dans le feed)

---

## 📋 Plan d'Implémentation

### Phase 1 : Extension du Schéma (Minimal)

**Fichier : `convex/schema.ts`**

```typescript
decisions: defineTable({
  // ... champs existants ...
  
  // ✅ NOUVEAU : Événements spéciaux (optionnel)
  specialEvent: v.optional(v.union(
    v.literal("municipales_2026"), // Municipales 2026
    v.literal("presidentielles_2027"), // Pour le futur
    // ... autres événements spéciaux
  )),
  
  // ✅ NOUVEAU : Métadonnées pour événements spéciaux (optionnel)
  specialEventMetadata: v.optional(v.object({
    region: v.optional(v.string()), // Ex: "Île-de-France", "Auvergne-Rhône-Alpes"
    city: v.optional(v.string()), // Ex: "Paris", "Lyon", "Marseille"
    eventCategory: v.optional(v.union(
      v.literal("blockbuster"), // Paris, Lyon, Marseille
      v.literal("tendance"), // Tendances nationales
      v.literal("insolite") // Marchés insolites
    )),
  })),
})
```

**Impact :** Aucun sur l'UI existante (champs optionnels)

---

### Phase 2 : Badge Visuel Spécial (Minimal)

**Fichier : `src/components/decisions/DecisionCard.tsx`**

**Modification :** Ajouter un petit badge "Municipales 2026" uniquement si `decision.specialEvent === "municipales_2026"`

```tsx
{decision.specialEvent === "municipales_2026" && (
  <Badge 
    variant="outline" 
    className="text-xs border-blue-500 text-blue-600 dark:text-blue-400"
  >
    🗳️ Municipales 2026
  </Badge>
)}
```

**Impact :** +1 ligne conditionnelle dans le composant existant

---

### Phase 3 : Gamification Régionale (Invisible dans le Feed)

**Fichier : `convex/schema.ts` (table `users`)**

```typescript
users: defineTable({
  // ... champs existants ...
  
  // ✅ NOUVEAU : Gamification municipales (optionnel)
  municipales2026: v.optional(v.object({
    selectedRegion: v.optional(v.string()), // Région choisie par l'utilisateur
    correctPredictions: v.number(), // Nombre de prédictions correctes
    totalPredictions: v.number(), // Nombre total de prédictions
    regionRank: v.optional(v.number()), // Classement dans sa région
  })),
})
```

**Affichage :** Uniquement dans le profil utilisateur (pas dans le feed)

**Impact :** Aucun sur le feed principal

---

### Phase 4 : Création des Marchés (Manuel ou Bot Spécialisé)

**Option A : Création manuelle (Recommandé pour le lancement)**
- Créer les 10-15 marchés "Blockbusters" et "Tendances" manuellement
- Contrôle total sur la qualité des questions
- Timing parfait (janvier 2026)

**Option B : Bot spécialisé (Pour plus tard)**
- Créer un bot `municipalesBot` qui génère automatiquement des marchés
- Utiliser les mêmes prompts que `generateDecision` mais adaptés aux municipales

**Recommandation :** Option A pour le lancement, Option B pour la scalabilité

---

## 🎨 Design Spécial (Minimal)

### Badge "Municipales 2026"
- **Couleur :** Bleu Blanc Rouge subtil (bordure bleue, fond blanc)
- **Icône :** 🗳️ (urne) ou 🏛️ (mairie)
- **Texte :** "Municipales 2026"

### Badge Régional (Profil uniquement)
- **Affichage :** "Team [Région]" avec un petit drapeau régional
- **Position :** Dans le profil utilisateur, pas dans le feed

---

## 📊 Exemples de Marchés à Créer

### Blockbusters (3-5 marchés)
1. **"Bataille de Paris 🗼"**
   - Question : "Rachida Dati (ou autre candidat clé) sera-t-elle la prochaine Maire de Paris ?"
   - `specialEventMetadata.city = "Paris"`
   - `specialEventMetadata.eventCategory = "blockbuster"`

2. **"La Vague Bleue Marine ? 🌊"**
   - Question : "Le RN gagnera-t-il la mairie de Marseille ou Perpignan ?"
   - `specialEventMetadata.eventCategory = "blockbuster"`

3. **"Lyon : Les Écolos Gardent ? 🟢"**
   - Question : "Les Écologistes garderont-ils la mairie de Lyon ?"
   - `specialEventMetadata.city = "Lyon"`

### Tendances Nationales (5-7 marchés)
4. **"Le RN Remportera-t-il Plus de 15 Villes ?"**
   - Question : "Le RN remportera-t-il plus de 15 villes de plus de 100 000 habitants ?"
   - `specialEventMetadata.eventCategory = "tendance"`

5. **"L'Abstention Dépassera-t-elle 60% ?"**
   - Question : "L'abstention dépassera-t-elle 60% au premier tour ?"
   - `specialEventMetadata.eventCategory = "tendance"`

6. **"L'Hécatombe des Ministres 📉"**
   - Question : "Plus de 5 ministres en exercice perdront-ils leur élection ?"
   - `specialEventMetadata.eventCategory = "tendance"`

### Insolites (2-3 marchés)
7. **"Une Célébrité Élue ?"**
   - Question : "Une célébrité (hors politique) sera-t-elle élue conseillère municipale dans une grande ville ?"
   - `specialEventMetadata.eventCategory = "insolite"`

---

## 🎮 Gamification "Bataille des Régions"

### Mécanique Simple
1. **Sélection de région** (dans les paramètres utilisateur)
2. **Scoring automatique** : Si l'utilisateur prédit correctement un marché lié à sa région, +1 point
3. **Classement régional** : Affiché uniquement dans le profil

### Affichage (Profil uniquement)
```
🏆 Team Île-de-France
Prédictions correctes : 12/15
Classement régional : #3
```

**Impact UI :** Aucun sur le feed, uniquement dans le profil

---

## ✅ Avantages de cette Approche

1. **Minimal** : +2 champs optionnels dans le schéma
2. **Rétrocompatible** : Les décisions existantes ne sont pas affectées
3. **Scalable** : Peut être étendu à d'autres événements spéciaux (présidentielles, européennes)
4. **Non-intrusif** : Le badge spécial n'apparaît que sur les municipales
5. **Gamification optionnelle** : L'utilisateur peut ignorer complètement la gamification régionale

---

## 🚀 Prochaines Étapes

1. **Valider le schéma** : Ajouter `specialEvent` et `specialEventMetadata`
2. **Créer les 10-15 marchés** manuellement (janvier 2026)
3. **Ajouter le badge visuel** dans `DecisionCard`
4. **Implémenter la gamification régionale** (profil uniquement)
5. **Lancer la campagne** début février 2026

---

## ⚠️ Points d'Attention

1. **Ne pas créer trop de marchés** : Se concentrer sur les Blockbusters et Tendances
2. **Résolution claire** : Préciser la source de vérité (Ministère de l'Intérieur, résultats officiels)
3. **Date limite précise** : Tous les marchés doivent avoir une date de résolution claire (après le 2nd tour)
4. **Gamification optionnelle** : Ne pas forcer l'utilisateur à choisir une région

---

## 📝 Conclusion

Cette implémentation est **minimale, non-intrusive et scalable**. Elle utilise l'infrastructure existante et n'ajoute qu'un badge visuel subtil dans le feed. La gamification régionale reste optionnelle et invisible dans le feed principal.

**Recommandation :** ✅ Implémenter cette solution pour les municipales 2026.

