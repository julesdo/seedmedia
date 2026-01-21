import { query, mutation, internalMutation, internalQuery, action } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Normalise un email (lowercase, trim)
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Vérifie si l'utilisateur connecté est un super admin
 */
export const isSuperAdmin = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      console.log("[isSuperAdmin] No Better Auth user or email");
      return false;
    }

    // Normaliser l'email (lowercase, trim)
    const normalizedEmail = betterAuthUser.email.toLowerCase().trim();
    console.log("[isSuperAdmin] Checking email:", normalizedEmail);

    // Chercher dans la table superAdmins avec l'email normalisé
    const superAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (superAdmin) {
      console.log("[isSuperAdmin] Super admin found:", superAdmin._id);
      return true;
    }

    // Si pas trouvé avec l'index, chercher manuellement (au cas où l'email dans la DB n'est pas normalisé)
    const allAdmins = await ctx.db.query("superAdmins").collect();
    const found = allAdmins.find(
      (admin) => admin.email.toLowerCase().trim() === normalizedEmail
    );

    if (found) {
      console.log("[isSuperAdmin] Super admin found (manual search):", found._id);
      return true;
    }

    console.log("[isSuperAdmin] No super admin found for email:", normalizedEmail);
    console.log("[isSuperAdmin] Available admins:", allAdmins.map((a) => a.email));
    return false;
  },
});

/**
 * Récupère tous les super admins (pour les super admins uniquement)
 */
export const getSuperAdmins = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const admins = await ctx.db.query("superAdmins").order("desc").collect();
    return admins;
  },
});

/**
 * Ajoute un super admin (via ligne de commande uniquement - internal mutation)
 */
export const addSuperAdmin = internalMutation({
  args: {
    email: v.string(),
    addedBy: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Vérifier si l'email existe déjà
    const existing = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error(`Super admin with email ${args.email} already exists`);
    }

    await ctx.db.insert("superAdmins", {
      email: args.email,
      addedBy: args.addedBy,
      addedAt: Date.now(),
      notes: args.notes,
    });

    return { success: true };
  },
});

/**
 * Supprime un super admin (pour les super admins uniquement)
 */
export const removeSuperAdmin = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const toRemove = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!toRemove) {
      throw new Error("Super admin not found");
    }

    await ctx.db.delete(toRemove._id);
    return { success: true };
  },
});

/**
 * Récupère tous les utilisateurs (super admin uniquement)
 */
export const getAllUsers = query({
  args: {
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const limit = args.limit || 50;
    const skip = args.skip || 0;

    let allUsers = await ctx.db.query("users").order("desc").collect();

    if (args.search) {
      // Filtrer par recherche (email, name, username)
      const searchLower = args.search.toLowerCase();
      allUsers = allUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(searchLower) ||
          user.name?.toLowerCase().includes(searchLower) ||
          user.username?.toLowerCase().includes(searchLower)
      );
    }

    // Pagination manuelle
    return allUsers.slice(skip, skip + limit);
  },
});

/**
 * Met à jour un utilisateur (super admin - bypass toutes les validations)
 */
export const updateUserAdmin = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      name: v.optional(v.string()),
      username: v.optional(v.string()),
      email: v.optional(v.string()), // ⚠️ Attention : modification d'email
      bio: v.optional(v.string()),
      image: v.optional(v.string()),
      coverImage: v.optional(v.string()),
      role: v.optional(v.union(v.literal("explorateur"), v.literal("contributeur"), v.literal("editeur"))),
      level: v.optional(v.number()),
      credibilityScore: v.optional(v.number()),
      premiumTier: v.optional(v.union(v.literal("free"), v.literal("starter"), v.literal("pro"), v.literal("impact"))),
      boostCredits: v.optional(v.number()),
      region: v.optional(v.string()),
      reachRadius: v.optional(v.number()),
      location: v.optional(
        v.object({
          lat: v.number(),
          lng: v.number(),
          city: v.optional(v.string()),
          region: v.optional(v.string()),
          country: v.optional(v.string()),
        })
      ),
      tags: v.optional(v.array(v.string())),
      links: v.optional(
        v.array(
          v.object({
            type: v.string(),
            url: v.string(),
          })
        )
      ),
      expertiseDomains: v.optional(v.array(v.string())),
      profileCompletion: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Construire l'objet de mise à jour (seulement les champs fournis)
    const updateData: any = {
      updatedAt: Date.now(),
    };

    Object.keys(args.updates).forEach((key) => {
      const value = (args.updates as any)[key];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    await ctx.db.patch(args.userId, updateData);

    return { success: true, userId: args.userId };
  },
});

/**
 * Récupère tous les articles (super admin uniquement)
 */
export const getAllArticles = query({
  args: {
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
    search: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("draft"), v.literal("pending"), v.literal("published"), v.literal("rejected"))
    ),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const limit = args.limit || 50;
    const skip = args.skip || 0;

    let query = ctx.db.query("articles").order("desc");

    let articles = await query.collect();

    // Filtrer par statut
    if (args.status) {
      articles = articles.filter((article) => article.status === args.status);
    }

    // Filtrer par recherche
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      articles = articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchLower) ||
          article.summary?.toLowerCase().includes(searchLower) ||
          article.slug.toLowerCase().includes(searchLower)
      );
    }

    // Pagination manuelle
    return articles.slice(skip, skip + limit);
  },
});

/**
 * Met à jour un article (super admin - bypass toutes les validations)
 */
export const updateArticleAdmin = mutation({
  args: {
    articleId: v.id("articles"),
    updates: v.object({
      title: v.optional(v.string()),
      slug: v.optional(v.string()),
      summary: v.optional(v.string()),
      content: v.optional(v.string()),
      coverImage: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      articleType: v.optional(
        v.union(
          v.literal("scientific"),
          v.literal("expert"),
          v.literal("opinion"),
          v.literal("news"),
          v.literal("tutorial"),
          v.literal("other")
        )
      ),
      status: v.optional(
        v.union(v.literal("draft"), v.literal("pending"), v.literal("published"), v.literal("rejected"))
      ),
      featured: v.optional(v.boolean()),
      qualityScore: v.optional(v.number()),
      views: v.optional(v.number()),
      reactions: v.optional(v.number()),
      comments: v.optional(v.number()),
      these: v.optional(v.string()),
      counterArguments: v.optional(v.array(v.string())),
      conclusion: v.optional(v.string()),
      sourcesCount: v.optional(v.number()),
      verifiedClaimsCount: v.optional(v.number()),
      totalClaimsCount: v.optional(v.number()),
      expertReviewCount: v.optional(v.number()),
      communityVerificationScore: v.optional(v.number()),
      publishedAt: v.optional(v.number()),
      categoryIds: v.optional(v.array(v.id("categories"))),
    }),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const article = await ctx.db.get(args.articleId);
    if (!article) {
      throw new Error("Article not found");
    }

    // Construire l'objet de mise à jour (seulement les champs fournis)
    const updateData: any = {
      updatedAt: Date.now(),
    };

    Object.keys(args.updates).forEach((key) => {
      const value = (args.updates as any)[key];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    // Si le statut passe à "published" et que publishedAt n'est pas défini, le définir automatiquement
    if (args.updates.status === "published" && !args.updates.publishedAt) {
      if (!article.publishedAt) {
        updateData.publishedAt = Date.now();
      }
    }

    await ctx.db.patch(args.articleId, updateData);

    return { success: true, articleId: args.articleId };
  },
});

/**
 * Supprime un article (super admin uniquement)
 */
export const deleteArticleAdmin = mutation({
  args: {
    articleId: v.id("articles"),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    await ctx.db.delete(args.articleId);
    return { success: true };
  },
});


/**
 * Récupère toutes les décisions avec événements spéciaux
 * Super admin uniquement
 */
export const getSpecialEventDecisions = query({
  args: {
    specialEvent: v.optional(v.union(
      v.literal("municipales_2026"),
      v.literal("presidentielles_2027"),
    )),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    let decisions = await ctx.db.query("decisions").collect();

    // Filtrer par événement spécial si fourni
    if (args.specialEvent) {
      decisions = decisions.filter((d) => d.specialEvent === args.specialEvent);
    } else {
      // Sinon, récupérer toutes les décisions avec un événement spécial
      decisions = decisions.filter((d) => d.specialEvent !== undefined);
    }

    return decisions;
  },
});

/**
 * Met à jour une décision pour ajouter/modifier un événement spécial
 * Super admin uniquement
 */
export const updateDecisionSpecialEvent = mutation({
  args: {
    decisionId: v.id("decisions"),
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
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error("Decision not found");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.specialEvent !== undefined) {
      updateData.specialEvent = args.specialEvent;
    }

    if (args.specialEventMetadata !== undefined) {
      updateData.specialEventMetadata = args.specialEventMetadata;
    }

    await ctx.db.patch(args.decisionId, updateData);

    return { success: true, decisionId: args.decisionId };
  },
});

/**
 * Récupère les statistiques du dashboard admin
 * Super admin uniquement
 */
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const last7d = now - 7 * 24 * 60 * 60 * 1000;
    const last30d = now - 30 * 24 * 60 * 60 * 1000;

    // Décisions
    const allDecisions = await ctx.db.query("decisions").collect();
    const decisionsTracking = allDecisions.filter((d) => d.status === "tracking");
    const decisionsResolved = allDecisions.filter((d) => d.status === "resolved");
    const decisionsLast24h = allDecisions.filter((d) => d.createdAt >= last24h);
    const decisionsLast7d = allDecisions.filter((d) => d.createdAt >= last7d);
    const decisionsLast30d = allDecisions.filter((d) => d.createdAt >= last30d);

    // Utilisateurs
    const allUsers = await ctx.db.query("users").collect();
    const usersLast7d = allUsers.filter((u) => u.createdAt >= last7d);
    const usersLast30d = allUsers.filter((u) => u.createdAt >= last30d);
    const activeUsersLast7d = allUsers.filter(
      (u) => u.lastLoginDate && u.lastLoginDate >= Math.floor(last7d / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000)
    );

    // Trading
    const allPools = await ctx.db.query("tradingPools").collect();
    const allTransactions = await ctx.db.query("tradingTransactions").collect();
    const transactionsLast24h = allTransactions.filter((t) => t.createdAt >= last24h);
    const transactionsLast7d = allTransactions.filter((t) => t.createdAt >= last7d);
    
    // Calculer la liquidité totale (somme des réserves de tous les pools)
    const totalLiquidity = allPools.reduce((sum, pool) => sum + (pool.reserve || 0), 0);
    
    // Volume de trading (somme des coûts des transactions - cost pour buy, netAmount pour sell)
    const volume24h = transactionsLast24h.reduce((sum, t) => {
      if (t.type === "buy") {
        return sum + (t.cost || 0);
      } else {
        return sum + (t.netAmount || t.cost || 0);
      }
    }, 0);
    const volume7d = transactionsLast7d.reduce((sum, t) => {
      if (t.type === "buy") {
        return sum + (t.cost || 0);
      } else {
        return sum + (t.netAmount || t.cost || 0);
      }
    }, 0);

    // Taux de résolution
    const resolutionRate = allDecisions.length > 0
      ? (decisionsResolved.length / allDecisions.length) * 100
      : 0;

    return {
      decisions: {
        total: allDecisions.length,
        tracking: decisionsTracking.length,
        resolved: decisionsResolved.length,
        last24h: decisionsLast24h.length,
        last7d: decisionsLast7d.length,
        last30d: decisionsLast30d.length,
      },
      users: {
        total: allUsers.length,
        last7d: usersLast7d.length,
        last30d: usersLast30d.length,
        activeLast7d: activeUsersLast7d.length,
      },
      trading: {
        totalPools: allPools.length,
        totalLiquidity,
        transactions24h: transactionsLast24h.length,
        volume24h,
        volume7d,
      },
      resolutionRate: Math.round(resolutionRate * 100) / 100,
    };
  },
});

/**
 * Récupère l'activité récente pour le dashboard
 * Super admin uniquement
 */
export const getRecentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const limit = args.limit || 20;

    // Décisions récentes
    const recentDecisions = await ctx.db
      .query("decisions")
      .order("desc")
      .take(limit);

    // Transactions récentes
    const recentTransactions = await ctx.db
      .query("tradingTransactions")
      .order("desc")
      .take(limit);

    // Utilisateurs récents
    const recentUsers = await ctx.db
      .query("users")
      .order("desc")
      .take(limit);

    return {
      decisions: recentDecisions.map((d) => ({
        _id: d._id,
        title: d.title,
        status: d.status,
        createdAt: d.createdAt,
      })),
      transactions: recentTransactions.map((t) => ({
        _id: t._id,
        decisionId: t.decisionId,
        userId: t.userId,
        type: t.type,
        position: t.position,
        cost: t.cost,
        shares: t.shares,
        createdAt: t.createdAt,
      })),
      users: recentUsers.map((u) => ({
        _id: u._id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt,
      })),
    };
  },
});

/**
 * Crée une nouvelle décision (admin uniquement)
 * Super admin uniquement
 */
export const createDecision = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    slug: v.string(),
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
    answer1: v.string(),
    targetPrice: v.optional(v.number()),
    depthFactor: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    imageSource: v.optional(v.string()),
    sentiment: v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral")),
    heat: v.number(),
    emoji: v.string(),
    badgeColor: v.string(),
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
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    // Vérifier que le slug est unique
    const existing = await ctx.db
      .query("decisions")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Une décision avec ce slug existe déjà");
    }

    // Générer un contentHash simple (titre + sourceUrl)
    const contentHash = `${args.title}_${args.sourceUrl}`.replace(/[^a-zA-Z0-9]/g, "_");

    const now = Date.now();

    const decisionId = await ctx.db.insert("decisions", {
      title: args.title,
      description: args.description,
      slug: args.slug,
      contentHash,
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
      targetPrice: args.targetPrice ?? 50,
      depthFactor: args.depthFactor ?? 5000,
      imageUrl: args.imageUrl,
      imageSource: args.imageSource,
      createdBy: "manual",
      status: "announced",
      anticipationsCount: 0,
      sourcesCount: 0,
      sentiment: args.sentiment,
      heat: args.heat,
      emoji: args.emoji,
      badgeColor: args.badgeColor,
      specialEvent: args.specialEvent,
      specialEventMetadata: args.specialEventMetadata,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, decisionId };
  },
});

/**
 * Met à jour une décision (admin - étend les champs modifiables)
 * Super admin uniquement
 */
export const updateDecision = mutation({
  args: {
    decisionId: v.id("decisions"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    slug: v.optional(v.string()),
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
    answer1: v.optional(v.string()),
    targetPrice: v.optional(v.number()),
    depthFactor: v.optional(v.number()),
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
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error("Decision not found");
    }

    // Vérifier l'unicité du slug si modifié
    if (args.slug && args.slug !== decision.slug) {
      const slugToCheck = args.slug; // Type narrowing
      const existing = await ctx.db
        .query("decisions")
        .withIndex("slug", (q) => q.eq("slug", slugToCheck))
        .first();

      if (existing) {
        throw new Error("Une décision avec ce slug existe déjà");
      }
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    Object.keys(args).forEach((key) => {
      if (key !== "decisionId" && args[key as keyof typeof args] !== undefined) {
        updateData[key] = args[key as keyof typeof args];
      }
    });

    await ctx.db.patch(args.decisionId, updateData);

    return { success: true, decisionId: args.decisionId };
  },
});

/**
 * Résout une décision (admin uniquement)
 * Super admin uniquement
 */
export const resolveDecision = mutation({
  args: {
    decisionId: v.id("decisions"),
    result: v.union(v.literal("yes"), v.literal("no")),
    justification: v.optional(v.string()),
    sources: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error("Decision not found");
    }

    if (decision.status === "resolved") {
      throw new Error("Cette décision est déjà résolue");
    }

    const now = Date.now();

    await ctx.db.patch(args.decisionId, {
      status: "resolved",
      resolvedAt: now,
      updatedAt: now,
      // Stocker le résultat dans un champ custom si nécessaire
      // Pour l'instant, on peut utiliser un champ dans specialEventMetadata ou créer un nouveau champ
    });

    // TODO: Résoudre toutes les anticipations et distribuer les gains/pertes
    // Cette logique devrait être dans une fonction séparée ou un cron job

    return { success: true, decisionId: args.decisionId };
  },
});

/**
 * Supprime une décision (admin uniquement)
 * Super admin uniquement
 */
export const deleteDecision = mutation({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      throw new Error("Decision not found");
    }

    // TODO: Supprimer aussi les anticipations, pools de trading, transactions associées
    // Pour l'instant, on supprime juste la décision
    await ctx.db.delete(args.decisionId);

    return { success: true };
  },
});

// ============================================
// GESTION DES CATÉGORIES POUR DÉCISIONS (Admin)
// ============================================

/**
 * Récupère toutes les catégories pour décisions (admin uniquement)
 * Super admin uniquement
 */
export const getAllCategoriesForDecisions = query({
  args: {
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    let categories = await ctx.db
      .query("categories")
      .withIndex("status", (q) => q.eq("status", "active"))
      .collect();

    // Filtrer par appliesTo incluant "decisions"
    categories = categories.filter((cat) => cat.appliesTo.includes("decisions"));

    // Filtrer par featured si fourni
    if (args.featured !== undefined) {
      categories = categories.filter((cat) => cat.featured === args.featured);
    }

    // Trier par priority (croissant), puis par nom
    return categories.sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return a.name.localeCompare(b.name);
    });
  },
});

/**
 * Crée une catégorie pour décisions (admin uniquement)
 * Super admin uniquement
 */
export const createCategoryForDecisions = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    parentCategoryId: v.optional(v.id("categories")),
    featured: v.optional(v.boolean()),
    priority: v.optional(v.number()),
    coverImage: v.optional(v.string()),
    coverImageAlt: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    // Vérifier que le slug est unique
    const existing = await ctx.db
      .query("categories")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Une catégorie avec ce slug existe déjà");
    }

    // Récupérer l'utilisateur app
    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!appUser) {
      throw new Error("User not found");
    }

    const now = Date.now();

    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      shortDescription: args.shortDescription,
      icon: args.icon,
      color: args.color,
      parentCategoryId: args.parentCategoryId,
      appliesTo: ["decisions"], // Uniquement pour décisions
      featured: args.featured ?? false,
      priority: args.priority ?? 0,
      coverImage: args.coverImage,
      coverImageAlt: args.coverImageAlt,
      tags: args.tags ?? [],
      status: "active",
      usageCount: 0,
      proposedBy: appUser._id,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, categoryId };
  },
});

/**
 * Met à jour une catégorie pour décisions (admin uniquement)
 * Super admin uniquement
 */
export const updateCategoryForDecisions = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    parentCategoryId: v.optional(v.id("categories")),
    featured: v.optional(v.boolean()),
    priority: v.optional(v.number()),
    coverImage: v.optional(v.string()),
    coverImageAlt: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Vérifier que le slug est unique si modifié
    if (args.slug && args.slug !== category.slug) {
      const existing = await ctx.db
        .query("categories")
        .withIndex("slug", (q) => q.eq("slug", args.slug!))
        .first();

      if (existing) {
        throw new Error("Une catégorie avec ce slug existe déjà");
      }
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.slug !== undefined) updateData.slug = args.slug;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.shortDescription !== undefined) updateData.shortDescription = args.shortDescription;
    if (args.icon !== undefined) updateData.icon = args.icon;
    if (args.color !== undefined) updateData.color = args.color;
    if (args.parentCategoryId !== undefined) updateData.parentCategoryId = args.parentCategoryId;
    if (args.featured !== undefined) updateData.featured = args.featured;
    if (args.priority !== undefined) updateData.priority = args.priority;
    if (args.coverImage !== undefined) updateData.coverImage = args.coverImage;
    if (args.coverImageAlt !== undefined) updateData.coverImageAlt = args.coverImageAlt;
    if (args.tags !== undefined) updateData.tags = args.tags;

    await ctx.db.patch(args.categoryId, updateData);

    return { success: true, categoryId: args.categoryId };
  },
});

/**
 * Supprime/archive une catégorie pour décisions (admin uniquement)
 * Super admin uniquement
 */
export const deleteCategoryForDecisions = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    // Archiver plutôt que supprimer
    await ctx.db.patch(args.categoryId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============================================
// GESTION DES ÉVÉNEMENTS SPÉCIAUX (Admin)
// ============================================

/**
 * Récupère tous les événements spéciaux (admin uniquement)
 * Super admin uniquement
 */
export const getAllSpecialEvents = query({
  args: {
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    let events = await ctx.db.query("specialEvents").collect();

    // Filtrer par featured si fourni
    if (args.featured !== undefined) {
      events = events.filter((event) => event.featured === args.featured);
    }

    // Trier par priorité (croissant), puis par date de début
    return events.sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      const startA = a.startDate ?? 0;
      const startB = b.startDate ?? 0;
      return startB - startA; // Plus récent en premier
    });
  },
});

/**
 * Crée un événement spécial (admin uniquement)
 * Super admin uniquement
 */
export const createSpecialEvent = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    coverImageAlt: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    eventCategory: v.optional(
      v.union(v.literal("blockbuster"), v.literal("tendance"), v.literal("insolite"))
    ),
    cohortRules: v.object({
      categoryIds: v.optional(v.array(v.id("categories"))),
      titleKeywords: v.optional(v.array(v.string())),
      titleContains: v.optional(v.string()),
      descriptionKeywords: v.optional(v.array(v.string())),
      descriptionContains: v.optional(v.string()),
      decisionType: v.optional(
        v.array(
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
        )
      ),
      decider: v.optional(v.string()),
      sentiment: v.optional(
        v.array(
          v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral"))
        )
      ),
      impactedDomains: v.optional(v.array(v.string())),
      decisionCreatedAfter: v.optional(v.number()),
      decisionCreatedBefore: v.optional(v.number()),
      operator: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
    }),
    featured: v.optional(v.boolean()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    // Vérifier que le slug est unique
    const existing = await ctx.db
      .query("specialEvents")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Un événement spécial avec ce slug existe déjà");
    }

    // Valider qu'au moins une règle de cohorte est définie
    const rules = args.cohortRules;
    const hasRules =
      (rules.categoryIds && rules.categoryIds.length > 0) ||
      (rules.titleKeywords && rules.titleKeywords.length > 0) ||
      rules.titleContains ||
      (rules.descriptionKeywords && rules.descriptionKeywords.length > 0) ||
      rules.descriptionContains ||
      (rules.decisionType && rules.decisionType.length > 0) ||
      rules.decider ||
      (rules.sentiment && rules.sentiment.length > 0) ||
      (rules.impactedDomains && rules.impactedDomains.length > 0) ||
      rules.decisionCreatedAfter ||
      rules.decisionCreatedBefore;

    if (!hasRules) {
      throw new Error("Au moins une règle de cohorte doit être définie");
    }

    const now = Date.now();

    const eventId = await ctx.db.insert("specialEvents", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      shortDescription: args.shortDescription,
      coverImage: args.coverImage,
      coverImageAlt: args.coverImageAlt,
      startDate: args.startDate,
      endDate: args.endDate,
      region: args.region,
      city: args.city,
      eventCategory: args.eventCategory,
      cohortRules: args.cohortRules,
      featured: args.featured ?? false,
      priority: args.priority ?? 0,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, eventId };
  },
});

/**
 * Met à jour un événement spécial (admin uniquement)
 * Super admin uniquement
 */
export const updateSpecialEvent = mutation({
  args: {
    eventId: v.id("specialEvents"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    coverImageAlt: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    eventCategory: v.optional(
      v.union(v.literal("blockbuster"), v.literal("tendance"), v.literal("insolite"))
    ),
    cohortRules: v.optional(
      v.object({
        categoryIds: v.optional(v.array(v.id("categories"))),
        titleKeywords: v.optional(v.array(v.string())),
        titleContains: v.optional(v.string()),
        descriptionKeywords: v.optional(v.array(v.string())),
        descriptionContains: v.optional(v.string()),
        decisionType: v.optional(
          v.array(
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
          )
        ),
        decider: v.optional(v.string()),
        sentiment: v.optional(
          v.array(
            v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral"))
          )
        ),
        impactedDomains: v.optional(v.array(v.string())),
        decisionCreatedAfter: v.optional(v.number()),
        decisionCreatedBefore: v.optional(v.number()),
        operator: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
      })
    ),
    featured: v.optional(v.boolean()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Événement spécial non trouvé");
    }

    // Vérifier que le slug est unique si modifié
    if (args.slug && args.slug !== event.slug) {
      const existing = await ctx.db
        .query("specialEvents")
        .withIndex("slug", (q) => q.eq("slug", args.slug!))
        .first();

      if (existing) {
        throw new Error("Un événement spécial avec ce slug existe déjà");
      }
    }

    // Valider les règles de cohorte si modifiées
    if (args.cohortRules) {
      const rules = args.cohortRules;
      const hasRules =
        (rules.categoryIds && rules.categoryIds.length > 0) ||
        (rules.titleKeywords && rules.titleKeywords.length > 0) ||
        rules.titleContains ||
        (rules.descriptionKeywords && rules.descriptionKeywords.length > 0) ||
        rules.descriptionContains ||
        (rules.decisionType && rules.decisionType.length > 0) ||
        rules.decider ||
        (rules.sentiment && rules.sentiment.length > 0) ||
        (rules.impactedDomains && rules.impactedDomains.length > 0) ||
        rules.decisionCreatedAfter ||
        rules.decisionCreatedBefore;

      if (!hasRules) {
        throw new Error("Au moins une règle de cohorte doit être définie");
      }
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.slug !== undefined) updateData.slug = args.slug;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.shortDescription !== undefined)
      updateData.shortDescription = args.shortDescription;
    if (args.coverImage !== undefined) updateData.coverImage = args.coverImage;
    if (args.coverImageAlt !== undefined) updateData.coverImageAlt = args.coverImageAlt;
    if (args.startDate !== undefined) updateData.startDate = args.startDate;
    if (args.endDate !== undefined) updateData.endDate = args.endDate;
    if (args.region !== undefined) updateData.region = args.region;
    if (args.city !== undefined) updateData.city = args.city;
    if (args.eventCategory !== undefined) updateData.eventCategory = args.eventCategory;
    if (args.cohortRules !== undefined) updateData.cohortRules = args.cohortRules;
    if (args.featured !== undefined) updateData.featured = args.featured;
    if (args.priority !== undefined) updateData.priority = args.priority;

    await ctx.db.patch(args.eventId, updateData);

    return { success: true, eventId: args.eventId };
  },
});

/**
 * Supprime un événement spécial (admin uniquement)
 * Super admin uniquement
 */
export const deleteSpecialEvent = mutation({
  args: {
    eventId: v.id("specialEvents"),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Événement spécial non trouvé");
    }

    await ctx.db.delete(args.eventId);

    return { success: true };
  },
});

/**
 * Met en avant une catégorie (admin uniquement)
 * Super admin uniquement
 */
export const setCategoryFeatured = mutation({
  args: {
    categoryId: v.id("categories"),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await ctx.db.patch(args.categoryId, {
      featured: args.featured,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Définit l'ordre d'affichage d'une catégorie (admin uniquement)
 * Super admin uniquement
 */
export const setCategoryPriority = mutation({
  args: {
    categoryId: v.id("categories"),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await ctx.db.patch(args.categoryId, {
      priority: args.priority,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ============================================
// FONCTIONS INTERNES POUR MIGRATION
// ============================================

/**
 * Vérifie si un utilisateur est super admin (version interne)
 */
export const checkIsSuperAdminInternal = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = normalizeEmail(args.email);
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    return !!isAdmin;
  },
});

/**
 * Récupère un utilisateur par email (version interne)
 */
export const getUserByEmailInternal = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const normalizedEmail = normalizeEmail(args.email);
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    return user;
  },
});

/**
 * Lance la migration des décisions vers le système de catégories unifié
 * Super admin uniquement
 */
export const runMigrationDecisionsToCategories = action({
  args: {},
  handler: async (ctx, args): Promise<{ success: boolean; stats?: any; error?: string }> => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    const normalizedEmail = normalizeEmail(betterAuthUser.email);
    // @ts-ignore - Type instantiation is excessively deep
    const isAdmin = await ctx.runQuery(internal.admin.checkIsSuperAdminInternal, {
      email: normalizedEmail,
    });

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    // Récupérer l'utilisateur app
    const appUser = await ctx.runQuery(internal.admin.getUserByEmailInternal, {
      email: normalizedEmail,
    });

    if (!appUser) {
      throw new Error("User not found");
    }

    // Lancer la migration
    const result = await ctx.runMutation(
      internal.scripts.migrateDecisionsToCategories.migrateDecisionsToCategories,
      {
        adminUserId: appUser._id,
      }
    );

    return result;
  },
});

