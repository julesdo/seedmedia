import { query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Règles de calcul publiques et documentées
 * Ces règles sont en lecture seule et définies par l'équipe
 * Elles déterminent comment Seed calcule les issues et distribue les Seeds
 */

export interface ResolutionRule {
  id: string;
  name: string;
  description: string;
  category: "threshold" | "weight" | "scoring" | "seeds";
  value: number | string;
  unit?: string;
  details?: string;
}

/**
 * Récupère toutes les règles de résolution (publiques)
 */
export const getResolutionRules = query({
  args: {},
  handler: async (ctx): Promise<ResolutionRule[]> => {
    // Règles de seuils de variation
    const thresholdRules: ResolutionRule[] = [
      {
        id: "significant_change",
        name: "Variation Significative",
        description: "Pourcentage de variation minimum pour considérer un effet significatif",
        category: "threshold",
        value: 5,
        unit: "%",
        details: "Une variation de 5% ou plus est considérée comme significative",
      },
      {
        id: "strong_change",
        name: "Variation Forte",
        description: "Pourcentage de variation pour un changement fort",
        category: "threshold",
        value: 15,
        unit: "%",
        details: "Une variation de 15% ou plus est considérée comme un changement fort",
      },
      {
        id: "weak_change",
        name: "Variation Faible",
        description: "Pourcentage de variation pour un changement faible",
        category: "threshold",
        value: 2,
        unit: "%",
        details: "Une variation de 2% ou plus est considérée comme un changement faible",
      },
      {
        id: "min_indicators",
        name: "Nombre Minimum d'Indicateurs",
        description: "Nombre minimum d'indicateurs nécessaires pour une résolution fiable",
        category: "threshold",
        value: 1,
        unit: "indicateur(s)",
        details: "Au moins 1 indicateur est nécessaire pour calculer une résolution",
      },
    ];

    // Règles de poids par période
    const weightRules: ResolutionRule[] = [
      {
        id: "weight_30d",
        name: "Poids 30 jours",
        description: "Poids des données à 30 jours dans le calcul final",
        category: "weight",
        value: 20,
        unit: "%",
        details: "Les données à 30 jours représentent 20% du score final",
      },
      {
        id: "weight_90d",
        name: "Poids 90 jours",
        description: "Poids des données à 90 jours dans le calcul final",
        category: "weight",
        value: 30,
        unit: "%",
        details: "Les données à 90 jours représentent 30% du score final",
      },
      {
        id: "weight_180d",
        name: "Poids 180 jours",
        description: "Poids des données à 180 jours dans le calcul final",
        category: "weight",
        value: 30,
        unit: "%",
        details: "Les données à 180 jours représentent 30% du score final",
      },
      {
        id: "weight_365d",
        name: "Poids 365 jours",
        description: "Poids des données à 365 jours dans le calcul final",
        category: "weight",
        value: 20,
        unit: "%",
        details: "Les données à 365 jours représentent 20% du score final",
      },
    ];

    // Règles de scoring
    const scoringRules: ResolutionRule[] = [
      {
        id: "score_works_threshold",
        name: "Seuil pour 'Ça marche'",
        description: "Score minimum pour déterminer que la décision 'marche'",
        category: "scoring",
        value: 30,
        unit: "points",
        details: "Un score pondéré de 30 points ou plus = 'works'",
      },
      {
        id: "score_fails_threshold",
        name: "Seuil pour 'Ça ne marche pas'",
        description: "Score maximum pour déterminer que la décision 'ne marche pas'",
        category: "scoring",
        value: -30,
        unit: "points",
        details: "Un score pondéré de -30 points ou moins = 'fails'",
      },
      {
        id: "score_partial_range",
        name: "Plage pour 'Partiel'",
        description: "Plage de score pour déterminer que la décision est 'partielle'",
        category: "scoring",
        value: "-29 à +29",
        unit: "points",
        details: "Un score pondéré entre -29 et +29 = 'partial'",
      },
      {
        id: "confidence_calculation",
        name: "Calcul de la Confiance",
        description: "Formule de calcul du niveau de confiance",
        category: "scoring",
        value: "50 + |score|",
        unit: "%",
        details: "La confiance est calculée comme 50% + la valeur absolue du score, limitée à 100%",
      },
    ];

    // Règles de Seeds
    const seedsRules: ResolutionRule[] = [
      {
        id: "seeds_base_multiplier",
        name: "Multiplicateur de Base",
        description: "Multiplicateur appliqué aux Seeds engagés si l'anticipation est correcte",
        category: "seeds",
        value: 1.5,
        unit: "x",
        details: "Si vous avez raison, vous gagnez 1.5x vos Seeds engagés",
      },
      {
        id: "seeds_wrong_penalty",
        name: "Pénalité pour Erreur",
        description: "Pourcentage de Seeds perdus si l'anticipation est incorrecte",
        category: "seeds",
        value: 50,
        unit: "%",
        details: "Si vous avez tort, vous perdez 50% de vos Seeds engagés",
      },
      {
        id: "seeds_partial_bonus",
        name: "Bonus 'Partiel'",
        description: "Bonus appliqué si vous avez anticipé 'partial' et que c'est correct",
        category: "seeds",
        value: 20,
        unit: "%",
        details: "Bonus de 20% si vous avez anticipé 'partial' et que c'est 'partial'",
      },
      {
        id: "seeds_exact_bonus",
        name: "Bonus 'Exact'",
        description: "Bonus appliqué si vous avez anticipé exactement 'works' ou 'fails'",
        category: "seeds",
        value: 50,
        unit: "%",
        details: "Bonus de 50% si vous avez anticipé exactement 'works' ou 'fails'",
      },
      {
        id: "seeds_confidence_adjustment",
        name: "Ajustement selon la Confiance",
        description: "Les gains sont ajustés selon le niveau de confiance de la résolution",
        category: "seeds",
        value: "confiance / 100",
        unit: "multiplicateur",
        details: "Plus la confiance est élevée, plus le gain est élevé",
      },
      {
        id: "seeds_min_gain",
        name: "Gain Minimum",
        description: "Gain minimum de Seeds même pour une petite anticipation correcte",
        category: "seeds",
        value: 1,
        unit: "Seed(s)",
        details: "Vous gagnez au minimum 1 Seed même pour une petite anticipation correcte",
      },
      {
        id: "seeds_min_loss",
        name: "Perte Minimum",
        description: "Perte minimum de Seeds même pour une petite anticipation incorrecte",
        category: "seeds",
        value: 1,
        unit: "Seed(s)",
        details: "Vous perdez au minimum 1 Seed même pour une petite anticipation incorrecte",
      },
    ];

    // Règles de niveaux
    const levelRules: ResolutionRule[] = [
      {
        id: "level_formula",
        name: "Formule de Niveau",
        description: "Formule de calcul du niveau basé sur le total de Seeds",
        category: "scoring",
        value: "niveau = √(totalSeeds / 100) + 1",
        unit: "",
        details: "Le niveau est calculé comme la racine carrée du total de Seeds divisé par 100, plus 1",
      },
      {
        id: "level_1_seeds",
        name: "Niveau 1",
        description: "Plage de Seeds pour le niveau 1",
        category: "threshold",
        value: "0-100",
        unit: "Seeds",
        details: "Niveau 1 : de 0 à 100 Seeds",
      },
      {
        id: "level_2_seeds",
        name: "Niveau 2",
        description: "Plage de Seeds pour le niveau 2",
        category: "threshold",
        value: "100-400",
        unit: "Seeds",
        details: "Niveau 2 : de 100 à 400 Seeds",
      },
      {
        id: "level_3_seeds",
        name: "Niveau 3",
        description: "Plage de Seeds pour le niveau 3",
        category: "threshold",
        value: "400-900",
        unit: "Seeds",
        details: "Niveau 3 : de 400 à 900 Seeds",
      },
      {
        id: "level_4_seeds",
        name: "Niveau 4",
        description: "Plage de Seeds pour le niveau 4",
        category: "threshold",
        value: "900-1600",
        unit: "Seeds",
        details: "Niveau 4 : de 900 à 1600 Seeds",
      },
    ];

    return [
      ...thresholdRules,
      ...weightRules,
      ...scoringRules,
      ...seedsRules,
      ...levelRules,
    ];
  },
});

/**
 * Récupère les règles par catégorie
 */
export const getRulesByCategory = query({
  args: {
    category: v.union(
      v.literal("threshold"),
      v.literal("weight"),
      v.literal("scoring"),
      v.literal("seeds")
    ),
  },
  handler: async (ctx, args): Promise<ResolutionRule[]> => {
    const allRules = await ctx.runQuery(api.rules.getResolutionRules, {});
    return allRules.filter((rule: ResolutionRule) => rule.category === args.category);
  },
});

/**
 * Récupère une règle spécifique par son ID
 */
export const getRuleById = query({
  args: {
    ruleId: v.string(),
  },
  handler: async (ctx, args): Promise<ResolutionRule | null> => {
    const allRules = await ctx.runQuery(api.rules.getResolutionRules, {});
    return allRules.find((rule: ResolutionRule) => rule.id === args.ruleId) || null;
  },
});

