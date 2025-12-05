# 🌱 Seed - Plateforme d'information et d'utilité publique

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react)](https://react.dev/)
[![Convex](https://img.shields.io/badge/Convex-Realtime-orange?style=flat&logo=convex)](https://convex.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-green.svg)](https://www.gnu.org/licenses/agpl-3.0.html)
[![Status: Open Source](https://img.shields.io/badge/Status-Open%20Source-brightgreen)](https://github.com/seedmedia)

> **Seed est plus qu'un média de la résilience technologique, c'est une plateforme d'information et d'utilité publique où la communauté publie, organise, vérifie et fait évoluer les contenus grâce à une gouvernance partagée.**
>
> **Pas d'algos opaques, pas de ligne éditoriale imposée.**

---

## 📖 Table des matières

- [À propos de Seed](#-à-propos-de-seed)
- [Vision et Mission](#-vision-et-mission)
- [Structure organisationnelle](#-structure-organisationnelle)
- [Fonctionnalités principales](#-fonctionnalités-principales)
- [Architecture technique](#-architecture-technique)
- [Installation et développement](#-installation-et-développement)
- [Gouvernance](#-gouvernance)
- [Contribution](#-contribution)
- [Licence](#-licence)
- [Support et contact](#-support-et-contact)

---

## 🎯 À propos de Seed

Seed est une plateforme open source d'information collaborative qui permet à une communauté de créer, organiser, vérifier et faire évoluer des contenus de manière transparente et démocratique. Contrairement aux médias traditionnels ou aux réseaux sociaux algorithmiques, Seed fonctionne selon des principes de **gouvernance partagée** et de **transparence totale**.

### Principes fondamentaux

- 🌐 **Open Source** : Le code source est librement accessible et modifiable
- 🏛️ **Gouvernance démocratique** : Les décisions sont prises collectivement par la communauté
- 🔍 **Transparence** : Pas d'algorithmes opaques, toutes les règles sont visibles et modifiables
- 🤝 **Collaboration** : Chaque membre peut contribuer, proposer des améliorations et participer aux débats
- 📊 **Vérification** : Système de crédibilité et de sources pour garantir la qualité de l'information
- 🎯 **Utilité publique** : Objectif non lucratif, au service de l'intérêt général

---

## 🌟 Vision et Mission

### Vision

Créer un écosystème d'information durable, transparent et collaboratif où chaque voix compte et où la qualité prime sur la viralité.

### Mission

**Seed est une plateforme d'information et d'utilité publique où la communauté publie, organise, vérifie et fait évoluer les contenus grâce à une gouvernance partagée.**

Nous croyons que l'information doit être :
- **Accessible** : Gratuite et ouverte à tous
- **Vérifiable** : Chaque affirmation peut être sourcée et contestée
- **Évolutive** : Les contenus s'améliorent grâce à la contribution collective
- **Transparente** : Aucun algorithme secret, toutes les règles sont publiques
- **Démocratique** : La gouvernance appartient à la communauté

---

## 🏢 Structure organisationnelle

Seed est géré par une **association loi 1901 française à but non lucratif**. Cette structure garantit :

- ✅ **Indépendance** : Aucun intérêt commercial ou politique
- ✅ **Transparence** : Comptes publics et décisions démocratiques
- ✅ **Durabilité** : Structure pérenne au service de la mission
- ✅ **Légitimité** : Cadre juridique reconnu en France

### Statuts de l'association

L'association Seed est régie par la loi du 1er juillet 1901 et le décret du 16 août 1901. Elle a pour objet :

1. Le développement et la maintenance de la plateforme Seed
2. La promotion de l'information libre et vérifiable
3. L'animation de la communauté de contributeurs
4. La défense des valeurs de transparence et de démocratie dans l'information

---

## 🚀 Fonctionnalités principales

### 📝 Articles

- **Rédaction collaborative** : Éditeur riche avec support Markdown et formatage avancé
- **Système de sources** : Chaque affirmation peut être sourcée et vérifiée
- **Catégorisation** : Organisation par catégories et tags
- **Scores de qualité** : Évaluation automatique basée sur les sources et la structure
- **Commentaires et débats** : Discussion autour de chaque article

### 🗳️ Gouvernance

- **Propositions** : La communauté peut proposer des modifications aux règles
- **Votes** : Système de vote transparent pour valider les propositions
- **Règles configurables** : Toutes les règles de la plateforme sont modifiables par vote
- **Évolutions** : Historique complet des changements de gouvernance
- **Transparence totale** : Tous les votes et décisions sont publics

### 💬 Débats

- **Arguments pour et contre** : Structure claire pour les débats
- **Scoring de polarisation** : Mesure de la qualité du débat
- **Sources obligatoires** : Chaque argument doit être sourcé
- **Modération communautaire** : La communauté modère elle-même

### 🎯 Actions

- **Pétitions** : Création et signature de pétitions
- **Contributions** : Appels à contribution pour améliorer les contenus
- **Événements** : Organisation d'événements communautaires
- **Suivi des participants** : Transparence sur l'engagement

### 🏗️ Projets

- **Gestion de projets** : Suivi des projets de la communauté
- **Stages de développement** : Idée → Prototype → Bêta → Production
- **Open Source** : Lien avec les projets open source
- **Collaboration** : Système de contribution aux projets

### 👥 Organisations

- **Profils d'organisations** : Associations, entreprises, collectifs
- **Découverte** : Recherche et filtrage avancé
- **Engagement** : Suivi des actions et contributions

### ⭐ Système de crédibilité

- **Points de crédibilité** : Récompense pour les contributions de qualité
- **Niveaux** : Progression basée sur l'engagement et la qualité
- **Badges** : Reconnaissance des contributions exceptionnelles
- **Transparence** : Tous les scores sont publics et justifiés

---

## 🏗️ Architecture technique

### Stack technologique

- **Frontend** : Next.js 16 (App Router), React 19, TypeScript
- **Backend** : Convex (base de données temps réel)
- **Authentification** : Better Auth
- **Styling** : Tailwind CSS v4, shadcn/ui
- **Éditeur** : Plate.js (éditeur riche)
- **Internationalisation** : next-intl
- **Déploiement** : Vercel (frontend), Convex Cloud (backend)

### Structure du projet

```
seedmedia/
├── src/
│   ├── app/                    # Pages Next.js (App Router)
│   │   ├── (public)/          # Pages publiques
│   │   ├── (auth)/            # Pages authentifiées
│   │   └── api/               # API routes
│   ├── components/            # Composants React réutilisables
│   ├── lib/                   # Utilitaires et configurations
│   └── hooks/                 # Hooks React personnalisés
├── convex/                    # Backend Convex
│   ├── schema.ts             # Schéma de base de données
│   ├── articles.ts           # Logique métier articles
│   ├── governance.ts         # Logique métier gouvernance
│   └── ...
├── public/                    # Assets statiques
└── messages/                  # Fichiers de traduction
```

### Principes d'architecture

- **Type Safety** : TypeScript partout pour la sécurité des types
- **Composants réutilisables** : Architecture modulaire et DRY
- **Séparation des responsabilités** : Logique métier dans Convex, UI dans React
- **Performance** : Optimisations Next.js (SSR, ISR, streaming)
- **Accessibilité** : Composants accessibles avec Radix UI
- **Sécurité** : Validation des données, authentification robuste

---

## 💻 Installation et développement

### Prérequis

- [Node.js](https://nodejs.org/) (v18 ou supérieur)
- [pnpm](https://pnpm.io/) (recommandé) ou npm/yarn
- [Convex CLI](https://docs.convex.dev/get-started/quickstart)
- Compte [Convex](https://convex.dev) (gratuit)

### Installation

1. **Cloner le dépôt**

```bash
git clone https://github.com/seedmedia/seed.git
cd seed
```

2. **Installer les dépendances**

```bash
pnpm install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env.local` :

```bash
# Convex
CONVEX_DEPLOYMENT=automatic
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Site
SITE_URL=http://localhost:3000

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here

# OAuth (optionnel)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

4. **Initialiser Convex**

```bash
pnpm convex dev
```

Suivez les instructions pour créer un projet Convex.

5. **Configurer les variables Convex**

```bash
pnpm convex env set SITE_URL http://localhost:3000
pnpm convex env set BETTER_AUTH_SECRET your-secret-key-here
```

6. **Lancer le serveur de développement**

```bash
pnpm dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Scripts disponibles

- `pnpm dev` : Lance le serveur de développement (Next.js + Convex)
- `pnpm build` : Build de production
- `pnpm start` : Lance le serveur de production
- `pnpm convex dev` : Lance uniquement le serveur Convex
- `pnpm convex deploy` : Déploie le backend sur Convex Cloud
- `pnpm lint` : Vérifie le code avec ESLint
- `pnpm type-check` : Vérifie les types TypeScript

### Documentation technique

Pour plus de détails sur l'architecture et le développement, consultez :

- [CLAUDE.md](CLAUDE.md) : Documentation pour assistants IA
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) : Guide de déploiement
- [README_ADMIN.md](README_ADMIN.md) : Documentation administrateur

---

## 🗳️ Gouvernance

Seed fonctionne selon un modèle de **gouvernance partagée** où toutes les règles sont :

1. **Publiques** : Accessibles à tous
2. **Modifiables** : Proposables par la communauté
3. **Votées** : Validées démocratiquement
4. **Traçables** : Historique complet des changements

### Types de propositions

- **Règles éditoriales** : Modifier les règles de publication
- **Évolutions produit** : Proposer de nouvelles fonctionnalités
- **Règles configurables** : Modifier les paramètres de la plateforme
- **Autres** : Propositions libres

### Processus de vote

1. **Proposition** : Un membre crée une proposition
2. **Discussion** : La communauté débat
3. **Vote** : Vote ouvert à tous les membres actifs
4. **Application** : Si approuvée, la proposition est appliquée automatiquement

### Transparence

- Tous les votes sont publics
- Tous les résultats sont traçables
- Aucune décision n'est prise en secret
- La communauté peut contester toute décision

---

## 🤝 Contribution

Seed est un projet open source et nous accueillons toutes les contributions !

### Comment contribuer

1. **Fork** le dépôt
2. **Créez une branche** pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. **Commitez** vos changements (`git commit -m 'Add amazing feature'`)
4. **Pushez** vers la branche (`git push origin feature/amazing-feature`)
5. **Ouvrez une Pull Request**

### Types de contributions

- 🐛 **Rapports de bugs** : Signalez les problèmes
- 💡 **Suggestions** : Proposez de nouvelles fonctionnalités
- 📝 **Documentation** : Améliorez la documentation
- 🎨 **Design** : Améliorez l'interface utilisateur
- 🔧 **Code** : Ajoutez des fonctionnalités ou corrigez des bugs
- 🌍 **Traduction** : Aidez à traduire la plateforme

### Standards de code

- Respectez les conventions TypeScript
- Suivez les règles ESLint
- Écrivez des tests quand c'est possible
- Documentez votre code
- Respectez les principes de design de Seed

### Code de conduite

Seed suit un code de conduite basé sur le respect, la bienveillance et la collaboration. Tous les contributeurs doivent :

- Être respectueux et inclusifs
- Accepter les critiques constructives
- Collaborer de manière transparente
- Respecter les décisions de la communauté

---

## 📄 Licence

Seed est distribué sous la **GNU Affero General Public License v3.0 (AGPL-3.0)**.

### Pourquoi l'AGPL-3.0 ?

L'AGPL-3.0 est la licence la plus appropriée pour Seed car elle :

✅ **Garantit la liberté** : Le code source reste libre et accessible  
✅ **Empêche la privatisation** : Interdit l'utilisation commerciale sans partager le code  
✅ **Protège contre la copie malveillante** : Toute modification doit être partagée  
✅ **Assure la transparence** : Même les services en ligne doivent partager leur code  
✅ **Respecte les valeurs** : Alignée avec la mission non lucrative de Seed  

### Ce que vous pouvez faire

- ✅ Utiliser Seed pour votre propre plateforme
- ✅ Modifier le code source
- ✅ Distribuer des copies
- ✅ Utiliser commercialement (si vous partagez vos modifications)

### Ce que vous devez faire

- ✅ Conserver la notice de copyright
- ✅ Inclure la licence AGPL-3.0
- ✅ Partager vos modifications (même pour les services en ligne)
- ✅ Documenter vos changements

### Ce que vous ne pouvez pas faire

- ❌ Utiliser Seed sans partager vos modifications
- ❌ Créer une copie fermée ou propriétaire
- ❌ Retirer la licence ou le copyright
- ❌ Utiliser le nom "Seed" pour un service concurrent sans autorisation

### Exceptions

Pour des cas spécifiques (intégrations, partenariats), contactez l'association Seed pour discuter d'une licence alternative.

**Pour plus de détails, consultez le fichier [LICENSE](LICENSE)**

---

## 🆘 Support et contact

### Ressources

- 📚 **Documentation** : [docs.seed.media](https://docs.seed.media) (à venir)
- 💬 **Discussions** : [GitHub Discussions](https://github.com/seedmedia/seed/discussions)
- 🐛 **Rapports de bugs** : [GitHub Issues](https://github.com/seedmedia/seed/issues)
- 📧 **Email** : contact@seed.media

### Communauté

- 🌐 **Site web** : [seed.media](https://seed.media)
- 🐙 **GitHub** : [@seedmedia](https://github.com/seedmedia)
- 💼 **LinkedIn** : [Seed Media](https://linkedin.com/company/seed-media)

### Association Seed

Pour toute question concernant l'association, la gouvernance ou les partenariats :

- 📧 **Email** : association@seed.media
- 📍 **Adresse** : (à venir)

---

## 🙏 Remerciements

Seed existe grâce à la communauté de contributeurs, bénévoles et utilisateurs qui croient en une information libre, transparente et démocratique.

**Merci de faire partie de cette aventure ! 🌱**

---

<div align="center">

**Fait avec ❤️ par la communauté Seed**

[🌐 Site web](https://seed.media) • [📖 Documentation](https://docs.seed.media) • [🐙 GitHub](https://github.com/seedmedia) • [📄 Licence](LICENSE)

</div>


git add .
git commit -m "maj 2.0 alfa prod"
git push -u origin main