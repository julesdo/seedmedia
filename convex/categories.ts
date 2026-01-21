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
        v.literal("actions"),
        v.literal("decisions") // ✅ NOUVEAU
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

    // Calculer dynamiquement le usageCount pour chaque catégorie
    // Compter TOUTES les occurrences dans TOUS les types de contenus, peu importe appliesTo
    const categoriesWithUsage = await Promise.all(
      categories.map(async (category) => {
        let usageCount = 0;

        // Si la catégorie a un _id (existe en base), compter les occurrences dans TOUS les contenus
        if (category._id) {
          // Compter dans les articles
          const allArticles = await ctx.db.query("articles").collect();
          usageCount += allArticles.filter(
            (article) => article.categoryIds?.includes(category._id)
          ).length;

          // Compter dans les projets
          const allProjects = await ctx.db.query("projects").collect();
          usageCount += allProjects.filter(
            (project) => project.categoryIds?.includes(category._id)
          ).length;

          // Compter dans les actions
          const allActions = await ctx.db.query("actions").collect();
          usageCount += allActions.filter(
            (action) => action.categoryIds?.includes(category._id)
          ).length;

          // Compter dans les débats
          const allDebates = await ctx.db.query("debates").collect();
          usageCount += allDebates.filter(
            (debate) => debate.categoryIds?.includes(category._id)
          ).length;

          // Compter dans les dossiers
          const allDossiers = await ctx.db.query("dossiers").collect();
          usageCount += allDossiers.filter(
            (dossier) => dossier.categoryIds?.includes(category._id)
          ).length;

          // Compter dans les organisations
          const allOrganizations = await ctx.db.query("organizations").collect();
          usageCount += allOrganizations.filter(
            (org) => org.categoryIds?.includes(category._id)
          ).length;
        }

        return {
          ...category,
          usageCount,
        };
      })
    );

    return categoriesWithUsage.sort((a, b) => a.name.localeCompare(b.name));
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
      categoryType: "topic", // Par défaut pour rétrocompatibilité
      featured: false,
      priority: 0,
      tags: [],
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
 * Archive une catégorie (réservé aux super admins)
 */
export const archiveCategory = mutation({
  args: {
    categoryId: v.id("categories"),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    // Vérifier si l'utilisateur est un super admin
    const normalizedEmail = betterAuthUser.email.toLowerCase().trim();
    const superAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!superAdmin) {
      // Si pas trouvé avec l'index, chercher manuellement
      const allAdmins = await ctx.db.query("superAdmins").collect();
      const found = allAdmins.find(
        (admin) => admin.email.toLowerCase().trim() === normalizedEmail
      );
      if (!found) {
        throw new Error("Seuls les super admins peuvent archiver des catégories");
      }
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

    // Le usageCount est maintenant calculé dynamiquement, pas besoin de le mettre à jour

    return { success: true };
  },
});

/**
 * Récupère toutes les catégories actives pour décisions
 */
export const getCategoriesForDecisions = query({
  args: {
    categoryType: v.optional(v.union(
      v.literal("domain"),
      v.literal("event_type"),
      v.literal("special_event"),
      v.literal("topic")
    )),
    featured: v.optional(v.boolean()),
    isSpecialEvent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let categories = await ctx.db
      .query("categories")
      .withIndex("status", (q) => q.eq("status", "active"))
      .collect();

    // Filtrer par appliesTo incluant "decisions"
    categories = categories.filter((cat) => cat.appliesTo.includes("decisions"));

    // Filtrer par categoryType si fourni
    if (args.categoryType) {
      categories = categories.filter((cat) => cat.categoryType === args.categoryType);
    }

    // Filtrer par featured si fourni
    if (args.featured !== undefined) {
      categories = categories.filter((cat) => cat.featured === args.featured);
    }

    // Filtrer par isSpecialEvent si fourni
    if (args.isSpecialEvent !== undefined) {
      categories = categories.filter((cat) => cat.isSpecialEvent === args.isSpecialEvent);
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
 * Récupère les catégories mises en avant pour décisions (pour hero, etc.)
 */
export const getFeaturedCategoriesForDecisions = query({
  args: {
    limit: v.optional(v.number()),
    categoryType: v.optional(v.union(
      v.literal("domain"),
      v.literal("event_type"),
      v.literal("special_event"),
      v.literal("topic")
    )),
  },
  handler: async (ctx, args) => {
    let categories = await ctx.db
      .query("categories")
      .withIndex("status", (q) => q.eq("status", "active"))
      .collect();

    // Filtrer par appliesTo incluant "decisions" et featured = true
    categories = categories.filter(
      (cat) => cat.appliesTo.includes("decisions") && cat.featured === true
    );

    // Filtrer par categoryType si fourni
    if (args.categoryType) {
      categories = categories.filter((cat) => cat.categoryType === args.categoryType);
    }

    // Trier par priority (croissant), puis par nom
    categories.sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return a.name.localeCompare(b.name);
    });

    // Limiter si spécifié
    if (args.limit) {
      return categories.slice(0, args.limit);
    }

    return categories;
  },
});

/**
 * Récupère une catégorie par son slug (pour décisions)
 */
export const getCategoryBySlugForDecisions = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!category) {
      return null;
    }

    // Vérifier que la catégorie s'applique aux décisions
    if (!category.appliesTo.includes("decisions")) {
      return null;
    }

    return category;
  },
});

/**
 * Récupère plusieurs catégories par leurs slugs (pour migration/synchronisation)
 */
export const getCategoriesBySlugs = query({
  args: {
    slugs: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("status", (q) => q.eq("status", "active"))
      .collect();

    // Filtrer par slugs et appliesTo incluant "decisions"
    return categories.filter(
      (cat) => args.slugs.includes(cat.slug) && cat.appliesTo.includes("decisions")
    );
  },
});

/**
 * Récupère les catégories avec leur liquidité totale (pour top bar)
 * Triées par liquidité décroissante
 */
export const getCategoriesWithLiquidity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Récupérer toutes les catégories actives pour décisions
    let categories = await ctx.db
      .query("categories")
      .withIndex("status", (q) => q.eq("status", "active"))
      .collect();

    categories = categories.filter((cat) => cat.appliesTo.includes("decisions"));

    // Pour chaque catégorie, calculer la liquidité totale
    const categoriesWithLiquidity = await Promise.all(
      categories.map(async (category) => {
        // Si la catégorie n'a pas d'ID (catégorie par défaut), liquidité = 0
        if (!category._id || category._id === "") {
          return {
            ...category,
            totalLiquidity: 0,
          };
        }

        // Récupérer toutes les décisions de cette catégorie
        const allDecisions = await ctx.db.query("decisions").collect();
        const categoryDecisions = allDecisions.filter(
          (d) => d.categoryIds && d.categoryIds.includes(category._id)
        );

        // Calculer la liquidité totale pour toutes les décisions de cette catégorie
        let totalLiquidity = 0;

        for (const decision of categoryDecisions) {
          // Récupérer les pools de trading pour cette décision
          const yesPool = await ctx.db
            .query("tradingPools")
            .withIndex("decisionId_position", (q) =>
              q.eq("decisionId", decision._id).eq("position", "yes")
            )
            .first();

          const noPool = await ctx.db
            .query("tradingPools")
            .withIndex("decisionId_position", (q) =>
              q.eq("decisionId", decision._id).eq("position", "no")
            )
            .first();

          // Calculer la liquidité (somme des réserves)
          const yesReserve = yesPool?.reserve || 0;
          const noReserve = noPool?.reserve || 0;
          totalLiquidity += yesReserve + noReserve;
        }

        return {
          ...category,
          totalLiquidity,
        };
      })
    );

    // Trier par liquidité décroissante
    categoriesWithLiquidity.sort((a, b) => b.totalLiquidity - a.totalLiquidity);

    // Limiter si spécifié
    if (args.limit) {
      return categoriesWithLiquidity.slice(0, args.limit);
    }

    return categoriesWithLiquidity;
  },
});

