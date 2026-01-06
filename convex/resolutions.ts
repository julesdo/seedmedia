import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Récupère la résolution pour une décision
 */
export const getResolutionByDecision = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const resolution = await ctx.db
      .query("resolutions")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .first();

    return resolution || null;
  },
});

/**
 * Récupère une résolution par son ID
 */
export const getResolutionById = query({
  args: {
    resolutionId: v.id("resolutions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.resolutionId);
  },
});

/**
 * Crée une nouvelle résolution
 */
export const createResolution = mutation({
  args: {
    decisionId: v.id("decisions"),
    issue: v.union(
      v.literal("works"),
      v.literal("partial"),
      v.literal("fails")
    ),
    confidence: v.number(), // 0-100
    details: v.object({
      positiveIndicators: v.number(),
      negativeIndicators: v.number(),
      neutralIndicators: v.number(),
      weightedScore: v.number(),
    }),
    method: v.string(),
    indicatorIds: v.array(v.id("indicators")),
    variations: v.array(
      v.object({
        indicatorId: v.id("indicators"),
        baseline: v.number(),
        current: v.number(),
        variation: v.number(),
        variationPercent: v.number(),
      })
    ),
    resolvedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const resolutionId = await ctx.db.insert("resolutions", {
      decisionId: args.decisionId,
      issue: args.issue,
      confidence: args.confidence,
      details: args.details,
      method: args.method,
      indicatorIds: args.indicatorIds,
      variations: args.variations,
      resolvedAt: args.resolvedAt,
      createdAt: Date.now(),
    });

    // Mettre à jour le statut de la décision
    await ctx.db.patch(args.decisionId, {
      status: "resolved",
    });

    return resolutionId;
  },
});

/**
 * Met à jour une résolution existante
 */
export const updateResolution = mutation({
  args: {
    resolutionId: v.id("resolutions"),
    issue: v.optional(
      v.union(v.literal("works"), v.literal("partial"), v.literal("fails"))
    ),
    confidence: v.optional(v.number()),
    details: v.optional(
      v.object({
        positiveIndicators: v.number(),
        negativeIndicators: v.number(),
        neutralIndicators: v.number(),
        weightedScore: v.number(),
      })
    ),
    resolvedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { resolutionId, ...updates } = args;

    const updateData: any = {};
    if (updates.issue !== undefined) updateData.issue = updates.issue;
    if (updates.confidence !== undefined)
      updateData.confidence = updates.confidence;
    if (updates.details !== undefined) updateData.details = updates.details;
    if (updates.resolvedAt !== undefined)
      updateData.resolvedAt = updates.resolvedAt;

    await ctx.db.patch(resolutionId, updateData);

    return resolutionId;
  },
});

/**
 * Récupère toutes les résolutions avec les décisions enrichies
 */
export const getAllResolutions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const resolutions = await ctx.db
      .query("resolutions")
      .order("desc")
      .take(args.limit || 50);

    // Enrichir avec les décisions
    const enriched = await Promise.all(
      resolutions.map(async (resolution) => {
        const decision = await ctx.db.get(resolution.decisionId);
        return {
          ...resolution,
          decision,
        };
      })
    );

    return enriched;
  },
});

