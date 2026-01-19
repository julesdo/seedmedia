# 🛡️ FILTRE ÉTHIQUE POUR LES DÉCISIONS

## Date : 2025-01-27

---

## 🎯 OBJECTIF

Éviter la génération de décisions sensibles ou morbides qui exploitent des tragédies humaines, notamment :
- Prédictions sur des morts, décès, victimes
- Questions morbides sur des catastrophes
- Contenu insensible ou inapproprié

---

## ✅ IMPLÉMENTATION

### 1. Fonction de filtrage éthique

**Fichier** : `convex/bots/generateDecision.ts`

**Fonction** : `checkEthicalFilter()`

**Vérifications** :
- Mots-clés sensibles : mort, morts, décès, décédé, victime, victimes, tué, assassiné, périr, tragédie, massacre, génocide
- Patterns de prédictions morbides :
  - "Y aura-t-il plus de X morts ?"
  - "Combien de morts ?"
  - "Au moins X décès ?"
- Vérification dans : titre, description, question

**Action** : Retourne `true` si la décision doit être bloquée, `false` sinon

---

### 2. Blocage avant création

**Emplacement** : Juste avant la création de la décision (ligne ~725)

**Code** :
```typescript
// 🛡️ FILTRE ÉTHIQUE : Vérifier que la décision ne contient pas de contenu sensible/morbide
const shouldBlockDecision = checkEthicalFilter({
  title: eventTitle,
  description: eventDescription || eventTitle,
  question: question,
  type: extracted.type,
});

if (shouldBlockDecision) {
  console.log(`🚫 Decision blocked by ethical filter: ${eventTitle}`);
  return null;
}
```

**Résultat** : Si la décision est bloquée, elle n'est pas créée et `null` est retourné.

---

### 3. Instructions éthiques dans le prompt IA

**Emplacement** : Prompt de génération de question (ligne ~288)

**Ajouts** :
- Section "🛡️ RÈGLES ÉTHIQUES ABSOLUES"
- Liste d'interdictions strictes
- Exemples de questions interdites
- Exemples de questions autorisées

**Objectif** : Guider l'IA pour éviter de générer des questions sensibles dès la source.

---

## 📋 MOTS-CLÉS BLOQUÉS

### Morts et décès
- mort, morts
- décès, décédé, décédés
- victime, victimes
- tué, tués
- assassiné, assassinés

### Formulations morbides
- périr, péris
- mourir, mourront, mourra, mouriront

### Tragédies humaines
- tragédie, tragédies
- massacre, massacres
- génocide, génocides

### Patterns de prédictions morbides
- "Y aura-t-il plus de X morts ?"
- "Combien de morts ?"
- "Au moins X décès ?"
- "Nombre de victimes ?"

---

## ✅ EXEMPLES

### ❌ Questions bloquées

1. **"Y aura-t-il plus de 200 morts au Mozambique dans les 3 prochains mois ?"**
   - ❌ Bloquée : Contient "plus de X morts"

2. **"Combien de victimes y aura-t-il dans cette catastrophe ?"**
   - ❌ Bloquée : Contient "victimes"

3. **"Le nombre de décès va-t-il dépasser 100 ?"**
   - ❌ Bloquée : Contient "décès"

### ✅ Questions autorisées

1. **"La situation humanitaire va-t-elle s'améliorer au Mozambique dans les 3 prochains mois ?"**
   - ✅ Autorisée : Pas de mention de morts, focus sur l'amélioration

2. **"Les secours vont-ils être efficaces dans les 3 prochains mois ?"**
   - ✅ Autorisée : Focus sur les secours, pas sur les morts

3. **"La reconstruction va-t-elle progresser dans les 3 prochains mois ?"**
   - ✅ Autorisée : Focus sur la reconstruction, pas sur les pertes humaines

---

## 🔍 FONCTIONNEMENT

### Flux de vérification

1. **Génération du titre et de la description** (par IA)
2. **Génération de la question** (par IA avec instructions éthiques)
3. **Vérification du filtre éthique** (fonction `checkEthicalFilter`)
4. **Si bloquée** : Retourne `null`, la décision n'est pas créée
5. **Si autorisée** : Création de la décision normalement

### Logs

Quand une décision est bloquée :
```
🚫 Decision blocked by ethical filter: [titre de la décision]
```

---

## 🎯 RÉSULTAT ATTENDU

- ✅ Plus de prédictions morbides sur des morts
- ✅ Plus de questions exploitant des tragédies humaines
- ✅ Contenu respectueux et éthique
- ✅ Focus sur les conséquences politiques, économiques, diplomatiques plutôt que sur les pertes humaines

---

## 📝 NOTES

- Le filtre est **proactif** : Il bloque avant la création
- Le filtre est **complet** : Vérifie titre, description et question
- Le filtre est **évolutif** : Peut être étendu avec d'autres mots-clés si nécessaire
- Les instructions IA sont **préventives** : Guident l'IA pour éviter de générer ce type de contenu

---

**FIN DU DOCUMENT**

