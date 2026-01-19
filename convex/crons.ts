import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

/**
 * Cron jobs pour l'automatisation des Decision Cards
 * 
 * STRATÉGIE OPTIMISÉE :
 * - Détection optimale (1h) pour capturer les nouvelles prédictions binaires (OUI/NON)
 * - Équilibrage automatique 50/50 positif/négatif pour éviter l'effet anxiogène
 * - Actualités récupérées côté client via RelatedNewsClient (RSS) - Zéro coût backend
 * - Résolution quotidienne des prédictions basée sur les indicateurs
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

// ⚠️ SUPPRIMÉ: Agrégation d'actualités (plus nécessaire)
// Les actualités sont maintenant récupérées côté client via RelatedNewsClient (RSS)
// Cela évite les coûts de stockage et d'API backend

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

// 🎯 FEATURE 2: LE TRADING - Snapshot quotidien des cours d'opinions - tous les jours à minuit UTC
crons.daily(
  "takeOpinionSnapshotsDaily",
  { hourUTC: 0, minuteUTC: 0 },
  internal.trading.takeDailySnapshot,
  {}
);

export default crons;

