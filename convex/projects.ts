import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { getRuleValueAsNumber } from "./configurableRules.helpers";
import { getDefaultCategory } from "./categories.defaults";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

/**
 * Récupère tous les projets de l'utilisateur connecté
 */
export const getMyProjects = query({
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
    const projects = await ctx.db
      .query("projects")
      .withIndex("authorId", (q) => q.eq("authorId", appUser._id))
      .order("desc")
      .take(limit);

    return projects;
  },
});

/**
 * Récupère un projet par son slug (public)
 */
export const getProjectBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!project) {
      return null;
    }

    // Enrichir avec les données de l'auteur et de l'organisation
    const author = await ctx.db.get(project.authorId);
    let organization = null;
    if (project.orgId) {
      organization = await ctx.db.get(project.orgId);
    }

    return {
      ...project,
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
 * Récupère un projet par son ID (pour l'édition)
 */
export const getProjectById = query({
  args: {
    projectId: v.id("projects"),
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    // Vérifier que l'utilisateur est l'auteur ou membre de l'organisation
    if (project.authorId !== appUser._id) {
      if (project.orgId) {
        const membership = await ctx.db
          .query("organizationMembers")
          .withIndex("organizationId", (q) => q.eq("organizationId", project.orgId!))
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

    return project;
  },
});

/**
 * Récupère les projets publics avec filtres
 * 
 * ⚠️ IMPORTANT : Ne PAS filtrer par rayon géographique (reachRadius/location)
 * Le filtrage se fait uniquement par :
 * - Statut (featured, stage, openSource)
 * - Tags
 * - Tri par date
 */
export const getProjects = query({
  args: {
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
    featured: v.optional(v.boolean()),
    stage: v.optional(
      v.union(
        v.literal("idea"),
        v.literal("prototype"),
        v.literal("beta"),
        v.literal("production")
      )
    ),
    openSource: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || (await getRuleValueAsNumber(ctx, "default_list_limit"));
    const skip = args.skip || 0;

    let projects;

    // Appliquer les filtres
    if (args.featured !== undefined) {
      const allProjects = await ctx.db
        .query("projects")
        .withIndex("featured", (q) => q.eq("featured", args.featured!))
        .collect();
      
      // Trier par date de création décroissante
      projects = allProjects
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit + skip);
    } else if (args.stage) {
      const allProjects = await ctx.db
        .query("projects")
        .withIndex("stage", (q) => q.eq("stage", args.stage!))
        .collect();
      
      // Trier par date de création décroissante
      projects = allProjects
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit + skip);
    } else if (args.openSource !== undefined) {
      const allProjects = await ctx.db
        .query("projects")
        .withIndex("openSource", (q) => q.eq("openSource", args.openSource!))
        .collect();
      
      // Trier par date de création décroissante
      projects = allProjects
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit + skip);
    } else {
      const allProjects = await ctx.db
        .query("projects")
        .collect();
      
      // Trier par date de création décroissante
      projects = allProjects
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit + skip);
    }

    let filtered = projects.slice(skip);

    // Filtre par tags (si spécifié)
    if (args.tags && args.tags.length > 0) {
      filtered = filtered.filter((project) =>
        args.tags!.some((tag) => project.tags.includes(tag))
      );
    }

    return filtered;
  },
});

/**
 * Crée un nouveau projet
 */
export const createProject = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    description: v.string(),
    orgId: v.optional(v.id("organizations")),
    tags: v.array(v.string()),
    categoryIds: v.optional(v.array(v.id("categories"))),
    categorySlugs: v.optional(v.array(v.string())), // Pour les catégories par défaut (pas encore en base)
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    images: v.optional(v.array(v.string())),
    links: v.optional(
      v.array(
        v.object({
          type: v.string(),
          url: v.string(),
        })
      )
    ),
    stage: v.union(
      v.literal("idea"),
      v.literal("prototype"),
      v.literal("beta"),
      v.literal("production")
    ),
    impactMetrics: v.optional(
      v.array(
        v.object({
          label: v.string(),
          value: v.string(),
        })
      )
    ),
    openSource: v.optional(v.boolean()),
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
      .query("projects")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Un projet avec ce slug existe déjà");
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
        throw new Error("Vous n'avez pas les permissions pour créer un projet pour cette organisation");
      }
    }

    const now = Date.now();

    // Gérer les catégories par défaut (créer si elles n'existent pas)
    let finalCategoryIds = args.categoryIds || [];
    
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
              categoryType: "topic", // Par défaut pour rétrocompatibilité
              featured: false,
              priority: 0,
              tags: [],
              status: "active",
              usageCount: 0,
              proposedBy: appUser._id, // L'utilisateur qui crée le projet
              createdAt: now,
              updatedAt: now,
            });
            
            finalCategoryIds.push(categoryId);
          }
        } else if (category.status === "active" && !finalCategoryIds.includes(category._id)) {
          // Si elle existe et est active, l'ajouter
          finalCategoryIds.push(category._id);
        }
      }
    }

    const projectId = await ctx.db.insert("projects", {
      title: args.title,
      slug: args.slug,
      summary: args.summary,
      description: args.description,
      orgId: args.orgId,
      authorId: appUser._id,
      tags: args.tags,
      categoryIds: finalCategoryIds.length > 0 ? finalCategoryIds : undefined,
      location: args.location,
      images: args.images || [],
      links: args.links || [],
      stage: args.stage,
      impactMetrics: args.impactMetrics || [],
      featured: false,
      openSource: args.openSource || false,
      views: 0,
      reactions: 0,
      comments: 0,
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

/**
 * Met à jour un projet
 */
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    categoryIds: v.optional(v.array(v.id("categories"))),
    categorySlugs: v.optional(v.array(v.string())), // Pour les catégories par défaut (pas encore en base)
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    images: v.optional(v.array(v.string())),
    links: v.optional(
      v.array(
        v.object({
          type: v.string(),
          url: v.string(),
        })
      )
    ),
    stage: v.optional(
      v.union(
        v.literal("idea"),
        v.literal("prototype"),
        v.literal("beta"),
        v.literal("production")
      )
    ),
    impactMetrics: v.optional(
      v.array(
        v.object({
          label: v.string(),
          value: v.string(),
        })
      )
    ),
    openSource: v.optional(v.boolean()),
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Vérifier les permissions
    let hasPermission = false;
    if (project.authorId === appUser._id) {
      hasPermission = true;
    } else if (project.orgId) {
      const membership = await ctx.db
        .query("organizationMembers")
        .withIndex("organizationId", (q) => q.eq("organizationId", project.orgId!))
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

    if (args.title !== undefined) updates.title = args.title;
    if (args.summary !== undefined) updates.summary = args.summary;
    if (args.description !== undefined) updates.description = args.description;
    if (args.tags !== undefined) updates.tags = args.tags;
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
                categoryType: "topic", // Par défaut pour rétrocompatibilité
                featured: false,
                priority: 0,
                tags: [],
                status: "active",
                usageCount: 0,
                proposedBy: appUser._id, // L'utilisateur qui modifie le projet
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

    if (args.location !== undefined) updates.location = args.location;
    if (args.images !== undefined) updates.images = args.images;
    if (args.links !== undefined) updates.links = args.links;
    if (args.stage !== undefined) updates.stage = args.stage;
    if (args.impactMetrics !== undefined) updates.impactMetrics = args.impactMetrics;
    if (args.openSource !== undefined) updates.openSource = args.openSource;

    await ctx.db.patch(args.projectId, updates);

    return { success: true };
  },
});

/**
 * Supprime un projet
 */
export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
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

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Vérifier les permissions (seul l'auteur peut supprimer)
    if (project.authorId !== appUser._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.projectId);

    return { success: true };
  },
});

/**
 * Incrémente les vues d'un projet
 * Note: Les vues sont comptées une fois par utilisateur/IP par projet
 */
export const incrementProjectViews = mutation({
  args: {
    projectId: v.id("projects"),
    viewerIp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return;
    }

    // Vérifier si l'utilisateur est connecté
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    let appUser = null;
    if (betterAuthUser) {
      appUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
        .first();
    }

    // Vérifier si une vue existe déjà (par userId ou IP) dans les dernières 24h
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    let existingView = null;
    if (appUser) {
      // Chercher par userId
      existingView = await ctx.db
        .query("views")
        .withIndex("targetType_targetId_userId", (q) =>
          q
            .eq("targetType", "project")
            .eq("targetId", args.projectId)
            .eq("userId", appUser._id)
        )
        .filter((q) => q.gte(q.field("createdAt"), oneDayAgo))
        .first();
    }

    // Si pas de vue par userId, chercher par IP (si fournie)
    if (!existingView && args.viewerIp) {
      existingView = await ctx.db
        .query("views")
        .withIndex("targetType_targetId_viewerIp", (q) =>
          q
            .eq("targetType", "project")
            .eq("targetId", args.projectId)
            .eq("viewerIp", args.viewerIp)
        )
        .filter((q) => q.gte(q.field("createdAt"), oneDayAgo))
        .first();
    }

    // Si une vue existe déjà, ne pas incrémenter
    if (existingView) {
      return;
    }

    // Créer une nouvelle vue
    await ctx.db.insert("views", {
      targetType: "project",
      targetId: args.projectId,
      userId: appUser?._id,
      viewerIp: args.viewerIp,
      createdAt: now,
    });

    // Incrémenter le compteur de vues du projet
    await ctx.db.patch(args.projectId, {
      views: project.views + 1,
      updatedAt: now,
    });

    // Si l'utilisateur est connecté, mettre à jour la mission "view_10_projects"
    if (appUser) {
      try {
        await ctx.runMutation(internal.missions.updateViewProjectMissionInternal, {
          userId: appUser._id,
        });
      } catch (error) {
        // Ignorer les erreurs de mission (peut ne pas exister)
        console.error("Erreur mise à jour mission view_10_projects:", error);
      }
    }
  },
});

