import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { betterAuthComponent } from "./auth";
import { api } from "./_generated/api";

/**
 * 🎯 Calcule l'économie totale de l'app (somme de tous les seedsBalance)
 * Utilisé pour calculer le prix d'accès aux profils
 */
export const getTotalEconomy = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    let totalEconomy = 0;
    for (const user of users) {
      totalEconomy += user.seedsBalance || 0;
    }
    
    return totalEconomy;
  },
});

/**
 * 🎯 Calcule le prix d'accès à un profil (proportionnel à l'économie totale)
 * Formule : prix = économie_totale × pourcentage (ex: 0.1% = 0.001)
 * 
 * Principes psychologiques appliqués :
 * - Scarcity : Plus l'économie est grande, plus c'est cher
 * - Variable Reward : Le prix change dynamiquement
 * - Social Proof : Les profils performants valent plus cher
 */
export const getProfileAccessPrice = query({
  args: {
    profileUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Calculer l'économie totale directement
    const users = await ctx.db.query("users").collect();
    let totalEconomy = 0;
    for (const user of users) {
      totalEconomy += user.seedsBalance || 0;
    }
    
    // Pourcentage de l'économie (0.1% = 0.001)
    // Plus l'économie est grande, plus l'accès est cher
    const PERCENTAGE = 0.001; // 0.1% de l'économie totale
    
    // Calculer le prix de base
    let basePrice = totalEconomy * PERCENTAGE;
    
    // Prix minimum (même si l'économie est faible)
    const MIN_PRICE = 10; // 10 Seeds minimum
    basePrice = Math.max(MIN_PRICE, basePrice);
    
    // Récupérer le profil pour ajuster selon la performance
    const profileUser = await ctx.db.get(args.profileUserId);
    if (!profileUser) {
      return basePrice;
    }
    
    // Bonus selon le niveau de l'utilisateur (plus performant = plus cher)
    // Multiplicateur basé sur le niveau (ex: niveau 10 = +50%)
    const levelMultiplier = 1 + (profileUser.level || 1) * 0.05;
    
    // Bonus selon les Seeds du profil (plus riche = plus cher)
    // Multiplicateur basé sur les Seeds (ex: 1000 Seeds = +20%)
    const seedsMultiplier = 1 + Math.min((profileUser.seedsBalance || 0) / 5000, 0.2);
    
    // Prix final avec multiplicateurs
    const finalPrice = basePrice * levelMultiplier * seedsMultiplier;
    
    // Arrondir à 2 décimales
    return Math.round(finalPrice * 100) / 100;
  },
});

/**
 * 🎯 Vérifie si l'utilisateur a déjà payé pour voir ce profil
 */
export const hasProfileAccess = query({
  args: {
    profileUserId: v.id("users"),
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

    // Si c'est son propre profil, accès gratuit
    if (appUser._id === args.profileUserId) {
      return true;
    }

    // Vérifier si l'accès a été payé
    const access = await ctx.db
      .query("profileAccess")
      .withIndex("viewerId_profileUserId", (q) =>
        q.eq("viewerId", appUser._id).eq("profileUserId", args.profileUserId)
      )
      .first();

    return !!access;
  },
});

/**
 * 🎯 Payer pour accéder à un profil
 * 
 * Principes psychologiques appliqués :
 * - Loss Aversion : Les utilisateurs paient pour ne pas rater des opportunités
 * - Gamification : Transformer l'accès en récompense précieuse
 * - Scarcity : L'accès est rare et précieux
 */
export const payForProfileAccess = mutation({
  args: {
    profileUserId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    alreadyHasAccess: v.optional(v.boolean()),
    pricePaid: v.optional(v.number()),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; alreadyHasAccess?: boolean; pricePaid?: number }> => {
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

    // Si c'est son propre profil, accès gratuit
    if (appUser._id === args.profileUserId) {
      return { success: true, alreadyHasAccess: true };
    }

    // Vérifier si l'accès a déjà été payé
    const existingAccess = await ctx.db
      .query("profileAccess")
      .withIndex("viewerId_profileUserId", (q) =>
        q.eq("viewerId", appUser._id).eq("profileUserId", args.profileUserId)
      )
      .first();

    if (existingAccess) {
      return { success: true, alreadyHasAccess: true };
    }

    // Calculer le prix d'accès
    const price: number = await ctx.runQuery(api.profileAccess.getProfileAccessPrice, {
      profileUserId: args.profileUserId,
    });

    // Vérifier le solde
    const currentBalance = appUser.seedsBalance || 0;
    if (currentBalance < price) {
      throw new Error(`Solde insuffisant. Vous avez ${currentBalance.toFixed(2)} Seeds, il en faut ${price.toFixed(2)}`);
    }

    // Calculer l'économie totale au moment du paiement
    const users = await ctx.db.query("users").collect();
    let totalEconomy = 0;
    for (const user of users) {
      totalEconomy += user.seedsBalance || 0;
    }

    const now = Date.now();

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
      reason: `Accès au profil de ${args.profileUserId}`,
      relatedId: args.profileUserId,
      relatedType: "profile_access",
      levelBefore: appUser.level || 1,
      levelAfter: levelInfo.level,
    });

    // Enregistrer l'accès
    await ctx.db.insert("profileAccess", {
      viewerId: appUser._id,
      profileUserId: args.profileUserId,
      pricePaid: price,
      economyAtTime: totalEconomy,
      createdAt: now,
    });

    return { success: true, pricePaid: price };
  },
});

