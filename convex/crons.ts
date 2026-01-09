import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

/**
 * Cron jobs pour l'automatisation des Decision Cards
 * 
 * STRATÉGIE POUR L'ACTUALITÉ CHAUDE :
 * - Détection optimale (1h) pour capturer les nouvelles décisions sans être excessif
 * - Équilibrage automatique 50/50 positif/négatif pour éviter l'effet anxiogène
 * - Agrégation intensive pour les décisions récentes (< 24h) toutes les heures
 * - Agrégation complète toutes les 6h pour maintenir à jour toutes les décisions
 */
const crons = cronJobs();

// Détection automatique de nouvelles décisions - toutes les heures
// Équilibre optimal entre réactivité et coûts (24 exécutions/jour)
// Équilibrage automatique 50/50 positif/négatif
crons.interval(
  "detectDecisionsFrequent",
  { hours: 1 },
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

