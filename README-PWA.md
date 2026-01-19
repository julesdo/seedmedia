# Configuration PWA pour Seed Media

L'application Seed Media est maintenant configurée comme Progressive Web App (PWA), permettant aux utilisateurs de l'installer sur leurs appareils mobiles.

## 📱 Fonctionnalités PWA

- ✅ Installation sur mobile (iOS et Android)
- ✅ Mode standalone (sans barre d'adresse)
- ✅ Service Worker pour le cache des assets
- ✅ Manifest.json avec toutes les métadonnées
- ✅ Icônes pour tous les formats requis

## 🎨 Génération des icônes

### Option 1 : Avec Sharp (recommandé)

1. Installer Sharp :
```bash
pnpm add -D sharp
```

2. Générer les icônes :
```bash
pnpm run generate-pwa-icons
```

### Option 2 : Script simple (sans dépendances)

Si vous ne pouvez pas installer Sharp, utilisez le script simple qui génère des SVG :

```bash
pnpm run generate-pwa-icons-simple
```

Puis convertissez les SVG en PNG avec un outil externe (ImageMagick, CloudConvert, etc.)

### Option 3 : Création manuelle

Créez manuellement les icônes PNG suivantes dans le dossier `public/` :
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png` (requis)
- `icon-384x384.png`
- `icon-512x512.png` (requis)

**Couleurs recommandées :**
- Fond : `#246BFD` (bleu primary)
- Texte/Logo : Blanc ou couleur du logo

## 📋 Fichiers créés/modifiés

- ✅ `public/manifest.json` - Manifest PWA
- ✅ `src/app/layout.tsx` - Meta tags PWA ajoutés
- ✅ `public/sw.js` - Service Worker (déjà existant)
- ✅ `scripts/generate-pwa-icons.js` - Script de génération d'icônes
- ✅ `scripts/generate-pwa-icons-simple.js` - Script simple (SVG)

## 🚀 Test de l'installation

### Sur Android (Chrome)
1. Ouvrir l'application dans Chrome
2. Menu (3 points) → "Ajouter à l'écran d'accueil"
3. L'application s'installe et apparaît comme une app native

### Sur iOS (Safari)
1. Ouvrir l'application dans Safari
2. Bouton de partage (carré avec flèche)
3. "Sur l'écran d'accueil"
4. L'application s'installe et apparaît comme une app native

### Sur Desktop (Chrome/Edge)
1. Ouvrir l'application dans Chrome/Edge
2. Icône d'installation dans la barre d'adresse
3. Cliquer pour installer

## ⚙️ Configuration

Le manifest.json est configuré avec :
- **Nom** : "Seed - Le média social de la résilience technologique"
- **Nom court** : "Seed"
- **Theme color** : `#246BFD` (bleu primary)
- **Background color** : `#0B1320` (fond sombre)
- **Display** : `standalone` (mode app)
- **Orientation** : `portrait-primary`

## 🔧 Personnalisation

Pour modifier les couleurs ou le nom, éditez :
- `public/manifest.json` - Métadonnées PWA
- `src/app/layout.tsx` - Meta tags dans les metadata

## 📝 Notes importantes

- Les icônes doivent être en PNG (pas SVG pour le manifest)
- L'icône 192x192 et 512x512 sont obligatoires
- Le Service Worker est déjà configuré pour le cache des assets
- L'application fonctionne en mode offline pour les assets mis en cache

