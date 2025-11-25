import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { DEFAULT_CATEGORIES, getDefaultCategory, getDefaultCategoriesFor } from "./categories.defaults";

/**
 * Récupère toutes les catégories actives
 * Combine les catégories en base avec les catégories par défaut (si elles n'existent pas encore)
 */
export const getActiveCategories = query({
  args: {
    appliesTo: v.optional(
      v.union(
        v.literal("articles"),
        v.literal("dossiers"),
        v.literal("debates"),
        v.literal("projects"),
        v.literal("organizations"),
        v.literal("actions")
      )
    ),
  },
  handler: async (ctx, args) => {
    // Récupérer les catégories en base
    let categories = await ctx.db
      .query("categories")
      .withIndex("status", (q) => q.eq("status", "active"))
      .collect();

    // Filtrer par appliesTo si spécifié
    if (args.appliesTo) {
      categories = categories.filter((cat) => cat.appliesTo.includes(args.appliesTo!));
    }

    // Récupérer les slugs des catégories existantes
    const existingSlugs = new Set(categories.map((c) => c.slug));

    // Ajouter les catégories par défaut qui n'existent pas encore en base
    let defaultCategoriesToAdd = DEFAULT_CATEGORIES;
    if (args.appliesTo) {
      defaultCategoriesToAdd = getDefaultCategoriesFor(args.appliesTo);
    }

    // Pour les catégories par défaut qui n'existent pas en base, les retourner quand même
    for (const defaultCat of defaultCategoriesToAdd) {
      if (!existingSlugs.has(defaultCat.slug)) {
        // Retourner la catégorie par défaut même si elle n'est pas en base
        categories.push({
          _id: "" as any, // Pas d'ID car pas encore en base
          _creationTime: Date.now(),
          name: defaultCat.name,
          slug: defaultCat.slug,
          description: defaultCat.description,
          icon: defaultCat.icon,
          color: defaultCat.color,
          appliesTo: defaultCat.appliesTo,
          status: "active",
          usageCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as any);
      }
    }

    return categories.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Récupère une catégorie par son slug
 */
export const getCategoryBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

/**
 * Crée une catégorie (utilisé lors de l'exécution d'une proposition approuvée)
 * Version interne pour être appelée depuis d'autres mutations
 */
export const createCategoryInternal = internalMutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    appliesTo: v.array(
      v.union(
        v.literal("articles"),
        v.literal("dossiers"),
        v.literal("debates"),
        v.literal("projects"),
        v.literal("organizations")
      )
    ),
    proposalId: v.id("governanceProposals"),
    executedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Vérifier que le slug est unique
    const existing = await ctx.db
      .query("categories")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Une catégorie avec ce slug existe déjà");
    }

    const now = Date.now();

    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      icon: args.icon,
      color: args.color,
      appliesTo: args.appliesTo,
      status: "active", // Créée directement comme active (pas de pending)
      usageCount: 0,
      proposedBy: args.executedBy, // L'utilisateur qui a exécuté la proposition
      proposalId: args.proposalId, // La proposition de gouvernance associée
      createdAt: now,
      updatedAt: now,
    });

    return { categoryId };
  },
});

/**
 * Récupère les catégories proposées par l'utilisateur actuel
 */
export const getMyCategories = query({
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

    return await ctx.db
      .query("categories")
      .withIndex("proposedBy", (q) => q.eq("proposedBy", appUser._id))
      .collect();
  },
});


/**
 * Archive une catégorie (réservé aux éditeurs)
 */
export const archiveCategory = mutation({
  args: {
    categoryId: v.id("categories"),
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
      throw new Error("Seuls les éditeurs peuvent archiver des catégories");
    }

    const category = await ctx.db.get(args.categoryId);
    if (!category) {
      throw new Error("Category not found");
    }

    await ctx.db.patch(args.categoryId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Met à jour les catégories d'un article
 */
export const updateArticleCategories = mutation({
  args: {
    articleId: v.id("articles"),
    categoryIds: v.array(v.id("categories")),
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

    const article = await ctx.db.get(args.articleId);
    if (!article) {
      throw new Error("Article not found");
    }

    // Vérifier que l'utilisateur est l'auteur ou un éditeur
    if (article.authorId !== appUser._id && appUser.role !== "editeur") {
      throw new Error("Vous n'avez pas la permission de modifier cet article");
    }

    // Vérifier que toutes les catégories sont actives et applicables aux articles
    for (const categoryId of args.categoryIds) {
      const category = await ctx.db.get(categoryId);
      if (!category || category.status !== "active" || !category.appliesTo.includes("articles")) {
        throw new Error(`La catégorie ${categoryId} n'est pas valide pour les articles`);
      }
    }

    // Mettre à jour les catégories
    await ctx.db.patch(args.articleId, {
      categoryIds: args.categoryIds,
      updatedAt: Date.now(),
    });

    // Mettre à jour les compteurs d'utilisation des catégories
    const oldCategoryIds = article.categoryIds || [];
    const removedCategories = oldCategoryIds.filter((id) => !args.categoryIds.includes(id));
    const addedCategories = args.categoryIds.filter((id) => !oldCategoryIds.includes(id));

    for (const categoryId of removedCategories) {
      const category = await ctx.db.get(categoryId);
      if (category) {
        await ctx.db.patch(categoryId, {
          usageCount: Math.max(0, category.usageCount - 1),
          updatedAt: Date.now(),
        });
      }
    }

    for (const categoryId of addedCategories) {
      const category = await ctx.db.get(categoryId);
      if (category) {
        await ctx.db.patch(categoryId, {
          usageCount: category.usageCount + 1,
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

