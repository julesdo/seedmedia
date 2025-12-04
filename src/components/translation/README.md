# Système de Traduction Automatique

Ce système permet de traduire automatiquement tout le contenu de l'application sans modifier chaque composant individuellement.

## Utilisation

### 1. Composant `TranslatedText` (Recommandé)

Pour traduire un texte simple :

```tsx
import { TranslatedText } from "@/components/translation/TranslatedText";

<TranslatedText 
  text="Bienvenue sur Seed" 
  sourceLanguage="fr"
  showSkeleton={true}
/>
```

### 2. Hook `useAutoTranslation`

Pour traduire du texte dans un composant :

```tsx
import { useAutoTranslation } from "@/hooks/useTranslation";

function MyComponent() {
  const { translatedText, isLoading } = useAutoTranslation(
    "Bienvenue sur Seed",
    "fr"
  );

  if (isLoading) return <Skeleton />;
  return <p>{translatedText}</p>;
}
```

### 3. Hook `useTranslation`

Pour traduire manuellement :

```tsx
import { useTranslation } from "@/hooks/useTranslation";

function MyComponent() {
  const { translate } = useTranslation();
  const [text, setText] = useState("");

  useEffect(() => {
    translate("Bienvenue", "fr").then(setText);
  }, []);

  return <p>{text}</p>;
}
```

### 4. Sélecteur de langue

Ajoutez le sélecteur de langue dans votre header :

```tsx
import { LanguageSelector } from "@/components/translation/LanguageSelector";

<LanguageSelector />
```

## Configuration

### Variables d'environnement

Ajoutez dans `.env.local` :

```env
# URL de l'application (pour les appels API)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optionnel : Clé API Google Translate
GOOGLE_TRANSLATE_API_KEY=your_key_here

# Optionnel : URL LibreTranslate (si vous hébergez votre propre instance)
LIBRETRANSLATE_URL=https://libretranslate.com/translate
```

## Fonctionnement

1. **Détection automatique** : La langue est détectée depuis le navigateur ou les préférences utilisateur
2. **Cache intelligent** : Les traductions sont mises en cache dans Convex et localStorage
3. **Traduction automatique** : Le système traduit automatiquement tout le contenu français
4. **Performance** : Les traductions sont mises en cache pour éviter les appels API répétés

## APIs supportées

- **LibreTranslate** (gratuit, open source) - Par défaut
- **Google Translate API** (si clé API fournie)
- **MyMemory Translation** (gratuit, limité) - Fallback

