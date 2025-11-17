# Features Manquantes - Organisations

## 📋 Vue d'ensemble

Ce document liste toutes les fonctionnalités manquantes liées aux organisations avant de passer aux autres grandes features (projets, actions, articles, etc.).

---

## 🔍 1. RECHERCHE ET DÉCOUVERTE

### 1.1 Page de découverte/recherche d'organisations
- [ ] **Page publique de recherche** (`/organizations/search` ou `/discover/organizations`)
  - Barre de recherche par nom/description
  - Filtres multiples :
    - Par région Seed (`seedRegion`)
    - Par type d'organisation (`organizationType`)
    - Par secteur (`sector`)
    - Par tags
    - Par rayon d'audience (`reachRadius`)
    - Par langues (`languages`)
    - Organisations vérifiées uniquement
    - Par premium tier
  - Tri : pertinence, date de création, nombre de membres, nombre de followers
  - Vue grille/liste
  - Pagination

### 1.2 Fonctions Convex manquantes
- [ ] `searchOrganizations` - Recherche avec filtres multiples
- [ ] `getOrganizationsByRegion` - Par région Seed
- [ ] `getOrganizationsByType` - Par type
- [ ] `getOrganizationsBySector` - Par secteur
- [ ] `getOrganizationsByTags` - Par tags
- [ ] `getFeaturedOrganizations` - Organisations mises en avant
- [ ] `getVerifiedOrganizations` - Organisations vérifiées

---

## 📧 2. SYSTÈME D'INVITATIONS

### 2.1 Acceptation d'invitations
- [ ] **Page de gestion des invitations** (`/invitations`)
  - Liste des invitations reçues (pending)
  - Bouton accepter/refuser
  - Lien direct depuis email avec token
  - Notification badge dans le header

### 2.2 Email d'invitation
- [ ] **Envoi d'email d'invitation** (actuellement TODO dans `convex/invitations.ts`)
  - Template email avec lien d'acceptation
  - Token dans l'URL
  - Expiration visible
  - Design cohérent avec les autres emails

### 2.3 Fonctions Convex manquantes
- [ ] `getUserInvitations` - Récupérer les invitations de l'utilisateur connecté
- [ ] `resendInvitation` - Renvoyer une invitation expirée
- [ ] `cancelInvitation` - Annuler une invitation (différent de delete)

---

## 👥 3. GESTION DES MEMBRES

### 3.1 Fonctionnalités manquantes
- [ ] **Transfert de propriété** (`transferOwnership`)
  - Seul le propriétaire peut transférer
  - Confirmation avec mot de passe/2FA
  - Notification au nouveau propriétaire

- [ ] **Quitter une organisation** (fonction existe mais pas d'UI)
  - Bouton "Quitter" dans les paramètres membres
  - Confirmation
  - Impossible pour le propriétaire (doit transférer ou supprimer)

- [ ] **Suspendre un membre** (statut `suspended` existe dans le schéma)
  - Fonction `suspendMember`
  - UI dans MembersManagement
  - Réactiver un membre suspendu

- [ ] **Permissions granulaires** (champs existent mais pas d'UI complète)
  - Interface pour modifier `canInvite`, `canEdit`, `canDelete` individuellement
  - Actuellement liées au rôle uniquement

### 3.2 Fonctions Convex manquantes
- [ ] `transferOwnership` - Transférer la propriété
- [ ] `suspendMember` - Suspendre un membre
- [ ] `unsuspendMember` - Réactiver un membre
- [ ] `updateMemberPermissions` - Modifier les permissions individuelles

---

## ⚙️ 4. PARAMÈTRES ET CONFIGURATION

### 4.1 Champs du schéma non édités dans l'UI
- [ ] **Métriques d'impact** (`impactMetrics`)
  - Interface pour ajouter/modifier/supprimer des métriques
  - Affichage dans le profil public
  - Format: `{ label: string, value: string }[]`

- [ ] **Liens externes** (`links`)
  - Interface pour ajouter/modifier/supprimer des liens
  - Types: website, social media, etc.
  - Affichage dans le profil public
  - Format: `{ type: string, url: string }[]`

- [ ] **Coordonnées GPS** (`location.lat`, `location.lng`)
  - Intégration avec une API de géocodage (Google Maps, OpenStreetMap)
  - Auto-complétion d'adresse
  - Carte interactive pour sélectionner la position
  - Affichage d'une carte dans le profil public

### 4.2 Fonctionnalités avancées
- [ ] **Suppression d'organisation** (fonction existe mais pas d'UI)
  - Bouton dans les paramètres (seul propriétaire)
  - Confirmation avec saisie du nom
  - Cascade delete des données associées

- [ ] **Duplication d'organisation** (template)
  - Créer une nouvelle org basée sur une existante
  - Copier les paramètres (sans les membres)

- [ ] **Export de données**
  - Export JSON/CSV des données de l'organisation
  - Liste des membres
  - Historique des activités

---

## 📊 5. STATISTIQUES ET ANALYTICS

### 5.1 Dashboard analytics
- [ ] **Page analytics** (`/organizations/[id]/analytics`)
  - Graphiques d'évolution des followers
  - Statistiques d'engagement (articles, projets, actions)
  - Répartition géographique des membres
  - Activité récente
  - Export des données

### 5.2 Fonctions Convex manquantes
- [ ] `getOrganizationAnalytics` - Statistiques détaillées
- [ ] `getOrganizationActivity` - Historique d'activité
- [ ] `getOrganizationEngagement` - Métriques d'engagement

---

## 🔗 6. INTÉGRATIONS ET LIENS

### 6.1 Liens sociaux et externes
- [ ] **Gestion des liens** (`links` array)
  - Ajouter liens sociaux (Twitter, LinkedIn, Facebook, Instagram)
  - Ajouter liens vers autres plateformes
  - Icônes appropriées
  - Validation des URLs
  - Affichage dans le header du profil

### 6.2 Partage social
- [ ] **Amélioration du partage**
  - Open Graph meta tags pour les organisations
  - Preview card lors du partage
  - Analytics de partage

---

## 🎨 7. AFFICHAGE PUBLIC

### 7.1 Profil public amélioré
- [ ] **Affichage des métriques d'impact**
  - Section dédiée dans le profil
  - Graphiques/visualisations

- [ ] **Carte de localisation**
  - Intégration d'une carte (Leaflet, Google Maps)
  - Marqueur sur la position
  - Rayon d'audience visible

- [ ] **Horaires et réunions** (`schedule`)
  - Affichage formaté dans le profil
  - Calendrier des prochaines réunions

- [ ] **Date de fondation** (`foundedAt`)
  - Affichage formaté
  - Calcul de l'âge de l'organisation

- [ ] **Statut légal** (`legalStatus`)
  - Affichage dans les informations

### 7.2 SEO et découverte
- [ ] **Meta tags SEO**
  - Description meta
  - Open Graph
  - Twitter Cards
  - Schema.org markup

- [ ] **URLs SEO-friendly**
  - Utilisation du `slug` dans les URLs
  - Redirection si slug change
  - `/organizations/[slug]` au lieu de `[id]`

---

## 🔔 8. NOTIFICATIONS

### 8.1 Notifications manquantes
- [ ] **Invitation reçue**
  - Notification quand on reçoit une invitation
  - Badge dans le header

- [ ] **Nouveau membre**
  - Notification aux admins quand un membre rejoint

- [ ] **Changement de rôle**
  - Notification quand le rôle change

- [ ] **Modifications importantes**
  - Notification quand l'org est modifiée (si membre)

---

## 🗑️ 9. SUPPRESSION ET ARCHIVAGE

### 9.1 Fonctionnalités manquantes
- [ ] **Archivage d'organisation**
  - Au lieu de supprimer, archiver
  - Table `archivedOrganizations` ou champ `archived`
  - Restauration possible

- [ ] **Suppression douce (soft delete)**
  - Champ `deletedAt`
  - Période de grâce avant suppression définitive
  - Restauration possible

---

## 🔐 10. SÉCURITÉ ET PERMISSIONS

### 10.1 Améliorations de sécurité
- [ ] **Audit log**
  - Historique des modifications
  - Qui a fait quoi et quand
  - Table `organizationAuditLogs`

- [ ] **Validation des permissions**
  - Vérification côté serveur renforcée
  - Tests de sécurité

- [ ] **Rate limiting**
  - Limiter les invitations par jour
  - Limiter les modifications

---

## 📱 11. RESPONSIVE ET UX

### 11.1 Améliorations UX
- [ ] **Amélioration de la page de création**
  - Formulaire multi-étapes
  - Validation en temps réel
  - Preview du profil

- [ ] **Amélioration de la liste des organisations**
  - Filtres dans la page `/organizations`
  - Tri et recherche
  - Vue compacte/détaillée

- [ ] **Breadcrumbs**
  - Navigation claire
  - Liens vers parent

---

## 🧪 12. TESTS ET VALIDATION

### 12.1 Tests manquants
- [ ] **Tests unitaires**
  - Fonctions Convex
  - Composants React

- [ ] **Tests d'intégration**
  - Flux complets (création, invitation, etc.)

- [ ] **Tests E2E**
  - Scénarios utilisateur complets

---

## 📝 13. DOCUMENTATION

### 13.1 Documentation manquante
- [ ] **Guide utilisateur**
  - Comment créer une organisation
  - Comment inviter des membres
  - Comment gérer les permissions

- [ ] **Documentation API**
  - Toutes les fonctions Convex documentées
  - Exemples d'utilisation

---

## 🎯 PRIORISATION RECOMMANDÉE

### 🔴 Priorité HAUTE (à faire en premier)
1. Page de recherche/découverte d'organisations
2. Acceptation d'invitations (page `/invitations`)
3. Envoi d'email d'invitation
4. Affichage des métriques d'impact dans l'UI
5. Gestion des liens externes
6. Transfert de propriété
7. Quitter une organisation (UI)

### 🟡 Priorité MOYENNE
8. Coordonnées GPS avec géocodage
9. Carte de localisation dans le profil
10. Dashboard analytics
11. Notifications
12. URLs SEO-friendly avec slugs

### 🟢 Priorité BASSE (nice to have)
13. Archivage d'organisations
14. Audit log
15. Duplication d'organisation
16. Export de données

---

## ✅ RÉSUMÉ

**Total de features manquantes identifiées : ~50+**

**Fonctions Convex manquantes : ~15**

**Composants UI manquants : ~20**

**Pages manquantes : ~5**

---

*Dernière mise à jour : [Date actuelle]*

