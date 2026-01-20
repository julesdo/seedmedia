# 🗳️ Script de Création des Marchés Municipales 2026

## Utilisation

### Option 1 : Via le Dashboard Convex (Recommandé)

1. Allez sur https://dashboard.convex.dev
2. Sélectionnez votre projet
3. Allez dans **"Functions"**
4. Recherchez `scripts/createMunicipalesMarkets:createMunicipalesMarkets`
5. Cliquez sur **"Run"** (action publique)
6. Les 10 marchés seront créés automatiquement

### Option 2 : Via une Action dans le Code

```typescript
import { api } from "@/convex/_generated/api";
import { useAction } from "convex/react";

const createMarkets = useAction(api.scripts.createMunicipalesMarkets.createMunicipalesMarkets);

// Appeler la fonction
await createMarkets({});
```

### Option 3 : Via une Mutation Interne (Depuis une autre fonction Convex)

```typescript
import { internal } from "./_generated/api";

await ctx.runMutation(internal.scripts.createMunicipalesMarkets.createAllMunicipalesMarkets, {});
```

## Marchés Créés

### Blockbusters (3 marchés)
1. **Bataille de Paris 🗼** - Qui sera le prochain maire de Paris ?
2. **La Vague Bleue Marine ? 🌊** - Le RN gagnera-t-il Marseille ou Perpignan ?
3. **Lyon : Les Écolos Gardent ? 🟢** - Les écologistes garderont-ils Lyon ?

### Tendances Nationales (5 marchés)
4. **Le RN Remportera-t-il Plus de 15 Villes ?** - Tendances nationales
5. **L'Abstention Dépassera-t-elle 60% ? 🗳️** - Taux d'abstention
6. **L'Hécatombe des Ministres 📉** - Plus de 5 ministres perdront-ils ?
7. **La Participation Dépassera-t-elle 45% ?** - Taux de participation
8. **Le RN Gagnera-t-il Plus de Mairies qu'en 2020 ?** - Comparaison avec 2020

### Insolites (2 marchés)
9. **Une Célébrité Élue ?** - Célébrité élue conseillère municipale
10. **Égalité Parfaite (Pile ou Face) ?** - Égalité nécessitant un tirage au sort

## Résolution

Tous les marchés seront résolus selon les **résultats officiels du Ministère de l'Intérieur** après le 2nd tour des municipales 2026 (fin mars 2026).

## Filtrage

Pour afficher uniquement les municipales dans l'interface :

```typescript
const decisions = useQuery(api.decisions.getDecisions, {
  specialEvent: "municipales_2026",
  limit: 20,
});
```

## Notes

- Les marchés déjà existants (même slug) seront ignorés
- Chaque marché initialise automatiquement ses pools de trading OUI/NON
- Les marchés sont créés avec le statut `"announced"` et le type `"election"`

