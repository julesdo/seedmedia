# Plan d'Interface Admin Complète

## 🎯 Objectif
Créer une interface admin professionnelle et complète permettant de gérer tous les aspects de l'application directement depuis l'interface web, sans passer par le dashboard Convex.

---

## 📊 Analyse des Features Actuellement Utilisées

### ✅ Features Actives (utilisées dans le codebase)

#### 1. **Décisions (Decisions)**
- ✅ `getDecisions` - Liste avec filtres (status, type, decider, impactedDomain, specialEvent)
- ✅ `getDecisionById` - Détail d'une décision
- ✅ `getDecisionBySlug` - Détail par slug
- ✅ `getHotDecisions` - Décisions populaires
- ✅ `getBreakingNews` - Breaking news
- ✅ Création/Modification via bots
- ✅ Système d'événements spéciaux (municipales_2026, presidentielles_2027)

#### 2. **Trading (Marchés de Prédiction)**
- ✅ `getTradingPools` - Pools de trading OUI/NON
- ✅ `getSingleOdds` - Probabilité unique
- ✅ `getDecisionCourseHistory` - Historique des cours
- ✅ `getInvestmentWindow` - Fenêtre d'investissement
- ✅ `getUserPortfolio` - Portfolio utilisateur
- ✅ `getDecisionAnticipations` - Top holders
- ✅ `getTradingHistory` - Historique des transactions
- ✅ `buyShares` / `sellShares` - Achat/Vente

#### 3. **News (Actualités)**
- ✅ `getNewsForDecision` - News liées à une décision
- ✅ Affichage dans RelatedNewsWidget

#### 4. **Utilisateurs (Users)**
- ✅ Profils utilisateurs
- ✅ Système de crédibilité (credibilityScore)
- ✅ Niveaux et progression (level, seedsBalance)
- ✅ Premium tiers
- ✅ Gamification (daily login, streak)

#### 5. **Articles**
- ⚠️ Présents dans le schema mais utilisation limitée dans l'UI
- ✅ `getAllArticles` (admin) existe déjà

#### 6. **Catégories**
- ✅ `getActiveCategories` - Catégories actives
- ⚠️ Système de catégories présent mais peu utilisé dans l'UI actuelle

#### 7. **Favoris (Favorites)**
- ✅ `getFavoritesForDecisions` - Favoris utilisateur
- ✅ SaveButton utilisé partout

#### 8. **Commentaires (Comments)**
- ✅ Affichage dans TopArgumentsList
- ✅ Système de commentaires actif

#### 9. **Bots**
- ✅ Système de bots pour détection/création de décisions
- ✅ `BotsListClient` existe

#### 10. **Shop & Payments**
- ✅ Shop avec Seed packs
- ✅ Badge fondateur
- ✅ Vote skins
- ✅ Intégration Stripe

#### 11. **Notifications**
- ✅ Système de notifications
- ✅ Page notifications

#### 12. **Gamification**
- ✅ Missions
- ✅ Daily login
- ✅ Leaderboards

#### 13. **Municipales 2026**
- ✅ Rankings par région
- ✅ Script de création de marchés

---

## 🏗️ Structure de l'Interface Admin

### **Navigation Principale (Sidebar)**

```
📊 Dashboard
├── 📈 Vue d'ensemble
├── 📊 Statistiques en temps réel
└── 🎯 KPIs principaux

📋 Décisions
├── 📝 Liste des décisions
├── ➕ Créer une décision
├── 🏷️ Événements spéciaux
└── 🔍 Recherche avancée

💰 Trading
├── 📊 Pools actifs
├── 📈 Historique des cours
├── 💸 Transactions
└── 🐋 Top holders

👥 Utilisateurs
├── 👤 Liste des utilisateurs
├── 🎖️ Crédibilité & Rôles
├── 💎 Premium & Abonnements
└── 📊 Statistiques utilisateurs

📰 News
├── 📄 Liste des news
├── ➕ Créer une news
└── 🔗 Lier à une décision

🤖 Bots
├── 🤖 Liste des bots
├── ⚙️ Configuration
├── 📊 Métriques
└── 📝 Logs

🏪 Shop
├── 💰 Seed Packs
├── 🎨 Vote Skins
├── 🏅 Badges
└── 📊 Ventes

⚙️ Configuration
├── 🏷️ Catégories
├── 📋 Règles configurables
├── 🎯 Missions
└── 🔔 Notifications

🛠️ Scripts & Maintenance
├── 🗳️ Scripts municipaux
├── 🔄 Actions de maintenance
└── 📊 Logs système
```

---

## 📋 Détail des Sections

### 1. 📊 Dashboard

**Objectif** : Vue d'ensemble de l'état de l'application

**Contenu** :
- **KPIs Principaux** (Cards)
  - Nombre total de décisions (tracking, resolved)
  - Nombre d'utilisateurs actifs (7j, 30j)
  - Volume de trading (24h, 7j, 30j)
  - Liquidité totale en Seeds
  - Nombre de transactions (24h)
  - Taux de résolution des décisions

- **Graphiques**
  - Évolution du nombre de décisions (7j, 30j)
  - Volume de trading par jour
  - Nouveaux utilisateurs par jour
  - Décisions les plus actives (top 10)

- **Alertes & Actions Rapides**
  - Décisions nécessitant une attention (résolution manuelle, erreurs)
  - Transactions suspectes
  - Utilisateurs signalés

**Fonctions Convex nécessaires** :
- `api.admin.getDashboardStats` (à créer)
- `api.admin.getRecentActivity` (à créer)

---

### 2. 📋 Décisions

#### 2.1 Liste des Décisions

**Fonctionnalités** :
- Tableau avec colonnes : Titre, Statut, Type, Décideur, Date, Actions
- Filtres : Statut, Type, Décideur, Domaine impacté, Événement spécial
- Recherche par titre/question
- Tri par date, popularité, liquidité
- Pagination
- Actions rapides : Modifier, Résoudre, Supprimer, Dupliquer

**Fonctions Convex** :
- ✅ `api.decisions.getDecisions` (existe)
- ⚠️ `api.admin.updateDecision` (à créer - étendre les champs modifiables)
- ⚠️ `api.admin.resolveDecision` (à créer)
- ⚠️ `api.admin.deleteDecision` (à créer)

#### 2.2 Créer/Modifier une Décision

**Formulaire complet** :
- **Informations de base**
  - Titre
  - Question
  - Description
  - Image de couverture (upload)
  - Slug (auto-généré, éditable)

- **Classification**
  - Type (law, sanction, tax, etc.)
  - Statut (announced, tracking, resolved)
  - Décideur
  - Domaines impactés (multi-select)
  - Niveau d'impact (1-5)
  - Sentiment (positive, negative, neutral)
  - Régions impactées (multi-select)

- **Événements spéciaux**
  - Événement spécial (municipales_2026, presidentielles_2027)
  - Métadonnées (région, ville, catégorie d'événement)

- **Dates**
  - Date de création
  - Date de décision prévue
  - Date de résolution (si résolu)

- **Résolution**
  - Résultat (OUI/NON)
  - Justification
  - Sources

**Fonctions Convex** :
- ⚠️ `api.admin.createDecision` (à créer)
- ⚠️ `api.admin.updateDecision` (à créer - étendre)
- ✅ `api.admin.updateDecisionSpecialEvent` (existe)

#### 2.3 Événements Spéciaux

**Fonctionnalités** :
- Liste des décisions par événement spécial
- Gestion des métadonnées (région, ville, catégorie)
- Scripts de création en masse
- Statistiques par événement

**Fonctions Convex** :
- ✅ `api.admin.getSpecialEventDecisions` (existe)
- ✅ `api.admin.updateDecisionSpecialEvent` (existe)
- ✅ `api.scripts.createMunicipalesMarkets.createMunicipalesMarkets` (existe)

---

### 3. 💰 Trading

#### 3.1 Pools Actifs

**Fonctionnalités** :
- Liste des pools de trading actifs
- Colonnes : Décision, Probabilité OUI/NON, Liquidité, Participants, Volume 24h
- Filtres : Par décision, par liquidité, par volume
- Actions : Voir détails, Forcer résolution

**Fonctions Convex** :
- ✅ `api.trading.getTradingPools` (existe)
- ⚠️ `api.admin.getAllTradingPools` (à créer - liste globale)

#### 3.2 Historique des Cours

**Fonctionnalités** :
- Graphique interactif par décision
- Export des données
- Comparaison entre décisions

**Fonctions Convex** :
- ✅ `api.trading.getDecisionCourseHistory` (existe)

#### 3.3 Transactions

**Fonctionnalités** :
- Liste de toutes les transactions
- Filtres : Par décision, par utilisateur, par type (achat/vente), par date
- Recherche par utilisateur
- Détails : Utilisateur, Décision, Position, Montant, Date
- Actions : Annuler transaction (si nécessaire)

**Fonctions Convex** :
- ✅ `api.trading.getTradingHistory` (existe)
- ⚠️ `api.admin.getAllTradingHistory` (à créer - toutes les transactions)
- ⚠️ `api.admin.cancelTransaction` (à créer - si nécessaire)

#### 3.4 Top Holders

**Fonctionnalités** :
- Liste des plus gros détenteurs par décision
- Filtres : Par décision, par position (OUI/NON)
- Statistiques : Part de marché, Investissement total

**Fonctions Convex** :
- ✅ `api.trading.getDecisionAnticipations` (existe)

---

### 4. 👥 Utilisateurs

#### 4.1 Liste des Utilisateurs

**Fonctionnalités** :
- Tableau avec colonnes : Email, Nom, Username, Niveau, Crédibilité, Rôle, Premium, Inscrit le
- Filtres : Par rôle, par niveau, par premium tier, par crédibilité
- Recherche : Email, nom, username
- Tri : Par date d'inscription, par crédibilité, par niveau
- Pagination

**Fonctions Convex** :
- ✅ `api.admin.getAllUsers` (existe)

#### 4.2 Détail Utilisateur / Modification

**Formulaire complet** :
- **Informations de base**
  - Email (modifiable)
  - Nom
  - Username
  - Bio
  - Image de profil (upload)
  - Image de couverture (upload)

- **Progression**
  - Niveau
  - Seeds balance (modifiable)
  - Seeds to next level
  - Crédibilité (modifiable)

- **Rôle & Permissions**
  - Rôle (explorateur, contributeur, éditeur)
  - Domaines d'expertise

- **Premium**
  - Tier (free, starter, pro, impact)
  - Boost credits (modifiable)

- **Localisation**
  - Région
  - Location (lat/lng)
  - Reach radius

- **Statistiques**
  - Nombre de décisions créées
  - Nombre d'anticipations
  - Portfolio value
  - Transactions totales

- **Actions**
  - Suspendre/Activer compte
  - Réinitialiser mot de passe (via Better Auth)
  - Supprimer compte

**Fonctions Convex** :
- ✅ `api.admin.updateUserAdmin` (existe)
- ⚠️ `api.admin.suspendUser` (à créer)
- ⚠️ `api.admin.getUserStats` (à créer)

#### 4.3 Gestion des Rôles

**Fonctionnalités** :
- Liste des utilisateurs par rôle
- Modification en masse
- Statistiques par rôle

---

### 5. 📰 News

#### 5.1 Liste des News

**Fonctionnalités** :
- Tableau avec colonnes : Titre, Décision liée, Auteur, Date, Actions
- Filtres : Par décision, par auteur, par date
- Recherche
- Actions : Modifier, Supprimer, Lier à une décision

**Fonctions Convex** :
- ✅ `api.news.getNewsForDecision` (existe - à adapter)
- ⚠️ `api.admin.getAllNews` (à créer)
- ⚠️ `api.admin.createNews` (à créer)
- ⚠️ `api.admin.updateNews` (à créer)
- ⚠️ `api.admin.deleteNews` (à créer)

#### 5.2 Créer/Modifier News

**Formulaire** :
- Titre
- Contenu (markdown)
- Décision liée (select)
- Source URL
- Image (upload)
- Date de publication

---

### 6. 🤖 Bots

#### 6.1 Liste des Bots

**Fonctionnalités** :
- Liste des bots actifs
- Statut (actif, inactif, erreur)
- Métriques : Décisions créées, Taux de succès, Dernière exécution
- Actions : Activer/Désactiver, Voir logs, Configurer

**Fonctions Convex** :
- ⚠️ `api.admin.getBotsList` (à créer)
- ⚠️ `api.admin.updateBotStatus` (à créer)

#### 6.2 Configuration Bots

**Fonctionnalités** :
- Paramètres de détection
- Sources de news
- Fréquence d'exécution
- Filtres de qualité

#### 6.3 Logs Bots

**Fonctionnalités** :
- Logs détaillés par bot
- Filtres : Par date, par type (succès/erreur)
- Recherche

---

### 7. 🏪 Shop

#### 7.1 Seed Packs

**Fonctionnalités** :
- Liste des packs disponibles
- Prix, Quantité de Seeds, Popularité
- Actions : Modifier, Activer/Désactiver

#### 7.2 Vote Skins

**Fonctionnalités** :
- Liste des skins disponibles
- Prix, Popularité
- Actions : Modifier, Activer/Désactiver

#### 7.3 Badges

**Fonctionnalités** :
- Liste des badges (Fondateur, etc.)
- Prix, Popularité
- Actions : Modifier

#### 7.4 Statistiques Ventes

**Fonctionnalités** :
- Revenus par période
- Top produits
- Conversion rates

**Fonctions Convex** :
- ⚠️ `api.admin.getShopStats` (à créer)

---

### 8. ⚙️ Configuration

#### 8.1 Catégories

**Fonctionnalités** :
- Liste des catégories actives
- Créer/Modifier/Supprimer catégorie
- Gérer les catégories par défaut
- Associer aux types de contenu (articles, dossiers, etc.)

**Fonctions Convex** :
- ✅ `api.categories.getActiveCategories` (existe)
- ⚠️ `api.admin.createCategory` (à créer)
- ⚠️ `api.admin.updateCategory` (à créer)
- ⚠️ `api.admin.deleteCategory` (à créer)

#### 8.2 Règles Configurables

**Fonctionnalités** :
- Liste des règles
- Modifier les paramètres
- Activer/Désactiver

**Fonctions Convex** :
- ⚠️ `api.admin.getConfigurableRules` (à créer)
- ⚠️ `api.admin.updateConfigurableRule` (à créer)

#### 8.3 Missions

**Fonctionnalités** :
- Liste des missions
- Créer/Modifier/Supprimer mission
- Récompenses

**Fonctions Convex** :
- ⚠️ `api.admin.getMissions` (à créer)
- ⚠️ `api.admin.createMission` (à créer)
- ⚠️ `api.admin.updateMission` (à créer)

---

### 9. 🛠️ Scripts & Maintenance

#### 9.1 Scripts

**Fonctionnalités** :
- Liste des scripts disponibles
- Lancer un script
- Historique des exécutions
- Logs

**Scripts disponibles** :
- ✅ Script municipal (createMunicipalesMarkets)
- ⚠️ Script de résolution automatique (à créer)
- ⚠️ Script de nettoyage (à créer)
- ⚠️ Script de migration (à créer)

**Fonctions Convex** :
- ✅ `api.scripts.createMunicipalesMarkets.createMunicipalesMarkets` (existe)
- ⚠️ `api.admin.getScriptHistory` (à créer)

#### 9.2 Maintenance

**Fonctionnalités** :
- Actions de maintenance
  - Réindexer les données
  - Nettoyer les données obsolètes
  - Recalculer les scores
  - Synchroniser les données

#### 9.3 Logs Système

**Fonctionnalités** :
- Logs d'erreurs
- Logs d'actions admin
- Filtres par date, type, utilisateur

---

## 🎨 Design & UX

### Principes de Design

1. **Clarté** : Interface claire et intuitive
2. **Efficacité** : Actions rapides, raccourcis clavier
3. **Feedback** : Confirmations, toasts, loading states
4. **Sécurité** : Confirmations pour actions destructives
5. **Responsive** : Desktop-first mais adapté mobile

### Composants UI à Utiliser

- **Tables** : `DataTable` avec tri, filtres, pagination
- **Forms** : `Form` avec validation
- **Modals** : `Dialog` pour confirmations et formulaires
- **Tabs** : Navigation entre sections
- **Cards** : Pour les KPIs et statistiques
- **Charts** : Pour les graphiques (recharts ou similar)
- **Badges** : Pour les statuts
- **Buttons** : Actions avec icônes

### Layout

- **Sidebar** : Navigation principale (collapsible)
- **Header** : Breadcrumbs, recherche globale, notifications admin
- **Main Content** : Zone de travail principale
- **Right Panel** (optionnel) : Détails contextuels

---

## 🔒 Sécurité & Permissions

### Niveaux d'Accès

1. **Super Admin** : Accès complet
2. **Admin** (futur) : Accès limité à certaines sections
3. **Modérateur** (futur) : Accès en lecture seule + modération

### Vérifications

- Toutes les fonctions admin vérifient `isSuperAdmin`
- Logs de toutes les actions admin
- Confirmations pour actions destructives
- Rate limiting sur actions sensibles

---

## 📝 Fonctions Convex à Créer

### Priorité 1 (Essentielles)

1. `api.admin.getDashboardStats` - Statistiques dashboard
2. `api.admin.createDecision` - Créer une décision
3. `api.admin.updateDecision` - Modifier une décision (étendre)
4. `api.admin.resolveDecision` - Résoudre une décision
5. `api.admin.deleteDecision` - Supprimer une décision
6. `api.admin.getAllTradingPools` - Liste globale des pools
7. `api.admin.getAllTradingHistory` - Toutes les transactions
8. `api.admin.getAllNews` - Liste de toutes les news
9. `api.admin.createNews` - Créer une news
10. `api.admin.updateNews` - Modifier une news
11. `api.admin.deleteNews` - Supprimer une news
12. `api.admin.getUserStats` - Statistiques utilisateur
13. `api.admin.suspendUser` - Suspendre un utilisateur
14. `api.admin.createCategory` - Créer une catégorie
15. `api.admin.updateCategory` - Modifier une catégorie
16. `api.admin.deleteCategory` - Supprimer une catégorie

### Priorité 2 (Importantes)

17. `api.admin.getBotsList` - Liste des bots
18. `api.admin.updateBotStatus` - Activer/Désactiver bot
19. `api.admin.getShopStats` - Statistiques shop
20. `api.admin.getConfigurableRules` - Règles configurables
21. `api.admin.updateConfigurableRule` - Modifier règle
22. `api.admin.getMissions` - Liste des missions
23. `api.admin.createMission` - Créer une mission
24. `api.admin.updateMission` - Modifier une mission
25. `api.admin.getScriptHistory` - Historique des scripts
26. `api.admin.getRecentActivity` - Activité récente

### Priorité 3 (Optionnelles)

27. `api.admin.cancelTransaction` - Annuler transaction
28. `api.admin.exportData` - Exporter des données
29. `api.admin.bulkActions` - Actions en masse

---

## 🚀 Plan d'Implémentation

### Phase 1 : Fondations (Semaine 1)
- ✅ Structure de navigation
- ✅ Dashboard avec KPIs de base
- ✅ Liste des décisions (lecture seule)
- ✅ Liste des utilisateurs (lecture seule)

### Phase 2 : Gestion Décisions (Semaine 2)
- ✅ Créer/Modifier décision
- ✅ Résoudre décision
- ✅ Gestion événements spéciaux
- ✅ Scripts municipaux

### Phase 3 : Trading & Utilisateurs (Semaine 3)
- ✅ Pools actifs
- ✅ Historique transactions
- ✅ Détail/Modification utilisateur
- ✅ Gestion des rôles

### Phase 4 : News, Bots, Shop (Semaine 4)
- ✅ Gestion news
- ✅ Gestion bots
- ✅ Gestion shop
- ✅ Statistiques

### Phase 5 : Configuration & Maintenance (Semaine 5)
- ✅ Gestion catégories
- ✅ Règles configurables
- ✅ Missions
- ✅ Logs système

---

## 📌 Notes Importantes

1. **Features Obsolètes** : Ne pas inclure les features qui ne sont plus utilisées (ex: certains types d'articles, dossiers, débats si non utilisés)

2. **Performance** : Pagination obligatoire pour toutes les listes, lazy loading pour les données lourdes

3. **Validation** : Validation côté client ET serveur pour tous les formulaires

4. **Audit Trail** : Logger toutes les actions admin importantes

5. **Backup** : Avant suppressions importantes, proposer export/backup

6. **UX Mobile** : Interface responsive mais optimisée desktop

---

## ✅ Checklist de Validation

- [ ] Toutes les fonctions Convex nécessaires sont créées
- [ ] Interface responsive et accessible
- [ ] Sécurité : toutes les routes vérifient les permissions
- [ ] Performance : pagination, lazy loading
- [ ] UX : feedback utilisateur, confirmations
- [ ] Tests : tests manuels de toutes les fonctionnalités
- [ ] Documentation : guide d'utilisation admin

---

**Date de création** : 2024
**Dernière mise à jour** : 2024
**Auteur** : Assistant IA


