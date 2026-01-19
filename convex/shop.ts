import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { betterAuthComponent } from "./auth";

/**
 * 🛒 PHASE 5: SHOP - Acheter "TOP COMMENT" (King of the Hill)
 * Enchère perpétuelle : l'utilisateur doit payer currentBidPrice + 10% pour remplacer le commentaire en vedette
 */
export const purchaseTopComment = mutation({
  args: {
    decisionId: v.id("decisions"),
    argumentId: v.id("topArguments"), // Le commentaire à mettre en vedette
    bidAmount: v.number(), // Montant à investir
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Vous devez être connecté");
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      throw new Error("Utilisateur non trouvé");
    }

    // Vérifier que la décision existe
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error("Décision non trouvée");
    }

    // Vérifier que le commentaire existe et appartient à l'utilisateur
    const argument = await ctx.db.get(args.argumentId);
    if (!argument) {
      throw new Error("Commentaire non trouvé");
    }

    if (argument.userId !== appUser._id) {
      throw new Error("Ce commentaire ne vous appartient pas");
    }

    // Calculer le prix minimum requis (currentBidPrice + 10%)
    const currentBidPrice = decision.currentBidPrice || 0;
    const minimumBid = Math.ceil(currentBidPrice * 1.1);

    if (args.bidAmount < minimumBid) {
      throw new Error(
        `Vous devez investir au moins ${minimumBid} Seeds (prix actuel: ${currentBidPrice} + 10%)`
      );
    }

    // Vérifier que l'utilisateur a assez de Seeds
    const currentBalance = appUser.seedsBalance || 0;
    if (currentBalance < args.bidAmount) {
      throw new Error(
        `Vous n'avez pas assez de Seeds. Vous avez ${currentBalance}, mais vous devez payer ${args.bidAmount}`
      );
    }

    const now = Date.now();

    // Mettre à jour la décision : nouveau topCommentId et currentBidPrice
    await ctx.db.patch(args.decisionId, {
      topCommentId: args.argumentId,
      currentBidPrice: args.bidAmount,
      updatedAt: now,
    });

    // Mettre à jour le commentaire : nouveau currentBid
    await ctx.db.patch(args.argumentId, {
      currentBid: args.bidAmount,
      updatedAt: now,
    });

    // Débiter les Seeds de l'utilisateur
    const newBalance = currentBalance - args.bidAmount;
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
      amount: args.bidAmount,
      reason: "Achat TOP COMMENT (King of the Hill)",
      relatedId: args.decisionId,
      relatedType: "shop",
      levelBefore: appUser.level || 1,
      levelAfter: levelInfo.level,
    });

    return {
      success: true,
      newBidPrice: args.bidAmount,
    };
  },
});

/**
 * 🛒 PHASE 5: SHOP - Acheter "RAYON X" (Data Insider)
 * Coût fixe : 50 Seeds
 * Permet de voir la répartition des votes des "Top 1% Users" vs "La Masse"
 */
export const purchaseRayonX = mutation({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Vous devez être connecté");
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      throw new Error("Utilisateur non trouvé");
    }

    // Vérifier que la décision existe
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error("Décision non trouvée");
    }

    // Vérifier si l'utilisateur a déjà acheté cette fonctionnalité
    const existingUnlock = await ctx.db
      .query("userDecisionUnlocks")
      .withIndex("userId_decisionId", (q) =>
        q.eq("userId", appUser._id).eq("decisionId", args.decisionId)
      )
      .filter((q) => q.eq(q.field("feature"), "rayon_x"))
      .first();

    if (existingUnlock) {
      throw new Error("Vous avez déjà acheté cette fonctionnalité pour cette décision");
    }

    const price = 50; // Coût fixe

    // Vérifier que l'utilisateur a assez de Seeds
    const currentBalance = appUser.seedsBalance || 0;
    if (currentBalance < price) {
      throw new Error(
        `Vous n'avez pas assez de Seeds. Vous avez ${currentBalance}, mais vous devez payer ${price}`
      );
    }

    const now = Date.now();

    // Créer l'unlock
    await ctx.db.insert("userDecisionUnlocks", {
      userId: appUser._id,
      decisionId: args.decisionId,
      feature: "rayon_x",
      purchasedAt: now,
    });

    // Débiter les Seeds de l'utilisateur
    const newBalance = currentBalance - price;
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
      amount: price,
      reason: "Achat RAYON X (Data Insider)",
      relatedId: args.decisionId,
      relatedType: "shop",
      levelBefore: appUser.level || 1,
      levelAfter: levelInfo.level,
    });

    return {
      success: true,
    };
  },
});

/**
 * 🛒 PHASE 5: SHOP - Acheter "BADGE FONDATEUR" (Statut)
 * Coût unique : 5000 Seeds
 * Cosmétique pur : affiche le pseudo en couleur Or + icône spéciale partout
 */
export const purchaseFounderBadge = mutation({
  args: {},
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Vous devez être connecté");
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      throw new Error("Utilisateur non trouvé");
    }

    // Vérifier si l'utilisateur a déjà le badge
    if (appUser.isFounderMember) {
      throw new Error("Vous possédez déjà le Badge Fondateur");
    }

    const price = 5000; // Coût unique

    // Vérifier que l'utilisateur a assez de Seeds
    const currentBalance = appUser.seedsBalance || 0;
    if (currentBalance < price) {
      throw new Error(
        `Vous n'avez pas assez de Seeds. Vous avez ${currentBalance}, mais vous devez payer ${price}`
      );
    }

    const now = Date.now();

    // Activer le badge fondateur
    await ctx.db.patch(appUser._id, {
      isFounderMember: true,
      updatedAt: now,
    });

    // Débiter les Seeds de l'utilisateur
    const newBalance = currentBalance - price;
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
      amount: price,
      reason: "Achat BADGE FONDATEUR",
      relatedType: "shop",
      levelBefore: appUser.level || 1,
      levelAfter: levelInfo.level,
    });

    return {
      success: true,
    };
  },
});

/**
 * 🛒 PHASE 5: SHOP - Vérifier si l'utilisateur a acheté Rayon X pour une décision
 */
export const hasRayonX = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return false;
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return false;
    }

    const unlock = await ctx.db
      .query("userDecisionUnlocks")
      .withIndex("userId_decisionId", (q) =>
        q.eq("userId", appUser._id).eq("decisionId", args.decisionId)
      )
      .filter((q) => q.eq(q.field("feature"), "rayon_x"))
      .first();

    return unlock !== null;
  },
});

/**
 * 🛒 PHASE 5: SHOP - Récupérer les données "Top 1% Users" pour Rayon X
 * Retourne la répartition des votes des utilisateurs avec roi_global > 20%
 */
export const getTopUsersVotes = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    // Vérifier que l'utilisateur a acheté Rayon X
    const hasAccess = await ctx.runQuery(api.shop.hasRayonX, {
      decisionId: args.decisionId,
    });

    if (!hasAccess) {
      throw new Error("Vous devez acheter RAYON X pour accéder à ces données");
    }

    // Récupérer toutes les anticipations pour cette décision
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    // Calculer le roi_global pour chaque utilisateur
    // Pour simplifier, on utilise le niveau comme proxy du roi_global
    // (les utilisateurs de niveau élevé ont généralement un meilleur ROI)
    const userVotes: Record<string, { yes: number; no: number; level: number }> = {};

    for (const anticipation of anticipations) {
      const user = await ctx.db.get(anticipation.userId);
      if (!user) continue;

      const level = user.level || 1;
      // Considérer les utilisateurs de niveau >= 20 comme "Top 1%"
      // (à ajuster selon la distribution réelle)
      if (level >= 20) {
        if (!userVotes[user._id]) {
          userVotes[user._id] = { yes: 0, no: 0, level };
        }
        if (anticipation.position === "yes") {
          userVotes[user._id].yes++;
        } else {
          userVotes[user._id].no++;
        }
      }
    }

    // Calculer les totaux
    const topUsersTotal = Object.values(userVotes).reduce(
      (acc, votes) => acc + votes.yes + votes.no,
      0
    );
    const topUsersYes = Object.values(userVotes).reduce((acc, votes) => acc + votes.yes, 0);
    const topUsersNo = Object.values(userVotes).reduce((acc, votes) => acc + votes.no, 0);

    // Calculer les totaux pour "La Masse" (tous les autres)
    const allYes = anticipations.filter((a) => a.position === "yes").length;
    const allNo = anticipations.filter((a) => a.position === "no").length;
    const allTotal = anticipations.length;

    const masseYes = allYes - topUsersYes;
    const masseNo = allNo - topUsersNo;
    const masseTotal = allTotal - topUsersTotal;

    return {
      topUsers: {
        yes: topUsersYes,
        no: topUsersNo,
        total: topUsersTotal,
      },
      masse: {
        yes: masseYes,
        no: masseNo,
        total: masseTotal,
      },
    };
  },
});

