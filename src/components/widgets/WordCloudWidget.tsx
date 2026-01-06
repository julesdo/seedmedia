"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

// Mots à exclure (stop words en français et anglais)
const stopWords = new Set([
  // Articles
  "le", "la", "les", "un", "une", "des", "de", "du", "the", "a", "an",
  // Prépositions
  "à", "dans", "sur", "avec", "pour", "par", "sans", "sous", "vers", "chez",
  "in", "on", "at", "by", "for", "with", "from", "to", "of", "and", "or",
  // Conjonctions
  "et", "ou", "mais", "car", "donc", "or", "ni",
  // Pronoms
  "il", "elle", "ils", "elles", "nous", "vous", "je", "tu",
  // Verbes courants
  "est", "sont", "être", "avoir", "faire", "aller", "venir",
  "is", "are", "was", "were", "be", "have", "has", "had", "do", "does", "did",
  // Autres mots communs
  "ce", "cette", "ces", "que", "qui", "quoi", "quand", "où", "comment", "pourquoi",
  "this", "that", "these", "those", "what", "when", "where", "how", "why",
  "plus", "moins", "très", "trop", "aussi", "encore", "déjà", "bien", "mal",
  "more", "less", "very", "too", "also", "still", "already", "well", "bad",
  // Mots spécifiques au contexte
  "événement", "événements", "décision", "décisions", "actu", "actualité", "actualités",
  "event", "events", "decision", "decisions", "news",
]);

// Fonction pour extraire et nettoyer les mots d'un texte
function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôöùûüÿç]/g, " ") // Garder seulement lettres, chiffres et espaces
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word)); // Minimum 4 caractères et pas de stop words
}

/**
 * Widget : Nuage de mots des événements
 */
export function WordCloudWidget() {
  const decisions = useQuery(api.decisions.getDecisions, { limit: 100 });

  // Extraire et compter les mots
  const wordCounts = useMemo(() => {
    if (!decisions) return new Map<string, number>();

    const counts = new Map<string, number>();

    decisions.forEach((decision) => {
      // Extraire les mots du titre et de la description
      const titleWords = decision.title ? extractWords(decision.title) : [];
      const descriptionWords = decision.description ? extractWords(decision.description) : [];
      const deciderWords = decision.decider ? extractWords(decision.decider) : [];

      // Combiner tous les mots
      const allWords = [...titleWords, ...descriptionWords, ...deciderWords];

      // Compter les occurrences
      allWords.forEach((word) => {
        counts.set(word, (counts.get(word) || 0) + 1);
      });
    });

    return counts;
  }, [decisions]);

  // Trier par fréquence et prendre le top 15
  const topWords = useMemo(() => {
    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => ({ word, count }));
  }, [wordCounts]);

  // Calculer les tailles de police (entre 10px et 24px)
  const minCount = topWords.length > 0 ? Math.min(...topWords.map((w) => w.count)) : 1;
  const maxCount = topWords.length > 0 ? Math.max(...topWords.map((w) => w.count)) : 1;
  const sizeRange = maxCount - minCount || 1;

  if (topWords.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <SolarIcon icon="hashtag-bold" className="size-4 text-muted-foreground" />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Mots-clés
        </h4>
      </div>
      <div className="flex flex-wrap gap-2 items-center justify-center p-3 rounded-lg border border-border/50 bg-muted/20 min-h-[120px]">
        {topWords.map(({ word, count }) => {
          // Calculer la taille proportionnelle (10px à 24px)
          const fontSize = 10 + ((count - minCount) / sizeRange) * 14;
          // Calculer l'opacité (0.6 à 1.0)
          const opacity = 0.6 + ((count - minCount) / sizeRange) * 0.4;
          
          return (
            <span
              key={word}
              className={cn(
                "inline-block px-2 py-1 rounded-md transition-all hover:scale-110 cursor-default",
                "text-foreground font-medium"
              )}
              style={{
                fontSize: `${fontSize}px`,
                opacity,
              }}
              title={`${count} ${count === 1 ? "occurrence" : "occurrences"}`}
            >
              {word}
            </span>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground text-center">
        {topWords.length} {topWords.length === 1 ? "mot-clé" : "mots-clés"} les plus fréquents
      </p>
    </div>
  );
}

