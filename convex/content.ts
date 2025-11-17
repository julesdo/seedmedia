import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";

/**
 * Récupère le contenu en vedette pour le carrousel
 */
export const getFeaturedContent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;

    // Récupérer les articles en vedette
    const featuredArticles = await ctx.db
      .query("articles")
      .withIndex("featured", (q) => q.eq("featured", true))
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(limit);

    // Récupérer les projets en vedette
    const featuredProjects = await ctx.db
      .query("projects")
      .withIndex("featured", (q) => q.eq("featured", true))
      .order("desc")
      .take(limit);

    // Mélanger et retourner
    const allFeatured = [
      ...featuredArticles.map((a) => ({ ...a, type: "article" as const })),
      ...featuredProjects.map((p) => ({ ...p, type: "project" as const })),
    ];

    return allFeatured.slice(0, limit);
  },
});

/**
 * Récupère les derniers articles publiés
 */
export const getLatestArticles = query({
  args: {
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const skip = args.skip || 0;

    const articles = await ctx.db
      .query("articles")
      .withIndex("publishedAt", (q) => q.gte("publishedAt", 0))
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(limit + skip);

    return articles.slice(skip);
  },
});

/**
 * Récupère les derniers projets
 */
export const getLatestProjects = query({
  args: {
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const skip = args.skip || 0;

    const projects = await ctx.db
      .query("projects")
      .order("desc")
      .take(limit + skip);

    return projects.slice(skip);
  },
});

/**
 * Récupère les dernières actions actives
 */
export const getLatestActions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const actions = await ctx.db
      .query("actions")
      .withIndex("status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(limit);

    return actions;
  },
});

/**
 * Récupère un article par slug
 */
export const getArticleBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const article = await ctx.db
      .query("articles")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    return article;
  },
});

/**
 * Récupère un projet par slug
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

    return project;
  },
});

/**
 * Récupère une action par slug
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

    return action;
  },
});

/**
 * Récupère uniquement le titre d'un article par ID (pour le breadcrumb)
 */
export const getArticleName = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.articleId);
    return article ? { name: article.title } : null;
  },
});

/**
 * Récupère uniquement le titre d'un projet par ID (pour le breadcrumb)
 */
export const getProjectName = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    return project ? { name: project.title } : null;
  },
});

/**
 * Récupère uniquement le titre d'une action par ID (pour le breadcrumb)
 */
export const getActionName = query({
  args: { actionId: v.id("actions") },
  handler: async (ctx, args) => {
    const action = await ctx.db.get(args.actionId);
    return action ? { name: action.title } : null;
  },
});

/**
 * Incrémente les vues d'un contenu
 */
export const incrementViews = mutation({
  args: {
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action")
    ),
    targetId: v.union(v.id("articles"), v.id("projects"), v.id("actions")),
  },
  handler: async (ctx, args) => {
    let doc;
    if (args.targetType === "article") {
      doc = await ctx.db.get(args.targetId as Id<"articles">);
      if (doc) {
        await ctx.db.patch(args.targetId as Id<"articles">, {
          views: doc.views + 1,
        });
      }
    } else if (args.targetType === "project") {
      doc = await ctx.db.get(args.targetId as Id<"projects">);
      if (doc) {
        await ctx.db.patch(args.targetId as Id<"projects">, {
          views: doc.views + 1,
        });
      }
    } else if (args.targetType === "action") {
      doc = await ctx.db.get(args.targetId as Id<"actions">);
      if (doc) {
        // Actions n'ont pas de champ views, on peut l'ajouter via participants
        await ctx.db.patch(args.targetId as Id<"actions">, {
          participants: doc.participants + 1,
        });
      }
    }

    // Enregistrer la vue dans la table views
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    await ctx.db.insert("views", {
      userId: betterAuthUser
        ? (
            await ctx.db
              .query("users")
              .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
              .first()
          )?._id
        : undefined,
      targetType: args.targetType,
      targetId: args.targetId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Ajoute ou retire une réaction
 */
export const addReaction = mutation({
  args: {
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action")
    ),
    targetId: v.union(v.id("articles"), v.id("projects"), v.id("actions")),
    type: v.union(v.literal("like"), v.literal("love"), v.literal("useful")),
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

    // Vérifier si la réaction existe déjà
    const existingReaction = await ctx.db
      .query("reactions")
      .withIndex("targetType_targetId", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (existingReaction) {
      // Retirer la réaction
      await ctx.db.delete(existingReaction._id);

      // Décrémenter le compteur
      if (args.targetType === "article") {
        const doc = await ctx.db.get(args.targetId as Id<"articles">);
        if (doc) {
          await ctx.db.patch(args.targetId as Id<"articles">, {
            reactions: Math.max(0, doc.reactions - 1),
          });
        }
      } else if (args.targetType === "project") {
        const doc = await ctx.db.get(args.targetId as Id<"projects">);
        if (doc) {
          await ctx.db.patch(args.targetId as Id<"projects">, {
            reactions: Math.max(0, doc.reactions - 1),
          });
        }
      }

      return { success: true, added: false };
    } else {
      // Ajouter la réaction
      await ctx.db.insert("reactions", {
        userId: appUser._id,
        targetType: args.targetType,
        targetId: args.targetId,
        type: args.type,
        createdAt: Date.now(),
      });

      // Incrémenter le compteur
      if (args.targetType === "article") {
        const doc = await ctx.db.get(args.targetId as Id<"articles">);
        if (doc) {
          await ctx.db.patch(args.targetId as Id<"articles">, {
            reactions: doc.reactions + 1,
          });
        }
      } else if (args.targetType === "project") {
        const doc = await ctx.db.get(args.targetId as Id<"projects">);
        if (doc) {
          await ctx.db.patch(args.targetId as Id<"projects">, {
            reactions: doc.reactions + 1,
          });
        }
      }

      return { success: true, added: true };
    }
  },
});

/**
 * Ajoute un commentaire
 */
export const addComment = mutation({
  args: {
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action")
    ),
    targetId: v.union(v.id("articles"), v.id("projects"), v.id("actions")),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
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

    const commentId = await ctx.db.insert("comments", {
      userId: appUser._id,
      targetType: args.targetType,
      targetId: args.targetId,
      content: args.content,
      parentId: args.parentId,
      usefulCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Incrémenter le compteur de commentaires
    if (args.targetType === "article") {
      const doc = await ctx.db.get(args.targetId as Id<"articles">);
      if (doc) {
        await ctx.db.patch(args.targetId as Id<"articles">, {
          comments: doc.comments + 1,
        });
      }
    } else if (args.targetType === "project") {
      const doc = await ctx.db.get(args.targetId as Id<"projects">);
      if (doc) {
        await ctx.db.patch(args.targetId as Id<"projects">, {
          comments: doc.comments + 1,
        });
      }
    }

    return { success: true, commentId };
  },
});

/**
 * Ajoute ou retire des favoris
 */
export const toggleFavorite = mutation({
  args: {
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action")
    ),
    targetId: v.union(v.id("articles"), v.id("projects"), v.id("actions")),
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

    // Vérifier si le favori existe déjà
    const existingFavorite = await ctx.db
      .query("favorites")
      .withIndex("targetType_targetId", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (existingFavorite) {
      // Retirer des favoris
      await ctx.db.delete(existingFavorite._id);
      return { success: true, favorited: false };
    } else {
      // Ajouter aux favoris
      await ctx.db.insert("favorites", {
        userId: appUser._id,
        targetType: args.targetType,
        targetId: args.targetId,
        createdAt: Date.now(),
      });
      return { success: true, favorited: true };
    }
  },
});

