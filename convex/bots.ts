import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Récupère tous les bots actifs
 */
export const getBots = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("detection"),
        v.literal("generation"),
        v.literal("resolution"),
        v.literal("tracking"),
        v.literal("aggregation"),
        v.literal("other")
      )
    ),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let bots;

    // Filtrer par statut actif si fourni
    if (args.active !== undefined) {
      bots = await ctx.db
        .query("bots")
        .withIndex("active", (q) => q.eq("active", args.active!))
        .collect();
    } else {
      bots = await ctx.db.query("bots").collect();
    }

    // Filtrer par catégorie si fourni
    if (args.category) {
      bots = bots.filter((bot) => bot.category === args.category);
    }

    // Trier par dernière activité (plus récent en premier)
    bots.sort((a, b) => {
      const aTime = a.lastActivityAt || 0;
      const bTime = b.lastActivityAt || 0;
      return bTime - aTime;
    });

    return bots;
  },
});

/**
 * Récupère un bot par son slug
 */
export const getBotBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const bot = await ctx.db
      .query("bots")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!bot) {
      return null;
    }

    // Compter les décisions créées par ce bot
    const decisionsCreated = await ctx.db
      .query("decisions")
      .filter((q) => q.eq(q.field("createdBy"), "bot"))
      .collect();

    // Compter les résolutions créées par ce bot
    const resolutions = await ctx.db
      .query("resolutions")
      .collect();

    return {
      ...bot,
      // Mettre à jour les stats réelles
      decisionsCreated: decisionsCreated.length,
      decisionsResolved: resolutions.length,
    };
  },
});

/**
 * Récupère un bot par son ID
 */
export const getBotById = query({
  args: {
    botId: v.id("bots"),
  },
  handler: async (ctx, args) => {
    const bot = await ctx.db.get(args.botId);
    return bot;
  },
});

/**
 * Crée ou met à jour un bot (admin uniquement)
 */
export const upsertBot = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    bio: v.optional(v.string()),
    avatar: v.optional(v.string()),
    color: v.optional(v.string()),
    functionName: v.string(),
    category: v.union(
      v.literal("detection"),
      v.literal("generation"),
      v.literal("resolution"),
      v.literal("tracking"),
      v.literal("aggregation"),
      v.literal("other")
    ),
    active: v.optional(v.boolean()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("paused"),
        v.literal("maintenance")
      )
    ),
  },
  handler: async (ctx, args) => {
    // Vérifier si le bot existe déjà
    const existing = await ctx.db
      .query("bots")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    const now = Date.now();

    if (existing) {
      // Mettre à jour le bot existant
      await ctx.db.patch(existing._id, {
        name: args.name,
        description: args.description,
        bio: args.bio,
        avatar: args.avatar,
        color: args.color,
        functionName: args.functionName,
        category: args.category,
        active: args.active ?? existing.active,
        status: args.status ?? existing.status,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Créer un nouveau bot
      const botId = await ctx.db.insert("bots", {
        name: args.name,
        slug: args.slug,
        description: args.description,
        bio: args.bio,
        avatar: args.avatar,
        color: args.color,
        functionName: args.functionName,
        category: args.category,
        decisionsCreated: 0,
        decisionsResolved: 0,
        newsAggregated: 0,
        indicatorsTracked: 0,
        active: args.active ?? true,
        status: args.status ?? "active",
        createdAt: now,
        updatedAt: now,
      });
      return botId;
    }
  },
});

/**
 * Met à jour les statistiques d'un bot
 */
export const updateBotStats = mutation({
  args: {
    botId: v.id("bots"),
    decisionsCreated: v.optional(v.number()),
    decisionsResolved: v.optional(v.number()),
    newsAggregated: v.optional(v.number()),
    indicatorsTracked: v.optional(v.number()),
    increment: v.optional(v.boolean()), // Si true, incrémente au lieu de remplacer
  },
  handler: async (ctx, args) => {
    const bot = await ctx.db.get(args.botId);
    if (!bot) {
      throw new Error("Bot not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
      lastActivityAt: Date.now(),
    };

    if (args.decisionsCreated !== undefined) {
      updates.decisionsCreated = args.increment
        ? (bot.decisionsCreated || 0) + args.decisionsCreated
        : args.decisionsCreated;
    }
    if (args.decisionsResolved !== undefined) {
      updates.decisionsResolved = args.increment
        ? (bot.decisionsResolved || 0) + args.decisionsResolved
        : args.decisionsResolved;
    }
    if (args.newsAggregated !== undefined) {
      updates.newsAggregated = args.increment
        ? (bot.newsAggregated || 0) + args.newsAggregated
        : args.newsAggregated;
    }
    if (args.indicatorsTracked !== undefined) {
      updates.indicatorsTracked = args.increment
        ? (bot.indicatorsTracked || 0) + args.indicatorsTracked
        : args.indicatorsTracked;
    }

    await ctx.db.patch(args.botId, updates);
  },
});

/**
 * Initialise les bots par défaut (mutation publique - à appeler une fois)
 */
export const initializeDefaultBots = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    const defaultBots = [
      {
        name: "Détecteur",
        slug: "detecteur",
        description: "Détecte automatiquement les nouvelles décisions politiques, économiques et diplomatiques depuis les sources officielles.",
        bio: "Je surveille en permanence les sources officielles (gouvernements, institutions, médias) pour détecter les nouvelles décisions importantes. Mon rôle est de repérer les annonces qui méritent d'être suivies sur Seed.",
        functionName: "detectDecisions",
        category: "detection" as const,
        color: "#3b82f6", // Bleu
      },
      {
        name: "Générateur",
        slug: "generateur",
        description: "Génère automatiquement les Decision Cards avec questions objectives et réponses factuelles.",
        bio: "Je transforme les décisions détectées en Decision Cards complètes. J'extrais les informations clés, génère des questions objectives et propose 3 réponses factuelles sans orientation.",
        functionName: "generateDecision",
        category: "generation" as const,
        color: "#8b5cf6", // Violet
      },
      {
        name: "Résolveur",
        slug: "resolveur",
        description: "Résout automatiquement les décisions en calculant l'issue basée sur les indicateurs mesurables.",
        bio: "Je suis le bot qui détermine si une décision a atteint son objectif. J'analyse les variations des indicateurs économiques et sociaux pour calculer automatiquement l'issue (ça marche, partiellement, ou ça ne marche pas).",
        functionName: "resolveDecision",
        category: "resolution" as const,
        color: "#10b981", // Vert
      },
      {
        name: "Suiveur",
        slug: "suiveur",
        description: "Suit automatiquement les indicateurs économiques et sociaux pour mesurer l'impact des décisions.",
        bio: "Je collecte quotidiennement les données des indicateurs (inflation, prix, export, etc.) depuis les sources publiques. Mon travail permet de mesurer objectivement l'impact des décisions.",
        functionName: "trackIndicators",
        category: "tracking" as const,
        color: "#f59e0b", // Orange
      },
      {
        name: "Agrégateur",
        slug: "agregateur",
        description: "Agrège automatiquement les actualités liées à chaque décision depuis plusieurs sources.",
        bio: "Je recherche et agrège les actualités pertinentes pour chaque Decision Card. Je collecte des articles de presse depuis plusieurs sources pour offrir une vue d'ensemble factuelle.",
        functionName: "aggregateNews",
        category: "aggregation" as const,
        color: "#ef4444", // Rouge
      },
    ];

    const botIds: string[] = [];

    for (const botData of defaultBots) {
      // Vérifier si le bot existe déjà
      const existing = await ctx.db
        .query("bots")
        .withIndex("slug", (q) => q.eq("slug", botData.slug))
        .first();

      if (!existing) {
        const botId = await ctx.db.insert("bots", {
          ...botData,
          decisionsCreated: 0,
          decisionsResolved: 0,
          newsAggregated: 0,
          indicatorsTracked: 0,
          active: true,
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
        botIds.push(botId);
      } else {
        botIds.push(existing._id);
      }
    }

    return {
      created: botIds.length,
      bots: botIds,
    };
  },
});

/**
 * Récupère les logs d'un bot
 */
export const getBotLogs = query({
  args: {
    botId: v.id("bots"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("botLogs")
      .withIndex("botId_createdAt", (q) => q.eq("botId", args.botId))
      .order("desc")
      .take(args.limit || 50);

    return logs;
  },
});

/**
 * Crée un log pour un bot
 */
export const createBotLog = mutation({
  args: {
    botId: v.id("bots"),
    level: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    ),
    message: v.string(),
    details: v.optional(v.any()),
    functionName: v.optional(v.string()),
    executionTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("botLogs", {
      botId: args.botId,
      level: args.level,
      message: args.message,
      details: args.details,
      functionName: args.functionName,
      executionTime: args.executionTime,
      createdAt: Date.now(),
    });

    // Mettre à jour lastActivityAt du bot
    await ctx.db.patch(args.botId, {
      lastActivityAt: Date.now(),
    });

    return logId;
  },
});

/**
 * Récupère les métriques temporelles d'un bot
 */
export const getBotMetrics = query({
  args: {
    botId: v.id("bots"),
    metricType: v.optional(
      v.union(
        v.literal("decisionsCreated"),
        v.literal("decisionsResolved"),
        v.literal("newsAggregated"),
        v.literal("indicatorsTracked"),
        v.literal("executionTime"),
        v.literal("errorCount")
      )
    ),
    period: v.optional(v.union(v.literal("hour"), v.literal("day"), v.literal("week"))),
    startTime: v.optional(v.number()), // Timestamp de début
    endTime: v.optional(v.number()), // Timestamp de fin
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let metrics;

    // Filtrer par botId et metricType si fourni
    if (args.metricType) {
      const metricType = args.metricType; // Variable locale pour TypeScript
      metrics = await ctx.db
        .query("botMetrics")
        .withIndex("botId_metricType", (q) =>
          q.eq("botId", args.botId).eq("metricType", metricType)
        )
        .order("desc")
        .take(args.limit || 100);
    } else {
      metrics = await ctx.db
        .query("botMetrics")
        .withIndex("botId", (q) => q.eq("botId", args.botId))
        .order("desc")
        .take(args.limit || 100);
    }

    // Filtrer par période si fournie
    if (args.period) {
      metrics = metrics.filter((m) => m.period === args.period);
    }

    // Filtrer par plage de temps si fournie
    if (args.startTime || args.endTime) {
      metrics = metrics.filter((m) => {
        if (args.startTime && m.timestamp < args.startTime) return false;
        if (args.endTime && m.timestamp > args.endTime) return false;
        return true;
      });
    }

    // Trier par timestamp croissant pour les graphiques
    metrics.sort((a, b) => a.timestamp - b.timestamp);

    return metrics;
  },
});

/**
 * Crée une métrique pour un bot
 */
export const createBotMetric = mutation({
  args: {
    botId: v.id("bots"),
    metricType: v.union(
      v.literal("decisionsCreated"),
      v.literal("decisionsResolved"),
      v.literal("newsAggregated"),
      v.literal("indicatorsTracked"),
      v.literal("executionTime"),
      v.literal("errorCount")
    ),
    value: v.number(),
    period: v.union(v.literal("hour"), v.literal("day"), v.literal("week")),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const metricId = await ctx.db.insert("botMetrics", {
      botId: args.botId,
      metricType: args.metricType,
      value: args.value,
      period: args.period,
      timestamp: args.timestamp || Date.now(),
      createdAt: Date.now(),
    });

    return metricId;
  },
});

