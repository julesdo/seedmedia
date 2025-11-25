import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";

/**
 * Récupère tous les dossiers (avec pagination)
 */
export const getDossiers = query({
  args: {
    limit: v.optional(v.number()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    let allDossiers;
    if (args.featured !== undefined) {
      allDossiers = await ctx.db
        .query("dossiers")
        .withIndex("featured", (q) => q.eq("featured", args.featured as boolean))
        .collect();
    } else {
      allDossiers = await ctx.db.query("dossiers").collect();
    }
    
    // Trier par createdAt décroissant et limiter
    const dossiers = allDossiers
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    return dossiers;
  },
});

/**
 * Récupère le dernier dossier
 */
export const getLatestDossier = query({
  args: {},
  handler: async (ctx) => {
    const allDossiers = await ctx.db.query("dossiers").collect();
    
    if (allDossiers.length === 0) {
      return null;
    }

    // Trier par createdAt décroissant
    const latestDossier = allDossiers
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    return latestDossier;
  },
});

/**
 * Récupère un dossier par son slug
 */
export const getDossierBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const dossier = await ctx.db
      .query("dossiers")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!dossier) {
      return null;
    }

    // Récupérer les articles du dossier
    const articles = await ctx.db
      .query("articles")
      .withIndex("dossierId", (q) => q.eq("dossierId", dossier._id))
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .collect();

    return {
      ...dossier,
      articles,
    };
  },
});

/**
 * Crée un nouveau dossier
 */
export const createDossier = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    coverImage: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featured: v.optional(v.boolean()),
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

    // Vérifier que l'utilisateur est éditeur (seuls les éditeurs peuvent créer des dossiers)
    if (appUser.role !== "editeur") {
      throw new Error("Seuls les éditeurs peuvent créer des dossiers");
    }

    // Vérifier que le slug est unique
    const existing = await ctx.db
      .query("dossiers")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Un dossier avec ce slug existe déjà");
    }

    const now = Date.now();

    const dossierId = await ctx.db.insert("dossiers", {
      title: args.title,
      slug: args.slug,
      description: args.description,
      coverImage: args.coverImage,
      tags: args.tags || [],
      articlesCount: 0,
      featured: args.featured || false,
      createdAt: now,
      updatedAt: now,
    });

    return { dossierId };
  },
});

/**
 * Met à jour un dossier
 */
export const updateDossier = mutation({
  args: {
    dossierId: v.id("dossiers"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featured: v.optional(v.boolean()),
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

    // Vérifier que l'utilisateur est éditeur
    if (appUser.role !== "editeur") {
      throw new Error("Seuls les éditeurs peuvent modifier des dossiers");
    }

    const dossier = await ctx.db.get(args.dossierId);
    if (!dossier) {
      throw new Error("Dossier not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.featured !== undefined) updates.featured = args.featured;

    await ctx.db.patch(args.dossierId, updates);

    return { success: true };
  },
});

/**
 * Ajoute un article à un dossier (ou l'enlève si déjà présent)
 */
export const toggleArticleInDossier = mutation({
  args: {
    articleId: v.id("articles"),
    dossierId: v.id("dossiers"),
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

    // Vérifier que l'utilisateur est éditeur
    if (appUser.role !== "editeur") {
      throw new Error("Seuls les éditeurs peuvent gérer les dossiers");
    }

    const article = await ctx.db.get(args.articleId);
    if (!article) {
      throw new Error("Article not found");
    }

    const dossier = await ctx.db.get(args.dossierId);
    if (!dossier) {
      throw new Error("Dossier not found");
    }

    const wasInDossier = article.dossierId === args.dossierId;

    // Mettre à jour l'article
    await ctx.db.patch(args.articleId, {
      dossierId: wasInDossier ? undefined : args.dossierId,
      updatedAt: Date.now(),
    });

    // Mettre à jour le compteur du dossier
    await ctx.db.patch(args.dossierId, {
      articlesCount: wasInDossier
        ? Math.max(0, dossier.articlesCount - 1)
        : dossier.articlesCount + 1,
      updatedAt: Date.now(),
    });

    return { success: true, added: !wasInDossier };
  },
});

