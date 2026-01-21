# 📊 Analyse & Proposition : Système de Catégories pour Décisions

**Date** : 2024  
**Objectif** : Améliorer le système de catégorisation existant des décisions (`impactedDomains` + `specialEvent`) en le convertissant en catégories gérées, sans recréer un nouveau système

---

## 🔍 État Actuel du Système

### 1. **Système de Catégories Existant**

#### ✅ Ce qui existe
- **Table `categories`** dans le schema Convex
- **Champs actuels** :
  - `name`, `slug`, `description`
  - `icon` (nom d'icône Solar)
  - `color` (hexadécimal)
  - `appliesTo` : array de types de contenus (`articles`, `dossiers`, `debates`, `projects`, `organizations`, `actions`)
  - `status` : `pending` | `active` | `archived`
  - `usageCount` : calculé dynamiquement
  - `proposedBy`, `proposalId` : système de gouvernance

#### ❌ Ce qui manque
- **`decisions` n'est PAS dans `appliesTo`** : Les catégories ne s'appliquent pas aux décisions
- **Pas de système de mise en avant** : Pas de `featured`, `priority`, `order`
- **Pas d'image de cover** : Pas de `coverImage` pour les catégories
- **Pas de gestion admin** : Création uniquement via gouvernance (pas d'admin direct)

### 2. **Système d'Événements Spéciaux Actuel**

#### ✅ Ce qui existe
- **Champs dans `decisions`** :
  - `specialEvent` : `"municipales_2026"` | `"presidentielles_2027"` (codé en dur)
  - `specialEventMetadata` : `{ region?, city?, eventCategory? }`
  - Index sur `specialEvent` dans le schema

#### ❌ Problèmes identifiés
- **Codé en dur** : Impossible d'ajouter de nouveaux événements sans modifier le code
- **Pas flexible** : Structure rigide, pas de gestion dynamique
- **Pas de mise en avant** : Pas de système pour mettre en avant certains événements
- **Pas d'image** : Pas d'image de cover pour les événements
- **Duplication** : Logique similaire aux catégories mais séparée

### 3. **Système `impactedDomains` Actuel (BASE DE NOTRE SOLUTION)**

#### ✅ Ce qui existe et fonctionne
- **Champ dans `decisions`** :
  - `impactedDomains` : array de strings (ex: `["politique", "société", "économie", "énergie", "diplomatie", "géopolitique", "technologie"]`)
  - Index sur `impactedDomains` dans le schema
  - Utilisé dans `getDecisions` avec filtre `impactedDomain`
  - Utilisé dans `MarketHero` pour filtrer par domaine
  - Utilisé dans les scripts (ex: `createMunicipalesMarkets` avec `["politique", "société"]`)

#### ✅ Valeurs actuelles observées
D'après le code, les domaines utilisés incluent :
- `"politique"`
- `"société"`
- `"économie"`
- `"énergie"`
- `"diplomatie"`
- `"géopolitique"`
- `"technologie"`

#### ❌ Problèmes identifiés (à améliorer)
- **Strings libres** : Pas de validation, risque d'incohérence (majuscules/minuscules, accents)
- **Pas de gestion admin** : Impossible de créer/modifier ces domaines depuis l'admin
- **Pas de métadonnées** : Pas d'icône, couleur, description, image de cover
- **Pas de mise en avant** : Impossible de mettre en avant certains domaines
- **Pas de hiérarchie** : Tous les domaines sont au même niveau

### 4. **Utilisation dans l'UI**

#### MarketHero (`src/components/decisions/MarketHero.tsx`)
- Utilise `specialEvent: "municipales_2026"` pour filtrer
- Utilise `impactedDomain: "géopolitique"` et `"technologie"` pour filtrer
- Affiche des sections par événement/catégorie

#### Admin (`src/app/(admin)/admin/decisions/DecisionForm.tsx`)
- Formulaire avec champ `impactedDomains` (string séparée par virgules)
- Formulaire avec `specialEvent` et `specialEventMetadata`

---

## 🎯 Objectifs de la Solution

1. **Unifier** : Un seul système de catégories pour tous les contenus (articles, décisions, etc.)
2. **Flexibilité** : Pouvoir créer/modifier/supprimer des catégories depuis l'admin
3. **Mise en avant** : Système pour mettre en avant certaines catégories
4. **Visuel** : Image de cover pour les catégories
5. **Migration** : Remplacer `specialEvent` et `impactedDomains` par `categoryIds`

---

## 💡 Proposition de Solution (Basée sur l'Existant)

### **Principe : Convertir l'Existant en Catégories Gérées**

**Approche** : Au lieu de recréer un système, on convertit les `impactedDomains` (strings) et `specialEvent` existants en catégories réelles dans la table `categories`, tout en gardant la compatibilité avec le système actuel.

---

### **Architecture Recommandée**

#### 1. **Extension du Système de Catégories Existant**

##### A. Ajouter `decisions` à `appliesTo`
```typescript
appliesTo: v.array(
  v.union(
    v.literal("articles"),
    v.literal("dossiers"),
    v.literal("debates"),
    v.literal("projects"),
    v.literal("organizations"),
    v.literal("actions"),
    v.literal("decisions") // ✅ NOUVEAU - Basé sur impactedDomains existants
  )
)
```

##### B. Ajouter des champs pour la mise en avant et le visuel
```typescript
// Nouveaux champs dans categories (pour décisions)
featured: v.boolean(), // Mise en avant (affichée dans hero, etc.)
priority: v.number(), // Ordre d'affichage (0 = priorité la plus haute)
coverImage: v.optional(v.string()), // URL de l'image de cover
coverImageAlt: v.optional(v.string()), // Texte alternatif
shortDescription: v.optional(v.string()), // Description courte pour hero
```

##### C. Ajouter un champ pour les événements spéciaux
```typescript
// Pour convertir specialEvent en catégories
isSpecialEvent: v.optional(v.boolean()), // Marquer comme événement spécial (ex: municipales)
eventMetadata: v.optional(v.object({
  startDate: v.optional(v.number()),
  endDate: v.optional(v.number()),
  region: v.optional(v.string()),
  city: v.optional(v.string()),
  eventCategory: v.optional(v.union(
    v.literal("blockbuster"),
    v.literal("tendance"),
    v.literal("insolite")
  )),
})),
```

#### 2. **Création de Catégories Basées sur l'Existant**

##### A. Catégories de domaines (basées sur `impactedDomains` actuels)
Créer des catégories correspondant aux valeurs actuelles de `impactedDomains` :

| impactedDomain (actuel) | Catégorie à créer | Slug |
|-------------------------|------------------|------|
| `"politique"` | **Politique** | `politique` |
| `"société"` | **Société** | `societe` |
| `"économie"` | **Économie** | `economie` |
| `"énergie"` | **Énergie** | `energie` |
| `"diplomatie"` | **Diplomatie** | `diplomatie` |
| `"géopolitique"` | **Géopolitique** | `geopolitique` |
| `"technologie"` | **Technologie** | `technologie` |

**Note** : Ces catégories seront créées avec `appliesTo: ["decisions"]` pour ne pas mélanger avec les catégories articles/projets.

##### B. Catégories d'événements spéciaux (basées sur `specialEvent`)
Convertir les événements spéciaux en catégories :

| specialEvent (actuel) | Catégorie à créer | Slug | Métadonnées |
|----------------------|------------------|------|-------------|
| `"municipales_2026"` | **Municipales 2026** | `municipales-2026` | `isSpecialEvent: true`, `featured: true`, `priority: 1` |
| `"presidentielles_2027"` | **Présidentielles 2027** | `presidentielles-2027` | `isSpecialEvent: true`, `featured: true`, `priority: 2` |

#### 3. **Migration Progressive (Compatibilité Ascendante)**

##### A. Garder `impactedDomains` en parallèle (transition)
```typescript
// Dans decisions schema - GARDER les deux pendant la transition
impactedDomains: v.array(v.string()), // ✅ GARDÉ pour compatibilité
categoryIds: v.array(v.id("categories")), // ✅ NOUVEAU - En parallèle
```

##### B. Synchronisation automatique
- Lors de la création/modification d'une décision :
  - Si `categoryIds` est fourni → synchroniser automatiquement `impactedDomains` (récupérer les slugs des catégories)
  - Si `impactedDomains` est fourni → synchroniser automatiquement `categoryIds` (trouver les catégories par slug)
- Permet une migration progressive sans casser l'existant

##### C. Migration des données existantes
```typescript
// Script de migration
// 1. Créer les catégories manquantes basées sur impactedDomains uniques
// 2. Pour chaque décision :
//    - Trouver les catégories correspondant à impactedDomains
//    - Remplir categoryIds
//    - Si specialEvent existe, ajouter la catégorie correspondante
```

#### 4. **Compatibilité avec le Code Existant**

##### A. Modifier `getDecisions` pour accepter les deux
```typescript
// Dans convex/decisions.ts
export const getDecisions = query({
  args: {
    // ... autres args
    impactedDomain: v.optional(v.string()), // ✅ GARDÉ pour compatibilité
    categoryIds: v.optional(v.array(v.id("categories"))), // ✅ NOUVEAU
    specialEvent: v.optional(...), // ✅ GARDÉ pour compatibilité
  },
  handler: async (ctx, args) => {
    // Si categoryIds fourni → filtrer par categoryIds
    // Sinon si impactedDomain fourni → filtrer par impactedDomains (compatibilité)
    // Si specialEvent fourni → trouver la catégorie correspondante et filtrer
  }
});
```

##### B. Modifier `MarketHero` pour utiliser les catégories
```typescript
// Dans src/components/decisions/MarketHero.tsx
// Au lieu de :
//   impactedDomain: "géopolitique"
// Utiliser :
//   categorySlug: "geopolitique" (qui sera converti en categoryIds)
```

#### 4. **Fonctions Convex à Créer/Modifier**

##### A. Admin - Gestion des catégories (basées sur impactedDomains existants)
```typescript
// Dans convex/admin.ts
api.admin.getAllCategoriesForDecisions // Liste toutes les catégories pour décisions (admin)
api.admin.createCategoryForDecisions // Créer une catégorie pour décisions (admin)
api.admin.updateCategoryForDecisions // Modifier une catégorie (admin)
api.admin.deleteCategoryForDecisions // Supprimer/archiver une catégorie (admin)
api.admin.setCategoryFeatured // Mettre en avant une catégorie (admin)
api.admin.setCategoryPriority // Définir l'ordre d'affichage (admin)
api.admin.syncDecisionCategories // Synchroniser categoryIds ↔ impactedDomains (admin)
```

##### B. Queries - Récupération des catégories
```typescript
// Dans convex/categories.ts
api.categories.getActiveCategories // Modifier pour inclure decisions dans appliesTo
api.categories.getCategoriesForDecisions // NOUVEAU - Catégories avec appliesTo incluant "decisions"
api.categories.getFeaturedCategoriesForDecisions // NOUVEAU - Catégories mises en avant pour décisions
api.categories.getCategoryBySlug // Existe déjà - Utiliser pour trouver catégorie depuis impactedDomain
api.categories.getCategoriesBySlugs // NOUVEAU - Trouver plusieurs catégories par slugs (pour migration)
```

##### C. Décisions - Compatibilité et migration
```typescript
// Dans convex/decisions.ts
api.decisions.getDecisions // Modifier pour accepter categoryIds ET impactedDomain (compatibilité)
api.decisions.getDecisionsByCategory // NOUVEAU - Filtrer par catégorie (slug ou ID)
api.admin.migrateImpactedDomainsToCategories // NOUVEAU - Script de migration impactedDomains → categoryIds
api.admin.migrateSpecialEventsToCategories // NOUVEAU - Script de migration specialEvent → categoryIds
```

#### 5. **Interface Admin**

##### A. Page `/admin/config/categories`
- Liste des catégories avec :
  - Nom, slug, description
  - Icône, couleur
  - Types de contenus applicables
  - Statut (active/archived)
  - Featured (oui/non)
  - Priority (ordre)
  - Cover image
  - Usage count
- Actions :
  - Créer une catégorie
  - Modifier une catégorie
  - Archiver une catégorie
  - Toggle featured
  - Modifier priority
  - Upload cover image

##### B. Formulaire de catégorie
- **Informations de base** :
  - Nom *
  - Slug * (auto-généré depuis nom)
  - Description
  - Description courte (pour hero)
- **Visuel** :
  - Icône (sélecteur SolarIcon)
  - Couleur (color picker)
  - Image de cover (upload)
- **Configuration** :
  - Types de contenus applicables (multi-select : articles, décisions, etc.)
  - Featured (checkbox)
  - Priority (number input)
  - Événement spécial (checkbox + métadonnées si coché)
- **Métadonnées événement** (si isSpecialEvent) :
  - Date de début
  - Date de fin
  - Région
  - Ville

##### C. Formulaire de décision (modifier - Compatibilité)
- **Garder `impactedDomains`** (string séparée par virgules) pour compatibilité
- **Ajouter `categoryIds`** (multi-select de catégories) comme méthode principale
- **Synchronisation automatique** : Si on sélectionne des catégories, remplir automatiquement `impactedDomains` (slugs)
- **Synchronisation inverse** : Si on saisit `impactedDomains`, proposer les catégories correspondantes
- **Garder `specialEvent`** temporairement (affichage en lecture seule) pendant la transition
- **Afficher les catégories spéciales** (municipales, présidentielles) dans le sélecteur de catégories

#### 6. **Migration des Données**

##### A. Script de migration (basé sur l'existant)
```typescript
// convex/scripts/migrateDecisionsToCategories.ts
// 1. Récupérer toutes les valeurs uniques de impactedDomains dans toutes les décisions
// 2. Pour chaque valeur unique :
//    - Créer une catégorie si elle n'existe pas (slug = valeur normalisée)
//    - Appliquer appliesTo: ["decisions"]
// 3. Créer les catégories d'événements spéciaux :
//    - "Municipales 2026" (slug: municipales-2026) si des décisions ont specialEvent: "municipales_2026"
//    - "Présidentielles 2027" (slug: presidentielles-2027) si des décisions ont specialEvent: "presidentielles_2027"
// 4. Pour chaque décision :
//    - Trouver les catégories correspondant à impactedDomains (par slug)
//    - Remplir categoryIds avec ces catégories
//    - Si specialEvent existe, trouver la catégorie correspondante et l'ajouter à categoryIds
//    - GARDER impactedDomains et specialEvent pour compatibilité (ne pas supprimer)
// 5. Vérifier la cohérence (toutes les décisions ont categoryIds rempli)
```

##### B. Mapping impactedDomains → Categories (basé sur valeurs réelles)
Mapping basé sur les valeurs observées dans le code :
- `"politique"` → Catégorie "Politique" (slug: `politique`)
- `"société"` → Catégorie "Société" (slug: `societe`)
- `"économie"` → Catégorie "Économie" (slug: `economie`)
- `"énergie"` → Catégorie "Énergie" (slug: `energie`)
- `"diplomatie"` → Catégorie "Diplomatie" (slug: `diplomatie`)
- `"géopolitique"` → Catégorie "Géopolitique" (slug: `geopolitique`)
- `"technologie"` → Catégorie "Technologie" (slug: `technologie`)

**Normalisation** : Gérer les variations (majuscules, accents, espaces) :
- `"Géopolitique"` → `"geopolitique"`
- `"Économie"` → `"economie"`
- `"société"` → `"societe"`

##### C. Mapping specialEvent → Categories (basé sur valeurs réelles)
- `"municipales_2026"` → Catégorie "Municipales 2026" (slug: `municipales-2026`)
  - `isSpecialEvent: true`
  - `featured: true`
  - `priority: 1`
  - `eventMetadata`: Récupérer depuis `specialEventMetadata` de la décision
- `"presidentielles_2027"` → Catégorie "Présidentielles 2027" (slug: `presidentielles-2027`)
  - `isSpecialEvent: true`
  - `featured: true`
  - `priority: 2`

---

## 📋 Plan d'Implémentation

### **Phase 1 : Extension du Schema (Basé sur l'Existant)**
1. Ajouter `decisions` à `appliesTo` dans `categories`
2. Ajouter nouveaux champs : `featured`, `priority`, `coverImage`, `coverImageAlt`, `shortDescription`
3. Ajouter optionnel : `isSpecialEvent`, `eventMetadata`
4. **GARDER `impactedDomains` dans `decisions`** (compatibilité)
5. Ajouter `categoryIds` dans `decisions` (en parallèle de `impactedDomains` pour transition)

### **Phase 2 : Fonctions Convex**
1. Créer fonctions admin pour gérer les catégories
2. Modifier `getActiveCategories` pour inclure `decisions`
3. Créer `getFeaturedCategories` pour hero
4. Modifier `getDecisions` pour accepter `categoryIds`
5. Créer script de migration

### **Phase 3 : Interface Admin**
1. Créer page `/admin/config/categories`
2. Créer formulaire de création/modification de catégorie
3. Modifier formulaire de décision pour utiliser catégories
4. Ajouter gestion des images de cover

### **Phase 4 : Migration des Données**
1. Créer les catégories par défaut pour décisions
2. Exécuter le script de migration
3. Vérifier la cohérence des données

### **Phase 5 : Mise à Jour UI (Compatibilité)**
1. Modifier `MarketHero` pour utiliser `getFeaturedCategories` (priorité) mais garder fallback sur `impactedDomain`
2. Modifier filtres pour utiliser `categoryIds` (priorité) mais garder fallback sur `impactedDomain`
3. **GARDER** les références à `specialEvent` et `impactedDomain` en lecture seule pendant la transition

### **Phase 6 : Nettoyage (Optionnel - Long Terme)**
1. **Optionnel** : Supprimer `specialEvent` et `specialEventMetadata` du schema (seulement si toutes les décisions sont migrées)
2. **Optionnel** : Marquer `impactedDomains` comme deprecated (garder pour compatibilité avec anciennes décisions)
3. **Optionnel** : Supprimer index `specialEvent` (seulement si plus utilisé)
4. **Optionnel** : Supprimer fonctions obsolètes (seulement si plus utilisées)

**Note** : Le nettoyage peut être fait plus tard, l'important est que le nouveau système fonctionne en parallèle.

---

## 🎨 Exemples d'Utilisation

### **Création d'une catégorie "Municipales 2026"**
```typescript
{
  name: "Municipales 2026",
  slug: "municipales-2026",
  description: "Élections municipales françaises de 2026",
  shortDescription: "Suivez les élections municipales",
  icon: "vote-bold",
  color: "#246BFD",
  coverImage: "https://...",
  appliesTo: ["decisions"],
  featured: true,
  priority: 1,
  isSpecialEvent: true,
  eventMetadata: {
    startDate: 2026-03-01,
    endDate: 2026-03-31,
  },
  status: "active"
}
```

### **Association d'une décision à des catégories (Migration Progressive)**
```typescript
// Avant (système actuel)
{
  impactedDomains: ["politique", "société"],
  specialEvent: "municipales_2026",
  specialEventMetadata: { city: "Paris", region: "Île-de-France" }
}

// Après migration (nouveau système + compatibilité)
{
  // NOUVEAU - Catégories gérées
  categoryIds: [
    categoryId("politique"),      // Depuis impactedDomains
    categoryId("societe"),         // Depuis impactedDomains
    categoryId("municipales-2026") // Depuis specialEvent
  ],
  // GARDÉ pour compatibilité (synchronisé automatiquement)
  impactedDomains: ["politique", "société"],
  specialEvent: "municipales_2026", // GARDÉ en lecture seule
  specialEventMetadata: { city: "Paris", region: "Île-de-France" } // GARDÉ
}

// Synchronisation automatique :
// - Si on modifie categoryIds → mettre à jour impactedDomains (récupérer slugs)
// - Si on modifie impactedDomains → mettre à jour categoryIds (trouver catégories par slug)
```

### **Récupération des décisions par catégorie**
```typescript
// Récupérer les décisions de la catégorie "Municipales 2026"
const decisions = await getDecisions({
  categoryIds: [municipalesCategoryId],
  status: "tracking"
});

// Récupérer les catégories mises en avant pour le hero
const featuredCategories = await getFeaturedCategories({
  appliesTo: "decisions",
  limit: 5
});
```

---

## ✅ Avantages de cette Solution (Basée sur l'Existant)

1. **Respect de l'existant** : Se base sur `impactedDomains` et `specialEvent` actuels, pas de recréation
2. **Compatibilité** : Garde les champs existants en parallèle, pas de breaking change
3. **Migration progressive** : Synchronisation automatique entre ancien et nouveau système
4. **Flexibilité** : Création/modification depuis l'admin sans code
5. **Évolutivité** : Facile d'ajouter de nouveaux domaines/événements depuis l'admin
6. **Visuel** : Images de cover pour les catégories
7. **Mise en avant** : Système flexible pour mettre en avant certaines catégories
8. **Cohérence** : Même logique que pour articles, projets, etc.
9. **Maintenance** : Plus simple à maintenir qu'un système séparé
10. **Pas de perte de données** : Toutes les données existantes sont préservées et migrées

---

## ⚠️ Points d'Attention

1. **Migration** : Migration des données existantes nécessaire (mais progressive, pas de breaking change)
2. **Rétrocompatibilité** : Garder `impactedDomains` et `specialEvent` en parallèle pendant la transition (synchronisation automatique)
3. **Performance** : Index sur `categoryIds` dans `decisions` (en plus de l'index `impactedDomains` existant)
4. **UI** : Mettre à jour progressivement les composants (fallback sur ancien système si catégories non disponibles)
5. **Scripts** : Script municipal pourra continuer à utiliser `impactedDomains` (synchronisation automatique vers `categoryIds`)
6. **Normalisation** : Gérer les variations de `impactedDomains` (majuscules, accents, espaces) lors de la migration
7. **Doublons** : Vérifier qu'il n'y a pas de doublons dans les catégories créées (même slug avec variations)

---

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| **Système** | 3 systèmes séparés (catégories, specialEvent, impactedDomains) | 1 système unifié (catégories) |
| **Gestion** | Codé en dur, gouvernance uniquement | Admin complet |
| **Flexibilité** | Limitée (événements codés en dur) | Totale (création dynamique) |
| **Mise en avant** | Aucune | Featured + Priority |
| **Visuel** | Aucun | Cover image |
| **Cohérence** | Incohérent (strings libres) | Cohérent (IDs de catégories) |
| **Maintenance** | Complexe (3 systèmes) | Simple (1 système unifié) |
| **Compatibilité** | - | ✅ Garde l'existant en parallèle |
| **Migration** | - | ✅ Progressive, pas de breaking change |

---

## 🚀 Recommandation Finale

**Adopter cette solution** car elle :
- ✅ **Se base sur l'existant** : Utilise `impactedDomains` et `specialEvent` actuels
- ✅ **Pas de breaking change** : Garde la compatibilité avec le code existant
- ✅ **Migration progressive** : Synchronisation automatique entre ancien et nouveau
- ✅ Unifie tous les systèmes de catégorisation
- ✅ Permet une gestion admin complète
- ✅ Offre la flexibilité nécessaire
- ✅ Améliore la cohérence et la maintenabilité
- ✅ Permet la mise en avant et le visuel
- ✅ Facilite l'évolution future
- ✅ **Préserve les données** : Aucune perte de données lors de la migration

**Ordre d'implémentation recommandé** :
1. Phase 1 (Schema) - Fondations
2. Phase 2 (Fonctions) - Backend
3. Phase 3 (Admin UI) - Interface de gestion
4. Phase 4 (Migration) - Données existantes
5. Phase 5 (UI) - Interface utilisateur
6. Phase 6 (Nettoyage) - Suppression ancien système

---

**Date de création** : 2024  
**Statut** : Proposition - En attente de validation

