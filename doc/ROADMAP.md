# Roadmap Seed - Vue d'ensemble

> Vue synthétique du plan de développement pour référence rapide

## 🎯 Objectifs

Créer une plateforme **média + directory communautaire** pour technologies résilientes et IA éthique avec :
- Système de **niveaux** et **missions** gamifiées
- **Rayon d'audience** équitable (pas de pay-to-win)
- Plans **Premium** non intrusifs
- Support **dark/light** mode fidèle aux maquettes

## 📦 Stack

- **Frontend** : Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **UI** : Shadcn UI, Magic UI
- **Backend** : Convex (real-time)
- **Auth** : Better Auth
- **i18n** : FR/EN

## 🗓️ Sprints

### Sprint 1 : Fondations (Semaine 1-2)
- ✅ Design System Seed (couleurs, typographie)
- ✅ Composants Shadcn UI de base
- ✅ Schéma Convex complet
- ✅ Layout (Header, Sidebar, MainLayout)

### Sprint 2 : Page d'Accueil (Semaine 3-4)
- ✅ Fonctions Convex (users, missions, content)
- ✅ Hero avec carrousel featured
- ✅ Widgets colonne droite (Portée, Niveau, Activité)
- ✅ Sections Articles & Projets

### Sprint 3 : Contenu (Semaine 5-6)
- ✅ Pages Article & Projet (détail)
- ✅ Pages listes avec filtres
- ✅ Formulaires création (Article, Projet, Action)

### Sprint 4 : Fonctionnalités Avancées (Semaine 7-8)
- ✅ Page Carte interactive
- ✅ Système Missions & Niveaux complet
- ✅ Recherche globale

### Sprint 5 : Premium & Finalisation (Semaine 9-10)
- ✅ Système Premium & Boosts
- ✅ i18n FR/EN
- ✅ Tests & Optimisations

## 📊 Priorités

**Priorité 1** (MVP) :
- Design System
- Schéma & Backend
- Layout & Navigation
- Page d'Accueil

**Priorité 2** (Fonctionnalités Core) :
- Pages de contenu
- Création de contenu
- Carte & Géolocalisation
- Missions & Niveaux

**Priorité 3** (Améliorations) :
- Premium & Boosts
- Recherche avancée
- i18n
- Tests & Optimisations

## 🎨 Design Tokens

### Couleurs Dark
- Background : `#0C1117` → `#0B0E14`
- Surface : `#131A21`
- Card : `#161C24`
- Border : `#1E2630`
- Texte primaire : `#E6EDF3`
- Texte secondaire : `#9FB0C3`

### Couleurs Light
- Background : `#F3F5F7`
- Surface : `#FFFFFF`
- Card : `#FFFFFF` / `#F7F9FB`
- Border : `#E4E9EE`
- Texte primaire : `#0B1320`
- Texte secondaire : `#627184`

### Accent
- Seed Blue : `#005DE7`

### Typographie
- Police : Plus Jakarta Sans
- Poids : 400-500 (texte), 600-700 (titres)
- Échelles : 12, 14, 16, 18, 20, 24, 30px

## 📐 Principes

- **Rayon** : 12-16px sur cartes et boutons
- **Ombres** : Douces, verticales
- **Glassmorphism** : Uniquement sidebar active
- **Espacements** : 8, 12, 16, 24, 32, 48px
- **Hit-areas** : Minimum 44×44px
- **Animations** : 120-180ms, respect `prefers-reduced-motion`

## 🗄️ Tables Convex Principales

- `users` - Profils utilisateurs avec niveau, région, rayon
- `articles` - Contenu éditorial
- `projects` - Fiches projets
- `organizations` - Organisations
- `actions` - Actions collectives
- `missions` - Missions gamifiées
- `reactions`, `comments`, `views`, `favorites`, `follows` - Interactions

## 🚀 Commandes Utiles

```bash
# Développement
pnpm dev

# Build
pnpm build

# Convex
pnpm convex dev
pnpm convex deploy

# Ajouter composant Shadcn
npx shadcn@latest add [component]
```

## 📚 Documentation

- **Plan détaillé** : `doc/PLAN_DEVELOPPEMENT.md`
- **Introduction produit** : `doc/Introduction.md`
- **Maquettes** : `doc/Seed - Accueil.png` (dark) & `doc/Seed - Accueil light.png` (light)

---

**Status** : 🟡 En cours de développement  
**Version** : 0.1.0

