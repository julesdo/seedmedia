# Migration des Bots en Production

## Problèmes identifiés

### 1. Stats des bots non mises à jour en temps réel
Les bots n'appellent pas `updateBotStats` ou `createBotLog` après leurs exécutions, donc :
- `lastActivityAt` n'est pas mis à jour
- Les compteurs (`decisionsCreated`, `decisionsResolved`, `newsAggregated`, etc.) ne sont pas incrémentés
- Les stats affichées dans l'interface ne reflètent pas l'activité réelle

### 2. Stats utilisateur calculées à la volée
Les stats utilisateur sont calculées à chaque requête depuis `getUserProfile`, ce qui est correct mais peut être optimisé avec un cache.

## Solution : Migration en Production

### ✅ Améliorations apportées

1. **Helper `updateBotActivity`** : Fonction centralisée pour mettre à jour les stats des bots
2. **Incrémentation automatique** : Les stats sont maintenant incrémentées au lieu d'être remplacées
3. **Logs automatiques** : Chaque action de bot crée un log avec le niveau approprié
4. **Mise à jour dans tous les bots** :
   - ✅ `generateDecision` : Met à jour `decisionsCreated` après création
   - ✅ `aggregateNewsForDecision` : Met à jour `newsAggregated` après agrégation
   - ✅ `resolveDecision` : Met à jour `decisionsResolved` après résolution
   - ✅ `updateIndicatorDataForDecision` : Met à jour `indicatorsTracked` après suivi
   - ✅ `detectDecisions` : Crée un log après détection
   - ✅ Fonctions batch : Mettent à jour les stats avec les totaux

### Étape 1 : Initialiser les bots

**Via Dashboard Convex :**
1. Aller sur https://dashboard.convex.dev
2. Sélectionner votre projet de production
3. Aller dans "Functions"
4. Chercher `bots:initializeDefaultBots`
5. Cliquer sur "Run" (sans arguments)

**Via CLI :**
```bash
npx convex run bots:initializeDefaultBots --prod
```

Cette fonction crée les 5 bots par défaut s'ils n'existent pas déjà :
- **Détecteur** (`detecteur`) : Détecte les nouvelles décisions
- **Générateur** (`generateur`) : Génère les Decision Cards
- **Résolveur** (`resolveur`) : Résout automatiquement les décisions
- **Suiveur** (`suiveur`) : Suit les indicateurs économiques
- **Agrégateur** (`agregateur`) : Agrège les actualités

### Étape 2 : Vérifier que les bots sont actifs

```bash
# Vérifier les bots créés
npx convex run bots:getBots --prod
```

Vous devriez voir les 5 bots avec leurs stats initialisées à 0.

## Vérification

### Vérifier que les bots fonctionnent

1. **Vérifier les cron jobs** :
   - Dashboard Convex > Cron Jobs
   - Vérifier que les jobs sont actifs :
     - `detectDecisionsFrequent` : toutes les 15 min
     - `aggregateNewsRecent` : toutes les heures
     - `aggregateNewsScheduled` : toutes les 6h
     - `resolveDecisionsDaily` : tous les jours à minuit UTC
     - `resolveAnticipationsDaily` : tous les jours à 1h UTC

2. **Vérifier les logs** :
   ```bash
   # Voir les logs d'un bot
   npx convex run bots:getBotLogs --prod --args '{"botId": "..."}'
   ```

3. **Vérifier les stats** :
   - Aller sur `/bots` dans l'application
   - Vérifier que `lastActivityAt` est récent
   - Vérifier que les compteurs augmentent

## Notes importantes

- Les bots sont créés avec `active: true` et `status: "active"` par défaut
- La fonction `initializeDefaultBots` est idempotente : elle ne crée pas de doublons
- **Les stats sont maintenant mises à jour automatiquement** : chaque bot met à jour ses stats après chaque action
- Les stats utilisateur sont calculées à la volée dans `getUserProfile` et `UserProfileClient`, donc elles sont toujours à jour grâce à Convex
- Les compteurs dans la table `bots` sont incrémentés automatiquement grâce à `updateBotActivity` avec `increment: true`

## Vérification des stats en temps réel

### Stats des bots
Les stats des bots sont maintenant mises à jour automatiquement :
- `lastActivityAt` : Mis à jour à chaque action
- `decisionsCreated` : Incrémenté à chaque création de décision
- `decisionsResolved` : Incrémenté à chaque résolution
- `newsAggregated` : Incrémenté à chaque agrégation d'actualités
- `indicatorsTracked` : Incrémenté à chaque suivi d'indicateurs

### Stats utilisateur
Les stats utilisateur sont calculées à la volée depuis les anticipations, donc elles sont toujours à jour :
- Calculées dans `getUserProfile` (backend)
- Recalculées dans `UserProfileClient` (frontend) depuis `allAnticipations`
- Mises à jour automatiquement grâce à Convex React Query

