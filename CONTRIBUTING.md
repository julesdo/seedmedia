# 🤝 Guide de Contribution - Seed

Merci de votre intérêt pour contribuer à Seed ! Ce document vous guidera dans le processus de contribution.

## 📋 Table des matières

- [Code de conduite](#code-de-conduite)
- [Comment contribuer](#comment-contribuer)
- [Standards de code](#standards-de-code)
- [Processus de Pull Request](#processus-de-pull-request)
- [Types de contributions](#types-de-contributions)
- [Développement local](#développement-local)

---

## 📜 Code de conduite

En participant à ce projet, vous acceptez de respecter notre code de conduite basé sur :

- **Respect** : Traiter tous les contributeurs avec respect et bienveillance
- **Inclusivité** : Accueillir les personnes de tous horizons
- **Collaboration** : Collaborer de manière transparente et constructive
- **Transparence** : Communiquer ouvertement sur les décisions et changements

---

## 🚀 Comment contribuer

### 1. Fork et Clone

```bash
# Fork le dépôt sur GitHub, puis clonez votre fork
git clone https://github.com/VOTRE-USERNAME/seed.git
cd seed
```

### 2. Configurer le projet

```bash
# Installer les dépendances
pnpm install

# Créer votre fichier .env.local
cp .env.example .env.local
# Éditer .env.local avec vos valeurs

# Initialiser Convex (si nécessaire)
pnpm convex dev
```

### 3. Créer une branche

```bash
# Créer une branche pour votre fonctionnalité/correction
git checkout -b feature/ma-fonctionnalite
# ou
git checkout -b fix/mon-bug
```

### 4. Développer

- Écrivez du code propre et bien documenté
- Respectez les standards de code (voir ci-dessous)
- Testez vos modifications
- Documentez si nécessaire

### 5. Commiter

```bash
# Vérifier les modifications
git status

# Ajouter les fichiers modifiés
git add .

# Créer un commit descriptif
git commit -m "feat: ajouter une nouvelle fonctionnalité"
# ou
git commit -m "fix: corriger un bug dans..."
```

**Convention de commits :**
- `feat:` : Nouvelle fonctionnalité
- `fix:` : Correction de bug
- `docs:` : Documentation
- `style:` : Formatage, pas de changement de code
- `refactor:` : Refactorisation
- `test:` : Tests
- `chore:` : Tâches de maintenance

### 6. Pousser et créer une Pull Request

```bash
# Pousser vers votre fork
git push origin feature/ma-fonctionnalite

# Créer une Pull Request sur GitHub
```

---

## 📐 Standards de code

### TypeScript

- Utilisez TypeScript partout
- Évitez `any` autant que possible
- Définissez des types/interfaces clairs
- Documentez les fonctions complexes avec des commentaires JSDoc

### React/Next.js

- Utilisez des composants fonctionnels avec hooks
- Nommez les composants en PascalCase
- Gardez les composants petits et focalisés
- Utilisez les composants shadcn/ui existants quand c'est possible

### Style

- Suivez les règles ESLint configurées
- Formatage automatique avec Prettier (si configuré)
- Utilisez Tailwind CSS pour le styling
- Respectez le design system existant

### Architecture

- **Frontend** : Logique d'affichage dans les composants React
- **Backend** : Logique métier dans les fonctions Convex
- **Séparation** : Ne mélangez pas la logique métier avec l'UI
- **Réutilisabilité** : Créez des composants réutilisables

### Documentation

- Documentez les fonctions complexes
- Ajoutez des commentaires pour expliquer le "pourquoi", pas le "quoi"
- Mettez à jour la documentation si vous modifiez une API

---

## 🔄 Processus de Pull Request

### Avant de créer une PR

1. **Synchroniser votre fork**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Mettre à jour votre branche**
   ```bash
   git checkout feature/ma-fonctionnalite
   git rebase main
   ```

3. **Vérifier votre code**
   ```bash
   pnpm lint
   # Corriger les erreurs de lint si nécessaire
   ```

### Créer la Pull Request

1. **Description claire**
   - Expliquez ce que fait votre PR
   - Mentionnez les issues liées (ex: `Fixes #123`)
   - Ajoutez des captures d'écran si UI

2. **Remplir le template**
   - Description de la modification
   - Tests effectués
   - Checklist complétée

3. **Attendre la revue**
   - Répondez aux commentaires
   - Effectuez les modifications demandées
   - Restez ouvert aux suggestions

### Processus de revue

- **Mainteneurs** : Examineront votre PR
- **Feedback** : Soyez ouvert aux critiques constructives
- **Modifications** : Effectuez les changements demandés
- **Approbation** : Une fois approuvé, la PR sera mergée

---

## 🎯 Types de contributions

### 🐛 Signaler des bugs

Utilisez le template d'issue "Bug report" et incluez :

- Description claire du bug
- Steps pour reproduire
- Comportement attendu vs. réel
- Screenshots si applicable
- Environnement (OS, navigateur, version)

### 💡 Proposer des fonctionnalités

Utilisez le template d'issue "Feature request" et incluez :

- Problème résolu
- Solution proposée
- Alternatives considérées
- Impact sur l'existant

### 📝 Améliorer la documentation

- Corriger les fautes
- Clarifier les explications
- Ajouter des exemples
- Traduire (si vous parlez d'autres langues)

### 🎨 Améliorer l'UI/UX

- Respecter le design system existant
- Tester sur différents écrans
- Vérifier l'accessibilité
- Être cohérent avec le reste de l'app

### 🔧 Améliorer le code

- Refactoriser du code existant
- Optimiser les performances
- Ajouter des tests
- Améliorer la structure

---

## 💻 Développement local

### Prérequis

- Node.js v18+
- pnpm (recommandé) ou npm/yarn
- Convex CLI
- Compte Convex (gratuit)

### Scripts disponibles

```bash
# Développement
pnpm dev              # Lance Next.js + Convex en mode dev
pnpm dev:frontend     # Lance uniquement Next.js
pnpm dev:backend      # Lance uniquement Convex

# Production
pnpm build           # Build de production
pnpm start           # Lance le serveur de production

# Qualité
pnpm lint            # Vérifie le code avec ESLint
pnpm type-check      # Vérifie les types TypeScript
```

### Structure du projet

```
seed/
├── src/
│   ├── app/              # Pages Next.js (App Router)
│   ├── components/       # Composants React
│   ├── lib/             # Utilitaires
│   └── hooks/           # Hooks React
├── convex/              # Backend Convex
│   ├── schema.ts        # Schéma de base de données
│   └── *.ts             # Fonctions backend
└── public/              # Assets statiques
```

---

## ✅ Checklist avant de soumettre

- [ ] Mon code suit les standards du projet
- [ ] J'ai testé mes modifications
- [ ] J'ai mis à jour la documentation si nécessaire
- [ ] Mes commits suivent la convention
- [ ] J'ai vérifié qu'il n'y a pas d'erreurs de lint
- [ ] J'ai synchronisé avec la branche principale
- [ ] Ma PR a une description claire

---

## 📞 Besoin d'aide ?

- 💬 **Discussions** : [GitHub Discussions](https://github.com/seedmedia/seed/discussions)
- 🐛 **Bugs** : [GitHub Issues](https://github.com/seedmedia/seed/issues)
- 📧 **Email** : contact@seed.media

---

**Merci de contribuer à Seed ! 🌱**
