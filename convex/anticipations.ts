import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Récupère les anticipations d'un utilisateur
 */
export const getMyAnticipations = query({
  args: {},
  handler: async (ctx) => {
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

    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .order("desc")
      .collect();

    // Enrichir avec les décisions
    const enriched = await Promise.all(
      anticipations.map(async (anticipation) => {
        const decision = await ctx.db.get(anticipation.decisionId);
        return {
          ...anticipation,
          decision,
        };
      })
    );

    return enriched;
  },
});

/**
 * Récupère les anticipations d'un utilisateur par son ID (pour profils publics)
 */
export const getUserAnticipations = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Enrichir avec les décisions
    const enriched = await Promise.all(
      anticipations.map(async (anticipation) => {
        const decision = await ctx.db.get(anticipation.decisionId);
        return {
          ...anticipation,
          decision,
        };
      })
    );

    return enriched;
  },
});

/**
 * Récupère les anticipations résolues d'un utilisateur
 */
export const getUserResolvedAnticipations = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Filtrer les anticipations résolues
    const resolved = anticipations.filter((a) => a.resolved === true).slice(0, limit);

    // Enrichir avec les décisions
    const enriched = await Promise.all(
      resolved.map(async (anticipation) => {
        const decision = await ctx.db.get(anticipation.decisionId);
        return {
          ...anticipation,
          decision,
        };
      })
    );

    return enriched;
  },
});

/**
 * Récupère les anticipations correctes d'un utilisateur (résolues et gagnées)
 */
export const getUserCorrectAnticipations = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Filtrer les anticipations résolues et correctes
    // result === issue signifie que l'anticipation était correcte
    const correct = anticipations
      .filter((a) => a.resolved === true && a.result === a.issue)
      .slice(0, limit);

    // Enrichir avec les décisions
    const enriched = await Promise.all(
      correct.map(async (anticipation) => {
        const decision = await ctx.db.get(anticipation.decisionId);
        return {
          ...anticipation,
          decision,
        };
      })
    );

    return enriched;
  },
});

/**
 * Récupère les anticipations pour une décision
 */
export const getAnticipationsForDecision = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    // Enrichir avec les utilisateurs
    const enriched = await Promise.all(
      anticipations.map(async (anticipation) => {
        const user = await ctx.db.get(anticipation.userId);
        return {
          ...anticipation,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                image: user.image,
              }
            : null,
        };
      })
    );

    return enriched;
  },
});

/**
 * Récupère une anticipation spécifique
 */
export const getAnticipation = query({
  args: {
    anticipationId: v.id("anticipations"),
  },
  handler: async (ctx, args) => {
    const anticipation = await ctx.db.get(args.anticipationId);
    if (!anticipation) {
      return null;
    }

    const decision = await ctx.db.get(anticipation.decisionId);
    const user = await ctx.db.get(anticipation.userId);

    return {
      ...anticipation,
      decision,
      user: user
        ? {
            _id: user._id,
            name: user.name,
            image: user.image,
          }
        : null,
    };
  },
});

/**
 * Crée une nouvelle anticipation
 */
export const createAnticipation = mutation({
  args: {
    decisionId: v.id("decisions"),
    issue: v.union(
      v.literal("works"),
      v.literal("partial"),
      v.literal("fails")
    ),
    seedsEngaged: v.number(),
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

    // Vérifier que la décision n'est pas déjà résolue
    if (decision.status === "resolved") {
      throw new Error("Cannot anticipate a resolved decision");
    }

    // Vérifier qu'il n'y a pas déjà une anticipation pour cette décision
    const existing = await ctx.db
      .query("anticipations")
      .withIndex("decisionId_userId", (q) =>
        q.eq("decisionId", args.decisionId).eq("userId", appUser._id)
      )
      .first();

    if (existing) {
      throw new Error("You have already anticipated this decision");
    }

    // TODO: Vérifier que l'utilisateur a assez de Seeds
    // Pour l'instant, on accepte toutes les anticipations

    const now = Date.now();

    // Créer l'anticipation
    const anticipationId = await ctx.db.insert("anticipations", {
      decisionId: args.decisionId,
      userId: appUser._id,
      issue: args.issue,
      seedsEngaged: args.seedsEngaged,
      resolved: false,
      createdAt: now,
      updatedAt: now,
    });

    // Mettre à jour le compteur d'anticipations de la décision
    await ctx.db.patch(args.decisionId, {
      anticipationsCount: decision.anticipationsCount + 1,
      updatedAt: now,
    });

    // TODO: Débiter les Seeds de l'utilisateur
    // TODO: Créer une transaction Seeds

    // Récompense de participation sera gérée côté client après la création
    // (appelée depuis AnticipationModal et QuizSimple)

    return anticipationId;
  },
});

/**
 * Met à jour une anticipation (avant résolution uniquement)
 */
export const updateAnticipation = mutation({
  args: {
    anticipationId: v.id("anticipations"),
    issue: v.optional(
      v.union(
        v.literal("works"),
        v.literal("partial"),
        v.literal("fails")
      )
    ),
    seedsEngaged: v.optional(v.number()),
    resolved: v.optional(v.boolean()),
    result: v.optional(
      v.union(
        v.literal("works"),
        v.literal("partial"),
        v.literal("fails")
      )
    ),
    seedsEarned: v.optional(v.number()),
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

    const anticipation = await ctx.db.get(args.anticipationId);
    if (!anticipation) {
      throw new Error("Anticipation not found");
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (anticipation.userId !== appUser._id) {
      throw new Error("Not authorized");
    }

    // Si on met à jour une anticipation résolue, on permet seulement certains champs
    if (anticipation.resolved && (args.issue !== undefined || args.seedsEngaged !== undefined)) {
      throw new Error("Cannot update issue or seedsEngaged for a resolved anticipation");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.issue !== undefined) {
      updateData.issue = args.issue;
    }

    if (args.seedsEngaged !== undefined) {
      updateData.seedsEngaged = args.seedsEngaged;
    }

    if (args.resolved !== undefined) {
      updateData.resolved = args.resolved;
    }

    if (args.result !== undefined) {
      updateData.result = args.result;
    }

    if (args.seedsEarned !== undefined) {
      updateData.seedsEarned = args.seedsEarned;
    }

    await ctx.db.patch(args.anticipationId, updateData);

    return args.anticipationId;
  },
});

