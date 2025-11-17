# Système d'Articles avec Vérification

## Vue d'ensemble

Le système d'articles de Seed est conçu pour encourager la production de contenu qualitatif et vérifié, tout en restant ouvert à différents types de contenus (scientifiques, experts, opinions, etc.).

## Architecture

### 1. Schéma de base (`convex/schema.ts`)

#### Table `articles`
- **Champs de base** : title, slug, summary, content, authorId, tags, coverImage
- **Système de qualité** :
  - `qualityScore` (0-100) : Score calculé automatiquement
  - `verifiedClaimsCount` : Nombre de claims vérifiés
  - `totalClaimsCount` : Nombre total de claims
  - `expertReviewCount` : Nombre de vérifications par experts
  - `communityVerificationScore` (0-100) : Score de vérification communautaire
- **Type d'article** : scientific, expert, opinion, news, tutorial, other
- **Statut** : draft, pending, published, rejected

#### Table `articleClaims`
Représente les affirmations/claims dans un article qui peuvent être vérifiés.
- `articleId` : Référence à l'article
- `claimText` : Le texte de l'affirmation
- `verificationStatus` : unverified, verified, disputed, false
- `verificationScore` (0-100) : Score de vérification
- `sourcesCount` : Nombre de sources associées
- `expertVerificationsCount` : Nombre de vérifications par experts

#### Table `claimSources`
Sources pour justifier les claims.
- `claimId` : Référence au claim
- `sourceType` : scientific_paper, expert_statement, official_data, news_article, website, other
- `title`, `url`, `author`, `publicationDate`
- `reliabilityScore` (0-100) : Score de fiabilité de la source
- `addedBy` : Utilisateur qui a ajouté la source

#### Table `claimVerifications`
Vérifications par la communauté ou des experts.
- `claimId` : Référence au claim
- `verifierId` : Utilisateur qui vérifie
- `isExpert` : Vérification par un expert (poids 3x)
- `verificationResult` : verified, disputed, false
- `comment` : Commentaire de vérification

## Algorithme de Calcul de Qualité

### Score de qualité (0-100)

Le score est calculé selon plusieurs critères :

1. **Ratio de vérification** (0-40 points)
   - Basé sur le pourcentage de claims vérifiés
   - `(verifiedClaimsCount / totalClaimsCount) * 40`

2. **Bonus vérifications expertes** (0-30 points)
   - `expertReviewCount * 5` (max 30)

3. **Score communautaire** (0-20 points)
   - Basé sur les vérifications de la communauté
   - `(communityVerificationScore / 100) * 20`

4. **Bonus type d'article** (0-10 points)
   - scientific: 10
   - expert: 7
   - tutorial: 5
   - news: 3
   - opinion: 2
   - other: 1

### Score de vérification communautaire

Calculé à partir de toutes les vérifications de tous les claims d'un article :
- Les vérifications d'experts ont un poids 3x supérieur
- Score basé sur le ratio de vérifications positives vs négatives
- Pénalité pour les vérifications "false"

### Statut d'un claim

Le statut d'un claim est déterminé par :
1. **Si des experts ont vérifié** : Leur avis prime (poids 3x)
2. **Sinon** : Majorité communautaire
3. **Statuts possibles** :
   - `verified` : Vérifié comme vrai
   - `disputed` : Contesté
   - `false` : Vérifié comme faux
   - `unverified` : Non vérifié

## Impact sur la Visibilité

Les articles sont triés par défaut par **qualité** dans les listes :
- Les articles avec un score de qualité élevé apparaissent en premier
- Les articles avec des claims non vérifiés ou contestés sont moins visibles
- Les articles scientifiques et d'experts sont favorisés

## Fonctions Convex (`convex/articles.ts`)

### Queries
- `getArticles` : Récupère les articles avec tri par qualité/recent/popular/verified
- `getArticleBySlug` : Récupère un article complet avec ses claims
- `getArticleClaims` : Récupère les claims d'un article avec sources et vérifications

### Mutations
- `createArticle` : Crée un nouvel article
- `updateArticle` : Met à jour un article (recalcule le score)
- `addClaim` : Ajoute un claim à un article
- `addSourceToClaim` : Ajoute une source pour justifier un claim
- `verifyClaim` : Vérifie un claim (communauté ou expert)

## Prochaines Étapes

1. ✅ Schéma étendu avec système de vérification
2. ✅ Fonctions Convex de base
3. ⏳ Interface de création/édition d'articles avec système de claims
4. ⏳ Page de liste d'articles avec tri par qualité
5. ⏳ Page de détail d'article avec affichage des vérifications
6. ⏳ Système de badges pour les experts
7. ⏳ Notifications pour les vérifications

## Encouragement Discret à la Qualité

Le système encourage la qualité de manière discrète :
- Les articles avec des sources fiables et vérifiées sont plus visibles
- Les auteurs qui ajoutent des sources gagnent en crédibilité
- Les experts qui vérifient gagnent en réputation
- Les articles de type "scientific" et "expert" sont favorisés dans le score

