import { mutation, query, internalMutation, action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { betterAuthComponent } from "./auth";
import { api, internal } from "./_generated/api";

/**
 * 💳 Packs de Seeds disponibles
 */
export const SEED_PACKS = {
  pack_survie: {
    seeds: 1200,
    price: 199, // 1.99€ en centimes
    name: "Pack Survie",
    description: "Idéal pour débuter",
  },
  pack_strategie: {
    seeds: 6000,
    price: 999, // 9.99€ en centimes
    name: "Pack Stratège",
    description: "Pour les joueurs réguliers",
  },
  pack_whale: {
    seeds: 30000,
    price: 4999, // 49.99€ en centimes
    name: "Pack Whale",
    description: "Pour les investisseurs",
  },
} as const;

export type PackId = keyof typeof SEED_PACKS;

/**
 * Récupère les packs disponibles
 */
export const getAvailablePacks = query({
  args: {},
  handler: async (ctx) => {
    return Object.entries(SEED_PACKS).map(([id, pack]) => ({
      id: id as PackId,
      ...pack,
    }));
  },
});

/**
 * Crée une session Stripe Checkout
 * Note: Cette mutation prépare les données, mais la session Stripe est créée côté API route Next.js
 * pour des raisons de sécurité (clé secrète Stripe)
 */
export const prepareCheckoutSession = mutation({
  args: {
    packId: v.union(
      v.literal("pack_survie"),
      v.literal("pack_strategie"),
      v.literal("pack_whale")
    ),
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

    const pack = SEED_PACKS[args.packId];
    if (!pack) {
      throw new Error("Invalid pack ID");
    }

    // Créer une entrée "pending" dans stripePayments
    // La session Stripe sera créée côté API route Next.js
    // Cette entrée sera mise à jour par le webhook quand le paiement sera complété
    const paymentId = await ctx.db.insert("stripePayments", {
      userId: appUser._id,
      stripeSessionId: `pending_${Date.now()}`, // Temporaire, sera remplacé par la vraie session ID
      packId: args.packId,
      amount: pack.price,
      currency: "eur",
      seedsAwarded: pack.seeds,
      status: "pending",
      createdAt: Date.now(),
    });

    return {
      paymentId,
      pack: {
        id: args.packId,
        ...pack,
      },
      userId: appUser._id.toString(),
    };
  },
});

/**
 * ✅ ACTION PUBLIQUE: Crédite les Seeds après un paiement Stripe réussi
 * Appelé par le webhook Stripe (via API route Next.js)
 * 
 * ⚠️ SÉCURITÉ: Cette action doit être appelée uniquement depuis le webhook Stripe
 * avec une vérification de signature côté API route Next.js
 */
export const creditSeedsFromPayment = action({
  args: {
    userId: v.string(), // ID utilisateur en string (sera converti en Id)
    stripeSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    packId: v.string(),
    amount: v.number(),
    seedsAwarded: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Appeler l'internal mutation
    await ctx.runMutation(internal.payments.creditSeedsFromPaymentInternal, {
      userId: args.userId as Id<"users">,
      stripeSessionId: args.stripeSessionId,
      stripePaymentIntentId: args.stripePaymentIntentId,
      packId: args.packId,
      amount: args.amount,
      seedsAwarded: args.seedsAwarded,
      metadata: args.metadata,
    });
  },
});

/**
 * ✅ INTERNAL: Crédite les Seeds après un paiement Stripe réussi (logique métier)
 */
export const creditSeedsFromPaymentInternal = internalMutation({
  args: {
    userId: v.id("users"),
    stripeSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    packId: v.string(),
    amount: v.number(),
    seedsAwarded: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; reason?: string; newBalance?: number; levelUp?: boolean; newLevel?: number }> => {
    // Vérifier que le paiement n'a pas déjà été traité
    const existingPayment = await ctx.db
      .query("stripePayments")
      .withIndex("stripeSessionId", (q) => q.eq("stripeSessionId", args.stripeSessionId))
      .first();

    if (existingPayment && existingPayment.status === "completed") {
      console.log(`Payment ${args.stripeSessionId} already processed`);
      return { success: false, reason: "already_processed" };
    }

    // Récupérer l'utilisateur
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Calculer le nouveau solde et niveau
    const oldBalance = user.seedsBalance || 0;
    const newBalance = oldBalance + args.seedsAwarded;
    
    // Utiliser la fonction de calcul de niveau existante
    const levelInfo: { level: number; seedsToNextLevel: number; seedsForCurrentLevel: number } = await ctx.runQuery(api.gamification.getLevelInfo, {
      totalSeeds: newBalance,
    });

    const oldLevel = user.level || 1;

    // Mettre à jour l'utilisateur
    await ctx.db.patch(args.userId, {
      seedsBalance: newBalance,
      level: levelInfo.level,
      seedsToNextLevel: levelInfo.seedsToNextLevel,
      updatedAt: Date.now(),
    });

    // Créer ou mettre à jour l'entrée de paiement
    if (existingPayment) {
      await ctx.db.patch(existingPayment._id, {
        stripePaymentIntentId: args.stripePaymentIntentId,
        status: "completed",
        completedAt: Date.now(),
        metadata: args.metadata,
      });
    } else {
      await ctx.db.insert("stripePayments", {
        userId: args.userId,
        stripeSessionId: args.stripeSessionId,
        stripePaymentIntentId: args.stripePaymentIntentId,
        packId: args.packId,
        amount: args.amount,
        currency: "eur",
        seedsAwarded: args.seedsAwarded,
        status: "completed",
        metadata: args.metadata,
        createdAt: Date.now(),
        completedAt: Date.now(),
      });
    }

    // Créer une transaction Seeds
    await ctx.runMutation(api.seedsTransactions.createTransaction, {
      userId: args.userId,
      type: "earned",
      amount: args.seedsAwarded,
      reason: `purchase_${args.packId}`,
      relatedId: args.stripeSessionId,
      relatedType: "stripe_payment",
      levelBefore: oldLevel,
      levelAfter: levelInfo.level,
    });

    return {
      success: true,
      newBalance,
      levelUp: levelInfo.level > oldLevel,
      newLevel: levelInfo.level,
    };
  },
});

/**
 * Récupère l'historique des paiements d'un utilisateur
 */
export const getUserPayments = query({
  args: {
    limit: v.optional(v.number()),
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

    const payments = await ctx.db
      .query("stripePayments")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .order("desc")
      .take(args.limit || 20);

    return payments.map((payment) => ({
      ...payment,
      pack: SEED_PACKS[payment.packId as PackId],
    }));
  },
});

/**
 * Vérifie le statut d'un paiement par session ID
 */
export const getPaymentBySessionId = query({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("stripePayments")
      .withIndex("stripeSessionId", (q) => q.eq("stripeSessionId", args.sessionId))
      .first();

    if (!payment) {
      return null;
    }

    return {
      ...payment,
      pack: SEED_PACKS[payment.packId as PackId],
    };
  },
});

