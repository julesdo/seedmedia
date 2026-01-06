import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { updateBotActivity } from "./helpers";

/**
 * Récupère les données d'un indicateur depuis une source publique
 */
export const fetchIndicatorData = action({
  args: {
    indicatorId: v.id("indicators"),
  },
  handler: async (ctx, args) => {
    const indicator = await ctx.runQuery(api.indicators.getIndicatorById, {
      indicatorId: args.indicatorId,
    });

    if (!indicator) {
      throw new Error("Indicator not found");
    }

    // TODO: Implémenter la récupération selon le type de source
    // Exemples de sources gratuites :
    // - INSEE API (gratuite, nécessite inscription)
    // - Eurostat API (gratuite)
    // - Banque de France (données publiques)
    // - APIs gouvernementales (gratuites)

    let value: number | null = null;
    let source: string = "";
    let sourceUrl: string = "";

    switch (indicator.dataSource) {
      case "api":
        // TODO: Appeler l'API spécifiée
        // if (indicator.sourceApi === "INSEE") {
        //   value = await fetchINSEEData(indicator);
        // } else if (indicator.sourceApi === "Eurostat") {
        //   value = await fetchEurostatData(indicator);
        // }
        break;

      case "dataset":
        // TODO: Parser le dataset depuis l'URL
        // if (indicator.sourceUrl) {
        //   value = await fetchDatasetData(indicator.sourceUrl);
        // }
        break;

      case "manual":
        // Les données manuelles sont saisies par les utilisateurs
        // On ne les récupère pas automatiquement
        return null;
    }

    if (value === null) {
      return null;
    }

    return {
      value,
      source,
      sourceUrl,
      timestamp: Date.now(),
    };
  },
});

/**
 * Met à jour les données d'indicateur pour une décision
 */
export const updateIndicatorDataForDecision = action({
  args: {
    decisionId: v.id("decisions"),
    indicatorId: v.id("indicators"),
  },
  handler: async (ctx, args): Promise<Id<"indicatorData"> | null> => {
    const decision = await ctx.runQuery(api.decisions.getDecisionById, {
      decisionId: args.decisionId,
    });

    if (!decision) {
      throw new Error("Decision not found");
    }

    const indicator = await ctx.runQuery(api.indicators.getIndicatorById, {
      indicatorId: args.indicatorId,
    });

    if (!indicator) {
      throw new Error("Indicator not found");
    }

    // Récupérer la valeur actuelle
    const currentData = await ctx.runAction(
      api.bots.trackIndicators.fetchIndicatorData,
      {
        indicatorId: args.indicatorId,
      }
    );

    if (!currentData) {
      return null;
    }

    // Calculer le type de mesure selon le temps écoulé depuis la décision
    const decisionDate = new Date(decision.date);
    const now = Date.now();
    const daysSinceDecision = Math.floor(
      (now - decisionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let measureType: "baseline" | "30d" | "90d" | "180d" | "365d" = "baseline";

    if (daysSinceDecision >= 365) {
      measureType = "365d";
    } else if (daysSinceDecision >= 180) {
      measureType = "180d";
    } else if (daysSinceDecision >= 90) {
      measureType = "90d";
    } else if (daysSinceDecision >= 30) {
      measureType = "30d";
    } else {
      measureType = "baseline";
    }

    // Vérifier si une donnée existe déjà pour ce type de mesure
    const existingData = await ctx.runQuery(
      api.indicatorData.getIndicatorDataByType,
      {
        decisionId: args.decisionId,
        indicatorId: args.indicatorId,
        measureType,
      }
    );

    if (existingData) {
      // Mettre à jour la donnée existante
      await ctx.runMutation(api.indicatorData.updateIndicatorData, {
        indicatorDataId: existingData._id,
        value: currentData.value,
        source: currentData.source,
        sourceUrl: currentData.sourceUrl,
      });
      return existingData._id;
    } else {
      // Créer une nouvelle donnée
      const dataId = await ctx.runMutation(api.indicatorData.createIndicatorData, {
        decisionId: args.decisionId,
        indicatorId: args.indicatorId,
        date: currentData.timestamp,
        value: currentData.value,
        source: currentData.source,
        sourceUrl: currentData.sourceUrl,
        measureType,
      });
      // Mettre à jour les stats du bot Suiveur
      await updateBotActivity(ctx, {
        botSlug: "suiveur",
        indicatorsTracked: 1,
        logMessage: `Indicateur suivi: ${indicator.name} (${measureType})`,
        logLevel: "success",
        functionName: "updateIndicatorDataForDecision",
      });

      return dataId;
    }
  },
});

/**
 * Met à jour tous les indicateurs pour toutes les décisions en suivi
 */
export const updateAllIndicators = action({
  args: {},
  handler: async (ctx): Promise<{
    processed: number;
    results: Array<{
      decisionId: Id<"decisions">;
      updated: number;
      errors: number;
    }>;
  }> => {
    // Récupérer toutes les décisions en cours de suivi
    const decisions = await ctx.runQuery(api.decisions.getDecisions, {
      limit: 100,
      status: "tracking",
    });

    const results: Array<{
      decisionId: Id<"decisions">;
      updated: number;
      errors: number;
    }> = [];

    for (const decision of decisions) {
      let updated = 0;
      let errors = 0;

      // Pour chaque indicateur de la décision
      for (const indicatorId of decision.indicatorIds) {
        try {
          const result = await ctx.runAction(
            api.bots.trackIndicators.updateIndicatorDataForDecision,
            {
              decisionId: decision._id,
              indicatorId,
            }
          );

          if (result) {
            updated++;
          }
        } catch (error) {
          console.error(
            `Error updating indicator ${indicatorId} for decision ${decision._id}:`,
            error
          );
          errors++;
        }
      }

      results.push({
        decisionId: decision._id,
        updated,
        errors,
      });
    }

    // Calculer le total d'indicateurs suivis
    const totalTracked = results.reduce((sum, r) => sum + r.updated, 0);

    // Mettre à jour les stats du bot Suiveur
    if (totalTracked > 0) {
      await updateBotActivity(ctx, {
        botSlug: "suiveur",
        indicatorsTracked: totalTracked,
        logMessage: `${totalTracked} indicateurs suivis pour ${decisions.length} décisions`,
        logLevel: "success",
        functionName: "updateAllIndicators",
      });
    }

    return {
      processed: decisions.length,
      results,
    };
  },
});

