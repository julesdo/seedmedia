import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Récupère les actualités pour une décision
 */
export const getNewsForDecision = query({
  args: {
    decisionId: v.id("decisions"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const newsItems = await ctx.db
      .query("newsItems")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .order("desc")
      .take(args.limit || 20);

    // Trier par score de pertinence décroissant
    newsItems.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return newsItems;
  },
});

/**
 * Récupère une actualité par son URL (pour vérifier les doublons)
 */
export const getNewsByUrl = query({
  args: {
    url: v.string(),
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const newsItems = await ctx.db
      .query("newsItems")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    return newsItems.find((item) => item.url === args.url) || null;
  },
});

/**
 * Crée une nouvelle actualité
 */
export const createNewsItem = mutation({
  args: {
    decisionId: v.id("decisions"),
    title: v.string(),
    url: v.string(),
    source: v.string(),
    publishedAt: v.number(),
    summary: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    relevanceScore: v.number(),
  },
  handler: async (ctx, args) => {
    const newsId = await ctx.db.insert("newsItems", {
      decisionId: args.decisionId,
      title: args.title,
      url: args.url,
      source: args.source,
      publishedAt: args.publishedAt,
      summary: args.summary,
      imageUrl: args.imageUrl,
      relevanceScore: args.relevanceScore,
      createdAt: Date.now(),
    });

    return newsId;
  },
});

/**
 * Met à jour une actualité existante
 */
export const updateNewsItem = mutation({
  args: {
    newsId: v.id("newsItems"),
    imageUrl: v.optional(v.string()),
    summary: v.optional(v.string()),
    relevanceScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const news = await ctx.db.get(args.newsId);
    if (!news) {
      throw new Error("News item not found");
    }

    await ctx.db.patch(args.newsId, {
      ...(args.imageUrl !== undefined && { imageUrl: args.imageUrl }),
      ...(args.summary !== undefined && { summary: args.summary }),
      ...(args.relevanceScore !== undefined && { relevanceScore: args.relevanceScore }),
    });
  },
});

/**
 * Récupère les actualités "hot" (les plus récentes et pertinentes)
 */
export const getHotNews = query({
  args: {
    limit: v.optional(v.number()),
    minRelevanceScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const minScore = args.minRelevanceScore || 50;

    const allNews = await ctx.db
      .query("newsItems")
      .withIndex("publishedAt")
      .order("desc")
      .collect();

    // Filtrer par score de pertinence et trier
    const filteredNews = allNews
      .filter((news) => news.relevanceScore >= minScore)
      .sort((a, b) => {
        // Trier par score puis par date
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return b.publishedAt - a.publishedAt;
      })
      .slice(0, limit);

    return filteredNews;
  },
});

