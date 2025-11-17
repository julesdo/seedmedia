# Plan de Développement - Seed by Laiyr

> Plan d'exécution structuré pour l'implémentation de la plateforme Seed  
> Basé sur le document d'introduction et les maquettes fournies

---

## 📋 Vue d'ensemble

**Objectif** : Créer une plateforme média + directory communautaire pour technologies résilientes et IA éthique avec système de niveaux, missions gamifiées, et rayon d'audience équitable.

**Stack technique** :
- Next.js 16 (App Router) + React 19
- TypeScript
- Convex (backend real-time)
- Better Auth (authentification)
- Shadcn UI + Tailwind CSS v4
- Magic UI (composants animés)

---

## 🎯 Phase 0 : Fondations & Design System (Priorité 1)

### 0.1 Configuration du thème Seed
**Fichiers à modifier/créer** :
- `src/app/globals.css` - Mise à jour des couleurs selon spécifications
- `tailwind.config.ts` - Configuration des tokens Seed

**Tâches** :
- [ ] Implémenter les couleurs Dark mode :
  - Background `#0C1117` à `#0B0E14`
  - Surface `#131A21`
  - Card `#161C24`
  - Border `#1E2630`
  - Texte primaire `#E6EDF3`
  - Texte secondaire `#9FB0C3`
- [ ] Implémenter les couleurs Light mode :
  - Background `#F3F5F7`
  - Surface `#FFFFFF`
  - Card `#FFFFFF` ou `#F7F9FB`
  - Border `#E4E9EE`
  - Texte primaire `#0B1320`
  - Texte secondaire `#627184`
- [ ] Ajouter la couleur accent Seed `#005DE7` (bleu moderne)
- [ ] Configurer les rayons de bordure (12-16px)
- [ ] Configurer les ombres douces verticales
- [ ] Ajouter les variables CSS pour glassmorphism (sidebar active)

**Livrables** : Thème Seed fonctionnel avec switch dark/light

---

### 0.2 Typographie
**Fichiers à modifier** :
- `src/app/layout.tsx` - Changer la police vers Plus Jakarta Sans

**Tâches** :
- [ ] Remplacer Geist Mono par Plus Jakarta Sans
- [ ] Configurer les échelles de taille : 12, 14, 16, 18, 20, 24, 30px
- [ ] Configurer les poids : 400-500 pour texte, 600-700 pour titres

**Livrables** : Typographie Seed appliquée

---

### 0.3 Composants Shadcn UI de base
**Composants à ajouter** :
- [ ] `separator` - Séparateurs visuels
- [ ] `tabs` - Navigation par onglets
- [ ] `select` - Sélecteurs de région/niveau
- [ ] `skeleton` - États de chargement
- [ ] `tooltip` - Infobulles (niveau, missions)
- [ ] `progress` - Barres de progression (missions)
- [ ] `switch` - Toggle dark/light mode
- [ ] `scroll-area` - Zones de défilement
- [ ] `carousel` - Carrousel featured (avec embla-carousel-react)

**Commande** : Utiliser `mcp_shadcn_get_add_command_for_items` pour chaque composant

**Livrables** : Bibliothèque de composants UI complète

---

## 🗄️ Phase 1 : Schéma Convex & Backend (Priorité 1)

### 1.1 Extension du schéma utilisateur
**Fichier** : `convex/schema.ts`

**Tables à créer/modifier** :
- [ ] **users** (extension) :
  - `level` : number (niveau actuel, défaut 1)
  - `region` : string (région sélectionnée)
  - `reachRadius` : number (rayon d'audience en km, calculé selon niveau)
  - `location` : object { lat, lng, city, region }
  - `bio` : string (optionnel)
  - `tags` : array<string> (sujets suivis)
  - `links` : array<{ type, url }> (liens externes)
  - `profileCompletion` : number (0-100)
  - `premiumTier` : "free" | "starter" | "pro" | "impact"
  - `boostCredits` : number (crédits de boost mensuels)
  - `createdAt` : number
  - `updatedAt` : number

- [ ] **articles** :
  - `title` : string
  - `slug` : string (unique)
  - `summary` : string
  - `content` : string (markdown)
  - `authorId` : Id<"users">
  - `tags` : array<string>
  - `coverImage` : string (URL)
  - `featured` : boolean
  - `publishedAt` : number
  - `views` : number
  - `reactions` : number
  - `comments` : number
  - `status` : "draft" | "pending" | "published" | "rejected"
  - `createdAt` : number
  - `updatedAt` : number

- [ ] **projects** :
  - `title` : string
  - `slug` : string (unique)
  - `summary` : string
  - `description` : string (markdown)
  - `orgId` : Id<"organizations"> (optionnel)
  - `authorId` : Id<"users">
  - `tags` : array<string>
  - `location` : object { lat, lng, city, region, country }
  - `images` : array<string> (URLs)
  - `links` : array<{ type, url }>
  - `stage` : "idea" | "prototype" | "beta" | "production"
  - `impactMetrics` : array<{ label, value }>
  - `featured` : boolean
  - `views` : number
  - `reactions` : number
  - `comments` : number
  - `openSource` : boolean
  - `createdAt` : number
  - `updatedAt` : number

- [ ] **organizations** :
  - `name` : string
  - `slug` : string (unique)
  - `description` : string
  - `logo` : string (URL)
  - `location` : object { lat, lng, city, region, country }
  - `tags` : array<string>
  - `links` : array<{ type, url }>
  - `verified` : boolean
  - `premiumTier` : "free" | "starter" | "pro" | "impact"
  - `createdAt` : number
  - `updatedAt` : number

- [ ] **actions** :
  - `title` : string
  - `slug` : string (unique)
  - `summary` : string
  - `description` : string (markdown)
  - `type` : "petition" | "contribution" | "event"
  - `authorId` : Id<"users">
  - `orgId` : Id<"organizations"> (optionnel)
  - `tags` : array<string>
  - `target` : string (cible de l'action)
  - `link` : string (URL externe)
  - `status` : "active" | "completed" | "cancelled"
  - `deadline` : number (timestamp, optionnel)
  - `location` : object { lat, lng, city, region } (optionnel)
  - `featured` : boolean
  - `participants` : number
  - `createdAt` : number
  - `updatedAt` : number

- [ ] **missions** :
  - `userId` : Id<"users">
  - `type` : string (ex: "login_3_days", "view_10_projects", etc.)
  - `category` : "discovery" | "habit" | "contribution" | "engagement"
  - `title` : string
  - `description` : string
  - `target` : number (objectif à atteindre)
  - `progress` : number (progression actuelle)
  - `completed` : boolean
  - `completedAt` : number (timestamp, optionnel)
  - `expiresAt` : number (timestamp, optionnel)
  - `createdAt` : number

- [ ] **reactions** :
  - `userId` : Id<"users">
  - `targetType` : "article" | "project" | "action"
  - `targetId` : Id<"articles"> | Id<"projects"> | Id<"actions">
  - `type` : "like" | "love" | "useful"
  - `createdAt` : number

- [ ] **comments** :
  - `userId` : Id<"users">
  - `targetType` : "article" | "project" | "action"
  - `targetId` : Id<"articles"> | Id<"projects"> | Id<"actions">
  - `content` : string
  - `parentId` : Id<"comments"> (optionnel, pour réponses)
  - `usefulCount` : number
  - `createdAt` : number
  - `updatedAt` : number

- [ ] **views** :
  - `userId` : Id<"users"> (optionnel, pour vues anonymes)
  - `targetType` : "article" | "project" | "action" | "profile"
  - `targetId` : string (Id ou userId pour profil)
  - `viewerLocation` : object { lat, lng, region } (optionnel)
  - `createdAt` : number

- [ ] **favorites** :
  - `userId` : Id<"users">
  - `targetType` : "article" | "project" | "action"
  - `targetId` : Id<"articles"> | Id<"projects"> | Id<"actions">
  - `createdAt` : number

- [ ] **follows** :
  - `userId` : Id<"users">
  - `targetType` : "user" | "organization" | "tag"
  - `targetId` : string (Id ou tag name)
  - `createdAt` : number

**Indexes à créer** :
- `articles` : `authorId`, `publishedAt`, `featured`, `tags`, `slug`
- `projects` : `authorId`, `orgId`, `location`, `tags`, `featured`, `slug`
- `organizations` : `slug`, `location`, `verified`
- `actions` : `authorId`, `status`, `deadline`, `location`, `featured`, `slug`
- `missions` : `userId`, `completed`, `category`
- `reactions` : `targetType+targetId`, `userId`
- `comments` : `targetType+targetId`, `userId`, `parentId`
- `views` : `targetType+targetId`, `userId`, `createdAt`
- `favorites` : `userId`, `targetType+targetId`
- `follows` : `userId`, `targetType+targetId`

**Livrables** : Schéma Convex complet avec types TypeScript générés

---

### 1.2 Fonctions Convex - Utilisateurs & Profils
**Fichier** : `convex/users.ts`

**Queries** :
- [ ] `getCurrentUser` - Récupère l'utilisateur connecté avec toutes ses données
- [ ] `getUserProfile` - Récupère un profil utilisateur public
- [ ] `getUserStats` - Statistiques d'activité (vues profil, vues articles, etc.)
- [ ] `getUserMissions` - Liste des missions de l'utilisateur
- [ ] `getUserReach` - Calcule le rayon d'audience selon le niveau

**Mutations** :
- [ ] `updateProfile` - Met à jour bio, location, tags, links
- [ ] `updateRegion` - Change la région sélectionnée
- [ ] `calculateProfileCompletion` - Recalcule le % de complétion du profil
- [ ] `upgradeLevel` - Monte de niveau (si conditions remplies)

**Livrables** : Module utilisateurs fonctionnel

---

### 1.3 Fonctions Convex - Missions & Niveaux
**Fichier** : `convex/missions.ts`

**Queries** :
- [ ] `getMissionsForUser` - Liste toutes les missions avec progression
- [ ] `getLevelInfo` - Informations sur le niveau actuel et suivant

**Mutations** :
- [ ] `initializeMissions` - Crée les missions initiales pour un nouvel utilisateur
- [ ] `updateMissionProgress` - Met à jour la progression d'une mission
- [ ] `completeMission` - Marque une mission comme complétée
- [ ] `checkLevelUp` - Vérifie et applique la montée de niveau

**Actions** :
- [ ] `trackLogin` - Enregistre une connexion (pour missions "se connecter X jours")
- [ ] `trackView` - Enregistre une vue (projet, article, profil)
- [ ] `trackComment` - Enregistre un commentaire utile
- [ ] `trackReaction` - Enregistre une réaction

**Livrables** : Système de missions et niveaux fonctionnel

---

### 1.4 Fonctions Convex - Contenu (Articles, Projets, Actions)
**Fichier** : `convex/content.ts`

**Queries** :
- [ ] `getFeaturedContent` - Contenu en vedette pour le carrousel
- [ ] `getLatestArticles` - Derniers articles publiés (avec pagination)
- [ ] `getLatestProjects` - Derniers projets (avec pagination)
- [ ] `getLatestActions` - Dernières actions actives
- [ ] `getArticleBySlug` - Article complet par slug
- [ ] `getProjectBySlug` - Projet complet par slug
- [ ] `getActionBySlug` - Action complète par slug
- [ ] `getContentInRadius` - Contenu dans le rayon d'audience d'un utilisateur
- [ ] `searchContent` - Recherche globale (articles, projets, actions)

**Mutations** :
- [ ] `createArticle` - Crée un nouvel article (status: "draft" ou "pending")
- [ ] `updateArticle` - Met à jour un article
- [ ] `publishArticle` - Publie un article (modération si première publication)
- [ ] `createProject` - Crée un nouveau projet
- [ ] `updateProject` - Met à jour un projet
- [ ] `createAction` - Crée une nouvelle action
- [ ] `updateAction` - Met à jour une action
- [ ] `incrementViews` - Incrémente les vues d'un contenu
- [ ] `addReaction` - Ajoute/retire une réaction
- [ ] `addComment` - Ajoute un commentaire
- [ ] `toggleFavorite` - Ajoute/retire des favoris

**Livrables** : CRUD complet pour tous les types de contenu

---

## 🎨 Phase 2 : Layout & Navigation (Priorité 1)

### 2.1 Header Global
**Fichier** : `src/components/layout/Header.tsx`

**Composants** :
- [ ] Logo Seed (texte + icône optionnelle)
- [ ] Navigation principale : "Accueil", "Community"
- [ ] Barre de recherche omnibox
- [ ] Badge niveau avec tooltip
- [ ] Sélecteur de région (dropdown)
- [ ] Sélecteur de langue (FR/EN)
- [ ] Toggle dark/light mode
- [ ] Notifications (badge avec compteur)
- [ ] Menu utilisateur (dropdown avec profil, paramètres, déconnexion)

**Fonctionnalités** :
- [ ] Header fixe en haut
- [ ] Responsive (mobile : menu hamburger)
- [ ] Glassmorphism sur l'item actif de navigation

**Livrables** : Header fonctionnel et responsive

---

### 2.2 Sidebar Navigation
**Fichier** : `src/components/layout/Sidebar.tsx`

**Sections** :
- [ ] **Actions rapides** :
  - Bouton "Création rapide" (plus icon)
  - Item "Accueil" (actif avec glassmorphism)
- [ ] **Explorer** :
  - Articles
  - Carte
  - Projets
  - Organisations
  - Actions
  - Jobs
- [ ] **Membre Premium** (conditionnel si premium) :
  - Campagnes
  - Statistiques
  - Badges
- [ ] **Compte** :
  - Paramètres
  - Aide
- [ ] **Footer sidebar** :
  - Carte utilisateur condensée (photo, nom, email)

**Fonctionnalités** :
- [ ] Sidebar fixe à gauche (desktop)
- [ ] Drawer mobile (fermable)
- [ ] Glassmorphism sur l'item actif
- [ ] Indicateurs visuels (badges, notifications)

**Livrables** : Sidebar fonctionnelle et responsive

---

### 2.3 Layout Principal
**Fichier** : `src/components/layout/MainLayout.tsx`

**Structure** :
- [ ] Container principal avec Header + Sidebar + Content
- [ ] Grille responsive :
  - Desktop : Sidebar (250px) + Content (flex) + Right Column (300px optionnel)
  - Tablet : Sidebar drawer + Content full width
  - Mobile : Sidebar drawer + Content full width
- [ ] Gestion des marges et espacements (8, 12, 16, 24, 32, 48px)

**Livrables** : Layout principal fonctionnel

---

## 🏠 Phase 3 : Page d'Accueil (Priorité 1)

### 3.1 Hero Section
**Fichier** : `src/app/(auth)/accueil/page.tsx`

**Composants** :
- [ ] **Greeting** : "Bonjour {Prénom}"
- [ ] **Subtitle** : "Voici ce qui se passe dans ton rayon et sur tes sujets"
- [ ] **Carrousel Featured** :
  - Auto-rotate (~6s)
  - Pause au survol
  - Navigation par flèches
  - Pagination par points
  - Swipe mobile
  - Carte avec image, tags, location, métriques, titre, description, CTA

**Fichier** : `src/components/home/FeaturedCarousel.tsx`

**Livrables** : Hero section avec carrousel fonctionnel

---

### 3.2 Colonne Droite - Widgets
**Fichier** : `src/components/home/RightColumn.tsx`

**Widgets** :
- [ ] **Portée actuelle** :
  - Carte de France (SVG ou image)
  - Région colorée selon sélection utilisateur
  - Texte : "Ta voix porte au niveau régional {Région}"
- [ ] **Passer au niveau suivant** :
  - Badge niveau actuel
  - Liste de missions avec checkboxes
  - Barre de progression globale
  - Catégories : "Découverte et habitude"
- [ ] **Mon activité récente** :
  - 4 métriques en grille 2x2 :
    - Vues de votre profil
    - Vues moyennes par article
    - Commentaires moyens par article
    - Réactions moyennes par article
  - Sous-titre : "Calculée sur le dernier mois"

**Fichiers** :
- `src/components/home/CurrentReach.tsx`
- `src/components/home/LevelUp.tsx`
- `src/components/home/RecentActivity.tsx`

**Livrables** : Widgets de la colonne droite fonctionnels

---

### 3.3 Section Derniers Articles
**Fichier** : `src/components/home/LatestArticles.tsx`

**Composants** :
- [ ] Header avec titre et bouton "Découvrir plus d'articles"
- [ ] Grille de 3 cartes articles :
  - Image de couverture
  - Avatar auteur (en haut à gauche)
  - Tags (chips)
  - Titre
  - Description (1-2 lignes)
  - Métriques (personnes, vues) en haut à droite
  - Hover : légère élévation + skeleton lines de résumé

**Fichier** : `src/components/content/ArticleCard.tsx`

**Livrables** : Section articles avec cartes fonctionnelles

---

### 3.4 Section Derniers Projets
**Fichier** : `src/components/home/LatestProjects.tsx`

**Composants** :
- [ ] Header avec titre et bouton "Découvrir plus de projets"
- [ ] Grille de 3 cartes projets :
  - Image principale
  - Logo organisation (optionnel)
  - Tags (chips en bas)
  - Titre
  - Description (1-2 lignes)
  - Métriques (personnes, vues)
  - Hover : légère élévation

**Fichier** : `src/components/content/ProjectCard.tsx`

**Livrables** : Section projets avec cartes fonctionnelles

---

## 📄 Phase 4 : Pages de Contenu (Priorité 2)

### 4.1 Page Article
**Fichier** : `src/app/(auth)/articles/[slug]/page.tsx`

**Composants** :
- [ ] Header article (titre, auteur, date, tags)
- [ ] Image de couverture
- [ ] Contenu markdown (avec syntax highlighting)
- [ ] Sidebar droite :
  - Métriques (vues, réactions, commentaires)
  - Actions (réagir, commenter, partager, favoris)
  - Articles similaires
- [ ] Section commentaires
- [ ] Articles suggérés en bas

**Livrables** : Page article complète

---

### 4.2 Page Projet
**Fichier** : `src/app/(auth)/projets/[slug]/page.tsx`

**Composants** :
- [ ] Header projet (titre, organisation, tags, stage)
- [ ] Galerie d'images
- [ ] Description complète
- [ ] Métriques d'impact
- [ ] Liens externes
- [ ] Localisation (carte)
- [ ] Sidebar droite : métriques, actions, projets similaires

**Livrables** : Page projet complète

---

### 4.3 Page Liste Articles
**Fichier** : `src/app/(auth)/articles/page.tsx`

**Fonctionnalités** :
- [ ] Filtres : tags, date, auteur
- [ ] Tri : récent, en vedette, proches de moi, tendance
- [ ] Pagination (pas de scroll infini)
- [ ] Grille responsive de cartes articles

**Livrables** : Page liste articles avec filtres

---

### 4.4 Page Liste Projets
**Fichier** : `src/app/(auth)/projets/page.tsx`

**Fonctionnalités** :
- [ ] Filtres : tags, région, stage, open source
- [ ] Tri : récent, en vedette, proches de moi
- [ ] Pagination
- [ ] Grille responsive de cartes projets

**Livrables** : Page liste projets avec filtres

---

## 🗺️ Phase 5 : Carte & Géolocalisation (Priorité 2)

### 5.1 Page Carte
**Fichier** : `src/app/(auth)/carte/page.tsx`

**Composants** :
- [ ] Carte interactive (Leaflet ou Mapbox)
- [ ] Filtres : Articles, Projets, Actions
- [ ] Marqueurs sur la carte selon le rayon d'audience
- [ ] Popup au clic sur marqueur
- [ ] Légende et contrôles

**Dépendances** :
- [ ] Installer `react-leaflet` ou `@vis.gl/react-map`
- [ ] Configurer les clés API si nécessaire

**Livrables** : Page carte interactive

---

## ✍️ Phase 6 : Création de Contenu (Priorité 2)

### 6.1 Création Rapide (Modal/Drawer)
**Fichier** : `src/components/creation/QuickCreate.tsx`

**Options** :
- [ ] Créer un article
- [ ] Créer un projet
- [ ] Créer une action

**Livrables** : Modal création rapide

---

### 6.2 Formulaire Article
**Fichier** : `src/app/(auth)/articles/nouveau/page.tsx`

**Champs** :
- [ ] Titre
- [ ] Slug (auto-généré)
- [ ] Résumé
- [ ] Contenu (éditeur markdown)
- [ ] Tags (multi-select avec création)
- [ ] Image de couverture (upload)
- [ ] Publier maintenant ou brouillon

**Validation** :
- [ ] Modération automatique si première publication
- [ ] Validation des champs requis

**Livrables** : Formulaire création article

---

### 6.3 Formulaire Projet
**Fichier** : `src/app/(auth)/projets/nouveau/page.tsx`

**Champs** :
- [ ] Titre, slug, résumé, description
- [ ] Organisation (select ou création)
- [ ] Tags
- [ ] Localisation (géocodage)
- [ ] Images (multi-upload)
- [ ] Liens externes
- [ ] Stage
- [ ] Métriques d'impact
- [ ] Open source (checkbox)

**Livrables** : Formulaire création projet

---

## 🎮 Phase 7 : Système de Missions & Niveaux (Priorité 2)

### 7.1 Page Missions
**Fichier** : `src/app/(auth)/missions/page.tsx`

**Composants** :
- [ ] Vue d'ensemble du niveau actuel
- [ ] Liste des missions par catégorie
- [ ] Barres de progression
- [ ] Récompenses débloquées
- [ ] Historique des missions complétées

**Livrables** : Page missions complète

---

### 7.2 Logique de Calcul du Rayon
**Fichier** : `convex/utils/reach.ts`

**Fonction** :
- [ ] Calcul du rayon selon niveau :
  - Niveau 1 : 10km
  - Niveau 2 : 25km
  - Niveau 3 : 50km (régional)
  - Niveau 4 : 100km
  - Niveau 5+ : 200km+ (national/international)
- [ ] Filtrage du contenu dans le rayon
- [ ] Priorisation avec boosts Premium

**Livrables** : Système de rayon fonctionnel

---

## 💎 Phase 8 : Premium & Boosts (Priorité 3)

### 8.1 Gestion Premium
**Fichier** : `convex/premium.ts`

**Fonctionnalités** :
- [ ] Attribution des crédits mensuels selon tier
- [ ] Utilisation des boosts
- [ ] Analytics de base (Starter)
- [ ] Analytics avancés (Pro/Impact)

**Livrables** : Système Premium fonctionnel

---

## 🔍 Phase 9 : Recherche (Priorité 3)

### 9.1 Recherche Globale
**Fichier** : `src/components/search/SearchBar.tsx`

**Fonctionnalités** :
- [ ] Recherche en temps réel (debounce)
- [ ] Résultats : Articles, Projets, Actions, Organisations
- [ ] Filtres rapides
- [ ] Historique de recherche

**Livrables** : Recherche fonctionnelle

---

## 🌐 Phase 10 : i18n (Priorité 3)

### 10.1 Configuration i18n
**Fichiers** :
- [ ] Installer `next-intl` ou `next-i18next`
- [ ] Créer les fichiers de traduction FR/EN
- [ ] Configurer le routing multilingue

**Livrables** : Support multilingue FR/EN

---

## 🧪 Phase 11 : Tests & Optimisations (Priorité 3)

### 11.1 Tests
- [ ] Tests unitaires (composants critiques)
- [ ] Tests d'intégration (flux utilisateur)
- [ ] Tests E2E (scénarios principaux)

### 11.2 Optimisations
- [ ] Lazy loading images
- [ ] Code splitting
- [ ] Optimisation des requêtes Convex
- [ ] Cache stratégique
- [ ] Performance Lighthouse > 90

**Livrables** : Application optimisée et testée

---

## 📊 Ordre d'Exécution Recommandé

### Sprint 1 (Fondations)
1. Phase 0 : Design System
2. Phase 1 : Schéma Convex (partie 1.1)
3. Phase 2 : Layout & Navigation

### Sprint 2 (Page d'Accueil)
1. Phase 1 : Fonctions Convex (parties 1.2, 1.3, 1.4)
2. Phase 3 : Page d'Accueil complète

### Sprint 3 (Contenu)
1. Phase 4 : Pages de contenu
2. Phase 6 : Création de contenu

### Sprint 4 (Fonctionnalités Avancées)
1. Phase 5 : Carte
2. Phase 7 : Missions & Niveaux
3. Phase 9 : Recherche

### Sprint 5 (Premium & Finalisation)
1. Phase 8 : Premium
2. Phase 10 : i18n
3. Phase 11 : Tests & Optimisations

---

## 📝 Notes Importantes

- **Respecter les maquettes** : Dark et Light mode doivent être fidèles aux images fournies
- **Mobile First** : Tous les composants doivent être responsive dès le départ
- **Accessibilité** : Contraste ≥ 4.5:1, focus visible, `prefers-reduced-motion`
- **Performance** : Temps interactif initial < 2s desktop, < 4s mobile 4G
- **Équité** : Pas de pay-to-win, l'algorithme reste juste même avec Premium

---

## 🛠️ Outils Disponibles

- **MCP Convex** : Accès direct au backend pour queries, mutations, schémas
- **Shadcn UI** : Composants UI accessibles et personnalisables
- **Magic UI** : Composants animés pour effets visuels
- **Next DevTools** : Debugging et optimisation

---

**Dernière mise à jour** : [Date]
**Version** : 1.0.0

