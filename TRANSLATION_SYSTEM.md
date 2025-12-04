# Système de Traduction Automatique

## ✅ Configuration actuelle

Le système de traduction automatique est **entièrement opérationnel** et utilise des services **100% gratuits et open source**, sans nécessiter de clé API.

## 🔧 Services utilisés

### 1. **LibreTranslate** (Principal)
- **Open source** : https://github.com/LibreTranslate/LibreTranslate
- **Gratuit** : Pas besoin de clé API
- **Instances publiques** :
  - `https://libretranslate.com/translate`
  - `https://translate.argosopentech.com/translate` (fallback)
- **Avantages** : Open source, respectueux de la vie privée, gratuit

### 2. **MyMemory Translation API** (Fallback)
- **Gratuit** : 10 000 caractères/jour sans clé API
- **URL** : `https://api.mymemory.translated.net`
- **Utilisé** : Seulement si LibreTranslate échoue

## 🚀 Fonctionnement

### Traduction automatique du DOM

Le système `AutoTranslateProvider` :
1. **Détecte automatiquement** tous les textes français dans le DOM
2. **Traduit en temps réel** quand l'utilisateur change de langue
3. **Cache les traductions** pour éviter les appels API répétés
4. **Traduit par batch** pour optimiser les performances

### Routes API

#### `/api/translate` (Traduction simple)
```typescript
POST /api/translate
{
  "text": "Bonjour",
  "sourceLanguage": "fr",
  "targetLanguage": "en"
}
```

#### `/api/translate/batch` (Traduction multiple)
```typescript
POST /api/translate/batch
{
  "texts": ["Bonjour", "Au revoir"],
  "sourceLanguage": "fr",
  "targetLanguage": "en"
}
```

## 📝 Langues supportées

- 🇫🇷 Français (fr) - Langue par défaut
- 🇬🇧 Anglais (en)
- 🇪🇸 Espagnol (es)
- 🇩🇪 Allemand (de)
- 🇮🇹 Italien (it)
- 🇵🇹 Portugais (pt)
- 🇳🇱 Néerlandais (nl)
- 🇵🇱 Polonais (pl)

## 🎯 Utilisation

### Changer la langue

Le sélecteur de langue dans le header change automatiquement la langue de toute l'application :

```tsx
import { useLanguage } from '@/contexts/LanguageContext';

function MyComponent() {
  const { language, setLanguage } = useLanguage();
  
  return (
    <button onClick={() => setLanguage('en')}>
      Switch to English
    </button>
  );
}
```

### Traduction automatique

Tous les textes français sont **automatiquement traduits** sans intervention manuelle. Le système :
- Détecte les textes français
- Les traduit via LibreTranslate
- Met à jour le DOM en temps réel
- Cache les traductions pour la performance

## 🔒 Vie privée

- **LibreTranslate** : Open source, vous pouvez héberger votre propre instance
- **Pas de tracking** : Aucune donnée n'est envoyée à des services commerciaux
- **Cache local** : Les traductions sont mises en cache localement

## ⚙️ Configuration avancée

### Héberger votre propre instance LibreTranslate

Si vous voulez héberger votre propre instance (recommandé pour la production) :

1. **Docker** :
```bash
docker run -ti --rm -p 5000:5000 libretranslate/libretranslate
```

2. **Configuration** :
```env
LIBRETRANSLATE_URL=http://localhost:5000/translate
```

3. **Modifier** `src/app/api/translate/route.ts` pour utiliser votre instance.

## 📊 Performance

- **Cache** : Les traductions sont mises en cache (local + Convex)
- **Batch** : Traduction par lots de 5-20 textes
- **Débounce** : 200ms pour éviter trop d'appels
- **Fallback** : Si LibreTranslate échoue, utilise MyMemory

## 🐛 Dépannage

### Les traductions ne fonctionnent pas

1. Vérifier que LibreTranslate est accessible
2. Vérifier la console pour les erreurs
3. Le système utilise automatiquement MyMemory en fallback

### Performance lente

1. Réduire la taille des batches dans `AutoTranslateProvider.tsx`
2. Augmenter le délai de débounce
3. Vérifier que le cache fonctionne

## 📚 Documentation

- [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate)
- [MyMemory API](https://mymemory.translated.net/doc/spec)

