import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Récupère un indicateur par son ID
 */
export const getIndicatorById = query({
  args: {
    indicatorId: v.id("indicators"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.indicatorId);
  },
});

/**
 * Récupère tous les indicateurs
 */
export const getIndicators = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const indicators = await ctx.db
      .query("indicators")
      .order("desc")
      .take(args.limit || 50);

    return indicators;
  },
});

/**
 * Crée un nouvel indicateur
 */
export const createIndicator = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("number"),
      v.literal("percentage"),
      v.literal("index"),
      v.literal("currency")
    ),
    unit: v.string(),
    dataSource: v.union(
      v.literal("api"),
      v.literal("dataset"),
      v.literal("manual")
    ),
    sourceUrl: v.optional(v.string()),
    sourceApi: v.optional(v.string()),
    updateFrequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
  },
  handler: async (ctx, args) => {
    // Vérifier que le slug est unique
    const existing = await ctx.db
      .query("indicators")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("An indicator with this slug already exists");
    }

    const now = Date.now();

    const indicatorId = await ctx.db.insert("indicators", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      type: args.type,
      unit: args.unit,
      dataSource: args.dataSource,
      sourceUrl: args.sourceUrl,
      sourceApi: args.sourceApi,
      updateFrequency: args.updateFrequency,
      createdAt: now,
      updatedAt: now,
    });

    return indicatorId;
  },
});

