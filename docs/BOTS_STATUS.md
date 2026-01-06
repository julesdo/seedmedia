# État des Bots pour la Production

## ✅ Bots Principaux (5 bots)

Tous les bots principaux sont **fonctionnels et prêts pour la production** :

### 1. **Détecteur** (`detecteur`)
- ✅ Fonction : `detectDecisions`
- ✅ Stats mises à jour : Log créé après détection
- ✅ Cron job : Toutes les 15 minutes (`runDecisionDetection`)
- ✅ Fichier : `convex/bots/detectDecisions.ts`

### 2. **Générateur** (`generateur`)
- ✅ Fonction : `generateDecision`
- ✅ Stats mises à jour : `decisionsCreated` incrémenté après création
- ✅ Appelé par : `runDecisionDetection` (cron job)
- ✅ Fichier : `convex/bots/generateDecision.ts`

### 3. **Résolveur** (`resolveur`)
- ✅ Fonction : `resolveDecision` + `resolveAllEligibleDecisions`
- ✅ Stats mises à jour : `decisionsResolved` incrémenté après résolution
- ✅ Cron job : Quotidien à minuit UTC (`resolveDecisionsDaily`)
- ✅ Fichier : `convex/bots/resolveDecisions.ts`

### 4. **Suiveur** (`suiveur`)
- ✅ Fonction : `updateIndicatorDataForDecision` + `updateAllIndicators`
- ✅ Stats mises à jour : `indicatorsTracked` incrémenté après suivi
- ✅ Cron job : Quotidien à 23h UTC (`updateIndicatorsDaily`) - avant la résolution des décisions
- ✅ Fichier : `convex/bots/trackIndicators.ts`

### 5. **Agrégateur** (`agregateur`)
- ✅ Fonction : `aggregateNewsForDecision` + `aggregateNewsForAllDecisions` + `aggregateNewsForRecentDecisions`
- ✅ Stats mises à jour : `newsAggregated` incrémenté après agrégation
- ✅ Cron jobs :
  - Agrégation récente : Toutes les heures (`aggregateNewsRecent`)
  - Agrégation complète : Toutes les 6 heures (`aggregateNewsScheduled`)
- ✅ Fichier : `convex/bots/aggregateNews.ts`

## 📋 Cron Jobs Configurés

Tous les cron jobs sont configurés dans `convex/bots/scheduled.ts` :

| Cron Job | Fréquence | Fonction | Bot |
|----------|-----------|----------|-----|
| `detectDecisionsFrequent` | 15 min | `runDecisionDetection` | Détecteur + Générateur |
| `aggregateNewsRecent` | 1h | `aggregateNewsForRecentDecisions` | Agrégateur |
| `aggregateNewsScheduled` | 6h | `aggregateNewsForAllDecisions` | Agrégateur |
| `updateIndicatorsDaily` | Quotidien (23:00 UTC) | `updateAllIndicators` | Suiveur |
| `translateDecisionsScheduled` | 6h | `runDecisionTranslation` | (Fonction utilitaire) |
| `resolveDecisionsDaily` | Quotidien (00:00 UTC) | `resolveAllEligibleDecisions` | Résolveur |
| `resolveAnticipationsDaily` | Quotidien (01:00 UTC) | `resolveAllAnticipations` | (Fonction utilitaire) |

## ✅ Fonctions Batch

Toutes les fonctions batch mettent à jour les stats :

- ✅ `aggregateNewsForAllDecisions` : Met à jour les stats avec le total agrégé
- ✅ `aggregateNewsForRecentDecisions` : Met à jour les stats avec le total agrégé
- ✅ `resolveAllEligibleDecisions` : Met à jour les stats avec le total résolu
- ✅ `updateAllIndicators` : Met à jour les stats avec le total suivi

## 🔧 Helper Centralisé

Tous les bots utilisent `updateBotActivity` depuis `convex/bots/helpers.ts` :
- ✅ Incrémentation automatique des stats
- ✅ Création automatique de logs
- ✅ Gestion d'erreurs silencieuse (n'interrompt pas l'action principale)

## 📝 Fonctions Utilitaires (Non-bots)

Ces fonctions ne sont pas des bots mais des utilitaires :
- `fetchUrlMetadata` : Récupère les métadonnées d'URL (utilisé par Agrégateur)
- `checkDuplicateDecision` : Vérifie les doublons (utilisé par Détecteur)
- `searchFreeImage` : Recherche d'images (utilisé par Générateur)
- `testBotChain` : Tests de la chaîne (développement uniquement)
- `generateDailyDecisions` : Génération quotidienne (tests)

## ✅ Architecture Finale

### Bots Principaux (5 bots avec stats)
Tous les bots principaux ont des stats et des logs automatiques.

### Fonctions Utilitaires (sans bot dédié)
Ces fonctions sont appelées par cron jobs mais n'ont pas besoin de bot dédié :

1. **Traduction** (`runDecisionTranslation`) : 
   - Fonction utilitaire pour traduire les décisions
   - Appelée toutes les 6h par cron job
   - Pas besoin de bot dédié (fonction secondaire)

2. **Résolution d'anticipations** (`resolveAllAnticipations`) :
   - Fonction utilitaire liée au Résolveur
   - Appelée quotidiennement à 1h UTC (après la résolution des décisions)
   - Logique : résout les anticipations après que les décisions soient résolues
   - Pas besoin de bot dédié (fait partie du workflow du Résolveur)

## ✅ Checklist Production

- [x] Tous les bots principaux ont `updateBotActivity`
- [x] Toutes les fonctions batch mettent à jour les stats
- [x] Tous les cron jobs sont configurés (y compris Suiveur)
- [x] `initializeDefaultBots` crée les 5 bots par défaut
- [x] Documentation de migration créée (`docs/BOTS_MIGRATION.md`)
- [x] Helper centralisé fonctionnel
- [x] Incrémentation automatique des stats
- [x] Logs automatiques pour chaque action
- [x] Cron job Suiveur ajouté (23h UTC, avant résolution)

## 🚀 Prêt pour la Production

**Tous les bots sont fonctionnels et prêts pour la production !**

Pour initialiser en production :
```bash
npx convex run bots:initializeDefaultBots --prod
```

