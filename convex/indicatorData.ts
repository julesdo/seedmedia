import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Récupère les données d'indicateur pour une décision
 */
export const getIndicatorDataForDecision = query({
  args: {
    decisionId: v.id("decisions"),
    indicatorId: v.optional(v.id("indicators")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("indicatorData")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId));

    if (args.indicatorId) {
      query = query.filter((q) => q.eq(q.field("indicatorId"), args.indicatorId));
    }

    const data = await query.order("desc").collect();

    return data;
  },
});

/**
 * Récupère une donnée d'indicateur par type de mesure
 */
export const getIndicatorDataByType = query({
  args: {
    decisionId: v.id("decisions"),
    indicatorId: v.id("indicators"),
    measureType: v.union(
      v.literal("baseline"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("180d"),
      v.literal("365d")
    ),
  },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("indicatorData")
      .withIndex("indicatorId_decisionId_date", (q) =>
        q
          .eq("indicatorId", args.indicatorId)
          .eq("decisionId", args.decisionId)
      )
      .filter((q) => q.eq(q.field("measureType"), args.measureType))
      .first();

    return data;
  },
});

/**
 * Crée une nouvelle donnée d'indicateur
 */
export const createIndicatorData = mutation({
  args: {
    decisionId: v.id("decisions"),
    indicatorId: v.id("indicators"),
    date: v.number(),
    value: v.number(),
    source: v.string(),
    sourceUrl: v.optional(v.string()),
    measureType: v.union(
      v.literal("baseline"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("180d"),
      v.literal("365d")
    ),
  },
  handler: async (ctx, args) => {
    const dataId = await ctx.db.insert("indicatorData", {
      decisionId: args.decisionId,
      indicatorId: args.indicatorId,
      date: args.date,
      value: args.value,
      source: args.source,
      sourceUrl: args.sourceUrl,
      measureType: args.measureType,
      createdAt: Date.now(),
    });

    return dataId;
  },
});

/**
 * Met à jour une donnée d'indicateur
 */
export const updateIndicatorData = mutation({
  args: {
    indicatorDataId: v.id("indicatorData"),
    value: v.optional(v.number()),
    source: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { indicatorDataId, ...updates } = args;

    const updateData: any = {};
    if (updates.value !== undefined) updateData.value = updates.value;
    if (updates.source !== undefined) updateData.source = updates.source;
    if (updates.sourceUrl !== undefined) updateData.sourceUrl = updates.sourceUrl;

    await ctx.db.patch(indicatorDataId, updateData);

    return indicatorDataId;
  },
});

