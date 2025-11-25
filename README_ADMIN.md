# Espace Super Admin - Seed Tech

## 🔒 Accès Super Admin

L'espace super admin (`/admin`) est réservé à l'équipe Seed Tech et permet de gérer tous les aspects de la plateforme sans restrictions.

## 🛡️ Sécurité

- **Accès uniquement par email** : Seuls les emails ajoutés manuellement via ligne de commande peuvent accéder
- **Protection au niveau Convex** : Toutes les fonctions vérifient l'identité du super admin
- **Pas de bypass possible** : Impossible d'accéder sans être dans la table `superAdmins`

## 📝 Ajouter un Super Admin

### Via la Console Convex Dashboard (Seule méthode)

1. Allez sur [Convex Dashboard](https://dashboard.convex.dev)
2. Sélectionnez votre projet
3. Allez dans "Functions"
4. Exécutez la fonction interne `scripts/addSuperAdmin:addSuperAdmin` avec les arguments suivants :

```json
{
  "email": "julescamilledore@gmail.com",
  "addedBy": "system",
  "notes": "Fondateur Seed"
}
```

**⚠️ Important :** Cette méthode est la seule méthode sécurisée. Toutes les autres méthodes (ligne de commande, API publique) ont été supprimées pour des raisons de sécurité.

## 🗑️ Supprimer un Super Admin

Les super admins peuvent supprimer d'autres super admins via l'interface `/admin` (dashboard).

## 📋 Fonctionnalités

### Dashboard (`/admin`)
- Vue d'ensemble des statistiques
- Accès rapide aux différentes sections
- Liste des super admins

### Gestion des Utilisateurs (`/admin/users`)
- **Recherche** : Par email, nom, username
- **Modification complète** :
  - Nom, username, email
  - Bio, image, cover image
  - Rôle (explorateur, contributeur, éditeur)
  - Niveau, score de crédibilité
  - Premium tier, boost credits
  - Région, rayon d'audience
  - Tags, liens, domaines d'expertise
- **⚠️ Sans validation** : Toutes les modifications sont appliquées immédiatement

### Gestion des Articles (`/admin/articles`)
- **Recherche** : Par titre, résumé, slug
- **Filtres** : Par statut (draft, pending, published, rejected)
- **Modification complète** :
  - Titre, slug, résumé, contenu
  - Type d'article, statut
  - Featured, score qualité
  - Vues, réactions, commentaires
  - Sources, claims vérifiés
  - Tous les métriques
- **Suppression** : Suppression définitive d'articles
- **⚠️ Bypass validations** : Peut publier directement, changer les scores, etc.

## ⚠️ Avertissements

1. **Modifications sans validation** : Toutes les modifications sont appliquées immédiatement sans vérification
2. **Pas de rollback automatique** : Les modifications sont permanentes
3. **Accès sensible** : Cet espace permet de modifier toutes les données de l'application
4. **Email critique** : La modification d'email peut affecter l'authentification

## 🔐 Bonnes Pratiques

1. **Vérifier avant de modifier** : Toujours vérifier les données avant modification
2. **Documenter les changements** : Noter les modifications importantes
3. **Limiter les accès** : Ne donner l'accès super admin qu'aux membres de l'équipe Seed Tech
4. **Surveiller les accès** : Vérifier régulièrement la liste des super admins

## 📞 Support

Pour toute question ou problème, contacter l'équipe Seed Tech.

