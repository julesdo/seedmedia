import { query, mutation, internalAction, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { internal, api } from "./_generated/api";
import { betterAuthComponent } from "./auth";
import {
  calculateSlope,
  calculateGhostSupply,
  getCurrentPrice,
  getCurrentPriceAdjusted,
  calculateBuyCost,
  calculateBuyCostAdjusted,
  calculateSellGross,
  calculateSellGrossAdjusted,
  calculateSellNet,
  normalizeBinaryPrices,
  normalizeBinaryPricesFromRealPrices,
  calculatePoolLiquidity,
  calculateInvestmentWindow,
} from "./tradingEngine";

/**
 * 🎯 FEATURE 2: LE TRADING - Prend un snapshot quotidien des cours d'opinions
 * Appelé par un cron job chaque jour à minuit
 */
export const takeDailySnapshot = internalAction({
  args: {},
  returns: v.object({
    success: v.boolean(),
    snapshotsCreated: v.number(),
  }),
  handler: async (ctx): Promise<{ success: boolean; snapshotsCreated: number }> => {
    const now = Date.now();
    // Calculer le début de la journée UTC (00:00:00)
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    const snapshotDate = today.getTime();

    const decisions: Array<{ _id: Id<"decisions"> }> = await ctx.runQuery(internal.trading.getActiveDecisions);

    for (const decision of decisions) {
      const existingSnapshot = await ctx.runQuery(internal.trading.getSnapshotForDate, {
        decisionId: decision._id,
        snapshotDate,
      });

      if (existingSnapshot) {
        await ctx.runMutation(internal.trading.updateSnapshot, {
          snapshotId: existingSnapshot._id,
          decisionId: decision._id,
          snapshotDate,
        });
      } else {
        await ctx.runMutation(internal.trading.createSnapshot, {
          decisionId: decision._id,
          snapshotDate,
        });
      }
    }
    return { success: true, snapshotsCreated: decisions.length };
  },
});

/**
 * Récupère toutes les décisions non résolues - internal query
 */
export const getActiveDecisions = internalQuery({
  args: {},
  handler: async (ctx) => {
    const decisions = await ctx.db
      .query("decisions")
      .withIndex("status", (q) => q.eq("status", "tracking"))
      .collect();

    return decisions;
  },
});

/**
 * Récupère un snapshot pour une date donnée - internal query
 */
export const getSnapshotForDate = internalQuery({
  args: {
    decisionId: v.id("decisions"),
    snapshotDate: v.number(),
  },
  handler: async (ctx, args) => {
    const snapshot = await ctx.db
      .query("opinionSnapshots")
      .withIndex("decisionId_snapshotDate", (q) =>
        q.eq("decisionId", args.decisionId).eq("snapshotDate", args.snapshotDate)
      )
      .first();

    return snapshot;
  },
});

/**
 * Calcule le cours d'une position basé sur les votes (anticipations)
 * @deprecated Cette fonction sera remplacée par la bonding curve dans PHASE 2
 */
async function calculatePositionPrice(
  ctx: any,
  decisionId: Id<"decisions">,
  position: "yes" | "no"
): Promise<number> {
  // Récupérer toutes les anticipations pour cette décision
  const anticipations = await ctx.db
    .query("anticipations")
    .withIndex("decisionId", (q: any) => q.eq("decisionId", decisionId))
    .collect();

  if (anticipations.length === 0) {
    return 10; // Prix de base si aucun vote
  }

  // Compter les votes pour chaque position (système binaire)
  const totalVotes = anticipations.length;
  const yesVotes = anticipations.filter((a: Doc<"anticipations">) => a.position === "yes").length;
  const noVotes = anticipations.filter((a: Doc<"anticipations">) => a.position === "no").length;

  // Calculer le nombre de votes pour la position demandée
  const positionVotes = position === "yes" ? yesVotes : noVotes;

  // Calculer le pourcentage de votes pour cette position
  const percentage = totalVotes > 0 ? (positionVotes / totalVotes) * 100 : 0;

  // Formule du cours : 
  // - Base : 10 Seeds
  // - + (pourcentage * 2) : chaque % de vote = +2 Seeds
  // - + (nombre de votes * 0.5) : chaque vote = +0.5 Seeds (pour encourager la participation)
  // Exemple : 50% avec 100 votes = 10 + (50 * 2) + (100 * 0.5) = 10 + 100 + 50 = 160 Seeds
  const price = Math.round(10 + (percentage * 2) + (positionVotes * 0.5));
  
  // Minimum 10 Seeds, maximum 1000 Seeds
  return Math.max(10, Math.min(1000, price));
}

/**
 * Crée un nouveau snapshot (internal mutation)
 */
export const createSnapshot = internalMutation({
  args: {
    decisionId: v.id("decisions"),
    snapshotDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Récupérer toutes les anticipations pour cette décision
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    const total = anticipations.length;
    const yesCount = anticipations.filter((a) => a.position === "yes").length;
    const noCount = anticipations.filter((a) => a.position === "no").length;

    // 🎯 Calculer les cours d'action (en Seeds) - Système binaire
    const yesPrice = await calculatePositionPrice(ctx, args.decisionId, "yes");
    const noPrice = await calculatePositionPrice(ctx, args.decisionId, "no");

    await ctx.db.insert("opinionSnapshots", {
      decisionId: args.decisionId,
      snapshotDate: args.snapshotDate,
      yesPrice,
      noPrice,
      totalAnticipations: total,
      yesCount,
      noCount,
      createdAt: Date.now(),
    });
  },
});

/**
 * Met à jour un snapshot existant (internal mutation)
 */
export const updateSnapshot = internalMutation({
  args: {
    snapshotId: v.id("opinionSnapshots"),
    decisionId: v.id("decisions"),
    snapshotDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Récupérer toutes les anticipations pour cette décision
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    const total = anticipations.length;
    const yesCount = anticipations.filter((a) => a.position === "yes").length;
    const noCount = anticipations.filter((a) => a.position === "no").length;

    // 🎯 Calculer les cours d'action (en Seeds) - Système binaire
    const yesPrice = await calculatePositionPrice(ctx, args.decisionId, "yes");
    const noPrice = await calculatePositionPrice(ctx, args.decisionId, "no");

    await ctx.db.patch(args.snapshotId, {
      yesPrice,
      noPrice,
      totalAnticipations: total,
      yesCount,
      noCount,
    });
  },
});

/**
 * Action wrapper pour prendre un snapshot (appelé depuis createAnticipation)
 */
export const takeSnapshotForDecisionAction = internalAction({
  args: {
    decisionId: v.id("decisions"),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await ctx.runMutation(internal.trading.takeSnapshotForDecision, {
      decisionId: args.decisionId,
    });
    return null;
  },
});

/**
 * Prend un snapshot immédiat pour une décision (utile pour les nouvelles décisions)
 */
export const takeSnapshotForDecision = internalMutation({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const today = new Date(now);
    today.setUTCHours(0, 0, 0, 0);
    const snapshotDate = today.getTime();

    // Vérifier si un snapshot existe déjà pour aujourd'hui
    const existingSnapshot = await ctx.db
      .query("opinionSnapshots")
      .withIndex("decisionId_snapshotDate", (q) =>
        q.eq("decisionId", args.decisionId).eq("snapshotDate", snapshotDate)
      )
      .first();

    // Récupérer toutes les anticipations pour cette décision
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    const total = anticipations.length;
    const yesCount = anticipations.filter((a) => a.position === "yes").length;
    const noCount = anticipations.filter((a) => a.position === "no").length;

    // 🎯 Calculer les cours d'action (en Seeds) - Système binaire
    const yesPrice = await calculatePositionPrice(ctx, args.decisionId, "yes");
    const noPrice = await calculatePositionPrice(ctx, args.decisionId, "no");

    if (existingSnapshot) {
      // Mettre à jour le snapshot existant
      await ctx.db.patch(existingSnapshot._id, {
        yesPrice,
        noPrice,
        totalAnticipations: total,
        yesCount,
        noCount,
      });
    } else {
      // Créer un nouveau snapshot
      await ctx.db.insert("opinionSnapshots", {
        decisionId: args.decisionId,
        snapshotDate,
        yesPrice,
        noPrice,
        totalAnticipations: total,
        yesCount,
        noCount,
        createdAt: now,
      });
    }
  },
});

/**
 * 🎯 FEATURE 2: LE TRADING - Récupère l'historique des cours en temps réel (pour graphique avec zoom)
 * Retourne les ticks enregistrés à chaque vote + le cours actuel
 */
export const getDecisionCourseHistory = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    // Récupérer la décision pour obtenir targetPrice et createdAt
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      return {
        history: [],
        current: { yes: 0, no: 0, total: 0 },
      };
    }

    // 🎯 UTILISER LES TRANSACTIONS INDIVIDUELLES au lieu des ticks
    // Chaque transaction est un point de données sur le graphique
    const transactions = await ctx.db
      .query("tradingTransactions")
      .withIndex("decisionId_timestamp", (q) => q.eq("decisionId", args.decisionId))
      .order("asc")
      .collect();

    // Récupérer aussi les ticks existants (pour compatibilité)
    const ticks = await ctx.db
      .query("opinionCourseTicks")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .order("asc")
      .collect();

    // 🎯 Récupérer les pools de trading pour obtenir le prix IPO initial
    const yesPool = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId_position", (q) => q.eq("decisionId", args.decisionId).eq("position", "yes"))
      .first();
    
    const noPool = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId_position", (q) => q.eq("decisionId", args.decisionId).eq("position", "no"))
      .first();

    // 🎯 Calculer la LIQUIDITÉ de chaque pool (reserve = liquidité réelle)
    // Utiliser calculatePoolLiquidity pour cohérence
    const targetPrice = decision.targetPrice ?? 50;
    const yesLiquidity = calculatePoolLiquidity(yesPool, targetPrice);
    const noLiquidity = calculatePoolLiquidity(noPool, targetPrice);
    
    // 🎯 NORMALISATION BINAIRE : Corrélation inverse STRICTE basée sur la liquidité
    // Si OUI a 60% de la liquidité, NON a 40% (TOUJOURS inversement corrélé)
    // Si quelqu'un achète OUI → yesLiquidity augmente → OUI monte, NON baisse
    const initialLiquidity = (decision.targetPrice ?? 50) * 2; // Liquidité initiale (targetPrice × 2)
    const normalized = normalizeBinaryPrices(yesLiquidity, noLiquidity, initialLiquidity);
    const currentYesPrice = normalized.yes;
    const currentNoPrice = normalized.no;

    const now = Date.now();

    // Récupérer les anticipations pour le total actuel
    const allAnticipations = await ctx.db
      .query("anticipations")
      .withIndex("decisionId", (q: any) => q.eq("decisionId", args.decisionId))
      .collect();

    const totalNow = allAnticipations.length;

    // 🎯 UTILISER LES PRIX ENREGISTRÉS (FIGÉS) AU LIEU DE RECALCULER
    // Les prix historiques doivent être figés et ne jamais changer
    // On utilise les ticks enregistrés qui contiennent les prix normalisés au moment exact
    const history: Array<{ time: number; timestamp: number; yes: number; no: number; total: number }> = [];
    
    // 🎯 PRIORITÉ 1 : Utiliser les ticks enregistrés (prix normalisés figés)
    // Ces prix ont été enregistrés au moment exact et ne doivent jamais changer
    ticks.forEach((tick) => {
      history.push({
        time: Math.floor(tick.timestamp / 1000),
        timestamp: tick.timestamp,
        yes: tick.yesPrice, // Prix normalisé enregistré (FIGÉ)
        no: tick.noPrice, // Prix normalisé enregistré (FIGÉ)
        total: tick.totalAnticipations,
      });
    });
    
    // 🎯 PRIORITÉ 2 : Si pas de tick pour une transaction, utiliser le prix normalisé enregistré
    // Les transactions récentes ont pricePerShareNormalized enregistré
    transactions.forEach((transaction) => {
      // Vérifier si un tick existe déjà pour ce timestamp
      const tickExists = ticks.some((tick) => Math.abs(tick.timestamp - transaction.timestamp) < 1000);
      
      if (!tickExists && transaction.pricePerShareNormalized !== undefined) {
        // Utiliser le prix normalisé enregistré dans la transaction
        // Pour obtenir les deux prix (OUI et NON), on doit recalculer à partir du prix enregistré
        // Mais seulement si on n'a pas de tick pour ce moment
        // Note: On ne peut pas obtenir les deux prix à partir d'un seul pricePerShareNormalized
        // Donc on saute ces transactions si pas de tick correspondant
      }
    });

    // 🚀 AJOUTER LE POINT IPO SI IL N'EXISTE PAS DÉJÀ
    // Le point IPO est le prix initial basé sur targetPrice (liquidité initiale)
    // On le calcule une seule fois et il reste figé
    if (ticks.length === 0) {
      // À l'IPO, les deux pools ont la même liquidité initiale (targetPrice)
      const ipoLiquidity = decision.targetPrice ?? 50;
      const initialLiquidity = ipoLiquidity * 2; // Liquidité initiale (targetPrice × 2)
      
      // Normaliser les prix IPO pour la corrélation inverse (50/50 au départ)
      const ipoNormalized = normalizeBinaryPrices(ipoLiquidity, ipoLiquidity, initialLiquidity);
      
      // Utiliser createdAt de la décision comme timestamp IPO
      const ipoTimestamp = decision.createdAt || now;
      
      history.push({
        time: Math.floor(ipoTimestamp / 1000),
        timestamp: ipoTimestamp,
        yes: ipoNormalized.yes,
        no: ipoNormalized.no,
        total: 0, // Aucune anticipation au moment de l'IPO
      });
    }

    // 🎯 AJOUTER LE PRIX ACTUEL (seul prix qui doit être recalculé)
    // Tous les autres prix sont figés dans les ticks
    const lastTick = ticks.length > 0 ? ticks[ticks.length - 1] : null;
    const lastHistoryPoint = history.length > 0 ? history[history.length - 1] : null;
    
    // Vérifier si on doit ajouter le point actuel (seulement si différent du dernier tick)
    let shouldAddCurrent = false;
    if (!lastTick && !lastHistoryPoint) {
      // Aucun point n'existe, ajouter le point actuel
      shouldAddCurrent = true;
    } else if (lastTick) {
      // Comparer avec le dernier tick enregistré (prix figé)
      // Le prix actuel peut être différent si une nouvelle transaction a eu lieu
      if (Math.abs(lastTick.yesPrice - currentYesPrice) > 0.01 || 
          Math.abs(lastTick.noPrice - currentNoPrice) > 0.01) {
        shouldAddCurrent = true;
      }
    } else if (lastHistoryPoint) {
      // Comparer avec le dernier point de l'historique (IPO)
      if (Math.abs(lastHistoryPoint.yes - currentYesPrice) > 0.01 || 
          Math.abs(lastHistoryPoint.no - currentNoPrice) > 0.01) {
        shouldAddCurrent = true;
      }
    }
    
    if (shouldAddCurrent) {
      history.push({
        time: Math.floor(now / 1000),
        timestamp: now,
        yes: currentYesPrice, // Prix actuel (recalculé maintenant)
        no: currentNoPrice, // Prix actuel (recalculé maintenant)
        total: totalNow,
      });
    }

    // Trier par timestamp pour s'assurer que l'ordre est correct
    history.sort((a, b) => a.timestamp - b.timestamp);

    return {
      history,
      current: {
        yes: currentYesPrice,
        no: currentNoPrice,
        total: totalNow,
      },
    };
  },
});

export const getTradingPortfolioWithSnapshots = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return [];
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return [];
    }

    // Récupérer toutes les anticipations non résolues de l'utilisateur
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .filter((q) => q.eq(q.field("resolved"), false))
      .order("desc")
      .collect();

    // Enrichir avec les décisions et calculer les variations basées sur snapshots
    const portfolio = await Promise.all(
      anticipations.map(async (anticipation) => {
        const decision = await ctx.db.get(anticipation.decisionId);
        if (!decision) return null;

        // Récupérer toutes les anticipations pour cette décision (pour le cours actuel)
        const allAnticipations = await ctx.db
          .query("anticipations")
          .withIndex("decisionId", (q) => q.eq("decisionId", anticipation.decisionId))
          .collect();

        // Calculer le pourcentage actuel (système binaire)
        const totalNow = allAnticipations.length;
        const countForUserPosition = allAnticipations.filter(
          (a) => a.position === anticipation.position
        ).length;
        const currentPercentage = totalNow > 0 ? Math.round((countForUserPosition / totalNow) * 100) : 0;

        // Récupérer le snapshot d'hier
        const yesterday = new Date();
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        yesterday.setUTCHours(0, 0, 0, 0);
        const yesterdaySnapshotDate = yesterday.getTime();

        const yesterdaySnapshot = await ctx.db
          .query("opinionSnapshots")
          .withIndex("decisionId_snapshotDate", (q) =>
            q.eq("decisionId", anticipation.decisionId).eq("snapshotDate", yesterdaySnapshotDate)
          )
          .first();

        // Calculer la variation basée sur le snapshot d'hier (système binaire)
        let yesterdayPercentage = currentPercentage;
        if (yesterdaySnapshot) {
          // Utiliser le pourcentage du snapshot d'hier pour la position de l'utilisateur
          const yesterdayTotal = yesterdaySnapshot.totalAnticipations;
          if (anticipation.position === "yes") {
            yesterdayPercentage = yesterdayTotal > 0 
              ? Math.round((yesterdaySnapshot.yesCount / yesterdayTotal) * 100) 
              : currentPercentage;
          } else {
            yesterdayPercentage = yesterdayTotal > 0 
              ? Math.round((yesterdaySnapshot.noCount / yesterdayTotal) * 100) 
              : currentPercentage;
          }
        }

        const variation = currentPercentage - yesterdayPercentage;
        const variationPercentage = yesterdayPercentage > 0 
          ? Math.round((variation / yesterdayPercentage) * 100) 
          : 0;
        const isGain = variation > 0;

        return {
          anticipation,
          decision,
          currentPercentage,
          yesterdayPercentage,
          variation,
          variationPercentage,
          isGain,
        };
      })
    );

    return portfolio.filter((p) => p !== null);
  },
});

/**
 * Action wrapper pour enregistrer un tick de cours (appelé depuis createAnticipation)
 */
export const recordCourseTickAction = internalAction({
  args: {
    decisionId: v.id("decisions"),
    timestamp: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await ctx.runMutation(internal.trading.recordCourseTick, {
      decisionId: args.decisionId,
      timestamp: args.timestamp,
    });
    return null;
  },
});

/**
 * 🎯 FEATURE 2: LE TRADING - Enregistre un "tick" de cours en temps réel (appelé à chaque vote)
 * Permet de voir les variations jusqu'à la seconde
 */
export const recordCourseTick = internalMutation({
  args: {
    decisionId: v.id("decisions"),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // 🎯 Calculer les cours actuels (en Seeds) basés sur la bonding curve - Système binaire
    // Utiliser la bonding curve au lieu de l'ancien système de votes
    
    // Récupérer les pools de trading
    const yesPool = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId_position", (q) => q.eq("decisionId", args.decisionId).eq("position", "yes"))
      .first();
    
    const noPool = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId_position", (q) => q.eq("decisionId", args.decisionId).eq("position", "no"))
      .first();

    // 🎯 Calculer la LIQUIDITÉ de chaque pool (reserve = liquidité réelle)
    // Utiliser calculatePoolLiquidity pour cohérence
    const decision = await ctx.db.get(args.decisionId);
    const targetPrice = decision?.targetPrice ?? 50;
    const yesLiquidity = calculatePoolLiquidity(yesPool, targetPrice);
    const noLiquidity = calculatePoolLiquidity(noPool, targetPrice);
    
    // 🎯 NORMALISATION BINAIRE : Corrélation inverse STRICTE basée sur la liquidité
    const initialLiquidity = targetPrice * 2; // Liquidité initiale
    const normalized = normalizeBinaryPrices(yesLiquidity, noLiquidity, initialLiquidity);
    const yesPrice = normalized.yes;
    const noPrice = normalized.no;

    // Récupérer toutes les anticipations pour les compteurs
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("decisionId", (q: any) => q.eq("decisionId", args.decisionId))
      .collect();

    const total = anticipations.length;
    const yesCount = anticipations.filter((a: Doc<"anticipations">) => a.position === "yes").length;
    const noCount = anticipations.filter((a: Doc<"anticipations">) => a.position === "no").length;

    // Enregistrer le tick avec les prix normalisés
    await ctx.db.insert("opinionCourseTicks", {
      decisionId: args.decisionId,
      timestamp: args.timestamp,
      yesPrice,
      noPrice,
      totalAnticipations: total,
      yesCount,
      noCount,
    });
  },
});

/**
 * 🔧 MIGRATION: Met à jour tous les snapshots existants pour ajouter les prix manquants
 * À exécuter une seule fois après l'ajout des champs worksPrice, partialPrice, failsPrice
 */
export const migrateSnapshotsWithPrices = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    snapshotsUpdated: v.number(),
  }),
  handler: async (ctx): Promise<{ success: boolean; snapshotsUpdated: number }> => {
    // Cette migration n'est plus nécessaire - les snapshots sont créés avec yesPrice/noPrice
    // Gardée pour rétrocompatibilité mais ne fait rien
    // Les anciens snapshots avec worksPrice/partialPrice/failsPrice seront ignorés
    return {
      success: true,
      snapshotsUpdated: 0,
    };
  },
});

/**
 * 🚀 IPO (Initial Political Offering) - Initialise les pools de trading OUI/NON
 * 
 * Cette fonction implémente la stratégie IPO qui transforme chaque prédiction
 * en un marché financier dès la première seconde, sans attendre de liquidité.
 * 
 * STRATÉGIE IPO :
 * 
 * 1. PRIX DE DÉPART (targetPrice) :
 *    - Entre 1 Seed (improbable) et 99 Seeds (quasi-certain)
 *    - Exemple : Poutine réélu = 90 Seeds, Météorite sur Paris = 1 Seed
 * 
 * 2. PROFONDEUR DU MARCHÉ (depthFactor) :
 *    - Faible (500) : Marché "Meme Coin" - Volatil, peu d'achats = gros mouvement
 *    - Élevée (10000) : Marché "Blue Chip" - Stable, beaucoup de Seeds = petit mouvement
 * 
 * 3. MÉCANISME (Pre-Minting / Ghost Supply) :
 *    - slope = 100 / depthFactor (pente de la bonding curve)
 *    - ghostSupply = targetPrice / slope (actions fantômes pour simuler le prix initial)
 *    - Prix initial = slope × ghostSupply = targetPrice ✅
 * 
 * 4. RÉSULTAT :
 *    - Le marché démarre immédiatement au prix cible
 *    - Pas besoin de liquidité initiale (la "Banque" vend toujours)
 *    - Guidage de l'opinion via le prix de départ
 *    - Création de "Moonshots" sur les sujets buzz (faible profondeur)
 * 
 * @param decisionId - ID de la décision
 */
export const initializeTradingPools = internalMutation({
  args: {
    decisionId: v.id("decisions"),
  },
  returns: v.object({
    success: v.boolean(),
    poolsCreated: v.number(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; poolsCreated: number }> => {
    // Récupérer la décision
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error(`Decision ${args.decisionId} not found`);
    }

    // Vérifier que les pools n'existent pas déjà
    const existingPools = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    if (existingPools.length > 0) {
      // Les pools existent déjà, ne rien faire
      return {
        success: true,
        poolsCreated: 0,
      };
    }

    // 🎯 Récupérer les paramètres IPO de la décision
    // targetPrice : Prix de départ souhaité (1-99 Seeds)
    // depthFactor : Profondeur du marché (500 = volatile, 10000 = stable)
    const targetPrice = decision.targetPrice ?? 50; // Valeur par défaut (probabilité moyenne)
    const depthFactor = decision.depthFactor ?? 5000; // Valeur par défaut (marché modéré)

    // 🎯 Calculer les paramètres de la bonding curve linéaire : P(S) = m × S
    // Étape 1 : Calculer la pente m = 100 / depthFactor
    const slope = calculateSlope(depthFactor);
    
    // Étape 2 : Calculer le Supply Fantôme S_ghost = targetPrice / m
    // Cela simule qu'il y a déjà des actions en circulation pour atteindre le prix cible
    const ghostSupply = calculateGhostSupply(targetPrice, slope);
    
    // Vérification : getCurrentPrice(slope, ghostSupply) doit égaler targetPrice
    // slope × ghostSupply = slope × (targetPrice / slope) = targetPrice ✅

    const now = Date.now();

    // 🎯 Initialiser la réserve avec targetPrice pour cohérence
    // La liquidité initiale = prix initial = targetPrice
    const initialReserve = targetPrice;

    // Créer le pool OUI
    const yesPoolId = await ctx.db.insert("tradingPools", {
      decisionId: args.decisionId,
      position: "yes",
      slope,
      ghostSupply,
      realSupply: 0, // Commence à 0
      reserve: initialReserve, // Initialisé avec targetPrice
      createdAt: now,
      updatedAt: now,
    });

    // Créer le pool NON
    const noPoolId = await ctx.db.insert("tradingPools", {
      decisionId: args.decisionId,
      position: "no",
      slope,
      ghostSupply,
      realSupply: 0, // Commence à 0
      reserve: initialReserve, // Initialisé avec targetPrice
      createdAt: now,
      updatedAt: now,
    });

    // 🎯 Créer le tick initial (IPO) pour le graphique
    // À l'IPO, les deux pools ont la même liquidité initiale (targetPrice)
    // Cela crée un ratio 50/50 au départ
    // Utiliser calculatePoolLiquidity pour cohérence (maintenant que reserve = targetPrice)
    const yesPool = await ctx.db.get(yesPoolId);
    const noPool = await ctx.db.get(noPoolId);
    const ipoYesLiquidity = calculatePoolLiquidity(yesPool, targetPrice);
    const ipoNoLiquidity = calculatePoolLiquidity(noPool, targetPrice);
    
    // Normaliser les prix IPO pour la corrélation inverse (50/50 au départ)
    const initialLiquidity = targetPrice * 2; // Liquidité initiale (targetPrice × 2)
    const ipoNormalized = normalizeBinaryPrices(ipoYesLiquidity, ipoNoLiquidity, initialLiquidity);

    // Enregistrer le point IPO dans l'historique pour affichage sur le graphique
    await ctx.db.insert("opinionCourseTicks", {
      decisionId: args.decisionId,
      timestamp: now, // Timestamp de création de la décision (origine temporelle)
      yesPrice: ipoNormalized.yes, // Prix initial OUI normalisé (50 Seeds si targetPrice = 50)
      noPrice: ipoNormalized.no, // Prix initial NON normalisé (50 Seeds si targetPrice = 50)
      totalAnticipations: 0, // Aucun vote encore
      yesCount: 0,
      noCount: 0,
    });
    
    // Log pour debugging
    console.log(`🚀 IPO créée pour décision ${args.decisionId}:`, {
      targetPrice,
      depthFactor,
      slope,
      ghostSupply,
      ipoYesLiquidity,
      ipoNoLiquidity,
      normalizedYes: ipoNormalized.yes,
      normalizedNo: ipoNormalized.no,
    });

    return {
      success: true,
      poolsCreated: 2,
    };
  },
});

/**
 * 🎯 PHASE 2.3: Acheter des actions (shares) pour une position OUI/NON
 * 
 * Calcule le coût via bonding curve, débite les Seeds de l'utilisateur,
 * crédite les actions et met à jour la réserve du pool.
 * 
 * @param decisionId - ID de la décision
 * @param position - Position ("yes" ou "no")
 * @param shares - Nombre d'actions à acheter
 */
export const buyShares = mutation({
  args: {
    decisionId: v.id("decisions"),
    position: v.union(v.literal("yes"), v.literal("no")),
    shares: v.number(),
  },
  handler: async (ctx, args) => {
    // Vérifier l'authentification
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Vous devez être connecté pour acheter des actions");
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      throw new Error("Utilisateur non trouvé");
    }

    // Vérifier que la décision existe et n'est pas résolue
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error("Décision non trouvée");
    }
    if (decision.status === "resolved") {
      throw new Error("Cette décision est déjà résolue");
    }

    // Vérifier que les pools existent
    const pool = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId_position", (q) =>
        q.eq("decisionId", args.decisionId).eq("position", args.position)
      )
      .first();

    if (!pool) {
      throw new Error("Pool de trading non initialisé pour cette décision");
    }

    // 🎯 Calculer le coût total via bonding curve avec ajustement liquidité + probabilité
    const totalSupply = pool.ghostSupply + pool.realSupply;
    const cost = calculateBuyCostAdjusted(pool.slope, pool.ghostSupply, pool.realSupply, args.shares);
    const pricePerShare = getCurrentPriceAdjusted(pool.slope, pool.ghostSupply, pool.realSupply);

    // Vérifier que l'utilisateur a assez de Seeds
    const currentBalance = (appUser.seedsBalance || 0);
    if (currentBalance < cost) {
      throw new Error(`Solde insuffisant. Vous avez ${currentBalance} Seeds, il en faut ${cost}`);
    }

    const now = Date.now();

    // Mettre à jour le pool : ajouter les actions et la réserve
    await ctx.db.patch(pool._id, {
      realSupply: pool.realSupply + args.shares,
      reserve: pool.reserve + cost,
      updatedAt: now,
    });

    // 🎯 Calculer le prix normalisé APRÈS la transaction
    // Récupérer les deux pools pour normaliser
    const updatedPool = await ctx.db.get(pool._id);
    const otherPool = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId_position", (q) =>
        q.eq("decisionId", args.decisionId).eq("position", args.position === "yes" ? "no" : "yes")
      )
      .first();
    
    const targetPrice = decision.targetPrice ?? 50;
    const yesLiquidity = calculatePoolLiquidity(
      args.position === "yes" ? updatedPool : otherPool,
      targetPrice
    );
    const noLiquidity = calculatePoolLiquidity(
      args.position === "yes" ? otherPool : updatedPool,
      targetPrice
    );
    const initialLiquidity = targetPrice * 2; // Liquidité initiale
    const normalized = normalizeBinaryPrices(yesLiquidity, noLiquidity, initialLiquidity);
    const pricePerShareNormalized = args.position === "yes" ? normalized.yes : normalized.no;

    // Débiter les Seeds de l'utilisateur
    const newBalance = currentBalance - cost;
    const levelInfo = await ctx.runQuery(api.gamification.getLevelInfo, {
      totalSeeds: newBalance,
    });

    await ctx.runMutation(api.users.updateUserSeeds, {
      userId: appUser._id,
      seedsBalance: newBalance,
      level: levelInfo.level,
      seedsToNextLevel: levelInfo.seedsToNextLevel,
    });

    // Créer une transaction Seeds
    await ctx.runMutation(api.seedsTransactions.createTransaction, {
      userId: appUser._id,
      type: "lost",
      amount: cost,
      reason: `Achat de ${args.shares} actions ${args.position === "yes" ? "OUI" : "NON"}`,
      relatedId: args.decisionId,
      relatedType: "trading",
      levelBefore: appUser.level || 1,
      levelAfter: levelInfo.level,
    });

    // Créer une transaction de trading
    await ctx.db.insert("tradingTransactions", {
      decisionId: args.decisionId,
      userId: appUser._id,
      position: args.position,
      type: "buy",
      shares: args.shares,
      cost: cost,
      pricePerShare: pricePerShare,
      pricePerShareNormalized: pricePerShareNormalized,
      timestamp: now,
      createdAt: now,
    });

    // Mettre à jour ou créer l'anticipation
    const existingAnticipation = await ctx.db
      .query("anticipations")
      .withIndex("decisionId_userId", (q) =>
        q.eq("decisionId", args.decisionId).eq("userId", appUser._id)
      )
      .filter((q) => q.eq(q.field("position"), args.position))
      .first();

    if (existingAnticipation) {
      // Mettre à jour l'anticipation existante
      await ctx.db.patch(existingAnticipation._id, {
        sharesOwned: existingAnticipation.sharesOwned + args.shares,
        totalInvested: existingAnticipation.totalInvested + cost,
        updatedAt: now,
      });
    } else {
      // Créer une nouvelle anticipation
      await ctx.db.insert("anticipations", {
        decisionId: args.decisionId,
        userId: appUser._id,
        position: args.position,
        sharesOwned: args.shares,
        totalInvested: cost,
        resolved: false,
        createdAt: now,
        updatedAt: now,
      });

      // Mettre à jour le compteur d'anticipations de la décision
      await ctx.db.patch(args.decisionId, {
        anticipationsCount: (decision.anticipationsCount || 0) + 1,
        updatedAt: now,
      });
    }

    // 🎯 Enregistrer un tick de cours immédiatement après la transaction
    await ctx.scheduler.runAfter(0, internal.trading.recordCourseTickAction, {
      decisionId: args.decisionId,
      timestamp: now,
    });

    return {
      success: true,
      cost,
      pricePerShare,
      shares: args.shares,
      newBalance,
    };
  },
});

/**
 * 🎯 PHASE 2.3: Vendre des actions (shares) pour une position OUI/NON
 * 
 * Calcule le montant brut via bonding curve, applique la taxe de 5%,
 * crédite les Seeds à l'utilisateur et met à jour la réserve du pool.
 * 
 * @param decisionId - ID de la décision
 * @param position - Position ("yes" ou "no")
 * @param shares - Nombre d'actions à vendre
 */
export const sellShares = mutation({
  args: {
    decisionId: v.id("decisions"),
    position: v.union(v.literal("yes"), v.literal("no")),
    shares: v.number(),
  },
  handler: async (ctx, args) => {
    // Vérifier l'authentification
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Vous devez être connecté pour vendre des actions");
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      throw new Error("Utilisateur non trouvé");
    }

    // Vérifier que la décision existe et n'est pas résolue
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error("Décision non trouvée");
    }
    if (decision.status === "resolved") {
      throw new Error("Cette décision est déjà résolue");
    }

    // Vérifier que l'utilisateur a une anticipation avec assez d'actions
    const anticipation = await ctx.db
      .query("anticipations")
      .withIndex("decisionId_userId", (q) =>
        q.eq("decisionId", args.decisionId).eq("userId", appUser._id)
      )
      .filter((q) => q.eq(q.field("position"), args.position))
      .first();

    if (!anticipation || anticipation.sharesOwned < args.shares) {
      throw new Error(`Vous n'avez pas assez d'actions à vendre. Vous possédez ${anticipation?.sharesOwned || 0} actions`);
    }

    // Récupérer le pool
    const pool = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId_position", (q) =>
        q.eq("decisionId", args.decisionId).eq("position", args.position)
      )
      .first();

    if (!pool) {
      throw new Error("Pool de trading non initialisé pour cette décision");
    }

    // Vérifier que le pool a assez de réserve pour payer
    const totalSupply = pool.ghostSupply + pool.realSupply;
    if (pool.realSupply < args.shares) {
      throw new Error("Le pool n'a pas assez d'actions en circulation");
    }

    const now = Date.now();

    // 🎯 Calculer le montant brut et net via bonding curve avec ajustement liquidité + probabilité
    const gross = calculateSellGrossAdjusted(pool.slope, pool.ghostSupply, pool.realSupply, args.shares);
    
    // Calculer la durée de détention pour la taxe progressive
    const holdingDurationMs = now - anticipation.createdAt;
    const net = calculateSellNet(gross, holdingDurationMs);
    
    const pricePerShare = getCurrentPriceAdjusted(pool.slope, pool.ghostSupply, pool.realSupply);

    // Vérifier que le pool a assez de réserve
    if (pool.reserve < gross) {
      throw new Error("Le pool n'a pas assez de liquidité pour cette vente");
    }

    // Mettre à jour le pool : retirer les actions et la réserve
    await ctx.db.patch(pool._id, {
      realSupply: pool.realSupply - args.shares,
      reserve: pool.reserve - gross, // On retire le montant brut (les 5% sont brûlés)
      updatedAt: now,
    });

    // 🎯 Calculer le prix normalisé APRÈS la transaction
    // Récupérer les deux pools pour normaliser
    const updatedPool = await ctx.db.get(pool._id);
    const otherPool = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId_position", (q) =>
        q.eq("decisionId", args.decisionId).eq("position", args.position === "yes" ? "no" : "yes")
      )
      .first();
    
    const targetPrice = decision.targetPrice ?? 50;
    const yesLiquidity = calculatePoolLiquidity(
      args.position === "yes" ? updatedPool : otherPool,
      targetPrice
    );
    const noLiquidity = calculatePoolLiquidity(
      args.position === "yes" ? otherPool : updatedPool,
      targetPrice
    );
    const initialLiquidity = targetPrice * 2; // Liquidité initiale
    const normalized = normalizeBinaryPrices(yesLiquidity, noLiquidity, initialLiquidity);
    const pricePerShareNormalized = args.position === "yes" ? normalized.yes : normalized.no;

    // Créditer les Seeds à l'utilisateur (montant net après taxe)
    const currentBalance = (appUser.seedsBalance || 0);
    const newBalance = currentBalance + net;
    const levelInfo = await ctx.runQuery(api.gamification.getLevelInfo, {
      totalSeeds: newBalance,
    });

    await ctx.runMutation(api.users.updateUserSeeds, {
      userId: appUser._id,
      seedsBalance: newBalance,
      level: levelInfo.level,
      seedsToNextLevel: levelInfo.seedsToNextLevel,
    });

    // Créer une transaction Seeds
    await ctx.runMutation(api.seedsTransactions.createTransaction, {
      userId: appUser._id,
      type: "earned",
      amount: net,
      reason: `Vente de ${args.shares} actions ${args.position === "yes" ? "OUI" : "NON"} (taxe: ${(gross - net).toFixed(2)} Seeds)`,
      relatedId: args.decisionId,
      relatedType: "trading",
      levelBefore: appUser.level || 1,
      levelAfter: levelInfo.level,
    });

    // Créer une transaction de trading
    await ctx.db.insert("tradingTransactions", {
      decisionId: args.decisionId,
      userId: appUser._id,
      position: args.position,
      type: "sell",
      shares: args.shares,
      cost: gross, // Montant brut
      netAmount: net, // Montant net après taxe
      pricePerShare: pricePerShare,
      pricePerShareNormalized: pricePerShareNormalized,
      timestamp: now,
      createdAt: now,
    });

    // Mettre à jour l'anticipation
    const newSharesOwned = anticipation.sharesOwned - args.shares;
    if (newSharesOwned === 0) {
      // Supprimer l'anticipation si l'utilisateur n'a plus d'actions
      await ctx.db.delete(anticipation._id);
      
      // Mettre à jour le compteur d'anticipations de la décision
      await ctx.db.patch(args.decisionId, {
        anticipationsCount: Math.max(0, (decision.anticipationsCount || 0) - 1),
        updatedAt: now,
      });
    } else {
      // Mettre à jour l'anticipation
      // Note: totalInvested reste le même (on ne retire pas l'investissement initial)
      await ctx.db.patch(anticipation._id, {
        sharesOwned: newSharesOwned,
        updatedAt: now,
      });
    }

    return {
      success: true,
      gross,
      net,
      fee: gross - net,
      pricePerShare,
      shares: args.shares,
      newBalance,
    };
  },
});

/**
 * 🎯 FOMO : Calcule la fenêtre d'investissement variable pour une décision
 * 
 * @param decisionId - ID de la décision
 * @returns Durée en millisecondes pendant laquelle l'investissement est disponible
 */
export const getInvestmentWindow = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      return null;
    }

    // Récupérer les pools pour calculer le volume total d'actions achetées
    const pools = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();
    
    // Calculer le volume total d'actions achetées (realSupply des deux pools)
    const totalSharesPurchased = pools.reduce((total, pool) => {
      return total + (pool.realSupply || 0);
    }, 0);

    const now = Date.now();
    
    return calculateInvestmentWindow({
      heat: decision.heat || 50,
      type: decision.type,
      sentiment: decision.sentiment || "neutral",
      eventDate: decision.date,
      createdAt: decision.createdAt,
      anticipationsCount: decision.anticipationsCount || 0,
      totalSharesPurchased,
      now,
    });
  },
});

/**
 * 🎯 PHASE 2.4: Récupère les pools de trading pour une décision
 * 
 * @param decisionId - ID de la décision
 * @returns Les deux pools (OUI et NON) avec leurs états actuels
 */
export const getTradingPools = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const pools = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    // Séparer les pools OUI et NON
    const yesPool = pools.find((p) => p.position === "yes");
    const noPool = pools.find((p) => p.position === "no");

    // Si les pools n'existent pas, les initialiser
    if (!yesPool || !noPool) {
      // Les pools seront initialisés automatiquement lors de la prochaine création
      return {
        yes: null,
        no: null,
      };
    }

    // 🎯 Calculer la LIQUIDITÉ de chaque pool (reserve = liquidité réelle)
    // Utiliser calculatePoolLiquidity pour cohérence
    const decision = await ctx.db.get(args.decisionId);
    const targetPrice = decision?.targetPrice ?? 50;
    const yesLiquidity = calculatePoolLiquidity(yesPool, targetPrice);
    const noLiquidity = calculatePoolLiquidity(noPool, targetPrice);
    
    // Calculer les totalSupply pour le return
    const yesTotalSupply = yesPool.ghostSupply + yesPool.realSupply;
    const noTotalSupply = noPool.ghostSupply + noPool.realSupply;
    
    // 🎯 NOUVEAU SYSTÈME : Prix cohérents basés sur bonding curve avec corrélation inverse
    // Calculer les prix RÉELS via bonding curve (cohérent avec trading)
    const realPriceYes = getCurrentPriceAdjusted(yesPool.slope, yesPool.ghostSupply, yesPool.realSupply);
    const realPriceNo = getCurrentPriceAdjusted(noPool.slope, noPool.ghostSupply, noPool.realSupply);
    
    // Normaliser pour corrélation inverse (UX) tout en gardant cohérence avec prix réel
    // Le prix normalisé = probabilité (0-100%) pour l'affichage
    const normalized = normalizeBinaryPricesFromRealPrices(realPriceYes, realPriceNo);
    const yesPrice = normalized.yes; // Prix normalisé (probabilité 0-100%)
    const noPrice = normalized.no; // Prix normalisé (probabilité 0-100%)

    return {
      yes: {
        ...yesPool,
        currentPrice: yesPrice, // Prix normalisé (probabilité) pour affichage
        realPrice: realPriceYes, // Prix réel de bonding curve pour calcul multiplicateur (quote)
        totalSupply: yesTotalSupply,
      },
      no: {
        ...noPool,
        currentPrice: noPrice, // Prix normalisé (probabilité) pour affichage
        realPrice: realPriceNo, // Prix réel de bonding curve pour calcul multiplicateur (quote)
        totalSupply: noTotalSupply,
      },
    };
  },
});

/**
 * 🎯 NOUVEAU : Récupère la probabilité unique (cote unique style Polymarket)
 * 
 * @param decisionId - ID de la décision
 * @returns La probabilité que l'événement se produise (0-100%)
 */
export const getSingleOdds = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    // Récupérer les pools OUI et NON
    const yesPool = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId_position", (q) =>
        q.eq("decisionId", args.decisionId).eq("position", "yes")
      )
      .first();
    
    const noPool = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId_position", (q) =>
        q.eq("decisionId", args.decisionId).eq("position", "no")
      )
      .first();

    // Récupérer la décision pour targetPrice
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error("Décision non trouvée");
    }
    const targetPrice = decision.targetPrice ?? 50;

    // Si les pools n'existent pas encore, retourner la probabilité initiale
    if (!yesPool || !noPool) {
      return targetPrice; // targetPrice est déjà une probabilité (1-99)
    }

    // 🎯 Calculer la LIQUIDITÉ de chaque pool
    const yesLiquidity = calculatePoolLiquidity(yesPool, targetPrice);
    const noLiquidity = calculatePoolLiquidity(noPool, targetPrice);
    
    // 🎯 Calculer la probabilité = ratio de liquidité OUI
    const totalLiquidity = yesLiquidity + noLiquidity;
    if (totalLiquidity <= 0) {
      return targetPrice; // Par défaut, retourner la probabilité initiale
    }
    
    // Probabilité = (liquidité OUI / liquidité totale) × 100
    const probability = (yesLiquidity / totalLiquidity) * 100;
    
    // Arrondir à 2 décimales et s'assurer que c'est entre 0 et 100
    return Math.max(0, Math.min(100, Math.round(probability * 100) / 100));
  },
});

/**
 * 🎯 PHASE 2.4: Récupère le prix actuel d'une position
 * 
 * @param decisionId - ID de la décision
 * @param position - Position ("yes" ou "no")
 * @returns Le prix unitaire actuel en Seeds
 */
export const getCurrentPriceForPosition = query({
  args: {
    decisionId: v.id("decisions"),
    position: v.union(v.literal("yes"), v.literal("no")),
  },
  handler: async (ctx, args) => {
    // Récupérer les deux pools pour normaliser
    const yesPool = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId_position", (q) =>
        q.eq("decisionId", args.decisionId).eq("position", "yes")
      )
      .first();
    
    const noPool = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId_position", (q) =>
        q.eq("decisionId", args.decisionId).eq("position", "no")
      )
      .first();

    if (!yesPool || !noPool) {
      // Si les pools n'existent pas encore, retourner le prix initial basé sur targetPrice
      const decision = await ctx.db.get(args.decisionId);
      if (!decision) {
        throw new Error("Décision non trouvée");
      }
      const targetPrice = decision.targetPrice ?? 50;
      // Normaliser même pour le prix initial (utiliser prix réel = targetPrice)
      const normalized = normalizeBinaryPricesFromRealPrices(targetPrice, targetPrice);
      return args.position === "yes" ? normalized.yes : normalized.no;
    }

    // 🎯 NOUVEAU SYSTÈME : Calculer les prix RÉELS via bonding curve
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error("Décision non trouvée");
    }
    const targetPrice = decision.targetPrice ?? 50;
    // 🎯 Utiliser les prix ajustés selon liquidité + probabilité pour chaque pool
    const yesPrice = getCurrentPriceAdjusted(yesPool.slope, yesPool.ghostSupply, yesPool.realSupply);
    const noPrice = getCurrentPriceAdjusted(noPool.slope, noPool.ghostSupply, noPool.realSupply);
    
    // Retourner le prix ajusté pour la position demandée
    return args.position === "yes" ? yesPrice : noPrice;
  },
});

/**
 * 🎯 PHASE 2.4: Récupère le portefeuille de trading d'un utilisateur
 * 
 * @param decisionId - ID de la décision (optionnel, si non fourni retourne tous les portefeuilles)
 * @returns Les anticipations (actions possédées) de l'utilisateur
 */
export const getUserPortfolio = query({
  args: {
    decisionId: v.optional(v.id("decisions")),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return [];
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return [];
    }

    // Récupérer les anticipations de l'utilisateur
    let anticipations;
    if (args.decisionId) {
      const decisionId = args.decisionId; // Type narrowing pour TypeScript
      anticipations = await ctx.db
        .query("anticipations")
        .withIndex("decisionId_userId", (q) =>
          q.eq("decisionId", decisionId).eq("userId", appUser._id)
        )
        .collect();
    } else {
      anticipations = await ctx.db
        .query("anticipations")
        .withIndex("userId", (q) => q.eq("userId", appUser._id))
        .collect();
    }

    // Enrichir avec les informations des pools et décisions
    const enriched = await Promise.all(
      anticipations.map(async (anticipation) => {
        const decision = await ctx.db.get(anticipation.decisionId);
        if (!decision) {
          return null;
        }

        // Récupérer le pool correspondant
        const pool = await ctx.db
          .query("tradingPools")
          .withIndex("decisionId_position", (q) =>
            q.eq("decisionId", anticipation.decisionId).eq("position", anticipation.position)
          )
          .first();

        if (!pool) {
          return {
            ...anticipation,
            decision,
            currentPrice: decision.targetPrice ?? 50,
            totalSupply: 0,
            estimatedValue: anticipation.sharesOwned * (decision.targetPrice ?? 50),
            averageBuyPrice: anticipation.totalInvested / anticipation.sharesOwned,
          };
        }

        // 🎯 Calculer le prix actuel et la valeur estimée avec ajustement liquidité + probabilité
        const totalSupply = pool.ghostSupply + pool.realSupply;
        const currentPrice = getCurrentPriceAdjusted(pool.slope, pool.ghostSupply, pool.realSupply);
        const estimatedValue = anticipation.sharesOwned * currentPrice;
        const averageBuyPrice = anticipation.totalInvested / anticipation.sharesOwned;
        const profit = estimatedValue - anticipation.totalInvested;
        
        // 🎯 Calculer le pourcentage sur la TENDANCE ACTUELLE (maintenant)
        // Variation du prix actuel par rapport au prix moyen d'achat
        // Cela représente la tendance à l'instant présent, pas le retour sur investissement total
        const profitPercentage = averageBuyPrice > 0
          ? ((currentPrice - averageBuyPrice) / averageBuyPrice) * 100
          : 0;

        return {
          ...anticipation,
          decision,
          currentPrice,
          totalSupply,
          estimatedValue,
          averageBuyPrice,
          profit,
          profitPercentage,
        };
      })
    );

    // Filtrer les null (décisions supprimées)
    return enriched.filter((item) => item !== null);
  },
});

/**
 * Récupère toutes les anticipations pour une décision (pour Top Holders)
 */
export const getDecisionAnticipations = query({
  args: {
    decisionId: v.id("decisions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    // Enrichir avec les infos utilisateur
    const enriched = await Promise.all(
      anticipations.map(async (anticipation) => {
        const user = await ctx.db.get(anticipation.userId);
        return {
          ...anticipation,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
                username: user.username,
              }
            : null,
        };
      })
    );

    return enriched.slice(0, limit);
  },
});

/**
 * 🎯 PHASE 2.4: Récupère l'historique des transactions de trading
 * 
 * @param decisionId - ID de la décision (optionnel)
 * @param limit - Nombre maximum de transactions à retourner (défaut: 50)
 * @returns L'historique des transactions
 */
export const getTradingHistory = query({
  args: {
    decisionId: v.optional(v.id("decisions")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    let transactions;
    if (args.decisionId) {
      const decisionId = args.decisionId; // Type narrowing pour TypeScript
      transactions = await ctx.db
        .query("tradingTransactions")
        .withIndex("decisionId_timestamp", (q) =>
          q.eq("decisionId", decisionId)
        )
        .order("desc") // Ordre décroissant pour l'activité (plus récent en premier)
        .take(limit);
    } else {
      transactions = await ctx.db
        .query("tradingTransactions")
        .order("desc")
        .take(limit);
    }

    // Enrichir avec les informations des utilisateurs et décisions
    const enriched = await Promise.all(
      transactions.map(async (transaction) => {
        const user = await ctx.db.get(transaction.userId);
        const decision = await ctx.db.get(transaction.decisionId);

        return {
          ...transaction,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
              }
            : null,
          decision: decision
            ? {
                _id: decision._id,
                title: decision.title,
                slug: decision.slug,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

/**
 * 🎯 PHASE 2.4: Récupère l'historique des transactions d'un utilisateur spécifique
 * 
 * @param userId - ID de l'utilisateur (optionnel, si non fourni utilise l'utilisateur connecté)
 * @param decisionId - ID de la décision (optionnel)
 * @param limit - Nombre maximum de transactions à retourner (défaut: 50)
 * @returns L'historique des transactions de l'utilisateur
 */
export const getUserTradingHistory = query({
  args: {
    userId: v.optional(v.id("users")),
    decisionId: v.optional(v.id("decisions")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser && !args.userId) {
      return [];
    }

    // Utiliser l'utilisateur fourni ou l'utilisateur connecté
    let targetUserId: Id<"users">;
    if (args.userId) {
      targetUserId = args.userId;
    } else {
      const appUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", betterAuthUser!.email))
        .first();
      if (!appUser) {
        return [];
      }
      targetUserId = appUser._id;
    }

    const limit = args.limit || 50;

    // Récupérer les transactions
    let transactions;
    if (args.decisionId) {
      const decisionId = args.decisionId; // Type narrowing pour TypeScript
      transactions = await ctx.db
        .query("tradingTransactions")
        .withIndex("decisionId_timestamp", (q) =>
          q.eq("decisionId", decisionId)
        )
        .filter((q) => q.eq(q.field("userId"), targetUserId))
        .order("desc")
        .take(limit);
    } else {
      transactions = await ctx.db
        .query("tradingTransactions")
        .withIndex("userId_createdAt", (q) => q.eq("userId", targetUserId))
        .order("desc")
        .take(limit);
    }

    // Enrichir avec les informations des décisions
    const enriched = await Promise.all(
      transactions.map(async (transaction) => {
        const decision = await ctx.db.get(transaction.decisionId);

        return {
          ...transaction,
          decision: decision
            ? {
                _id: decision._id,
                title: decision.title,
                slug: decision.slug,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

/**
 * 🎯 PHASE 3: Liquidation "Winner Takes All" (Compatible Trading Continu)
 * 
 * Ce qui se passe ici :
 * 1. Le marché est fermé (plus de buy/sell possibles).
 * 2. On regarde ce qu'il reste dans les caisses (Réserves) après tous les trades.
 * 3. Les survivants (ceux qui n'ont pas vendu) se partagent le butin.
 * 
 * IMPORTANT : Compatible avec le trading continu
 * - Les traders qui ont vendu avant ("payout") sont déjà partis avec leur argent
 * - Les "holders" (ceux qui ont gardé jusqu'à la fin) se partagent le pot restant
 * - Le pot peut être plus petit si beaucoup de gens ont vendu (bank run)
 * 
 * Formule du prix final : FinalPrice = (Reserve_OUI + Reserve_NON) / RealSupply_GAGNANT
 * (Seul le Real Supply compte, on ignore le Ghost Supply pour le partage)
 * 
 * @param decisionId - ID de la décision résolue
 * @param winner - Position gagnante ("yes" ou "no")
 */
export const liquidatePools = internalMutation({
  args: {
    decisionId: v.id("decisions"),
    winner: v.union(v.literal("yes"), v.literal("no")),
  },
  returns: v.object({
    success: v.boolean(),
    winnerPool: v.object({
      position: v.union(v.literal("yes"), v.literal("no")),
      finalPrice: v.number(),
      totalReserve: v.number(),
      realSupply: v.number(),
      usersPaid: v.number(),
    }),
    loserPool: v.object({
      position: v.union(v.literal("yes"), v.literal("no")),
      reserveLost: v.number(),
    }),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    winnerPool: {
      position: "yes" | "no";
      finalPrice: number;
      totalReserve: number;
      realSupply: number;
      usersPaid: number;
    };
    loserPool: {
      position: "yes" | "no";
      reserveLost: number;
    };
  }> => {
    // Récupérer les deux pools
    const pools = await ctx.db
      .query("tradingPools")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    const yesPool = pools.find((p) => p.position === "yes");
    const noPool = pools.find((p) => p.position === "no");

    if (!yesPool || !noPool) {
      throw new Error("Pools de trading non trouvés pour cette décision");
    }

    // Déterminer le pool gagnant et perdant
    const winnerPool = args.winner === "yes" ? yesPool : noPool;
    const loserPool = args.winner === "yes" ? noPool : yesPool;
    
    const now = Date.now();

    // 🚨 COEUR DU SYSTÈME 🚨
    // On calcule le POT FINAL DISPONIBLE.
    // Ce pot contient : 
    // - L'argent des acheteurs du GAGNANT (qui n'ont pas vendu)
    // - L'argent restant des acheteurs du PERDANT (ceux qui ont cru au miracle jusqu'au bout)
    // - Note : Ceux qui ont vendu avant ("payout") sont déjà partis avec leur argent.
    const totalPotAvailable = winnerPool.reserve + loserPool.reserve;

    // Calcul du PRIX FINAL DE CLÔTURE
    // C'est la valeur d'une action pour ceux qui sont restés jusqu'au bout.
    // Formule : Tout l'argent restant / Toutes les actions gagnantes restantes
    // IMPORTANT : On utilise le pot réel disponible, pas le prix de bonding curve
    // Car si beaucoup de gens ont vendu, les réserves peuvent être vidées
    let finalResolutionPrice = 0;
    if (winnerPool.realSupply > 0) {
      finalResolutionPrice = totalPotAvailable / winnerPool.realSupply;
    }
    
    // ✅ GARANTIE : Le prix final reflète ce qui reste réellement dans les caisses
    // Si beaucoup ont vendu avant (bank run), le pot est plus petit
    // Les holders se partagent ce qui reste (bonus ou malus selon les cas)
    
    // Mettre à jour le pool gagnant : transférer tout le pot
    await ctx.db.patch(winnerPool._id, {
      reserve: totalPotAvailable, // Toute la réserve disponible (OUI + NON)
      updatedAt: now,
    });

    // Mettre à jour le pool perdant : liquider (réserve = 0)
    await ctx.db.patch(loserPool._id, {
      reserve: 0, // Liquidé
      updatedAt: now,
    });

    // Récupérer toutes les anticipations du gagnant
    const winnerAnticipations = await ctx.db
      .query("anticipations")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .filter((q) => q.eq(q.field("position"), args.winner))
      .filter((q) => q.eq(q.field("resolved"), false))
      .collect();

    // Créditer les Seeds aux détenteurs d'actions du gagnant
    let usersPaid = 0;
    for (const anticipation of winnerAnticipations) {
      if (anticipation.sharesOwned === 0) {
        continue; // Pas d'actions, rien à payer
      }

      // 🎯 Calculer le montant à payer (basé sur le pot final disponible)
      // Le prix final = pot disponible / actions restantes
      // C'est le "bonus de résolution" pour ceux qui ont tenu jusqu'au bout
      const payout = anticipation.sharesOwned * finalResolutionPrice;

      // Récupérer l'utilisateur
      const user = await ctx.db.get(anticipation.userId);
      if (!user) {
        continue; // Utilisateur supprimé, on skip
      }

      // Créditer les Seeds
      const currentBalance = (user.seedsBalance || 0);
      const newBalance = currentBalance + payout;
      const levelInfo = await ctx.runQuery(api.gamification.getLevelInfo, {
        totalSeeds: newBalance,
      });

      await ctx.runMutation(api.users.updateUserSeeds, {
        userId: anticipation.userId,
        seedsBalance: newBalance,
        level: levelInfo.level,
        seedsToNextLevel: levelInfo.seedsToNextLevel,
      });

      // Créer une transaction Seeds
      await ctx.runMutation(api.seedsTransactions.createTransaction, {
        userId: anticipation.userId,
        type: "earned",
        amount: payout,
        reason: `Résolution: ${args.winner === "yes" ? "OUI" : "NON"} gagnant (${anticipation.sharesOwned} actions × ${finalResolutionPrice.toFixed(2)} Seeds)`,
        relatedId: args.decisionId,
        relatedType: "trading_resolution",
        levelBefore: user.level || 1,
        levelAfter: levelInfo.level,
      });

      // Mettre à jour l'anticipation comme résolue
      await ctx.db.patch(anticipation._id, {
        resolved: true,
        resolvedAt: now,
        result: "won",
        seedsEarned: payout,
        updatedAt: now,
      });

      usersPaid++;
    }

    // Marquer toutes les anticipations du perdant comme perdues
    const loserAnticipations = await ctx.db
      .query("anticipations")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .filter((q) => q.eq(q.field("position"), args.winner === "yes" ? "no" : "yes"))
      .filter((q) => q.eq(q.field("resolved"), false))
      .collect();

    for (const anticipation of loserAnticipations) {
      await ctx.db.patch(anticipation._id, {
        resolved: true,
        resolvedAt: now,
        result: "lost",
        seedsEarned: 0, // Perdu, pas de remboursement
        updatedAt: now,
      });
    }

    return {
      success: true,
      winnerPool: {
        position: args.winner,
        finalPrice: finalResolutionPrice,
        totalReserve: totalPotAvailable,
        realSupply: winnerPool.realSupply,
        usersPaid,
      },
      loserPool: {
        position: args.winner === "yes" ? "no" : "yes",
        reserveLost: loserPool.reserve,
      },
    };
  },
});

/**
 * 🎯 Récupère l'historique du ROI du portefeuille dans le temps
 * Calcule le ROI quotidien basé sur les transactions et les snapshots
 */
export const getPortfolioROIHistory = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return [];
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return [];
    }

    // Récupérer toutes les transactions de l'utilisateur
    const transactions = await ctx.db
      .query("tradingTransactions")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .order("asc")
      .collect();

    if (transactions.length === 0) {
      // Si pas de transactions, retourner le point actuel basé sur le portefeuille
      // Calculer directement le portefeuille
      const anticipations = await ctx.db
        .query("anticipations")
        .withIndex("userId", (q) => q.eq("userId", appUser._id))
        .collect();

      let totalInvested = 0;
      let totalValue = 0;

      for (const anticipation of anticipations) {
        const decision = await ctx.db.get(anticipation.decisionId);
        if (!decision) continue;

        const pool = await ctx.db
          .query("tradingPools")
          .withIndex("decisionId_position", (q) =>
            q.eq("decisionId", anticipation.decisionId).eq("position", anticipation.position)
          )
          .first();

        if (pool) {
          const totalSupply = pool.ghostSupply + pool.realSupply;
          const currentPrice = getCurrentPriceAdjusted(pool.slope, pool.ghostSupply, pool.realSupply);
          totalInvested += anticipation.totalInvested;
          totalValue += anticipation.sharesOwned * currentPrice;
        } else {
          totalInvested += anticipation.totalInvested;
          totalValue += anticipation.sharesOwned * (decision.targetPrice ?? 50);
        }
      }

      const totalProfit = totalValue - totalInvested;
      const roiPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

      const now = new Date();
      now.setUTCHours(0, 0, 0, 0);

      return [{
        timestamp: now.getTime(),
        totalInvested,
        totalValue,
        totalProfit,
        roiPercent,
      }];
    }

    // Trouver la première et dernière transaction
    const firstTx = transactions[0];
    const lastTx = transactions[transactions.length - 1];
    
    if (!firstTx) {
      return [];
    }

    // Calculer la plage de dates (du premier jour de transaction à aujourd'hui)
    const firstDate = new Date(firstTx.timestamp);
    firstDate.setUTCHours(0, 0, 0, 0);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Grouper les transactions par jour
    const transactionsByDay = new Map<number, typeof transactions>();
    
    transactions.forEach((tx) => {
      const date = new Date(tx.timestamp);
      date.setUTCHours(0, 0, 0, 0);
      const dayTimestamp = date.getTime();
      
      if (!transactionsByDay.has(dayTimestamp)) {
        transactionsByDay.set(dayTimestamp, []);
      }
      transactionsByDay.get(dayTimestamp)!.push(tx);
    });

    // Calculer le ROI pour chaque jour de la plage
    const dailyROI: Array<{
      timestamp: number;
      totalInvested: number;
      totalValue: number;
      totalProfit: number;
      roiPercent: number;
    }> = [];

    // Parcourir chaque jour de la première transaction à aujourd'hui
    const currentDate = new Date(firstDate);
    while (currentDate <= today) {
      const dayTimestamp = currentDate.getTime();
      const dayEndTimestamp = dayTimestamp + 86400000 - 1; // Fin de journée
      
      // 🎯 Calculer l'investissement cumulé jusqu'à ce jour
      let totalInvested = 0;
      for (const tx of transactions) {
        if (tx.timestamp <= dayEndTimestamp) {
          if (tx.type === "buy") {
            totalInvested += tx.cost;
          } else if (tx.type === "sell") {
            // Pour les ventes, retirer le coût initial estimé
            // On utilise le coût brut comme approximation du coût initial
            totalInvested -= tx.cost;
          }
        }
      }

      // 🎯 Calculer la valeur réelle du portefeuille à ce jour
      // Pour chaque décision/position, reconstruire l'historique des parts possédées
      const positionsMap = new Map<string, {
        decisionId: Id<"decisions">;
        position: "yes" | "no";
        sharesOwned: number;
        totalInvested: number;
        firstBuyDate: number;
      }>();

      // Reconstruire l'historique des positions à ce jour
      for (const tx of transactions) {
        if (tx.timestamp > dayEndTimestamp) continue;
        
        const key = `${tx.decisionId}_${tx.position}`;
        
        if (tx.type === "buy") {
          const existing = positionsMap.get(key);
          if (existing) {
            existing.sharesOwned += tx.shares;
            existing.totalInvested += tx.cost;
          } else {
            positionsMap.set(key, {
              decisionId: tx.decisionId,
              position: tx.position,
              sharesOwned: tx.shares,
              totalInvested: tx.cost,
              firstBuyDate: tx.timestamp,
            });
          }
        } else if (tx.type === "sell") {
          const existing = positionsMap.get(key);
          if (existing) {
            existing.sharesOwned -= tx.shares;
            // On ne retire pas totalInvested car c'est le coût initial total
            // (on garde le prix moyen d'achat basé sur l'investissement initial)
          }
        }
      }

      // Calculer la valeur totale du portefeuille à ce jour
      let totalValue = 0;

      for (const [key, position] of positionsMap.entries()) {
        if (position.sharesOwned <= 0) continue; // Position vendue complètement

        const decision = await ctx.db.get(position.decisionId);
        if (!decision) continue;

        // 🎯 Récupérer le snapshot pour ce jour (ou le plus proche avant)
        let snapshot = await ctx.db
          .query("opinionSnapshots")
          .withIndex("decisionId_snapshotDate", (q) =>
            q.eq("decisionId", decision._id).eq("snapshotDate", dayTimestamp)
          )
          .first();

        // Si pas de snapshot exact, chercher le plus récent avant ce jour
        if (!snapshot) {
          const allSnapshots = await ctx.db
            .query("opinionSnapshots")
            .withIndex("decisionId", (q) => q.eq("decisionId", decision._id))
            .filter((q) => q.lte(q.field("snapshotDate"), dayTimestamp))
            .order("desc")
            .first();
          
          snapshot = allSnapshots || null;
        }

        // 🎯 Calculer le prix historique pour cette position
        let historicalPrice: number;
        
        if (snapshot) {
          // Utiliser le prix du snapshot (en Seeds)
          historicalPrice = position.position === "yes" 
            ? snapshot.yesPrice 
            : snapshot.noPrice;
        } else {
          // Pas de snapshot : utiliser le prix initial (targetPrice)
          historicalPrice = decision.targetPrice ?? 50;
        }

        // Calculer la valeur de cette position à ce jour
        totalValue += position.sharesOwned * historicalPrice;
      }

      // Calculer le profit et le ROI
      const totalProfit = totalValue - totalInvested;
      const roiPercent = totalInvested > 0 
        ? (totalProfit / totalInvested) * 100 
        : 0;

      dailyROI.push({
        timestamp: dayTimestamp,
        totalInvested,
        totalValue,
        totalProfit,
        roiPercent,
      });

      // Passer au jour suivant
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Toujours ajouter le point actuel (aujourd'hui) pour avoir au moins 2 points
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .collect();

    let totalInvested = 0;
    let totalValue = 0;

    for (const anticipation of anticipations) {
      const decision = await ctx.db.get(anticipation.decisionId);
      if (!decision) continue;

      const pool = await ctx.db
        .query("tradingPools")
        .withIndex("decisionId_position", (q) =>
          q.eq("decisionId", anticipation.decisionId).eq("position", anticipation.position)
        )
        .first();

      if (pool) {
        const totalSupply = pool.ghostSupply + pool.realSupply;
        const currentPrice = getCurrentPriceAdjusted(pool.slope, pool.ghostSupply, pool.realSupply);
        totalInvested += anticipation.totalInvested;
        totalValue += anticipation.sharesOwned * currentPrice;
      } else {
        totalInvested += anticipation.totalInvested;
        totalValue += anticipation.sharesOwned * (decision.targetPrice ?? 50);
      }
    }

    const totalProfit = totalValue - totalInvested;
    const roiPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    const todayTimestamp = now.getTime();

    // Ajouter le point d'aujourd'hui si différent du dernier point
    const lastPoint = dailyROI.length > 0 ? dailyROI[dailyROI.length - 1] : null;
    if (!lastPoint || 
        lastPoint.timestamp < todayTimestamp || 
        Math.abs(lastPoint.roiPercent - roiPercent) > 0.01 ||
        Math.abs(lastPoint.totalProfit - totalProfit) > 0.01) {
      dailyROI.push({
        timestamp: todayTimestamp,
        totalInvested,
        totalValue,
        totalProfit,
        roiPercent,
      });
    }

    // Si on n'a qu'un seul point, ajouter un point initial (jour de la première transaction)
    if (dailyROI.length === 1 && transactions.length > 0) {
      const firstTxDate = new Date(firstTx.timestamp);
      firstTxDate.setUTCHours(0, 0, 0, 0);
      const firstDayTimestamp = firstTxDate.getTime();
      
      // Ajouter un point initial avec ROI à 0%
      dailyROI.unshift({
        timestamp: firstDayTimestamp,
        totalInvested: 0,
        totalValue: 0,
        totalProfit: 0,
        roiPercent: 0,
      });
    }

    return dailyROI;
  },
});

