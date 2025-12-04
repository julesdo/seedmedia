# Guide de déploiement Vercel + Convex (2025)

## 📋 Prérequis

1. ✅ Convex déployé en production (déjà fait)
2. ✅ Variables d'environnement Convex configurées en production
3. ✅ Compte Vercel configuré

## 🚀 Étapes de déploiement

### 1. Obtenir la clé de déploiement Convex Production

1. Allez sur [Convex Dashboard](https://dashboard.convex.dev)
2. Sélectionnez votre projet de production
3. Allez dans **Settings** → **Deploy Keys**
4. Cliquez sur **Generate Production Deploy Key**
5. **Copiez la clé générée** (vous en aurez besoin pour Vercel)

### 2. Configurer le projet sur Vercel

#### Option A : Via l'interface Vercel (Recommandé)

1. **Connecter le dépôt Git** :
   - Allez sur [Vercel Dashboard](https://vercel.com)
   - Cliquez sur **Add New Project**
   - Importez votre dépôt GitHub/GitLab/Bitbucket

2. **Configurer les paramètres de build** :
   - **Framework Preset** : Next.js
   - **Root Directory** : `./` (ou le répertoire racine de votre projet)
   - **Build Command** : `npx convex deploy --cmd 'pnpm run build'` (déjà configuré dans `vercel.json`)
   - **Install Command** : `pnpm install` (déjà configuré dans `vercel.json`)
   - **Output Directory** : `.next` (par défaut pour Next.js)

#### Option B : Via `vercel.json` (Déjà configuré ✅)

Le fichier `vercel.json` est déjà configuré avec les bonnes commandes.

### 3. Variables d'environnement Vercel

Ajoutez **TOUTES** ces variables dans Vercel Dashboard → Settings → Environment Variables :

#### Variables Convex (OBLIGATOIRES)

```bash
# Clé de déploiement Convex Production
# ⚠️ IMPORTANT : Cette clé est sensible, ne la commitez JAMAIS dans Git
CONVEX_DEPLOY_KEY=prod:judicious-mandrill-471|eyJ2MiI6Ijk2MDgwMTZhNTdhMzQ5YTRiZTc4ZTFmOTc5NjZmOWI2In0=

# URL du déploiement Convex Production
CONVEX_DEPLOYMENT=prod:judicious-mandrill-471

# URL publique Convex
NEXT_PUBLIC_CONVEX_URL=https://judicious-mandrill-471.convex.cloud

# URL du site Convex (optionnel)
NEXT_PUBLIC_CONVEX_SITE_URL=https://judicious-mandrill-471.convex.site
```

#### Variables d'application (OBLIGATOIRES)

```bash
# URL de votre site en production
SITE_URL=https://votre-domaine.vercel.app

# Better Auth Secret (doit être le même qu'en production Convex)
BETTER_AUTH_SECRET=18JFBycXsG7Kdg0w3TofrOdGdFcEZK3A

# OAuth Providers (si utilisés)
GOOGLE_CLIENT_ID=34786906762-dbd2j6d7qa59u3cb1105oo8ie5tabnm5.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GITHUB_CLIENT_ID=Ov23ctblXHlGzyCv9ulo
GITHUB_CLIENT_SECRET=659fb5c458c4fd61a4761b6075d530e2c721238a

# Resend API Key (pour les emails)
RESEND_API_KEY=re_Nob7st7b_A54QcAU4yQSXgVfaEkD5bj7A
```

#### ⚠️ Important

- **Production uniquement** : Assurez-vous que `CONVEX_DEPLOY_KEY` est définie uniquement pour l'environnement **Production** dans Vercel
- **Même secret** : `BETTER_AUTH_SECRET` doit être **identique** entre Vercel et Convex production
- **URLs de production** : Utilisez les URLs de production, pas celles de développement

### 4. Déployer

1. **Push votre code** sur votre branche principale (main/master)
2. Vercel détectera automatiquement le push et lancera un déploiement
3. **Ou** allez sur Vercel Dashboard et cliquez sur **Deploy**

### 5. Vérifier le déploiement

1. **Logs de build** : Vérifiez que `npx convex deploy` s'exécute correctement
2. **URL de production** : Votre site sera disponible sur `https://votre-projet.vercel.app`
3. **Convex Dashboard** : Vérifiez que les fonctions sont bien déployées

## 🔄 Déploiements automatiques

Une fois configuré, chaque push sur votre branche principale déclenchera automatiquement :
1. ✅ Déploiement Convex (via `npx convex deploy`)
2. ✅ Build Next.js
3. ✅ Déploiement Vercel

## 🐛 Dépannage

### Erreur : "CONVEX_DEPLOY_KEY not found"
- Vérifiez que la variable est définie dans Vercel
- Assurez-vous qu'elle est définie pour l'environnement **Production**

### Erreur : "SITE_URL environment variable is required"
- Vérifiez que `SITE_URL` est définie dans Vercel
- Utilisez l'URL de production, pas `http://localhost:3000`

### Erreur : "Build failed"
- Vérifiez les logs de build dans Vercel
- Assurez-vous que toutes les variables d'environnement sont définies
- Vérifiez que `pnpm install` s'exécute correctement

### Convex ne se déploie pas
- Vérifiez que `CONVEX_DEPLOY_KEY` est correcte
- Vérifiez que `CONVEX_DEPLOYMENT` pointe vers la production
- Consultez les logs Convex dans le dashboard

## 📚 Ressources

- [Documentation Convex + Vercel](https://docs.convex.dev/production/hosting/vercel)
- [Documentation Vercel](https://vercel.com/docs)
- [Convex Dashboard](https://dashboard.convex.dev)

