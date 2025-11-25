import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";

/**
 * Récupère les votes d'un article
 */
export const getArticleVotes = query({
  args: {
    articleId: v.id("articles"),
  },
  handler: async (ctx, args) => {
    const votes = await ctx.db
      .query("articleVotes")
      .withIndex("articleId", (q) => q.eq("articleId", args.articleId))
      .collect();

    // Compter les votes par type
    const votesByType = {
      solide: 0,
      a_revoir: 0,
      biaise: 0,
      non_etaye: 0,
    };

    votes.forEach((vote) => {
      votesByType[vote.voteType] = (votesByType[vote.voteType] || 0) + 1;
    });

    return {
      votes,
      counts: votesByType,
      total: votes.length,
    };
  },
});

/**
 * Récupère le vote de l'utilisateur connecté sur un article
 */
export const getMyArticleVote = query({
  args: {
    articleId: v.id("articles"),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return null;
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return null;
    }

    const vote = await ctx.db
      .query("articleVotes")
      .withIndex("articleId_userId", (q) =>
        q.eq("articleId", args.articleId).eq("userId", appUser._id)
      )
      .first();

    return vote;
  },
});

/**
 * Vote sur un article (Solide, À revoir, Biaisé, Non étayé)
 */
export const voteOnArticle = mutation({
  args: {
    articleId: v.id("articles"),
    voteType: v.union(
      v.literal("solide"),
      v.literal("a_revoir"),
      v.literal("biaise"),
      v.literal("non_etaye")
    ),
    comment: v.optional(v.string()),
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

    const article = await ctx.db.get(args.articleId);
    if (!article) {
      throw new Error("Article not found");
    }

    // Vérifier si l'utilisateur a déjà voté
    const existingVote = await ctx.db
      .query("articleVotes")
      .withIndex("articleId_userId", (q) =>
        q.eq("articleId", args.articleId).eq("userId", appUser._id)
      )
      .first();

    const now = Date.now();

    if (existingVote) {
      // Mettre à jour le vote existant
      await ctx.db.patch(existingVote._id, {
        voteType: args.voteType,
        comment: args.comment,
        updatedAt: now,
      });
    } else {
      // Créer un nouveau vote
      await ctx.db.insert("articleVotes", {
        articleId: args.articleId,
        userId: appUser._id,
        voteType: args.voteType,
        comment: args.comment,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Supprime le vote de l'utilisateur sur un article
 */
export const removeArticleVote = mutation({
  args: {
    articleId: v.id("articles"),
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

    const vote = await ctx.db
      .query("articleVotes")
      .withIndex("articleId_userId", (q) =>
        q.eq("articleId", args.articleId).eq("userId", appUser._id)
      )
      .first();

    if (vote) {
      await ctx.db.delete(vote._id);
    }

    return { success: true };
  },
});

