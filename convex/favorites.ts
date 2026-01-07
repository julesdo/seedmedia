import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";

/**
 * Vérifie si un contenu est en favoris pour l'utilisateur connecté
 */
export const isFavorite = query({
  args: {
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action"),
      v.literal("decision")
    ),
    targetId: v.union(v.id("articles"), v.id("projects"), v.id("actions"), v.id("decisions")),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return false;
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return false;
    }

    const favorite = await ctx.db
      .query("favorites")
      .withIndex("targetType_targetId", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    return !!favorite;
  },
});

/**
 * Récupère tous les favoris d'un type spécifique pour l'utilisateur connecté
 * Optimisé pour éviter les N+1 queries
 * Retourne un array des IDs favoris (Set n'est pas supporté par Convex)
 */
export const getFavoritesForDecisions = query({
  args: {
    decisionIds: v.array(v.id("decisions")),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return [] as string[];
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return [] as string[];
    }

    // Récupérer tous les favoris de type "decision" pour cet utilisateur
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("targetType_targetId", (q) => q.eq("targetType", "decision"))
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .collect();

    // Créer un array des IDs favoris (filtrer seulement ceux dans decisionIds)
    const favoriteIds: string[] = [];
    const decisionIdsSet = new Set(args.decisionIds);
    for (const favorite of favorites) {
      if (decisionIdsSet.has(favorite.targetId as Id<"decisions">)) {
        favoriteIds.push(favorite.targetId);
      }
    }

    return favoriteIds;
  },
});

/**
 * Ajoute ou retire un contenu des favoris
 */
export const toggleFavorite = mutation({
  args: {
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action"),
      v.literal("decision")
    ),
    targetId: v.union(v.id("articles"), v.id("projects"), v.id("actions"), v.id("decisions")),
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

/**
 * Récupère tous les favoris d'un utilisateur spécifique (pour les profils publics)
 */
export const getUserFavorites = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Enrichir avec les données des contenus
    const enriched = await Promise.all(
      favorites.map(async (favorite) => {
        let content: any = null;
        let author: any = null;

        if (favorite.targetType === "article") {
          const article = await ctx.db.get(favorite.targetId as Id<"articles">);
          if (article) {
            content = {
              _id: article._id,
              title: article.title,
              slug: article.slug,
              summary: article.summary,
              coverImage: article.coverImage,
              createdAt: article.createdAt,
              views: article.views,
            };
            const articleAuthor = await ctx.db.get(article.authorId);
            if (articleAuthor) {
              author = {
                _id: articleAuthor._id,
                name: articleAuthor.name,
                email: articleAuthor.email,
                image: articleAuthor.image,
              };
            }
          }
        } else if (favorite.targetType === "project") {
          const project = await ctx.db.get(favorite.targetId as Id<"projects">);
          if (project) {
            content = {
              _id: project._id,
              title: project.title,
              slug: project.slug,
              description: project.description,
              coverImage: project.images && project.images.length > 0 ? project.images[0] : null,
              createdAt: project.createdAt,
              views: project.views,
            };
            const projectAuthor = await ctx.db.get(project.authorId);
            if (projectAuthor) {
              author = {
                _id: projectAuthor._id,
                name: projectAuthor.name,
                email: projectAuthor.email,
                image: projectAuthor.image,
              };
            }
          }
        } else if (favorite.targetType === "action") {
          const action = await ctx.db.get(favorite.targetId as Id<"actions">);
          if (action) {
            content = {
              _id: action._id,
              title: action.title,
              slug: action.slug,
              description: action.description,
              coverImage: null, // Les actions n'ont pas d'image de couverture
              createdAt: action.createdAt,
              views: 0, // Les actions n'ont pas de compteur de vues
            };
            const actionAuthor = await ctx.db.get(action.authorId);
            if (actionAuthor) {
              author = {
                _id: actionAuthor._id,
                name: actionAuthor.name,
                email: actionAuthor.email,
                image: actionAuthor.image,
              };
            }
          }
        } else if (favorite.targetType === "decision") {
          const decision = await ctx.db.get(favorite.targetId as Id<"decisions">);
          if (decision) {
            content = {
              _id: decision._id,
              title: decision.title,
              slug: decision.slug,
              description: decision.question,
              coverImage: decision.imageUrl || null,
              createdAt: decision.createdAt,
              views: 0,
            };
            // Les décisions n'ont pas d'auteur, elles sont créées par des bots
            author = null;
          }
        }

        return {
          _id: favorite._id,
          targetType: favorite.targetType,
          targetId: favorite.targetId,
          createdAt: favorite.createdAt,
          content,
          author,
        };
      })
    );

    // Filtrer les favoris sans contenu (contenu supprimé) et trier par date
    return enriched
      .filter((f) => f.content !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

