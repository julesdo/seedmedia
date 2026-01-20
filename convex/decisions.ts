import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Récupère les Decision Cards avec pagination et filtres
 */
export const getDecisions = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("announced"),
        v.literal("tracking"),
        v.literal("resolved")
      )
    ),
    type: v.optional(
      v.union(
        v.literal("law"),
        v.literal("sanction"),
        v.literal("tax"),
        v.literal("agreement"),
        v.literal("policy"),
        v.literal("regulation"),
        v.literal("crisis"),
        v.literal("disaster"),
        v.literal("conflict"),
        v.literal("discovery"),
        v.literal("election"),
        v.literal("economic_event"),
        v.literal("other")
      )
    ),
    decider: v.optional(v.string()),
    impactedDomain: v.optional(v.string()),
    // ✅ Nouveaux filtres
    impactLevels: v.optional(v.array(v.number())), // [1, 2, 3, 4, 5]
    sentiments: v.optional(v.array(
      v.union(
        v.literal("positive"),
        v.literal("negative"),
        v.literal("neutral")
      )
    )),
    regions: v.optional(v.array(v.string())), // ["EU", "US", "FR", etc.]
    deciderTypes: v.optional(v.array(v.string())), // ["country", "enterprise", etc.]
    types: v.optional(v.array(v.string())), // ["law", "sanction", etc.]
    // ✅ Filtre pour événements spéciaux
    specialEvent: v.optional(v.union(
      v.literal("municipales_2026"),
      v.literal("presidentielles_2027"),
    )),
  },
  handler: async (ctx, args) => {
    let decisionsQuery;

    // Filtrer par statut si fourni
    if (args.status) {
      decisionsQuery = ctx.db
        .query("decisions")
        .withIndex("status", (q) => q.eq("status", args.status!));
    } else {
      // Par défaut, trier par date (index date)
      decisionsQuery = ctx.db.query("decisions").withIndex("date");
    }

    // Trier par date décroissante et limiter
    let decisions = await decisionsQuery.order("desc").collect();

    // Filtrer par type si fourni
    if (args.type) {
      decisions = decisions.filter((d) => d.type === args.type);
    }

    // Filtrer par décideur si fourni
    if (args.decider) {
      decisions = decisions.filter((d) => d.decider === args.decider);
    }

    // Filtrer par domaine impacté si fourni
    if (args.impactedDomain) {
      decisions = decisions.filter((d) =>
        d.impactedDomains.includes(args.impactedDomain!)
      );
    }

    // ✅ Filtrer par niveaux d'impact si fourni
    if (args.impactLevels && args.impactLevels.length > 0) {
      decisions = decisions.filter((d) => {
        // Si la décision n'a pas d'impactLevel, on l'inclut par défaut (compatibilité avec anciennes décisions)
        if (!d.impactLevel) return true;
        return args.impactLevels!.includes(d.impactLevel);
      });
    }

    // ✅ Filtrer par sentiment si fourni
    if (args.sentiments && args.sentiments.length > 0) {
      decisions = decisions.filter((d) => 
        args.sentiments!.includes(d.sentiment)
      );
    }

    // ✅ Filtrer par types si fourni
    if (args.types && args.types.length > 0) {
      decisions = decisions.filter((d) => 
        args.types!.includes(d.type)
      );
    }

    // ✅ Filtrer par types de décideurs si fourni
    if (args.deciderTypes && args.deciderTypes.length > 0) {
      decisions = decisions.filter((d) => 
        args.deciderTypes!.includes(d.deciderType)
      );
    }

    // ✅ Filtrer par événement spécial si fourni
    if (args.specialEvent) {
      decisions = decisions.filter((d) => d.specialEvent === args.specialEvent);
    }

    // 🎯 FEATURE 4: LE MÉGAPHONE - Prioriser les décisions boostées
    const now = Date.now();
    const boostedDecisionIds = new Set<Id<"decisions">>();
    
    // Récupérer toutes les décisions boostées actuellement
    const activeBoosts = await ctx.db
      .query("decisionBoosts")
      .withIndex("expiresAt", (q) => q.gt("expiresAt", now))
      .collect();

    for (const boost of activeBoosts) {
      boostedDecisionIds.add(boost.decisionId);
    }

    // Séparer les décisions boostées et non boostées
    const boostedDecisions = decisions.filter((d) => boostedDecisionIds.has(d._id));
    const nonBoostedDecisions = decisions.filter((d) => !boostedDecisionIds.has(d._id));

    // Trier les boostées par date de boost (plus récent en premier)
    boostedDecisions.sort((a, b) => {
      const boostA = activeBoosts.find((boost) => boost.decisionId === a._id);
      const boostB = activeBoosts.find((boost) => boost.decisionId === b._id);
      if (!boostA || !boostB) return 0;
      return boostB.createdAt - boostA.createdAt; // Plus récent en premier
    });

    // Combiner : boostées en premier, puis non boostées
    decisions = [...boostedDecisions, ...nonBoostedDecisions];

    // Limiter les résultats
    decisions = decisions.slice(0, args.limit || 20);

    // Enrichir avec les données des indicateurs
    const enrichedDecisions = await Promise.all(
      decisions.map(async (decision) => {
        const indicators = await Promise.all(
          decision.indicatorIds.map((id) => ctx.db.get(id))
        );

        return {
          ...decision,
          indicators: indicators.filter((ind) => ind !== null),
        };
      })
    );

    return enrichedDecisions;
  },
});

/**
 * ✅ Récupère une décision par son hash de contenu (pour déduplication optimisée)
 */
export const getDecisionByContentHash = query({
  args: {
    contentHash: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("decisions")
      .withIndex("contentHash", (q) => q.eq("contentHash", args.contentHash))
      .first();
  },
});

/**
 * Récupère les décisions pour lesquelles un utilisateur a fait des anticipations
 */
export const getDecisionsByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    // Récupérer les anticipations de l'utilisateur
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Récupérer les décisions correspondantes
    const decisions = await Promise.all(
      anticipations.map(async (anticipation) => {
        const decision = await ctx.db.get(anticipation.decisionId);
        if (!decision) return null;
        
        // Enrichir avec les indicateurs
        const indicators = await Promise.all(
          decision.indicatorIds.map((id) => ctx.db.get(id))
        );

        return {
          ...decision,
          indicators: indicators.filter((ind) => ind !== null),
          anticipation, // Inclure l'anticipation de l'utilisateur
        };
      })
    );

    return decisions.filter((d) => d !== null);
  },
});

/**
 * Récupère une Decision Card par son ID
 */
export const getDecisionById = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      return null;
    }

    // Enrichir avec les indicateurs
    const indicators = await Promise.all(
      decision.indicatorIds.map((id) => ctx.db.get(id))
    );

    // Récupérer les anticipations pour cette décision
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    // Récupérer les sources
    const sources = await ctx.db
      .query("sources")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    // Récupérer les actualités
    // ⚠️ SUPPRIMÉ: newsItems (plus nécessaire, utilise RelatedNewsClient côté client)
    const newsItems: any[] = [];

    // Récupérer la résolution si elle existe
    const resolution = await ctx.db
      .query("resolutions")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .first();

    return {
      ...decision,
      indicators: indicators.filter((ind) => ind !== null),
      anticipations,
      sources,
      newsItems,
      resolution,
    };
  },
});

/**
 * Récupère une Decision Card par son slug
 */
export const getDecisionBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const decision = await ctx.db
      .query("decisions")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!decision) {
      return null;
    }

    // Enrichir avec les indicateurs
    const indicators = await Promise.all(
      decision.indicatorIds.map((id) => ctx.db.get(id))
    );

    // Récupérer les anticipations pour cette décision
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("decisionId", (q) => q.eq("decisionId", decision._id))
      .collect();

    // Récupérer les sources
    const sources = await ctx.db
      .query("sources")
      .withIndex("decisionId", (q) => q.eq("decisionId", decision._id))
      .collect();

    // Récupérer les actualités
    // ⚠️ SUPPRIMÉ: newsItems (plus nécessaire, utilise RelatedNewsClient côté client)
    const newsItems: any[] = [];

    // Récupérer la résolution si elle existe
    const resolution = await ctx.db
      .query("resolutions")
      .withIndex("decisionId", (q) => q.eq("decisionId", decision._id))
      .first();

    return {
      ...decision,
      indicators: indicators.filter((ind) => ind !== null),
      anticipations,
      sources,
      newsItems,
      resolution,
    };
  },
});

/**
 * Récupère uniquement les slugs des décisions récentes
 * Utilisé pour generateStaticParams (ISR)
 */
export const getRecentDecisionSlugs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    // Récupérer les décisions les plus récentes
    const decisions = await ctx.db
      .query("decisions")
      .withIndex("date")
      .order("desc")
      .take(limit);
    
    // Retourner uniquement les slugs
    return decisions.map((decision) => ({
      slug: decision.slug,
    }));
  },
});

/**
 * Récupère les Decision Cards "hot" (les plus récentes et suivies)
 * Utilisé pour Instagram et page d'accueil
 */
export const getHotDecisions = query({
  args: {
    limit: v.optional(v.number()),
    minAnticipations: v.optional(v.number()), // Minimum d'anticipations pour être "hot"
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const minAnticipations = args.minAnticipations || 5;

    // Récupérer toutes les décisions en cours de suivi
    const trackingDecisions = await ctx.db
      .query("decisions")
      .withIndex("status", (q) => q.eq("status", "tracking"))
      .collect();

    // Filtrer par nombre minimum d'anticipations
    const hotDecisions = trackingDecisions.filter(
      (d) => d.anticipationsCount >= minAnticipations
    );

    // Trier par nombre d'anticipations décroissant, puis par date
    hotDecisions.sort((a, b) => {
      if (b.anticipationsCount !== a.anticipationsCount) {
        return b.anticipationsCount - a.anticipationsCount;
      }
      return b.date - a.date;
    });

    // Limiter les résultats
    const limited = hotDecisions.slice(0, limit);

    // Enrichir avec les indicateurs
    const enrichedDecisions = await Promise.all(
      limited.map(async (decision) => {
        const indicators = await Promise.all(
          decision.indicatorIds.map((id) => ctx.db.get(id))
        );

        return {
          ...decision,
          indicators: indicators.filter((ind) => ind !== null),
        };
      })
    );

    return enrichedDecisions;
  },
});

/**
 * Récupère les breaking news importantes (heat >= 70 et récentes)
 * Utilisé pour le bandeau défilant
 */
export const getBreakingNews = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000; // 24 heures

    // Récupérer les décisions récentes (moins de 24h) avec un heat élevé (>= 70)
    const allDecisions = await ctx.db
      .query("decisions")
      .withIndex("date")
      .order("desc")
      .collect();

    // Filtrer : récentes (moins de 24h) et heat >= 70
    const breakingNews = allDecisions.filter((decision) => {
      const isRecent = decision.date >= oneDayAgo;
      const isHot = (decision.heat || 0) >= 70;
      return isRecent && isHot;
    });

    // Trier par heat décroissant, puis par date
    breakingNews.sort((a, b) => {
      const heatA = a.heat || 0;
      const heatB = b.heat || 0;
      if (heatB !== heatA) {
        return heatB - heatA;
      }
      return b.date - a.date;
    });

    // Limiter à 3 breaking news max
    return breakingNews.slice(0, 3);
  },
});

/**
 * Crée une nouvelle Decision Card (bot ou admin uniquement)
 */
export const createDecision = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    slug: v.string(),
    contentHash: v.string(), // ✅ Hash de contenu pour déduplication optimisée
    decider: v.string(),
    deciderType: v.union(
      v.literal("country"),
      v.literal("institution"),
      v.literal("leader"),
      v.literal("organization"),
      v.literal("natural"),
      v.literal("economic")
    ),
    date: v.number(),
    type: v.union(
      v.literal("law"),
      v.literal("sanction"),
      v.literal("tax"),
      v.literal("agreement"),
      v.literal("policy"),
      v.literal("regulation"),
      v.literal("crisis"),
      v.literal("disaster"),
      v.literal("conflict"),
      v.literal("discovery"),
      v.literal("election"),
      v.literal("economic_event"),
      v.literal("other")
    ),
    officialText: v.string(),
    sourceUrl: v.string(),
    sourceName: v.optional(v.string()),
    impactedDomains: v.array(v.string()),
    indicatorIds: v.array(v.id("indicators")),
    question: v.string(),
    answer1: v.string(), // Scénario OUI (système binaire)
    // answer2 et answer3 supprimés (système binaire)
    // 🚀 PARAMÈTRES IPO (Initial Political Offering) - calculés dynamiquement par le bot
    targetPrice: v.optional(v.number()), // Prix de départ (1-99 Seeds)
    depthFactor: v.optional(v.number()), // Profondeur du marché (500-10000)
    imageUrl: v.optional(v.string()),
    imageSource: v.optional(v.string()),
    createdBy: v.union(v.literal("bot"), v.literal("manual")),
    sentiment: v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral")),
    heat: v.number(),
    emoji: v.string(),
    badgeColor: v.string(),
    // ✅ ÉVÉNEMENTS SPÉCIAUX : Municipales 2026
    specialEvent: v.optional(v.union(
      v.literal("municipales_2026"),
      v.literal("presidentielles_2027"),
    )),
    specialEventMetadata: v.optional(v.object({
      region: v.optional(v.string()),
      city: v.optional(v.string()),
      eventCategory: v.optional(v.union(
        v.literal("blockbuster"),
        v.literal("tendance"),
        v.literal("insolite")
      )),
    })),
  },
  handler: async (ctx, args) => {
    // Vérifier que le slug est unique
    const existing = await ctx.db
      .query("decisions")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Une décision avec ce slug existe déjà");
    }

    const now = Date.now();

    const decisionId = await ctx.db.insert("decisions", {
      title: args.title,
      description: args.description,
      slug: args.slug,
      contentHash: args.contentHash, // ✅ Ajouter le hash
      decider: args.decider,
      deciderType: args.deciderType,
      date: args.date,
      type: args.type,
      officialText: args.officialText,
      sourceUrl: args.sourceUrl,
      sourceName: args.sourceName,
      impactedDomains: args.impactedDomains,
      indicatorIds: args.indicatorIds,
      question: args.question,
      answer1: args.answer1,
      // answer2 et answer3 supprimés (système binaire)
      // 🚀 PARAMÈTRES IPO (calculés dynamiquement par le bot ou valeurs par défaut)
      targetPrice: args.targetPrice ?? 50, // Prix de départ (1-99 Seeds) - calculé par calculateIPOParameters()
      depthFactor: args.depthFactor ?? 5000, // Profondeur du marché (500-10000) - calculé par calculateIPOParameters()
      imageUrl: args.imageUrl,
      imageSource: args.imageSource,
      createdBy: args.createdBy,
      status: "announced",
      anticipationsCount: 0,
      sourcesCount: 0,
      sentiment: args.sentiment,
      heat: args.heat,
      emoji: args.emoji,
      badgeColor: args.badgeColor,
      // ✅ ÉVÉNEMENTS SPÉCIAUX
      specialEvent: args.specialEvent,
      specialEventMetadata: args.specialEventMetadata,
      createdAt: now,
      updatedAt: now,
    });

    // 🎯 PHASE 2.2: Initialiser les pools de trading OUI/NON
    try {
      await ctx.scheduler.runAfter(0, internal.trading.initializeTradingPools, {
        decisionId,
      });
    } catch (error) {
      // Ne pas bloquer la création si l'initialisation des pools échoue
      console.error("Error initializing trading pools:", error);
    }

    return decisionId;
  },
});

/**
 * Met à jour une Decision Card
 */
export const updateDecision = mutation({
  args: {
    decisionId: v.id("decisions"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    decider: v.optional(v.string()),
    deciderType: v.optional(
      v.union(
        v.literal("country"),
        v.literal("institution"),
        v.literal("leader"),
        v.literal("organization"),
        v.literal("natural"),
        v.literal("economic")
      )
    ),
    date: v.optional(v.number()),
    type: v.optional(
      v.union(
        v.literal("law"),
        v.literal("sanction"),
        v.literal("tax"),
        v.literal("agreement"),
        v.literal("policy"),
        v.literal("regulation"),
        v.literal("crisis"),
        v.literal("disaster"),
        v.literal("conflict"),
        v.literal("discovery"),
        v.literal("election"),
        v.literal("economic_event"),
        v.literal("other")
      )
    ),
    officialText: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    sourceName: v.optional(v.string()),
    impactedDomains: v.optional(v.array(v.string())),
    indicatorIds: v.optional(v.array(v.id("indicators"))),
    question: v.optional(v.string()),
    answer1: v.optional(v.string()), // Scénario OUI (système binaire)
    // answer2 et answer3 supprimés (système binaire)
    imageUrl: v.optional(v.string()),
    imageSource: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("announced"),
        v.literal("tracking"),
        v.literal("resolved")
      )
    ),
    sentiment: v.optional(v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral"))),
    heat: v.optional(v.number()),
    emoji: v.optional(v.string()),
    badgeColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { decisionId, ...updates } = args;

    const decision = await ctx.db.get(decisionId);
    if (!decision) {
      throw new Error("Decision not found");
    }

    // Construire l'objet de mise à jour
    const updateData: any = {
      updatedAt: Date.now(),
    };

    // Ajouter uniquement les champs fournis
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.decider !== undefined) updateData.decider = updates.decider;
    if (updates.deciderType !== undefined)
      updateData.deciderType = updates.deciderType;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.officialText !== undefined)
      updateData.officialText = updates.officialText;
    if (updates.sourceUrl !== undefined) updateData.sourceUrl = updates.sourceUrl;
    if (updates.sourceName !== undefined)
      updateData.sourceName = updates.sourceName;
    if (updates.impactedDomains !== undefined)
      updateData.impactedDomains = updates.impactedDomains;
    if (updates.indicatorIds !== undefined)
      updateData.indicatorIds = updates.indicatorIds;
    if (updates.question !== undefined) updateData.question = updates.question;
    if (updates.answer1 !== undefined) updateData.answer1 = updates.answer1;
    // answer2 et answer3 supprimés (système binaire)
    if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
    if (updates.imageSource !== undefined)
      updateData.imageSource = updates.imageSource;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      if (updates.status === "resolved") {
        updateData.resolvedAt = Date.now();
      }
    }

    await ctx.db.patch(decisionId, updateData);

    return decisionId;
  },
});

/**
 * Recherche de décisions par texte (titre, décideur, domaines)
 */
export const searchDecisions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("announced"),
        v.literal("tracking"),
        v.literal("resolved")
      )
    ),
    type: v.optional(
      v.union(
        v.literal("law"),
        v.literal("sanction"),
        v.literal("tax"),
        v.literal("agreement"),
        v.literal("policy"),
        v.literal("regulation"),
        v.literal("crisis"),
        v.literal("disaster"),
        v.literal("conflict"),
        v.literal("discovery"),
        v.literal("election"),
        v.literal("economic_event"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    const searchQuery = args.query.toLowerCase().trim();
    if (!searchQuery) {
      return [];
    }

    // Récupérer toutes les décisions
    let decisions = await ctx.db.query("decisions").withIndex("date").order("desc").collect();

    // Filtrer par recherche textuelle
    decisions = decisions.filter((d) => {
      const titleMatch = d.title.toLowerCase().includes(searchQuery);
      const deciderMatch = d.decider.toLowerCase().includes(searchQuery);
      const domainMatch = d.impactedDomains.some((domain) =>
        domain.toLowerCase().includes(searchQuery)
      );
      const questionMatch = d.question.toLowerCase().includes(searchQuery);

      return titleMatch || deciderMatch || domainMatch || questionMatch;
    });

    // Filtrer par statut si fourni
    if (args.status) {
      decisions = decisions.filter((d) => d.status === args.status);
    }

    // Filtrer par type si fourni
    if (args.type) {
      decisions = decisions.filter((d) => d.type === args.type);
    }

    // Limiter les résultats
    decisions = decisions.slice(0, args.limit || 20);

    // Enrichir avec les données des indicateurs
    const enrichedDecisions = await Promise.all(
      decisions.map(async (decision) => {
        const indicators = await Promise.all(
          decision.indicatorIds.map((id) => ctx.db.get(id))
        );

        return {
          ...decision,
          indicators: indicators.filter((ind) => ind !== null),
        };
      })
    );

    return enrichedDecisions;
  },
});

