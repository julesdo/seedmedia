import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";

const BOOST_COST = 500; // Coût en Seeds
const BOOST_DURATION = 60 * 60 * 1000; // 1 heure en millisecondes

/**
 * 🎯 FEATURE 4: LE MÉGAPHONE - Booste une décision
 */
export const boostDecision = mutation({
  args: {
    decisionId: v.id("decisions"),
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

    // Vérifier que l'utilisateur a assez de Seeds
    if ((appUser.seedsBalance || 0) < BOOST_COST) {
      throw new Error(`Vous n'avez pas assez de Seeds. Vous avez ${appUser.seedsBalance || 0} Seeds, mais vous devez payer ${BOOST_COST} Seeds.`);
    }

    const now = Date.now();

    // Vérifier s'il y a déjà un boost actif
    const activeBoosts = await ctx.db
      .query("decisionBoosts")
      .withIndex("decisionId_expiresAt", (q) =>
        q.eq("decisionId", args.decisionId)
      )
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    // Si un boost est déjà actif, on ajoute du temps au boost existant (surenchère)
    let expiresAt: number;
    if (activeBoosts.length > 0) {
      // Trouver le boost avec le expiresAt le plus récent
      const latestBoost = activeBoosts.reduce((latest, boost) => 
        boost.expiresAt > latest.expiresAt ? boost : latest
      );
      // Ajouter la durée au temps restant
      expiresAt = latestBoost.expiresAt + BOOST_DURATION;
    } else {
      // Pas de boost actif, créer un nouveau boost
      expiresAt = now + BOOST_DURATION;
    }

    // Créer le boost (même si un boost existe déjà, on enregistre qui a surenchéri)
    await ctx.db.insert("decisionBoosts", {
      decisionId: args.decisionId,
      userId: appUser._id,
      duration: BOOST_DURATION,
      createdAt: now,
      expiresAt, // Nouveau expiresAt avec le temps ajouté
      seedsSpent: BOOST_COST,
    });

    // Débiter les Seeds de l'utilisateur
    const levelBefore = appUser.level || 1;
    await ctx.db.patch(appUser._id, {
      seedsBalance: (appUser.seedsBalance || 0) - BOOST_COST,
      updatedAt: now,
    });

    // Calculer le nouveau niveau
    const newSeedsBalance = (appUser.seedsBalance || 0) - BOOST_COST;
    const levelAfter = Math.floor(Math.sqrt(newSeedsBalance / 100)) + 1;

    // Créer une transaction de dépense
    await ctx.db.insert("seedsTransactions", {
      userId: appUser._id,
      type: "lost",
      amount: BOOST_COST,
      reason: "decision_boost",
      relatedId: args.decisionId,
      relatedType: "decision",
      levelBefore,
      levelAfter,
      createdAt: now,
    });

    // Calculer le temps total restant
    const totalTimeRemaining = expiresAt - now;
    const hoursRemaining = Math.floor(totalTimeRemaining / (60 * 60 * 1000));
    const minutesRemaining = Math.floor((totalTimeRemaining % (60 * 60 * 1000)) / (60 * 1000));

    return { 
      success: true, 
      expiresAt,
      totalTimeRemaining,
      hoursRemaining,
      minutesRemaining,
      wasAlreadyBoosted: activeBoosts.length > 0,
    };
  },
});

/**
 * Récupère les boosts actifs pour une décision
 */
export const getActiveBoosts = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const activeBoosts = await ctx.db
      .query("decisionBoosts")
      .withIndex("decisionId_expiresAt", (q) =>
        q.eq("decisionId", args.decisionId)
      )
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .order("desc")
      .collect();

    // Enrichir avec les infos utilisateurs
    const enriched = await Promise.all(
      activeBoosts.map(async (boost) => {
        const user = await ctx.db.get(boost.userId);
        return {
          ...boost,
          user: user ? {
            _id: user._id,
            name: user.name,
            image: user.image,
            username: user.username,
          } : null,
        };
      })
    );

    return enriched;
  },
});

/**
 * Récupère le temps total restant pour un boost (expiresAt le plus récent)
 */
export const getTotalBoostTimeRemaining = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const activeBoosts = await ctx.db
      .query("decisionBoosts")
      .withIndex("decisionId_expiresAt", (q) =>
        q.eq("decisionId", args.decisionId)
      )
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    if (activeBoosts.length === 0) {
      return null;
    }

    // Trouver le boost avec le expiresAt le plus récent
    const latestBoost = activeBoosts.reduce((latest, boost) => 
      boost.expiresAt > latest.expiresAt ? boost : latest
    );

    const totalTimeRemaining = latestBoost.expiresAt - now;
    const hoursRemaining = Math.floor(totalTimeRemaining / (60 * 60 * 1000));
    const minutesRemaining = Math.floor((totalTimeRemaining % (60 * 60 * 1000)) / (60 * 1000));

    return {
      expiresAt: latestBoost.expiresAt,
      totalTimeRemaining,
      hoursRemaining,
      minutesRemaining,
      totalBoosts: activeBoosts.length,
    };
  },
});

/**
 * Récupère toutes les décisions boostées actuellement (pour le feed prioritaire)
 */
export const getBoostedDecisions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const now = Date.now();

    // Récupérer tous les boosts actifs
    const activeBoosts = await ctx.db
      .query("decisionBoosts")
      .withIndex("expiresAt", (q) => q.gt("expiresAt", now))
      .order("desc")
      .take(limit * 2); // Prendre plus pour filtrer

    // Grouper par décision et prendre le boost le plus récent pour chaque
    const decisionMap = new Map<Id<"decisions">, typeof activeBoosts[0]>();
    for (const boost of activeBoosts) {
      const existing = decisionMap.get(boost.decisionId);
      if (!existing || boost.createdAt > existing.createdAt) {
        decisionMap.set(boost.decisionId, boost);
      }
    }

    // Récupérer les décisions
    const decisions = await Promise.all(
      Array.from(decisionMap.values())
        .slice(0, limit)
        .map(async (boost) => {
          const decision = await ctx.db.get(boost.decisionId);
          const user = await ctx.db.get(boost.userId);
          return {
            decision,
            boost: {
              ...boost,
              user: user ? {
                _id: user._id,
                name: user.name,
                image: user.image,
                username: user.username,
              } : null,
            },
          };
        })
    );

    return decisions.filter((d) => d.decision !== null);
  },
});

