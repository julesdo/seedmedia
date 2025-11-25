import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";

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

