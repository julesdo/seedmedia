# Plan de Traduction Complète - Seed Media

## 📊 État Global

### ✅ Déjà Traduit
- ✅ Navigation (DesktopSidebar, BottomNav, SimplifiedHeader)
- ✅ Paramètres (Settings page)
- ✅ Profil utilisateur (UserProfileClient - partiellement)
- ✅ Quiz (QuizSimple)
- ✅ Recherche (SearchModal)
- ✅ Map (EventsMap - légende)
- ✅ Widgets (tous les widgets de la sidebar droite)
- ✅ Breaking News Banner
- ✅ Messages communs (common, errors, success)
- ✅ **Décisions (DecisionCard, DecisionDetail, SaveButton)** ✨ NOUVEAU
- ✅ **Bots (BotsListClient, BotDetailClient, BotLogs, BotMetricsChart)** ✨ NOUVEAU
- ✅ **Anticipations (AnticipationsClient, AnticipationButton, AnticipationModal)** ✨ NOUVEAU
- ✅ **Règles (RulesClient)** ✨ NOUVEAU
- ✅ **Notifications (NotificationsPage)** ✨ NOUVEAU
- ✅ **Tendances (TrendingPage)** ✨ NOUVEAU
- ✅ **Sauvegardés (SavedPage)** ✨ NOUVEAU
- ✅ **Authentification (SignInPage, SignUpPage)** ✨ NOUVEAU (pages principales traduites, composants internes à compléter si nécessaire)

### ❌ À Traduire (par priorité)

---

## 🔴 PRIORITÉ 1 - Composants Principaux

### 1. Décisions (Decision Components) ✅ **TERMINÉ**
**Fichiers :**
- ✅ `src/components/decisions/DecisionCard.tsx` - **TRADUIT**
- ✅ `src/components/decisions/DecisionDetail.tsx` - **TRADUIT**
- ✅ `src/components/decisions/SaveButton.tsx` - **TRADUIT**
- [ ] `src/components/decisions/DecisionList.tsx`
- [ ] `src/components/decisions/DecisionReelCard.tsx`
- [ ] `src/components/decisions/DecisionReelFeed.tsx`
- [ ] `src/components/decisions/EventBadge.tsx`

**Textes traduits :**
- ✅ Types de décisions (Loi, Sanction, Taxe, etc.)
- ✅ Statuts (Annoncée, En suivi, Résolue)
- ✅ "Décision introuvable"
- ✅ "Retour aux décisions"
- ✅ "Source"
- ✅ "Actualités liées"
- ✅ "Résolution", "Résultat", "Confiance"
- ✅ "Sauvegarder" / "Sauvegardé"
- ✅ Messages toast de sauvegarde

**Textes restants à traduire :**
- [ ] "Il y a {count} jours/heures/minutes" (formatDistanceToNow - nécessite locale)
- [ ] "Voir plus" / "Voir moins"
- [ ] "Partager cette décision"
- [ ] "Décideur", "Type", "Domaines impactés"
- [ ] "Anticipations", "Aucune anticipation"
- [ ] "Faire une anticipation"

**Clés JSON à ajouter :**
```json
"decisions": {
  "timeAgo": {
    "days": "Il y a {count} jours",
    "hours": "Il y a {count} heures",
    "minutes": "Il y a {count} minutes",
    "now": "À l'instant"
  },
  "actions": {
    "seeMore": "Voir plus",
    "seeLess": "Voir moins",
    "share": "Partager cette décision",
    "save": "Sauvegarder",
    "saved": "Sauvegardé",
    "unsave": "Retirer des sauvegardes"
  },
  "fields": {
    "decider": "Décideur",
    "type": "Type",
    "impactedDomains": "Domaines impactés",
    "relatedArticles": "Articles liés"
  },
  "empty": {
    "noAnticipations": "Aucune anticipation",
    "makeAnticipation": "Faire une anticipation"
  }
}
```

---

### 2. Profil Utilisateur (User Profile)
**Fichiers :**
- `src/app/(public)/u/[username]/UserProfileClient.tsx`
- `src/app/(public)/profile/ProfileClient.tsx`

**Textes à traduire :**
- [ ] "Membre depuis {date}"
- [ ] "Voir plus" (bouton pagination)
- [ ] "Aucune anticipation en cours"
- [ ] "Aucune anticipation correcte"
- [ ] "Aucune décision sauvegardée"
- [ ] Messages de description pour les états vides
- [ ] "Partager le profil"
- [ ] "Modifier le profil"
- [ ] "Suivre"
- [ ] "Ne plus suivre"
- [ ] "Vous suivez maintenant {name}"
- [ ] "Vous ne suivez plus {name}"

**Note :** Certains textes sont déjà dans `profile` mais pas tous utilisés.

---

### 3. Bots (Bots Pages) ✅ **TERMINÉ**
**Fichiers :**
- ✅ `src/app/(public)/bots/BotsListClient.tsx` - **TRADUIT**
- ✅ `src/app/(public)/bots/[slug]/BotDetailClient.tsx` - **TRADUIT**
- ✅ `src/components/bots/BotLogs.tsx` - **TRADUIT**
- ✅ `src/components/bots/BotMetricsChart.tsx` - **TRADUIT**
- [ ] `src/components/bots/BotAvatar.tsx` (pas de texte à traduire)

**Textes traduits :**
- ✅ "Nos Bots", description
- ✅ Catégories (Détection, Génération, Résolution, etc.)
- ✅ Statuts (Actif, En pause, Maintenance)
- ✅ Statistiques (Décisions créées, résolues, etc.)
- ✅ Logs d'activité (filtres, niveaux)
- ✅ Métriques temporelles
- ✅ Informations techniques

**Clés JSON à ajouter :**
```json
"bots": {
  "title": "Bots",
  "list": {
    "title": "Liste des bots",
    "noBots": "Aucun bot disponible"
  },
  "detail": {
    "title": "Détails du bot",
    "stats": {
      "decisionsCreated": "Décisions créées",
      "decisionsResolved": "Décisions résolues",
      "newsAggregated": "Actualités agrégées",
      "indicatorsTracked": "Indicateurs suivis"
    },
    "lastActivity": "Dernière activité",
    "noRecentActivity": "Aucune activité récente",
    "logs": "Logs",
    "metrics": "Métriques",
    "description": "Description",
    "features": "Fonctionnalités"
  },
  "back": "Retour à la liste"
}
```

---

## 🟡 PRIORITÉ 2 - Pages et Fonctionnalités

### 4. Anticipations (Anticipations)
**Fichiers :**
- `src/app/(public)/anticipations/page.tsx`
- `src/app/(public)/anticipations/AnticipationsClient.tsx`
- `src/components/anticipations/AnticipationModal.tsx`
- `src/components/anticipations/AnticipationButton.tsx`

**Textes à traduire :**
- [ ] "Mes anticipations"
- [ ] "Toutes mes anticipations"
- [ ] "En attente"
- [ ] "Résolues"
- [ ] "Correctes"
- [ ] "Incorrectes"
- [ ] "Faire une anticipation"
- [ ] "Modifier l'anticipation"
- [ ] "Supprimer l'anticipation"
- [ ] "Confirmer"
- [ ] "Annuler"
- [ ] "Sélectionner un scénario"
- [ ] "Engager des seeds"
- [ ] "Vous avez déjà anticipé cet événement"
- [ ] "Anticipation enregistrée avec succès"
- [ ] "Erreur lors de l'enregistrement"

**Clés JSON à ajouter :**
```json
"anticipations": {
  "title": "Mes anticipations",
  "all": "Toutes mes anticipations",
  "status": {
    "pending": "En attente",
    "resolved": "Résolues",
    "correct": "Correctes",
    "incorrect": "Incorrectes"
  },
  "actions": {
    "create": "Faire une anticipation",
    "edit": "Modifier l'anticipation",
    "delete": "Supprimer l'anticipation",
    "selectScenario": "Sélectionner un scénario",
    "engageSeeds": "Engager des seeds"
  },
  "messages": {
    "alreadyAnticipated": "Vous avez déjà anticipé cet événement",
    "success": "Anticipation enregistrée avec succès",
    "error": "Erreur lors de l'enregistrement"
  }
}
```

---

### 5. Règles (Rules Page)
**Fichiers :**
- `src/app/(public)/rules/page.tsx`
- `src/app/(public)/rules/RulesClient.tsx`

**Textes à traduire :**
- [ ] "Règles du jeu"
- [ ] "Comment ça marche"
- [ ] "Objectif"
- [ ] "Règles"
- [ ] "Scoring"
- [ ] "Niveaux"
- [ ] Tout le contenu de la page des règles

**Clés JSON à ajouter :**
```json
"rules": {
  "title": "Règles du jeu",
  "sections": {
    "howItWorks": "Comment ça marche",
    "objective": "Objectif",
    "rules": "Règles",
    "scoring": "Scoring",
    "levels": "Niveaux"
  }
}
```

---

### 6. Notifications (Notifications)
**Fichiers :**
- `src/app/(public)/notifications/page.tsx`

**Textes à traduire :**
- [ ] "Notifications"
- [ ] "Aucune notification"
- [ ] "Vous n'avez pas de nouvelles notifications"
- [ ] "Marquer comme lu"
- [ ] "Marquer tout comme lu"
- [ ] "Supprimer"
- [ ] Types de notifications (anticipation résolue, nouveau follower, etc.)

**Clés JSON à ajouter :**
```json
"notifications": {
  "title": "Notifications",
  "empty": {
    "title": "Aucune notification",
    "description": "Vous n'avez pas de nouvelles notifications"
  },
  "actions": {
    "markAsRead": "Marquer comme lu",
    "markAllAsRead": "Marquer tout comme lu",
    "delete": "Supprimer"
  },
  "types": {
    "anticipationResolved": "Votre anticipation a été résolue",
    "newFollower": "{name} vous suit maintenant",
    "anticipationCorrect": "Félicitations ! Votre anticipation était correcte"
  }
}
```

---

### 7. Tendances (Trending Page)
**Fichiers :**
- `src/app/(public)/trending/page.tsx`

**Textes à traduire :**
- [ ] "Tendances"
- [ ] "Événements les plus suivis"
- [ ] "Aucun événement en tendance"
- [ ] "Les événements les plus populaires du moment"

**Clés JSON à ajouter :**
```json
"trending": {
  "title": "Tendances",
  "subtitle": "Événements les plus suivis",
  "empty": {
    "title": "Aucun événement en tendance",
    "description": "Les événements les plus populaires du moment"
  }
}
```

---

### 8. Sauvegardés (Saved Page)
**Fichiers :**
- `src/app/(public)/saved/page.tsx`

**Textes à traduire :**
- [ ] "Sauvegardés"
- [ ] "Mes décisions sauvegardées"
- [ ] "Aucune décision sauvegardée"
- [ ] "Vous n'avez pas encore sauvegardé de décisions"

**Clés JSON à ajouter :**
```json
"saved": {
  "title": "Sauvegardés",
  "subtitle": "Mes décisions sauvegardées",
  "empty": {
    "title": "Aucune décision sauvegardée",
    "description": "Vous n'avez pas encore sauvegardé de décisions"
  }
}
```

---

## 🟢 PRIORITÉ 3 - Composants Secondaires

### 9. Header et Navigation Mobile
**Fichiers :**
- `src/components/navigation/SimplifiedHeader.tsx` (partiellement fait)
- `src/components/navigation/MobileSubPageHeader.tsx` (partiellement fait)

**Textes à traduire :**
- [ ] Noms de pages dynamiques dans MobileSubPageHeader
- [ ] Messages de toast pour les actions

---

### 10. Footer
**Fichiers :**
- `src/components/layout/PublicFooter.tsx`

**Textes à traduire :**
- [ ] Liens du footer
- [ ] Copyright
- [ ] Mentions légales
- [ ] Politique de confidentialité
- [ ] Conditions d'utilisation

**Clés JSON à ajouter :**
```json
"footer": {
  "links": {
    "about": "À propos",
    "rules": "Règles",
    "help": "Aide",
    "privacy": "Confidentialité",
    "terms": "Conditions",
    "contact": "Contact"
  },
  "copyright": "© 2026 Seed. Tous droits réservés."
}
```

---

### 11. Messages Toast et Notifications
**Fichiers :**
- Tous les fichiers qui utilisent `toast.success()` ou `toast.error()`

**Textes à traduire :**
- [ ] Tous les messages de succès
- [ ] Tous les messages d'erreur
- [ ] Tous les messages d'information

**Note :** Certains sont déjà dans `success` et `errors`, mais pas tous utilisés.

---

## 🔵 PRIORITÉ 4 - Pages d'Authentification

### 12. Authentification (Auth Pages)
**Fichiers :**
- `src/app/(unauth)/sign-in/SignIn.tsx`
- `src/app/(unauth)/sign-up/SignUp.tsx`
- `src/app/(unauth)/verify-2fa/TwoFactorVerification.tsx`
- `src/app/(unauth)/callback/page.tsx`
- `src/app/(unauth)/oauth-callback/page.tsx`

**Textes à traduire :**
- [ ] "Connexion"
- [ ] "Inscription"
- [ ] "Email"
- [ ] "Mot de passe"
- [ ] "Confirmer le mot de passe"
- [ ] "Se connecter"
- [ ] "S'inscrire"
- [ ] "Mot de passe oublié ?"
- [ ] "Déjà un compte ?"
- [ ] "Pas encore de compte ?"
- [ ] "Vérification en deux étapes"
- [ ] "Code de vérification"
- [ ] Messages d'erreur d'authentification

**Clés JSON à ajouter :**
```json
"auth": {
  "signIn": {
    "title": "Connexion",
    "email": "Email",
    "password": "Mot de passe",
    "submit": "Se connecter",
    "forgotPassword": "Mot de passe oublié ?",
    "noAccount": "Pas encore de compte ?",
    "signUp": "S'inscrire"
  },
  "signUp": {
    "title": "Inscription",
    "email": "Email",
    "password": "Mot de passe",
    "confirmPassword": "Confirmer le mot de passe",
    "submit": "S'inscrire",
    "hasAccount": "Déjà un compte ?",
    "signIn": "Se connecter"
  },
  "twoFactor": {
    "title": "Vérification en deux étapes",
    "code": "Code de vérification",
    "submit": "Vérifier"
  },
  "errors": {
    "invalidCredentials": "Identifiants invalides",
    "emailExists": "Cet email est déjà utilisé",
    "weakPassword": "Le mot de passe est trop faible",
    "invalidCode": "Code de vérification invalide"
  }
}
```

---

## 📝 Plan d'Action Recommandé

### Phase 1 (Semaine 1) - Priorité 1
1. ✅ Décisions (DecisionCard, DecisionDetail)
2. ✅ Profil utilisateur (completion)
3. ✅ Bots (toutes les pages)

### Phase 2 (Semaine 2) - Priorité 2
4. ✅ Anticipations
5. ✅ Règles
6. ✅ Notifications
7. ✅ Tendances & Sauvegardés

### Phase 3 (Semaine 3) - Priorité 3
8. ✅ Header/Navigation (completion)
9. ✅ Footer
10. ✅ Messages Toast

### Phase 4 (Semaine 4) - Priorité 4
11. ✅ Authentification

---

## 📋 Checklist de Traduction

### Pour chaque composant/page :
- [ ] Identifier tous les textes en dur
- [ ] Créer les clés JSON dans `messages/fr.json`
- [ ] Remplacer les textes par `useTranslations()` et `t('key')`
- [ ] Traduire dans les 7 autres langues (en, es, de, it, pt, nl, pl)
- [ ] Tester le changement de langue
- [ ] Vérifier que tous les textes sont traduits

---

## 🔍 Fichiers à Examiner en Détail

### Composants Principaux
- [ ] `src/components/decisions/DecisionCard.tsx`
- [ ] `src/components/decisions/DecisionDetail.tsx`
- [ ] `src/components/decisions/DecisionList.tsx`
- [ ] `src/components/decisions/DecisionReelCard.tsx`
- [ ] `src/components/decisions/DecisionReelFeed.tsx`
- [ ] `src/app/(public)/u/[username]/UserProfileClient.tsx`
- [ ] `src/app/(public)/bots/BotsListClient.tsx`
- [ ] `src/app/(public)/bots/[slug]/BotDetailClient.tsx`

### Pages
- [ ] `src/app/(public)/anticipations/AnticipationsClient.tsx`
- [ ] `src/app/(public)/rules/RulesClient.tsx`
- [ ] `src/app/(public)/notifications/page.tsx`
- [ ] `src/app/(public)/trending/page.tsx`
- [ ] `src/app/(public)/saved/page.tsx`

### Authentification
- [ ] `src/app/(unauth)/sign-in/SignIn.tsx`
- [ ] `src/app/(unauth)/sign-up/SignUp.tsx`
- [ ] `src/app/(unauth)/verify-2fa/TwoFactorVerification.tsx`

---

## 📊 Statistiques

- **Total de fichiers à traduire** : ~50 fichiers
- **Composants principaux** : 15 fichiers
- **Pages** : 10 fichiers
- **Authentification** : 5 fichiers
- **Composants secondaires** : 20 fichiers

- **Langues à supporter** : 8 langues
- **Progression estimée** : ~80% complété (✅ +10% avec Authentification)
- **Temps estimé** : 3-4 semaines

---

## 🎯 Objectif Final

Avoir 100% de l'application traduite dans les 8 langues supportées :
- 🇫🇷 Français (fr) - Source
- 🇬🇧 Anglais (en)
- 🇪🇸 Espagnol (es)
- 🇩🇪 Allemand (de)
- 🇮🇹 Italien (it)
- 🇵🇹 Portugais (pt)
- 🇳🇱 Néerlandais (nl)
- 🇵🇱 Polonais (pl)

---

**Dernière mise à jour** : 2026-01-XX
**Statut** : En cours
**Responsable** : Équipe de développement

