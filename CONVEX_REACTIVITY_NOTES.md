# Convex Reactivity - Notes de développement

## ✅ Composants d'onglets organisation - Vérifiés

Tous les composants d'onglets utilisent correctement `useQuery` sans `useEffect` inutiles :

- ✅ `ArticlesTab.tsx` - Utilise uniquement `useQuery(api.organizations.getOrganizationArticlesPublic)`
- ✅ `ProjectsTab.tsx` - Utilise uniquement `useQuery(api.organizations.getOrganizationProjectsPublic)`
- ✅ `ActionsTab.tsx` - Utilise uniquement `useQuery(api.organizations.getOrganizationActionsPublic)`
- ✅ `MembersTab.tsx` - Utilise uniquement `useQuery(api.organizations.getOrganization)` ou `getOrganizationPublic`
- ✅ `OverviewTab.tsx` - Composant purement présentiel, pas de queries

**Aucun `useEffect` trouvé qui rechargerait des données Convex dans ces composants.**

## ✅ Composants principaux - Vérifiés

- ✅ `OrganizationHeader.tsx` - Utilise uniquement `useQuery` pour les URLs de storage
- ✅ `OrganizationActions.tsx` - Utilise uniquement `useQuery` et `useMutation`
- ✅ `OrganizationStats.tsx` - Composant présentiel, reçoit les stats en props
- ✅ Page principale `organizations/[id]/page.tsx` - Utilise uniquement `useQuery`

## ✅ `useEffect` légitimes

Les `useEffect` suivants sont légitimes et nécessaires :

1. **`GeneralSettings.tsx`** - Synchronise le state du formulaire avec les props de l'organisation
   ```typescript
   useEffect(() => {
     setName(organization.name);
     setDescription(organization.description);
     // etc.
   }, [organization]);
   ```
   → **Légitime** : Synchronisation de formulaire contrôlé

2. **Composants UI** (`OptimizedImage`, `ImageUpload`, etc.) - Gestion du lazy loading, IntersectionObserver, etc.
   → **Légitime** : Effets UI nécessaires

3. **localStorage/sessionStorage** - Synchronisation du state local
   → **Légitime** : Persistance locale

## Principe à respecter

**⚠️ NE JAMAIS utiliser `useEffect` pour recharger des données Convex !**

Avec Convex, `useQuery` met à jour automatiquement les composants quand les données changent. 
Pas besoin de :
- ❌ `useEffect` pour recharger sur changement d'onglet
- ❌ `useState` + `useEffect` pour stocker des données Convex
- ❌ `refetch` manuel
- ❌ `reload` ou `refresh` manuel

✅ **Juste utiliser `useQuery` et laisser Convex gérer la réactivité !**

