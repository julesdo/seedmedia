import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Crée une transaction Seeds
 */
export const createTransaction = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("earned"), v.literal("lost")),
    amount: v.number(),
    reason: v.string(),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    levelBefore: v.number(),
    levelAfter: v.number(),
  },
  handler: async (ctx, args) => {
    const transactionId = await ctx.db.insert("seedsTransactions", {
      userId: args.userId,
      type: args.type,
      amount: args.amount,
      reason: args.reason,
      relatedId: args.relatedId,
      relatedType: args.relatedType,
      levelBefore: args.levelBefore,
      levelAfter: args.levelAfter,
      createdAt: Date.now(),
    });

    return transactionId;
  },
});

/**
 * Récupère les transactions Seeds d'un utilisateur
 */
export const getUserTransactions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("seedsTransactions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 50);

    return transactions;
  },
});

/**
 * Récupère l'historique complet des transactions Seeds
 */
export const getAllTransactions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("seedsTransactions")
      .order("desc")
      .take(args.limit || 100);

    return transactions;
  },
});

