import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { getRuleValueAsNumber } from "./configurableRules.helpers";
import { getDefaultCategory } from "./categories.defaults";

/**
 * Récupère toutes les actions de l'utilisateur connecté
 */
export const getMyActions = query({
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

    const limit = await getRuleValueAsNumber(ctx, "default_list_limit");
    const actions = await ctx.db
      .query("actions")
      .withIndex("authorId", (q) => q.eq("authorId", appUser._id))
      .order("desc")
      .take(limit);

    return actions;
  },
});

/**
 * Récupère une action par son slug (public)
 */
export const getActionBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const action = await ctx.db
      .query("actions")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!action) {
      return null;
    }

    // Enrichir avec les données de l'auteur et de l'organisation
    const author = await ctx.db.get(action.authorId);
    let organization = null;
    if (action.orgId) {
      organization = await ctx.db.get(action.orgId);
    }

    return {
      ...action,
      author: author
        ? {
            _id: author._id,
            email: author.email || "",
            name: author.name || author.email?.split("@")[0] || "Auteur",
            image: author.image,
          }
        : null,
      organization: organization
        ? {
            _id: organization._id,
            name: organization.name,
            logo: organization.logo,
            slug: organization.slug,
          }
        : null,
    };
  },
});

/**
 * Récupère une action par son ID (pour l'édition)
 */
export const getActionById = query({
  args: {
    actionId: v.id("actions"),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return null;
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return null;
    }

    const action = await ctx.db.get(args.actionId);
    if (!action) {
      return null;
    }

    // Vérifier que l'utilisateur est l'auteur ou membre de l'organisation
    if (action.authorId !== appUser._id) {
      if (action.orgId) {
        const membership = await ctx.db
          .query("organizationMembers")
          .withIndex("organizationId", (q) => q.eq("organizationId", action.orgId!))
          .filter((q) => q.eq(q.field("userId"), appUser._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .first();

        if (!membership || !membership.canEdit) {
          return null;
        }
      } else {
        return null;
      }
    }

    return action;
  },
});

/**
 * Récupère les actions publiques avec filtres
 * 
 * ⚠️ IMPORTANT : Ne PAS filtrer par rayon géographique (reachRadius/location)
 * Le filtrage se fait uniquement par :
 * - Statut (active, completed, cancelled)
 * - Type (petition, contribution, event)
 * - Tags
 * - Tri par date
 */
export const getActions = query({
  args: {
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled"))
    ),
    type: v.optional(
      v.union(v.literal("petition"), v.literal("contribution"), v.literal("event"))
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || (await getRuleValueAsNumber(ctx, "default_list_limit"));
    const skip = args.skip || 0;

    let actions;

    // Appliquer les filtres
    if (args.status) {
      actions = await ctx.db
        .query("actions")
        .withIndex("status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit + skip);
    } else if (args.type) {
      actions = await ctx.db
        .query("actions")
        .withIndex("type", (q) => q.eq("type", args.type!))
        .order("desc")
        .take(limit + skip);
    } else {
      actions = await ctx.db
        .query("actions")
        .order("desc")
        .take(limit + skip);
    }

    let filtered = actions.slice(skip);

    // Filtre par tags (si spécifié)
    if (args.tags && args.tags.length > 0) {
      filtered = filtered.filter((action) =>
        args.tags!.some((tag) => action.tags.includes(tag))
      );
    }

    return filtered;
  },
});

/**
 * Crée une nouvelle action
 */
export const createAction = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    description: v.string(),
    type: v.union(v.literal("petition"), v.literal("contribution"), v.literal("event")),
    orgId: v.optional(v.id("organizations")),
    tags: v.array(v.string()),
    categoryIds: v.optional(v.array(v.id("categories"))),
    categorySlugs: v.optional(v.array(v.string())), // Pour les catégories par défaut (pas encore en base)
    target: v.optional(v.string()),
    link: v.optional(v.string()),
    deadline: v.optional(v.number()),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
      })
    ),
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

    // Vérifier que le slug est unique
    const existing = await ctx.db
      .query("actions")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Une action avec ce slug existe déjà");
    }

    // Si une organisation est spécifiée, vérifier que l'utilisateur est membre avec droits d'édition
    if (args.orgId) {
      const membership = await ctx.db
        .query("organizationMembers")
        .withIndex("organizationId", (q) => q.eq("organizationId", args.orgId!))
        .filter((q) => q.eq(q.field("userId"), appUser._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (!membership || !membership.canEdit) {
        throw new Error("Vous n'avez pas les permissions pour créer une action pour cette organisation");
      }
    }

    const now = Date.now();

    // Gérer les catégories : combiner categoryIds et categorySlugs
    const finalCategoryIds: Id<"categories">[] = [];
    
    // Ajouter les catégories existantes
    if (args.categoryIds && args.categoryIds.length > 0) {
      finalCategoryIds.push(...args.categoryIds);
    }
    
    // Gérer les catégories par défaut (pas encore en base)
    if (args.categorySlugs && args.categorySlugs.length > 0) {
      for (const slug of args.categorySlugs) {
        // Vérifier si la catégorie existe déjà en base
        let category = await ctx.db
          .query("categories")
          .withIndex("slug", (q) => q.eq("slug", slug))
          .first();

        // Si elle n'existe pas, créer la catégorie par défaut
        if (!category) {
          const defaultCat = getDefaultCategory(slug);
          if (defaultCat) {
            // Créer la catégorie automatiquement
            const categoryId = await ctx.db.insert("categories", {
              name: defaultCat.name,
              slug: defaultCat.slug,
              description: defaultCat.description,
              icon: defaultCat.icon,
              color: defaultCat.color,
              appliesTo: defaultCat.appliesTo,
              status: "active",
              usageCount: 0,
              proposedBy: appUser._id, // L'utilisateur qui crée l'action
              createdAt: now,
              updatedAt: now,
            });
            
            finalCategoryIds.push(categoryId);
          }
        } else {
          // La catégorie existe déjà, l'ajouter
          if (!finalCategoryIds.includes(category._id)) {
            finalCategoryIds.push(category._id);
          }
        }
      }
    }

    const actionId = await ctx.db.insert("actions", {
      title: args.title,
      slug: args.slug,
      summary: args.summary,
      description: args.description,
      type: args.type,
      orgId: args.orgId,
      authorId: appUser._id,
      tags: args.tags,
      categoryIds: finalCategoryIds.length > 0 ? finalCategoryIds : undefined,
      target: args.target || undefined,
      link: args.link,
      status: "active",
      deadline: args.deadline,
      location: args.location,
      featured: false,
      participants: 0,
      createdAt: now,
      updatedAt: now,
    });

    return actionId;
  },
});

/**
 * Met à jour une action
 */
export const updateAction = mutation({
  args: {
    actionId: v.id("actions"),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    categoryIds: v.optional(v.array(v.id("categories"))),
    categorySlugs: v.optional(v.array(v.string())), // Pour les catégories par défaut (pas encore en base)
    target: v.optional(v.string()),
    link: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled"))
    ),
    deadline: v.optional(v.number()),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
      })
    ),
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

    const action = await ctx.db.get(args.actionId);
    if (!action) {
      throw new Error("Action not found");
    }

    // Vérifier les permissions
    let hasPermission = false;
    if (action.authorId === appUser._id) {
      hasPermission = true;
    } else if (action.orgId) {
      const membership = await ctx.db
        .query("organizationMembers")
        .withIndex("organizationId", (q) => q.eq("organizationId", action.orgId!))
        .filter((q) => q.eq(q.field("userId"), appUser._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (membership && membership.canEdit) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      throw new Error("Unauthorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    // Gérer les catégories : combiner categoryIds et categorySlugs
    if (args.categoryIds !== undefined || args.categorySlugs !== undefined) {
      const finalCategoryIds: Id<"categories">[] = [];
      
      // Ajouter les catégories existantes
      if (args.categoryIds && args.categoryIds.length > 0) {
        finalCategoryIds.push(...args.categoryIds);
      }
      
      // Gérer les catégories par défaut (pas encore en base)
      if (args.categorySlugs && args.categorySlugs.length > 0) {
        for (const slug of args.categorySlugs) {
          // Vérifier si la catégorie existe déjà en base
          let category = await ctx.db
            .query("categories")
            .withIndex("slug", (q) => q.eq("slug", slug))
            .first();

          // Si elle n'existe pas, créer la catégorie par défaut
          if (!category) {
            const defaultCat = getDefaultCategory(slug);
            if (defaultCat) {
              // Créer la catégorie automatiquement
              const categoryId = await ctx.db.insert("categories", {
                name: defaultCat.name,
                slug: defaultCat.slug,
                description: defaultCat.description,
                icon: defaultCat.icon,
                color: defaultCat.color,
                appliesTo: defaultCat.appliesTo,
                status: "active",
                usageCount: 0,
                proposedBy: appUser._id, // L'utilisateur qui modifie l'action
                createdAt: Date.now(),
                updatedAt: Date.now(),
              });
              
              finalCategoryIds.push(categoryId);
            }
          } else {
            // La catégorie existe déjà, l'ajouter
            if (!finalCategoryIds.includes(category._id)) {
              finalCategoryIds.push(category._id);
            }
          }
        }
      }
      
      updates.categoryIds = finalCategoryIds.length > 0 ? finalCategoryIds : undefined;
    }

    if (args.title !== undefined) updates.title = args.title;
    if (args.summary !== undefined) updates.summary = args.summary;
    if (args.description !== undefined) updates.description = args.description;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.target !== undefined) updates.target = args.target;
    if (args.link !== undefined) updates.link = args.link;
    if (args.status !== undefined) updates.status = args.status;
    if (args.deadline !== undefined) updates.deadline = args.deadline;
    if (args.location !== undefined) updates.location = args.location;

    await ctx.db.patch(args.actionId, updates);

    return { success: true };
  },
});

/**
 * Supprime une action
 */
export const deleteAction = mutation({
  args: {
    actionId: v.id("actions"),
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

    const action = await ctx.db.get(args.actionId);
    if (!action) {
      throw new Error("Action not found");
    }

    // Vérifier les permissions (seul l'auteur peut supprimer)
    if (action.authorId !== appUser._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.actionId);

    return { success: true };
  },
});

/**
 * Participe à une action (toggle participation)
 */
export const participateInAction = mutation({
  args: {
    actionId: v.id("actions"),
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

    const action = await ctx.db.get(args.actionId);
    if (!action) {
      throw new Error("Action not found");
    }

    if (action.status !== "active") {
      throw new Error("Cette action n'est plus active");
    }

    // Vérifier si l'utilisateur a déjà participé
    const existingParticipation = await ctx.db
      .query("actionParticipants")
      .withIndex("actionId_userId", (q) =>
        q.eq("actionId", args.actionId).eq("userId", appUser._id)
      )
      .first();

    if (existingParticipation) {
      // Retirer la participation
      await ctx.db.delete(existingParticipation._id);
      await ctx.db.patch(args.actionId, {
        participants: Math.max(0, action.participants - 1),
        updatedAt: Date.now(),
      });
      return { participated: false, participants: Math.max(0, action.participants - 1) };
    } else {
      // Ajouter la participation
      await ctx.db.insert("actionParticipants", {
        actionId: args.actionId,
        userId: appUser._id,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.actionId, {
        participants: action.participants + 1,
        updatedAt: Date.now(),
      });
      return { participated: true, participants: action.participants + 1 };
    }
  },
});

/**
 * Vérifie si l'utilisateur a participé à une action
 */
export const hasUserParticipated = query({
  args: {
    actionId: v.id("actions"),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return { hasParticipated: false };
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return { hasParticipated: false };
    }

    const participation = await ctx.db
      .query("actionParticipants")
      .withIndex("actionId_userId", (q) =>
        q.eq("actionId", args.actionId).eq("userId", appUser._id)
      )
      .first();

    return { hasParticipated: !!participation };
  },
});

