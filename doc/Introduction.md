# Seed by Laiyr — README produit & design
> Référentiel design, UX et produit pour l’implémentation dans Cursor.  
> Objectif : fournir le contexte visuel et fonctionnel sans contraindre la structure du code.  
> Remarque : l’agent code a accès à la doc Convex via le MCP server, inutile de dupliquer ici.

---

## 1) TL;DR

Seed est un **média + directory communautaire** dédié aux technologies résilientes et à l’IA éthique.  
La plateforme combine : contenus éditoriaux, fiches projets, actions collectives, missions gamifiées, système de **rayon d’audience** équitable, et plans Premium non intrusifs.

Les maquettes de référence sont fournies en **dark** et **light**. Le dark est notre mode héro pour l’effet “wow”, le light notre mode “lecture”.

---

## 2) Principes de design

### 2.1 Modes visuels
- **Dark** : fond profond bleu-noir, cartes anthracite, contrastes doux, halos très légers.  
- **Light** : fond gris très clair, cartes blanches/gris clair, ombres + douces, même hiérarchie que le dark.

**Invariants entre modes**
- Même rythmes, mêmes espacements, mêmes rayons.
- Les accents et badges conservent une saturation modérée pour éviter l’agressivité.

### 2.2 Couleurs (référence visuelle)
- **Accent** : bleu "Seed" `#005DE7` utilisé pour états positifs, focus, badges niveau.  
- **Dark**
  - Background `#0C1117` à `#0B0E14`
  - Surface `#131A21`
  - Card `#161C24`
  - Border `#1E2630`
  - Texte primaire `#E6EDF3`
  - Texte secondaire `#9FB0C3`
- **Light**
  - Background `#F3F5F7`
  - Surface `#FFFFFF`
  - Card `#FFFFFF` ou `#F7F9FB`
  - Border `#E4E9EE`
  - Texte primaire `#0B1320`
  - Texte secondaire `#627184`

> Ces valeurs guident le rendu ; ajustez les tokens dans votre thème Tailwind/Shadcn pour coller à l’aperçu.

### 2.3 Typographie
- **Sans serif moderne** : Plus Jakarta Sans, titres 600–700, texte 400–500.
- Échelles lisibles mobile first : 12 · 14 · 16 · 18 · 20 · 24 · 30.

### 2.4 Forme & composants
- **Rayon** : ~12–16 px sur cartes et boutons.
- **Ombres** : douces, direction verticale, jamais “écrasées”.
- **Verre** : **seulement** sur l’item actif de la sidebar et les bulles d’indication légères.
- **Skeletons** : lignes grises pour remplacer les textes dans les aperçus (style mockups fournis).

### 2.5 Densité & rythme
- **Grille** : layout 12 colonnes desktop, 4 colonnes tablette, 1–2 colonnes mobile.
- **Espacements** : 8 · 12 · 16 · 24 · 32 · 48 selon les sections.
- **Hit-areas** minimum 44×44.

### 2.6 Accessibilité & motion
- Contraste texte ≥ 4.5:1.
- Focus visible sur tous les éléments interactifs.
- Animations 120–180 ms, **no parallax massif**. Respect de `prefers-reduced-motion`.

---

## 3) Architecture UX d’après les maquettes

### 3.1 Layout global
- **Header top** fixe : fil d’Ariane, recherche, niveau utilisateur, sélecteur de région, langue, menu utilisateur.
- **Sidebar** gauche :  
  - Actions rapides : **Création rapide**  
  - Accueil  
  - Explorer : Articles, Carte, Projets, Organisations, Actions, Jobs  
  - Membre Premium : Campagnes, Statistiques, Badges  
  - Compte : Paramètres, Aide  
  - Footer : carte utilisateur condensée
- **Contenu central** : sections en cartes, marges latérales régulières.
- **Colonne droite** sur desktop : widgets contextuels.

### 3.2 Page Accueil
1. **Hero “Bonjour {Prénom}”**  
   - Carrousel média “En vedette” avec tags chips ; CTA “Découvrir le projet”.  
   - Sous le carrousel : **pagination discrète** par points.
2. **Panneau latéral droit**  
   - **Portée actuelle** : carte de France avec région colorée + mini résumé.  
   - **Niveau actuel** : liste de missions avec cases à cocher et progression.  
   - **Mon activité récente** : vues de profil, vues d’articles, commentaires, partages.
3. **Derniers articles**  
   - 3 cartes mini-covers, auteur en haut à gauche, stats en haut à droite, skeleton lines au survol.  
   - Bouton “Découvrir plus d’articles”.
4. **Derniers projets**  
   - 3 cartes projet avec tags en bas, mini-statistiques, bouton “Découvrir plus de projets”.

### 3.3 Détails carte
- **Badges** : niveau, statut vérifié, tags thématiques.  
- **Meta** : vues, réactions, commentaires sous forme de **chips grisés**.  
- **CTA** : à droite, bleu ou accent selon mode, contraste fort.

---

## 4) Produit : concepts clés

### 4.1 Système de **Niveaux** et **Missions**
- Missions courtes, vérifiables, centrées sur la **contribution utile** :
  - se connecter 3 jours distincts cette semaine  
  - consulter 10 projets dans ton rayon  
  - écrire 5 commentaires jugés “utiles”  
  - publier 1 article validé  
  - atteindre 300 réactions cumulées
- Le **Niveau** débloque : agrandissement du **rayon d’audience**, crédits de boost, badges de crédibilité.

### 4.2 **Rayon d’audience** équitable
- L’audience d’un post se diffuse en priorité **dans le rayon** de l’auteur.  
- Le rayon s’agrandit **avec le niveau**, pas avec l’argent.  
- Les Boosts Premium améliorent **le placement temporel** et la **priorité dans le rayon**, sans bypasser l’équité.

### 4.3 Plans Premium orientés créateurs et organisations
- **Starter** : crédits de boost mensuels, analytics de base, lien externe sur profil.  
- **Pro** : plus de crédits, mise en avant prioritaire dans le rayon, page “organisation” enrichie.  
- **Impact** : multi-membres, campagnes thématiques, statistiques comparatives, accompagnement éditorial léger.
- Toujours **no pay-to-win** : pas d’accès global illimité, l’algorithme reste juste.

### 4.4 Types de contenu
- **Articles** : éditoriaux, retours d’expérience, analyses.  
- **Projets** : fiches structurées, tags, liens, métriques d’impact.  
- **Actions** : pétitions, appels à contribution, événements.

### 4.5 Carte & Région
- Sélecteur de **région** dans le header.  
- Widget “Portée actuelle” affiche la zone d’influence et un court état.  
- La carte principale (page Carte) permet de filtrer Articles, Projets, Actions **dans un périmètre**.

---

## 5) Comportements d’interface

- **Carrousel Featured** : auto-rotate ~6 s, pause au survol, swipe mobile, pagination points.  
- **Listes** : tri “récent”, “en vedette”, “proches de moi”, “tendance”.  
- **Cartes** : hover élève légèrement la carte, affiche 1–2 lignes skeleton de résumé.  
- **Missions** : cases interactives avec barre de progression et micro-feedback.  
- **Niveau** : badge dans le header, tooltip décrivant le prochain palier et la récompense.  
- **Modales** : bord arrondi, header simple, primary CTA à droite.

---

## 6) Contenu & tonalité

- **Ton** : clair, non-corporate, militant positif.  
- **Longueurs** : titres courts, chapeaux 1–2 phrases, listes à puces.  
- **Images** : réalistes, pas de stock cliché ; icônes sobres.  
- **Multilingue** : FR/EN en priorité, textes compatibles i18n dès le départ.

**Front-matter recommandé**
- Articles : `title, slug, summary, tags, author, publishedAt, cover, featured`  
- Projets : `title, slug, summary, tags, location, org, links, stage, impact_metrics[], images[], featured`  
- Actions : `title, slug, summary, tags, target, link, status, deadline, featured`

---

## 7) Navigation & repères

- **Header** :  
  - Breadcrumb minimal  
  - Recherche omnibox  
  - **Niveau** avec tooltip  
  - **Région** sélectionnable  
  - Langue  
  - Menu utilisateur
- **Sidebar** :  
  - Actions rapides → **Création rapide**  
  - Accueil  
  - Explorer → Articles · Carte · Projets · Organisations · Actions · Jobs  
  - Membre Premium → Campagnes · Statistiques · Badges  
  - Compte → Paramètres · Aide  
  - Footer → minicarte profil

> L’item actif utilise un **fond glassmorphism** subtil et une bordure douce, comme sur les maquettes.

---

## 8) Analytics, privacy, performance

- **Umami** uniquement, sans traqueurs tiers.
- Lazy-loading images et sections lourdes.
- Préférez les **listes paginées** aux scrolls infinis pour garder le contrôle.

---

## 9) Administration & modération

- Modération a priori des **premières publications** d’un auteur.  
- Éditeurs “curateurs” pour la page d’accueil.  
- Takedown clair : désinformation, spam, harcèlement, faille de sécurité.

---

## 10) Convex et partie dynamique

- Convex gère l’auth, les profils, les missions, les niveaux, les boosts, les métriques agrégées.  
- La logique exacte **reste libre** côté code ; ce README ne prescrit pas d’architecture.  
- L’**agent Cursor** a accès à la doc via **MCP server Convex** : se référer à cette source pour les appels, mutations, schémas, règles d’auth et hooks UI.

---

## 11) Qualité et critères d’acceptation

- Parité **dark/light** fidèle aux maquettes.  
- Couverture mobile impeccable : lecture confortable, carrousels swipe, CTA accessibles.  
- Focus visibles, règles A11y respectées.  
- Temps interactif initial < 2 s sur desktop moderne, < 4 s mobile 4G.  
- Aucune dérive pay-to-win dans l’algorithme de diffusion.

---

## 12) Roadmap exécution visuelle

- **V1 UI** : Header, Sidebar, Accueil avec carrousel, 2 grilles cartes, widgets “Portée actuelle”, “Niveau”, “Activité”.  
- **V1 UX** : Missions de base + badge niveau, soumissions simples, filtres essentiels.  
- **V1.1** : Carte rayon d’audience, tri “proches de moi”, premières Campagnes Premium.  
- **V1.2** : Statistiques créateurs, pages Organisations, Boosts éthiques avancés.  
- **V2** : i18n complet, multi-régions, API publique d’embed.

---

## 13) Manifeste visuel

Seed doit être :
- **lisible** avant d’être “wow”  
- **sobre** avant d’être “chargé”  
- **juste** avant d’être “bruyant”  
- et surtout **utile** aux projets qui comptent.

> Si une décision design améliore l’égo mais dégrade la clarté, on ne la prend pas.

---
