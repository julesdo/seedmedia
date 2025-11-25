import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import {
  DEFAULT_VOTE_PARAMETERS,
  DEFAULT_CREDIBILITY_RULES,
  DEFAULT_ROLE_PERMISSIONS,
} from "./governanceEvolution.defaults";

/**
 * Récupère les évolutions actives de gouvernance
 */
export const getActiveEvolutions = query({
  args: {
    evolutionType: v.optional(
      v.union(
        v.literal("vote_parameters"),
        v.literal("credibility_rules"),
        v.literal("role_permissions"),
        v.literal("content_rules"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    let evolutions = await ctx.db
      .query("governanceEvolution")
      .withIndex("status", (q) => q.eq("status", "active"))
      .collect();

    // Filtrer par type si spécifié
    if (args.evolutionType) {
      evolutions = evolutions.filter((e) => e.evolutionType === args.evolutionType);
    }

    return evolutions.sort((a, b) => b.appliedAt! - a.appliedAt!);
  },
});

/**
 * Récupère les paramètres de vote actuels (en tenant compte des évolutions)
 * Retourne les valeurs par défaut si aucune évolution n'est en base
 */
export const getCurrentVoteParameters = query({
  args: {},
  handler: async (ctx) => {
    // Récupérer la dernière évolution active pour les paramètres de vote
    const evolutions = await ctx.db
      .query("governanceEvolution")
      .withIndex("evolutionType", (q) => q.eq("evolutionType", "vote_parameters"))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Trier par date d'application (la plus récente en premier)
    evolutions.sort((a, b) => (b.appliedAt || 0) - (a.appliedAt || 0));

    // Si une évolution existe, utiliser ses paramètres (en fusionnant avec les valeurs par défaut)
    if (evolutions.length > 0 && evolutions[0].voteParameters) {
      return {
        ...DEFAULT_VOTE_PARAMETERS,
        ...evolutions[0].voteParameters,
      };
    }

    // Sinon, retourner les valeurs par défaut
    return DEFAULT_VOTE_PARAMETERS;
  },
});

/**
 * Récupère les règles de crédibilité actuelles (en tenant compte des évolutions)
 * Retourne les valeurs par défaut si aucune évolution n'est en base
 */
export const getCurrentCredibilityRules = query({
  args: {},
  handler: async (ctx) => {
    // Récupérer la dernière évolution active pour les règles de crédibilité
    const evolutions = await ctx.db
      .query("governanceEvolution")
      .withIndex("evolutionType", (q) => q.eq("evolutionType", "credibility_rules"))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Trier par date d'application (la plus récente en premier)
    evolutions.sort((a, b) => (b.appliedAt || 0) - (a.appliedAt || 0));

    // Si une évolution existe, utiliser ses règles (en fusionnant avec les valeurs par défaut)
    if (evolutions.length > 0 && evolutions[0].credibilityRules) {
      return {
        ...DEFAULT_CREDIBILITY_RULES,
        ...evolutions[0].credibilityRules,
      };
    }

    // Sinon, retourner les valeurs par défaut
    return DEFAULT_CREDIBILITY_RULES;
  },
});

/**
 * Récupère les permissions de rôle actuelles (en tenant compte des évolutions)
 * Retourne les valeurs par défaut si aucune évolution n'est en base
 */
export const getCurrentRolePermissions = query({
  args: {},
  handler: async (ctx) => {
    // Récupérer la dernière évolution active pour les permissions de rôle
    const evolutions = await ctx.db
      .query("governanceEvolution")
      .withIndex("evolutionType", (q) => q.eq("evolutionType", "role_permissions"))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Trier par date d'application (la plus récente en premier)
    evolutions.sort((a, b) => (b.appliedAt || 0) - (a.appliedAt || 0));

    // Si une évolution existe, utiliser ses permissions (en fusionnant avec les valeurs par défaut)
    if (evolutions.length > 0 && evolutions[0].rolePermissions) {
      return {
        explorateur: {
          ...DEFAULT_ROLE_PERMISSIONS.explorateur,
          ...evolutions[0].rolePermissions.explorateur,
        },
        contributeur: {
          ...DEFAULT_ROLE_PERMISSIONS.contributeur,
          ...evolutions[0].rolePermissions.contributeur,
        },
        editeur: {
          ...DEFAULT_ROLE_PERMISSIONS.editeur,
          ...evolutions[0].rolePermissions.editeur,
        },
      };
    }

    // Sinon, retourner les valeurs par défaut
    return DEFAULT_ROLE_PERMISSIONS;
  },
});

/**
 * Propose une évolution de gouvernance
 */
export const proposeEvolution = mutation({
  args: {
    evolutionType: v.union(
      v.literal("vote_parameters"),
      v.literal("credibility_rules"),
      v.literal("role_permissions"),
      v.literal("content_rules"),
      v.literal("other")
    ),
    description: v.string(),
    voteParameters: v.optional(
      v.object({
        defaultQuorum: v.optional(v.number()),
        defaultMajority: v.optional(v.number()),
        defaultDurationDays: v.optional(v.number()),
        minQuorum: v.optional(v.number()),
        maxQuorum: v.optional(v.number()),
        minMajority: v.optional(v.number()),
        maxMajority: v.optional(v.number()),
        minDurationDays: v.optional(v.number()),
        maxDurationDays: v.optional(v.number()),
      })
    ),
    credibilityRules: v.optional(
      v.object({
        publicationWeight: v.optional(v.number()),
        sourcesWeight: v.optional(v.number()),
        votesWeight: v.optional(v.number()),
        correctionsWeight: v.optional(v.number()),
        expertiseWeight: v.optional(v.number()),
        behaviorWeight: v.optional(v.number()),
      })
    ),
    rolePermissions: v.optional(
      v.object({
        explorateur: v.optional(
          v.object({
            canVote: v.optional(v.boolean()),
            canComment: v.optional(v.boolean()),
            canProposeSources: v.optional(v.boolean()),
            voteWeight: v.optional(v.number()),
          })
        ),
        contributeur: v.optional(
          v.object({
            canWriteArticles: v.optional(v.boolean()),
            canVoteGovernance: v.optional(v.boolean()),
            canFactCheck: v.optional(v.boolean()),
            voteWeight: v.optional(v.number()),
          })
        ),
        editeur: v.optional(
          v.object({
            canValidateArticles: v.optional(v.boolean()),
            canArbitrateDebates: v.optional(v.boolean()),
            voteWeight: v.optional(v.number()),
          })
        ),
      })
    ),
    proposalId: v.optional(v.id("governanceProposals")),
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

    const now = Date.now();

    const evolutionId = await ctx.db.insert("governanceEvolution", {
      evolutionType: args.evolutionType,
      description: args.description,
      voteParameters: args.voteParameters,
      credibilityRules: args.credibilityRules,
      rolePermissions: args.rolePermissions,
      proposedBy: appUser._id,
      proposalId: args.proposalId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return { evolutionId };
  },
});

/**
 * Approuve et applique une évolution (réservé aux éditeurs)
 */
export const approveAndApplyEvolution = mutation({
  args: {
    evolutionId: v.id("governanceEvolution"),
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

    if (appUser.role !== "editeur") {
      throw new Error("Seuls les éditeurs peuvent approuver et appliquer des évolutions");
    }

    const evolution = await ctx.db.get(args.evolutionId);
    if (!evolution) {
      throw new Error("Evolution not found");
    }

    if (evolution.status !== "pending") {
      throw new Error("Cette évolution a déjà été traitée");
    }

    const now = Date.now();

    // Marquer les anciennes évolutions du même type comme "superseded"
    const oldEvolutions = await ctx.db
      .query("governanceEvolution")
      .withIndex("evolutionType", (q) => q.eq("evolutionType", evolution.evolutionType))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    for (const oldEvolution of oldEvolutions) {
      await ctx.db.patch(oldEvolution._id, {
        status: "superseded",
        updatedAt: now,
      });
    }

    // Approuver et activer la nouvelle évolution
    await ctx.db.patch(args.evolutionId, {
      status: "active",
      approvedAt: now,
      approvedBy: appUser._id,
      appliedAt: now,
      appliedBy: appUser._id,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Récupère toutes les évolutions avec filtres (pour l'interface admin)
 */
export const getAllEvolutions = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("active"),
        v.literal("rejected"),
        v.literal("superseded")
      )
    ),
    evolutionType: v.optional(
      v.union(
        v.literal("vote_parameters"),
        v.literal("credibility_rules"),
        v.literal("role_permissions"),
        v.literal("content_rules"),
        v.literal("other")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let evolutions = await ctx.db
      .query("governanceEvolution")
      .collect();

    // Filtrer par statut si spécifié
    if (args.status) {
      evolutions = evolutions.filter((e) => e.status === args.status);
    }

    // Filtrer par type si spécifié
    if (args.evolutionType) {
      evolutions = evolutions.filter((e) => e.evolutionType === args.evolutionType);
    }

    // Trier par date de création (plus récentes en premier)
    evolutions.sort((a, b) => b.createdAt - a.createdAt);

    // Limiter les résultats
    const limit = args.limit || 50;
    evolutions = evolutions.slice(0, limit);

    // Enrichir avec les données du proposant et de l'approbateur
    const enrichedEvolutions = await Promise.all(
      evolutions.map(async (evolution) => {
        const proposer = evolution.proposedBy
          ? await ctx.db.get(evolution.proposedBy)
          : null;
        const approver = evolution.approvedBy
          ? await ctx.db.get(evolution.approvedBy)
          : null;
        const applier = evolution.appliedBy
          ? await ctx.db.get(evolution.appliedBy)
          : null;

        return {
          ...evolution,
          proposer: proposer
            ? {
                _id: proposer._id,
                email: proposer.email || "",
                name: proposer.name || proposer.email?.split("@")[0] || "Auteur",
              }
            : null,
          approver: approver
            ? {
                _id: approver._id,
                email: approver.email || "",
                name: approver.name || approver.email?.split("@")[0] || "Auteur",
              }
            : null,
          applier: applier
            ? {
                _id: applier._id,
                email: applier.email || "",
                name: applier.name || applier.email?.split("@")[0] || "Auteur",
              }
            : null,
        };
      })
    );

    return enrichedEvolutions;
  },
});

/**
 * Rejette une évolution (réservé aux éditeurs)
 */
export const rejectEvolution = mutation({
  args: {
    evolutionId: v.id("governanceEvolution"),
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

    if (appUser.role !== "editeur") {
      throw new Error("Seuls les éditeurs peuvent rejeter des évolutions");
    }

    const evolution = await ctx.db.get(args.evolutionId);
    if (!evolution) {
      throw new Error("Evolution not found");
    }

    if (evolution.status !== "pending") {
      throw new Error("Cette évolution a déjà été traitée");
    }

    await ctx.db.patch(args.evolutionId, {
      status: "rejected",
      approvedAt: Date.now(),
      approvedBy: appUser._id,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

