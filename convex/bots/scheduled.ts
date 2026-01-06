import { cronJobs } from "convex/server";
import { api, internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

/**
 * Action interne pour la détection et génération de décisions
 */
export const runDecisionDetection = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Running decision detection...");

    try {
      // Détecter les nouvelles décisions
      const result = await ctx.runAction(api.bots.detectDecisions.detectDecisions, {
        limit: 10,
      });

      console.log(`Detected ${result.detected} potential events`);

      // Pour chaque événement majeur détecté, générer une Decision Card
      for (const detectedEvent of result.events) {
        await ctx.runAction(api.bots.generateDecision.generateDecision, {
          detectedEvent,
        });
      }
    } catch (error) {
      console.error("Error in detectDecisions:", error);
    }
  },
});

/**
 * Action interne pour la traduction des décisions
 */
export const runDecisionTranslation = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Running scheduled decision translations...");

    try {
      // Récupérer les décisions non traduites
      const decisions = await ctx.runQuery(api.decisions.getDecisions, {
        limit: 50,
        status: "announced",
      });

      // Langues supportées (à étendre)
      const languages = ["en", "es", "de", "it", "pt"];

      // Traduire chaque décision dans toutes les langues
      for (const decision of decisions) {
        await ctx.runAction(
          api.decisionTranslations.translateDecisionToAllLanguages,
          {
            decisionId: decision._id,
            languages,
          }
        );
      }
    } catch (error) {
      console.error("Error in translateDecisionsScheduled:", error);
    }
  },
});

/**
 * Cron jobs pour l'automatisation des Decision Cards
 * 
 * STRATÉGIE POUR L'ACTUALITÉ CHAUDE :
 * - Détection fréquente (15 min) pour capturer les nouvelles décisions rapidement
 * - Agrégation intensive pour les décisions récentes (< 24h) toutes les heures
 * - Agrégation complète toutes les 6h pour maintenir à jour toutes les décisions
 */
const crons = cronJobs();

// Détection automatique de nouvelles décisions - toutes les 15 minutes
// Permet de capturer l'actualité chaude rapidement
crons.interval(
  "detectDecisionsFrequent",
  { minutes: 15 },
  internal.bots.scheduled.runDecisionDetection,
  {}
);

// Agrégation d'actualités pour les décisions récentes (< 24h) - toutes les heures
// Focus sur l'actualité chaude : les décisions récentes ont besoin d'actualités fraîches
crons.interval(
  "aggregateNewsRecent",
  { hours: 1 },
  api.bots.aggregateNews.aggregateNewsForRecentDecisions,
  {}
);

// Agrégation d'actualités complète - toutes les 6 heures
// Maintient à jour toutes les décisions en suivi (pas seulement les récentes)
crons.interval(
  "aggregateNewsScheduled",
  { hours: 6 },
  api.bots.aggregateNews.aggregateNewsForAllDecisions,
  {}
);

// Traduction automatique - toutes les 6 heures
crons.interval(
  "translateDecisionsScheduled",
  { hours: 6 },
  internal.bots.scheduled.runDecisionTranslation,
  {}
);

// Mise à jour des indicateurs - tous les jours à 23h UTC (avant la résolution)
// Les indicateurs doivent être à jour avant la résolution des décisions
crons.daily(
  "updateIndicatorsDaily",
  { hourUTC: 23, minuteUTC: 0 },
  api.bots.trackIndicators.updateAllIndicators,
  {}
);

// Résolution automatique des décisions - tous les jours à minuit UTC
crons.daily(
  "resolveDecisionsDaily",
  { hourUTC: 0, minuteUTC: 0 },
  api.bots.resolveDecisions.resolveAllEligibleDecisions,
  {}
);

// Résolution des anticipations - tous les jours à 1h UTC (après la résolution des décisions)
crons.daily(
  "resolveAnticipationsDaily",
  { hourUTC: 1, minuteUTC: 0 },
  api.bots.resolveAnticipations.resolveAllAnticipations,
  {}
);

export default crons;
