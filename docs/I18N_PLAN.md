# Plan de Traduction Complète de l'Application

## État Actuel

- ✅ `next-intl` est installé (v4.5.8)
- ✅ Configuration i18n existe (`src/i18n/`)
- ✅ Fichiers de messages basiques (`messages/fr.json`, `messages/en.json`)
- ❌ next-intl est **désactivé** dans `next.config.ts`
- ❌ Pas de middleware next-intl
- ❌ Pas de NextIntlClientProvider dans le layout
- ❌ La plupart des textes sont hardcodés en français

## Plan d'Action

### Phase 1 : Configuration de Base ✅
1. Activer next-intl dans `next.config.ts`
2. Créer un middleware next-intl
3. Wrapper le layout avec `NextIntlClientProvider`
4. Créer une structure complète de fichiers de traduction

### Phase 2 : Structure de Traduction
Créer des fichiers de traduction organisés par sections :
- `common` : Textes communs (boutons, actions, etc.)
- `navigation` : Navigation (menu, liens, etc.)
- `decisions` : Décisions et événements
- `profile` : Profil utilisateur
- `quiz` : Système de quiz
- `map` : Carte du monde
- `settings` : Paramètres
- `notifications` : Notifications
- `search` : Recherche
- `widgets` : Widgets de la sidebar
- `errors` : Messages d'erreur
- `success` : Messages de succès

### Phase 3 : Migration des Composants
Remplacer progressivement tous les textes hardcodés par des clés de traduction dans :
1. Composants de navigation (SimplifiedHeader, BottomNav, DesktopSidebar)
2. Composants de décisions (DecisionCard, DecisionDetail, QuizSimple)
3. Composants de profil (UserProfileClient)
4. Composants de recherche (SearchModal)
5. Composants de widgets
6. Pages (settings, profile, etc.)

### Phase 4 : Traductions
Traduire tous les textes dans les 8 langues supportées :
- Français (fr) - source
- Anglais (en)
- Espagnol (es)
- Allemand (de)
- Italien (it)
- Portugais (pt)
- Néerlandais (nl)
- Polonais (pl)

## Structure des Fichiers de Traduction

```json
{
  "common": {
    "actions": { ... },
    "status": { ... },
    "time": { ... }
  },
  "navigation": { ... },
  "decisions": { ... },
  "profile": { ... },
  "quiz": { ... },
  "map": { ... },
  "settings": { ... },
  "notifications": { ... },
  "search": { ... },
  "widgets": { ... },
  "errors": { ... },
  "success": { ... }
}
```

