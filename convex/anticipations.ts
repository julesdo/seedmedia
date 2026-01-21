import { query, mutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";

/**
 * Récupère les anticipations d'un utilisateur
 */
export const getMyAnticipations = query({
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

    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .order("desc")
      .collect();

    // Enrichir avec les décisions
    const enriched = await Promise.all(
      anticipations.map(async (anticipation) => {
        const decision = await ctx.db.get(anticipation.decisionId);
        return {
          ...anticipation,
          decision,
        };
      })
    );

    return enriched;
  },
});

/**
 * Récupère les anticipations d'un utilisateur par son ID (pour profils publics)
 */
export const getUserAnticipations = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Enrichir avec les décisions
    const enriched = await Promise.all(
      anticipations.map(async (anticipation) => {
        const decision = await ctx.db.get(anticipation.decisionId);
        return {
          ...anticipation,
          decision,
        };
      })
    );

    return enriched;
  },
});

/**
 * Récupère les anticipations résolues d'un utilisateur
 */
export const getUserResolvedAnticipations = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Filtrer les anticipations résolues
    const resolved = anticipations.filter((a) => a.resolved === true).slice(0, limit);

    // Enrichir avec les décisions
    const enriched = await Promise.all(
      resolved.map(async (anticipation) => {
        const decision = await ctx.db.get(anticipation.decisionId);
        return {
          ...anticipation,
          decision,
        };
      })
    );

    return enriched;
  },
});

/**
 * Récupère les anticipations correctes d'un utilisateur (résolues et gagnées)
 */
export const getUserCorrectAnticipations = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Filtrer les anticipations résolues et correctes
    // result === "won" signifie que l'anticipation était correcte
    const correct = anticipations
      .filter((a) => a.resolved === true && a.result === "won")
      .slice(0, limit);

    // Enrichir avec les décisions
    const enriched = await Promise.all(
      correct.map(async (anticipation) => {
        const decision = await ctx.db.get(anticipation.decisionId);
        return {
          ...anticipation,
          decision,
        };
      })
    );

    return enriched;
  },
});

/**
 * Récupère les anticipations pour une décision
 */
export const getAnticipationsForDecision = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    // Enrichir avec les utilisateurs
    const enriched = await Promise.all(
      anticipations.map(async (anticipation) => {
        const user = await ctx.db.get(anticipation.userId);
        return {
          ...anticipation,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                image: user.image,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

/**
 * 🎯 FEATURE 2: LE TRADING - Récupère le portefeuille d'opinions avec variations quotidiennes
 * @deprecated Utiliser getTradingPortfolioWithSnapshots à la place
 */
export const getTradingPortfolio = query({
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

    // Enrichir avec les décisions et calculer les variations
    const portfolio = await Promise.all(
      anticipations.map(async (anticipation) => {
        const decision = await ctx.db.get(anticipation.decisionId);
        if (!decision) return null;

        // Récupérer toutes les anticipations pour cette décision
        const allAnticipations = await ctx.db
          .query("anticipations")
          .withIndex("decisionId", (q) => q.eq("decisionId", anticipation.decisionId))
          .collect();

        // Calculer le pourcentage actuel pour la position de l'utilisateur
        const totalNow = allAnticipations.length;
        const countForUserPosition = allAnticipations.filter(
          (a) => a.position === anticipation.position
        ).length;
        const currentPercentage = totalNow > 0 ? Math.round((countForUserPosition / totalNow) * 100) : 0;

        // Calculer le pourcentage d'hier (anticipations créées il y a plus de 24h)
        const yesterdayTimestamp = Date.now() - 24 * 60 * 60 * 1000;
        const oldAnticipations = allAnticipations.filter(
          (a) => a.createdAt < yesterdayTimestamp
        );
        const totalYesterday = oldAnticipations.length;
        const countForUserPositionYesterday = oldAnticipations.filter(
          (a) => a.position === anticipation.position
        ).length;
        const yesterdayPercentage = totalYesterday > 0 
          ? Math.round((countForUserPositionYesterday / totalYesterday) * 100) 
          : currentPercentage; // Si pas de données hier, utiliser le pourcentage actuel

        // Calculer la variation
        const variation = currentPercentage - yesterdayPercentage;
        const variationPercentage = yesterdayPercentage > 0
          ? Math.round((variation / yesterdayPercentage) * 100)
          : 0;

        return {
          anticipation,
          decision,
          currentPercentage,
          yesterdayPercentage,
          variation,
          variationPercentage,
          isGain: variation > 0,
        };
      })
    );

    // Filtrer les nulls et trier par variation (gains en premier)
    return portfolio
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => b.variation - a.variation);
  },
});

/**
 * Récupère une anticipation spécifique
 */
export const getAnticipation = query({
  args: {
    anticipationId: v.id("anticipations"),
  },
  handler: async (ctx, args) => {
    const anticipation = await ctx.db.get(args.anticipationId);
    if (!anticipation) {
      return null;
    }

    const decision = await ctx.db.get(anticipation.decisionId);
    const user = await ctx.db.get(anticipation.userId);

    return {
      ...anticipation,
      decision,
      user: user
        ? {
            _id: user._id,
            name: user.name,
            image: user.image,
          }
        : null,
    };
  },
});

/**
 * Crée une nouvelle anticipation
 * @deprecated Utiliser buyShares du tradingEngine à la place (PHASE 2)
 * Cette fonction est temporairement conservée pour compatibilité mais sera supprimée
 */
export const createAnticipation = mutation({
  args: {
    decisionId: v.id("decisions"),
    position: v.union(
      v.literal("yes"), // OUI
      v.literal("no") // NON
    ),
    shares: v.number(), // Nombre d'actions à acheter (remplace seedsEngaged)
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      throw new Error("User not found");
    }

    // Vérifier que la décision existe
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error("Decision not found");
    }

    // Vérifier que la décision n'est pas déjà résolue
    if (decision.status === "resolved") {
      throw new Error("Cannot anticipate a resolved decision");
    }

    // Vérifier qu'il n'y a pas déjà une anticipation pour cette décision
    const existing = await ctx.db
      .query("anticipations")
      .withIndex("decisionId_userId", (q) =>
        q.eq("decisionId", args.decisionId).eq("userId", appUser._id)
      )
      .first();

    if (existing) {
      throw new Error("You have already anticipated this decision");
    }

    // TODO: Vérifier que l'utilisateur a assez de Seeds
    // Pour l'instant, on accepte toutes les anticipations

    const now = Date.now();

    // Créer l'anticipation (temporaire - sera remplacé par buyShares)
    const anticipationId = await ctx.db.insert("anticipations", {
      decisionId: args.decisionId,
      userId: appUser._id,
      position: args.position,
      sharesOwned: args.shares,
      totalInvested: 0, // Sera calculé par buyShares
      resolved: false,
      createdAt: now,
      updatedAt: now,
    });

    // Mettre à jour le compteur d'anticipations de la décision
    await ctx.db.patch(args.decisionId, {
      anticipationsCount: decision.anticipationsCount + 1,
      updatedAt: now,
    });

    // 🎯 FEATURE 2: LE TRADING - Enregistrer le cours en temps réel (à chaque vote)
    // On enregistre un "tick" pour avoir l'historique complet jusqu'à la seconde
    try {
      // @ts-ignore - Type instantiation is excessively deep due to complex return type
      await ctx.scheduler.runAfter(0, internal.trading.recordCourseTickAction, {
        decisionId: args.decisionId,
        timestamp: now,
      });
    } catch (error) {
      // Ne pas bloquer si l'enregistrement échoue
      console.error("Error scheduling course tick:", error);
    }

    // 🎯 FEATURE 2: LE TRADING - Mettre à jour le snapshot du cours (non bloquant)
    // On utilise une action pour appeler la mutation interne
    try {
      await ctx.scheduler.runAfter(0, internal.trading.takeSnapshotForDecisionAction, {
        decisionId: args.decisionId,
      });
    } catch (error) {
      // Ne pas bloquer si le snapshot échoue
      console.error("Error scheduling snapshot update:", error);
    }

    // TODO: Débiter les Seeds de l'utilisateur
    // TODO: Créer une transaction Seeds

    // Récompense de participation sera gérée côté client après la création
    // (appelée depuis AnticipationModal et QuizSimple)

    return anticipationId;
  },
});

/**
 * Met à jour une anticipation (avant résolution uniquement)
 * @deprecated Utiliser buyShares/sellShares du tradingEngine à la place (PHASE 2)
 */
export const updateAnticipation = mutation({
  args: {
    anticipationId: v.id("anticipations"),
    position: v.optional(
      v.union(
        v.literal("yes"), // OUI
        v.literal("no") // NON
      )
    ),
    sharesOwned: v.optional(v.number()),
    totalInvested: v.optional(v.number()),
    resolved: v.optional(v.boolean()),
    result: v.optional(
      v.union(
        v.literal("won"), // Gagné
        v.literal("lost") // Perdu
      )
    ),
    seedsEarned: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      throw new Error("User not found");
    }

    const anticipation = await ctx.db.get(args.anticipationId);
    if (!anticipation) {
      throw new Error("Anticipation not found");
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (anticipation.userId !== appUser._id) {
      throw new Error("Not authorized");
    }

    // Si on met à jour une anticipation résolue, on permet seulement certains champs
    if (anticipation.resolved && (args.position !== undefined || args.sharesOwned !== undefined)) {
      throw new Error("Cannot update position or sharesOwned for a resolved anticipation");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.position !== undefined) {
      updateData.position = args.position;
    }

    if (args.sharesOwned !== undefined) {
      updateData.sharesOwned = args.sharesOwned;
    }

    if (args.totalInvested !== undefined) {
      updateData.totalInvested = args.totalInvested;
    }

    if (args.resolved !== undefined) {
      updateData.resolved = args.resolved;
    }

    if (args.result !== undefined) {
      updateData.result = args.result;
    }

    if (args.seedsEarned !== undefined) {
      updateData.seedsEarned = args.seedsEarned;
    }

    await ctx.db.patch(args.anticipationId, updateData);

    return args.anticipationId;
  },
});

