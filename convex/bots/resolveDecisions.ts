import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { updateBotActivity } from "./helpers";

/**
 * Seuils de résolution (publiques et documentées)
 * Ces seuils déterminent si une décision "works", "partial", ou "fails"
 */
const RESOLUTION_THRESHOLDS = {
  // Pourcentage de variation minimum pour considérer un effet significatif
  SIGNIFICANT_CHANGE: 5, // 5% de variation minimum
  STRONG_CHANGE: 15, // 15% de variation = changement fort
  WEAK_CHANGE: 2, // 2% de variation = changement faible

  // Nombre minimum d'indicateurs nécessaires pour une résolution fiable
  MIN_INDICATORS: 1,

  // Poids des différents types de mesures
  WEIGHTS: {
    baseline: 0, // Baseline n'a pas de poids dans le calcul
    "30d": 0.2, // 20% de poids
    "90d": 0.3, // 30% de poids
    "180d": 0.3, // 30% de poids
    "365d": 0.2, // 20% de poids
  },
} as const;

/**
 * Calcule la variation d'un indicateur entre deux points
 */
function calculateVariation(
  baseline: number,
  current: number
): { absolute: number; percentage: number } {
  const absolute = current - baseline;
  const percentage = baseline !== 0 ? (absolute / baseline) * 100 : 0;

  return { absolute, percentage };
}

/**
 * Détermine l'issue d'une décision basée sur les variations d'indicateurs
 * Algorithme transparent et public
 */
function determineOutcome(
  variationsForCalculation: Array<{
    indicatorId: Id<"indicators">;
    indicatorName: string;
    measureType: "30d" | "90d" | "180d" | "365d";
    variation: { absolute: number; percentage: number };
    weight: number;
  }>
): {
  outcome: "works" | "partial" | "fails";
  confidence: number; // 0-100
  details: {
    positiveIndicators: number;
    negativeIndicators: number;
    neutralIndicators: number;
    weightedScore: number;
  };
} {
  if (variationsForCalculation.length === 0) {
    return {
      outcome: "fails",
      confidence: 0,
      details: {
        positiveIndicators: 0,
        negativeIndicators: 0,
        neutralIndicators: 0,
        weightedScore: 0,
      },
    };
  }

  let weightedScore = 0;
  let totalWeight = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  for (const variation of variationsForCalculation) {
    const { percentage } = variation.variation;
    const weight = variation.weight;

    // Calculer le score pour cet indicateur (-100 à +100)
    let indicatorScore = 0;

    if (Math.abs(percentage) >= RESOLUTION_THRESHOLDS.SIGNIFICANT_CHANGE) {
      // Variation significative
      if (percentage > 0) {
        // Variation positive = indicateur qui s'améliore
        indicatorScore = Math.min(100, percentage * 2); // Max 100
        positiveCount++;
      } else {
        // Variation négative = indicateur qui se détériore
        indicatorScore = Math.max(-100, percentage * 2); // Min -100
        negativeCount++;
      }
    } else {
      // Variation non significative
      neutralCount++;
    }

    // Ajouter au score pondéré
    weightedScore += indicatorScore * weight;
    totalWeight += weight;
  }

  // Normaliser le score pondéré (-100 à +100)
  const normalizedScore =
    totalWeight > 0 ? weightedScore / totalWeight : 0;

  // Déterminer l'issue
  let outcome: "works" | "partial" | "fails";
  let confidence: number;

  if (normalizedScore >= 30) {
    // Score positif élevé = ça marche
    outcome = "works";
    confidence = Math.min(100, 50 + normalizedScore);
  } else if (normalizedScore <= -30) {
    // Score négatif élevé = ça ne marche pas
    outcome = "fails";
    confidence = Math.min(100, 50 + Math.abs(normalizedScore));
  } else {
    // Score proche de zéro = partiel
    outcome = "partial";
    confidence = Math.max(30, 50 - Math.abs(normalizedScore));
  }

  return {
    outcome,
    confidence: Math.round(confidence),
    details: {
      positiveIndicators: positiveCount,
      negativeIndicators: negativeCount,
      neutralIndicators: neutralCount,
      weightedScore: Math.round(normalizedScore * 100) / 100,
    },
  };
}

/**
 * Résout une décision en calculant automatiquement l'issue
 */
export const resolveDecision = action({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args): Promise<{
    resolutionId: Id<"resolutions">;
    outcome: "works" | "partial" | "fails";
    confidence: number;
    details: {
      positiveIndicators: number;
      negativeIndicators: number;
      neutralIndicators: number;
      weightedScore: number;
    };
  }> => {
    const decision = await ctx.runQuery(api.decisions.getDecisionById, {
      decisionId: args.decisionId,
    });

    if (!decision) {
      throw new Error("Decision not found");
    }

    // Vérifier que la décision a des indicateurs
    if (decision.indicatorIds.length === 0) {
      throw new Error("Decision has no indicators");
    }

    // Récupérer toutes les données d'indicateurs pour cette décision
    const allIndicatorData = await ctx.runQuery(
      api.indicatorData.getIndicatorDataForDecision,
      {
        decisionId: args.decisionId,
      }
    );

    // Récupérer les indicateurs
    const indicators = await Promise.all(
      decision.indicatorIds.map((indicatorId: Id<"indicators">) =>
        ctx.runQuery(api.indicators.getIndicatorById, { indicatorId })
      )
    );

    // Organiser les données par indicateur et type de mesure
    const dataByIndicator = new Map<
      Id<"indicators">,
      Map<string, { value: number; date: number }>
    >();

    for (const data of allIndicatorData) {
      if (!dataByIndicator.has(data.indicatorId)) {
        dataByIndicator.set(data.indicatorId, new Map());
      }
      const indicatorData = dataByIndicator.get(data.indicatorId)!;
      indicatorData.set(data.measureType, {
        value: data.value,
        date: data.date,
      });
    }

    // Calculer les variations pour chaque indicateur
    const variationsForCalculation: Array<{
      indicatorId: Id<"indicators">;
      indicatorName: string;
      measureType: "30d" | "90d" | "180d" | "365d";
      variation: { absolute: number; percentage: number };
      weight: number;
      baseline: number;
      current: number;
    }> = [];

    for (const indicator of indicators) {
      if (!indicator) continue;

      const indicatorData = dataByIndicator.get(indicator._id);
      if (!indicatorData) continue;

      // Récupérer la baseline
      const baseline = indicatorData.get("baseline");
      if (!baseline) continue;

      // Calculer les variations pour chaque période
      for (const measureType of ["30d", "90d", "180d", "365d"] as const) {
        const currentData = indicatorData.get(measureType);
        if (!currentData) continue;

        const variation = calculateVariation(baseline.value, currentData.value);
        const weight = RESOLUTION_THRESHOLDS.WEIGHTS[measureType];

        variationsForCalculation.push({
          indicatorId: indicator._id,
          indicatorName: indicator.name,
          measureType,
          variation,
          weight,
          baseline: baseline.value,
          current: currentData.value,
        });
      }
    }

    // Déterminer l'issue
    const result = determineOutcome(variationsForCalculation);

    // Vérifier si une résolution existe déjà
    const existingResolution = await ctx.runQuery(
      api.resolutions.getResolutionByDecision,
      {
        decisionId: args.decisionId,
      }
    ) as { _id: Id<"resolutions"> } | null;

    if (existingResolution) {
      // Mettre à jour la résolution existante
      await ctx.runMutation(api.resolutions.updateResolution, {
        resolutionId: existingResolution._id,
        issue: result.outcome,
        confidence: result.confidence,
        details: result.details,
        resolvedAt: Date.now(),
      });

      // Mettre à jour les stats du bot Résolveur
      await updateBotActivity(ctx, {
        botSlug: "resolveur",
        decisionsResolved: 1,
        logMessage: `Décision résolue: ${result.outcome} (confiance: ${result.confidence}%)`,
        logLevel: "success",
        functionName: "resolveDecision",
      });

      return {
        resolutionId: existingResolution._id,
        ...result,
      };
    } else {
      // Préparer les variations pour le schéma
      const variationsForSchema = variationsForCalculation.map((v) => ({
        indicatorId: v.indicatorId,
        baseline: v.baseline,
        current: v.current,
        variation: v.variation.absolute,
        variationPercent: v.variation.percentage,
      }));

      // Créer une nouvelle résolution
      const resolutionId = (await ctx.runMutation(
        api.resolutions.createResolution,
        {
          decisionId: args.decisionId,
          issue: result.outcome,
          confidence: result.confidence,
          details: result.details,
          method: "automated_threshold",
          indicatorIds: decision.indicatorIds,
          variations: variationsForSchema,
          resolvedAt: Date.now(),
        }
      )) as Id<"resolutions">;

      // Mettre à jour les stats du bot Résolveur
      await updateBotActivity(ctx, {
        botSlug: "resolveur",
        decisionsResolved: 1,
        logMessage: `Décision résolue: ${result.outcome} (confiance: ${result.confidence}%)`,
        logLevel: "success",
        functionName: "resolveDecision",
      });

      return {
        resolutionId,
        ...result,
      };
    }
  },
});

/**
 * Résout toutes les décisions éligibles (avec indicateurs et données)
 */
export const resolveAllEligibleDecisions = action({
  args: {},
  handler: async (ctx): Promise<{
    processed: number;
    results: Array<{
      decisionId: Id<"decisions">;
      resolved: boolean;
      outcome?: "works" | "partial" | "fails";
      error?: string;
    }>;
  }> => {
    // Récupérer toutes les décisions en suivi
    const decisions = (await ctx.runQuery(api.decisions.getDecisions, {
      limit: 100,
      status: "tracking",
    })) as Array<{
      _id: Id<"decisions">;
      indicatorIds: Id<"indicators">[];
    }>;

    const results: Array<{
      decisionId: Id<"decisions">;
      resolved: boolean;
      outcome?: "works" | "partial" | "fails";
      error?: string;
    }> = [];

    for (const decision of decisions) {
      try {
        // Vérifier que la décision a des indicateurs
        if (decision.indicatorIds.length === 0) {
          results.push({
            decisionId: decision._id,
            resolved: false,
            error: "No indicators",
          });
          continue;
        }

        // Résoudre la décision
        const result = await ctx.runAction(api.bots.resolveDecisions.resolveDecision, {
          decisionId: decision._id,
        });

        results.push({
          decisionId: decision._id,
          resolved: true,
          outcome: result.outcome,
        });
      } catch (error) {
        console.error(
          `Error resolving decision ${decision._id}:`,
          error
        );
        results.push({
          decisionId: decision._id,
          resolved: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Calculer le total de décisions résolues
    const totalResolved = results.filter((r) => r.resolved).length;

    // Mettre à jour les stats du bot Résolveur pour le batch
    if (totalResolved > 0) {
      await updateBotActivity(ctx, {
        botSlug: "resolveur",
        decisionsResolved: totalResolved,
        logMessage: `${totalResolved} décisions résolues sur ${decisions.length} traitées (batch)`,
        logLevel: "success",
        functionName: "resolveAllEligibleDecisions",
      });
    }

    return {
      processed: decisions.length,
      results,
    };
  },
});

