# Variables d'environnement Vercel - Production

## 📋 Liste complète des variables à configurer dans Vercel

Allez dans **Vercel Dashboard** → **Votre Projet** → **Settings** → **Environment Variables**

### 🔐 Variables Convex (Production)

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `CONVEX_DEPLOY_KEY` | `prod:judicious-mandrill-471\|eyJ2MiI6Ijk2MDgwMTZhNTdhMzQ5YTRiZTc4ZTFmOTc5NjZmOWI2In0=` | **Production uniquement** |
| `CONVEX_DEPLOYMENT` | `prod:judicious-mandrill-471` | Production |
| `NEXT_PUBLIC_CONVEX_URL` | `https://judicious-mandrill-471.convex.cloud` | Production |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | `https://judicious-mandrill-471.convex.site` | Production |

### 🌐 Variables d'application

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `SITE_URL` | `https://votre-domaine.vercel.app` | Production |
| `BETTER_AUTH_SECRET` | `18JFBycXsG7Kdg0w3TofrOdGdFcEZK3A` | Production |

### 🔑 OAuth Providers

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `GOOGLE_CLIENT_ID` | `34786906762-dbd2j6d7qa59u3cb1105oo8ie5tabnm5.apps.googleusercontent.com` | Production |
| `GOOGLE_CLIENT_SECRET` | `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` | Production |
| `GITHUB_CLIENT_ID` | `Ov23ctblXHlGzyCv9ulo` | Production |
| `GITHUB_CLIENT_SECRET` | `659fb5c458c4fd61a4761b6075d530e2c721238a` | Production |

### 📧 Email Service

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `RESEND_API_KEY` | `re_Nob7st7b_A54QcAU4yQSXgVfaEkD5bj7A` | Production |

## ⚠️ Instructions importantes

1. **CONVEX_DEPLOY_KEY** : 
   - ⚠️ **NE JAMAIS** commiter cette clé dans Git
   - Définir uniquement pour l'environnement **Production** dans Vercel
   - Cette clé permet à Vercel de déployer Convex automatiquement

2. **SITE_URL** : 
   - Remplacez `votre-domaine.vercel.app` par votre vraie URL Vercel
   - Exemple : `https://seedmedia.vercel.app`

3. **BETTER_AUTH_SECRET** :
   - Doit être **identique** à celui configuré dans Convex production
   - Utilisé pour signer les sessions utilisateur

## 🚀 Configuration rapide

1. Copiez chaque variable ci-dessus
2. Dans Vercel, ajoutez-la avec :
   - **Key** : Le nom de la variable
   - **Value** : La valeur correspondante
   - **Environment** : Sélectionnez **Production** (ou **All** si nécessaire)

## ✅ Vérification

Après avoir ajouté toutes les variables, vérifiez que :
- ✅ `CONVEX_DEPLOY_KEY` est définie uniquement pour Production
- ✅ Toutes les variables sont présentes
- ✅ Les valeurs correspondent à celles de Convex production

