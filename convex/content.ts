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
    const allFeaturedArticles = await ctx.db
      .query("articles")
      .withIndex("featured", (q) => q.eq("featured", true))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();
    
    const featuredArticles = allFeaturedArticles
      .sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt))
      .slice(0, limit);

    // Récupérer les projets en vedette
    const allFeaturedProjects = await ctx.db
      .query("projects")
      .withIndex("featured", (q) => q.eq("featured", true))
      .collect();
    
    const featuredProjects = allFeaturedProjects
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    // Mélanger et retourner
    const allFeatured = [
      ...featuredArticles.map((a) => ({ ...a, type: "article" as const })),
      ...featuredProjects.map((p) => ({ ...p, type: "project" as const })),
    ];

    return allFeatured.slice(0, limit);
  },
});

/**
 * Récupère le dernier article publié
 */
export const getLatestArticle = query({
  args: {},
  handler: async (ctx) => {
    const allArticles = await ctx.db
      .query("articles")
      .withIndex("publishedAt", (q) => q.gte("publishedAt", 0))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();
    
    if (allArticles.length === 0) {
      return null;
    }

    // Trier par publishedAt décroissant
    const latestArticle = allArticles
      .sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt))[0];

    // Enrichir avec les données de l'auteur
    const author = await ctx.db.get(latestArticle.authorId);
    
    return {
      ...latestArticle,
      author: author
        ? {
            _id: author._id,
            email: author.email || "",
            name: author.name || author.email?.split("@")[0] || "Auteur",
            image: author.image || null,
          }
        : null,
    };
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

    const allArticles = await ctx.db
      .query("articles")
      .withIndex("publishedAt", (q) => q.gte("publishedAt", 0))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();
    
    // Trier par publishedAt décroissant et limiter
    const articles = allArticles
      .sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt))
      .slice(skip, skip + limit);

    // Enrichir avec les données de l'auteur et les catégories
    const articlesWithAuthor = await Promise.all(
      articles.slice(skip).map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        
        if (!author) {
          return {
            ...article,
            author: null,
            categories: [],
          };
        }

        // Utiliser directement les données de la table users
        const authorName = author.name || author.email.split("@")[0] || "Auteur";
        const authorImage = author.image || null;

        // Récupérer les catégories
        const categories = article.categoryIds && article.categoryIds.length > 0
          ? (await Promise.all(
              article.categoryIds.map(async (categoryId) => {
                const category = await ctx.db.get(categoryId);
                return category
                  ? {
                      _id: category._id,
                      name: category.name,
                      slug: category.slug,
                      icon: category.icon,
                      color: category.color,
                    }
                  : null;
              })
            )).filter((cat): cat is NonNullable<typeof cat> => cat !== null)
          : [];
        
        return {
          ...article,
          author: {
            _id: author._id,
            email: author.email,
            name: authorName,
            image: authorImage,
          },
          categories,
        };
      })
    );

    return articlesWithAuthor;
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
 * Incrémente les vues d'un contenu (une seule fois par IP)
 */
export const incrementViews = mutation({
  args: {
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action")
    ),
    targetId: v.union(v.id("articles"), v.id("projects"), v.id("actions")),
    viewerIp: v.optional(v.string()), // IP du visiteur (passée depuis le client)
  },
  handler: async (ctx, args) => {
    // Récupérer l'IP du client (passée en paramètre)
    const clientIp = args.viewerIp;
    
    // Si on a une IP, vérifier si cette IP a déjà vu ce contenu
    if (clientIp) {
      // Récupérer toutes les vues pour ce contenu et cette IP
      const viewsForTarget = await ctx.db
        .query("views")
        .withIndex("targetType_targetId", (q: any) =>
          q.eq("targetType", args.targetType)
            .eq("targetId", args.targetId)
        )
        .collect();
      
      // Vérifier si cette IP a déjà vu ce contenu
      const existingView = viewsForTarget.find(
        (view) => view.viewerIp === clientIp
      );
      
      // Si cette IP a déjà vu ce contenu, ne pas incrémenter
      if (existingView) {
        return { success: false, reason: "already_viewed" };
      }
    }

    // Récupérer l'utilisateur connecté (optionnel)
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    let userId: Id<"users"> | undefined;
    if (betterAuthUser) {
      const appUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
        .first();
      userId = appUser?._id;
      
      // Si l'utilisateur est connecté, vérifier aussi s'il a déjà vu ce contenu
      if (userId) {
        const existingUserView = await ctx.db
          .query("views")
          .withIndex("targetType_targetId", (q: any) =>
            q.eq("targetType", args.targetType)
              .eq("targetId", args.targetId)
          )
          .filter((q: any) => q.eq(q.field("userId"), userId))
          .first();
        
        if (existingUserView) {
          return { success: false, reason: "already_viewed" };
        }
      }
    }

    // Incrémenter le compteur de vues
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

    // Enregistrer la vue dans la table views avec l'IP
    await ctx.db.insert("views", {
      userId,
      targetType: args.targetType,
      targetId: args.targetId,
      viewerIp: clientIp || undefined,
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
 * Récupère les commentaires d'un article avec leurs réponses et les données des auteurs
 */
export const getComments = query({
  args: {
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action")
    ),
    targetId: v.union(v.id("articles"), v.id("projects"), v.id("actions")),
  },
  handler: async (ctx, args) => {
    // Récupérer tous les commentaires (parents et réponses)
    const allComments = await ctx.db
      .query("comments")
      .withIndex("targetType_targetId", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .collect();

    // Séparer les commentaires parents et les réponses
    const parentComments = allComments.filter((c) => !c.parentId);
    const replies = allComments.filter((c) => c.parentId);

    // Enrichir avec les données des auteurs
    const commentsWithAuthors = await Promise.all(
      parentComments.map(async (comment) => {
        const author = await ctx.db.get(comment.userId);
        const commentReplies = replies
          .filter((r) => r.parentId === comment._id)
          .sort((a, b) => a.createdAt - b.createdAt);

        // Enrichir les réponses avec leurs auteurs
        const repliesWithAuthors = await Promise.all(
          commentReplies.map(async (reply) => {
            const replyAuthor = await ctx.db.get(reply.userId);
            return {
              ...reply,
              author: replyAuthor
                ? {
                    _id: replyAuthor._id,
                    email: replyAuthor.email,
                    name: replyAuthor.email.split("@")[0] || "Utilisateur",
                    image: null, // Sera récupéré depuis Better Auth côté client si nécessaire
                  }
                : null,
            };
          })
        );

        return {
          ...comment,
          author: author
            ? {
                _id: author._id,
                email: author.email,
                name: author.email.split("@")[0] || "Utilisateur",
                image: null, // Sera récupéré depuis Better Auth côté client si nécessaire
              }
            : null,
          replies: repliesWithAuthors,
        };
      })
    );

    // Trier par date de création (plus récents en premier)
    return commentsWithAuthors.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Vérifie si l'utilisateur a réagi à un article/commentaire
 */
export const hasUserReacted = query({
  args: {
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action"),
      v.literal("comment")
    ),
    targetId: v.union(
      v.id("articles"),
      v.id("projects"),
      v.id("actions"),
      v.id("comments")
    ),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return { hasReacted: false, reactionType: null };
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return { hasReacted: false, reactionType: null };
    }

    const reaction = await ctx.db
      .query("reactions")
      .withIndex("targetType_targetId", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    return {
      hasReacted: !!reaction,
      reactionType: reaction?.type || null,
    };
  },
});

/**
 * Ajoute ou retire une réaction à un commentaire
 */
export const toggleCommentReaction = mutation({
  args: {
    commentId: v.id("comments"),
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
        q.eq("targetType", "comment").eq("targetId", args.commentId)
      )
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (existingReaction) {
      // Si c'est le même type de réaction, on la retire
      if (existingReaction.type === args.type) {
        await ctx.db.delete(existingReaction._id);
        return { success: true, added: false };
      } else {
        // Si c'est un type différent, on remplace l'ancienne par la nouvelle
        await ctx.db.delete(existingReaction._id);
        
        // Créer la nouvelle réaction
        await ctx.db.insert("reactions", {
          userId: appUser._id,
          targetType: "comment",
          targetId: args.commentId,
          type: args.type,
          createdAt: Date.now(),
        });
        
        return { success: true, added: true };
      }
    } else {
      // Ajouter la réaction
      await ctx.db.insert("reactions", {
        userId: appUser._id,
        targetType: "comment",
        targetId: args.commentId,
        type: args.type,
        createdAt: Date.now(),
      });
      return { success: true, added: true };
    }
  },
});

/**
 * Récupère les réactions d'un commentaire
 */
export const getCommentReactions = query({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("reactions")
      .withIndex("targetType_targetId", (q) =>
        q.eq("targetType", "comment").eq("targetId", args.commentId)
      )
      .collect();

    const counts = {
      like: 0,
      love: 0,
      useful: 0,
    };

    reactions.forEach((r) => {
      if (r.type in counts) {
        counts[r.type as keyof typeof counts]++;
      }
    });

    return counts;
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

/**
 * Recherche globale dans tous les contenus
 */
export const globalSearch = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    limits: v.optional(
      v.object({
        articles: v.optional(v.number()),
        projects: v.optional(v.number()),
        actions: v.optional(v.number()),
        debates: v.optional(v.number()),
        categories: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const defaultLimit = args.limit || 10;
    const limits = args.limits || {
      articles: defaultLimit,
      projects: defaultLimit,
      actions: defaultLimit,
      debates: defaultLimit,
      categories: defaultLimit,
    };
    
    const searchQuery = args.query.toLowerCase().trim();

    if (!searchQuery || searchQuery.length < 2) {
      return {
        articles: [],
        projects: [],
        actions: [],
        debates: [],
        categories: [],
      };
    }

    // Recherche dans les articles
    const allArticles = await ctx.db
      .query("articles")
      .withIndex("status", (q) => q.eq("status", "published"))
      .collect();

    const matchingArticles = allArticles
      .filter((article) => {
        const titleMatch = article.title.toLowerCase().includes(searchQuery);
        const summaryMatch = article.summary?.toLowerCase().includes(searchQuery);
        const tagMatch = article.tags?.some((tag) => tag.toLowerCase().includes(searchQuery));
        return titleMatch || summaryMatch || tagMatch;
      })
      .slice(0, limits.articles || defaultLimit);

    // Enrichir les articles avec auteur et catégories
    const articlesWithData = await Promise.all(
      matchingArticles.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        const categories = article.categoryIds && article.categoryIds.length > 0
          ? (await Promise.all(
              article.categoryIds.map(async (categoryId) => {
                const category = await ctx.db.get(categoryId);
                return category
                  ? {
                      _id: category._id,
                      name: category.name,
                      slug: category.slug,
                      icon: category.icon,
                    }
                  : null;
              })
            )).filter((cat): cat is NonNullable<typeof cat> => cat !== null)
          : [];

        return {
          _id: article._id,
          title: article.title,
          summary: article.summary,
          slug: article.slug,
          coverImage: article.coverImage,
          qualityScore: article.qualityScore,
          views: article.views,
          publishedAt: article.publishedAt,
          author: author
            ? {
                _id: author._id,
                name: author.name || author.email?.split("@")[0] || "Auteur",
                image: author.image || null,
              }
            : null,
          categories,
          tags: article.tags || [],
        };
      })
    );

    // Recherche dans les projets
    const allProjects = await ctx.db.query("projects").collect();
    const matchingProjects = allProjects
      .filter((project) => {
        const titleMatch = project.title.toLowerCase().includes(searchQuery);
        const summaryMatch = project.summary?.toLowerCase().includes(searchQuery);
        const tagMatch = project.tags?.some((tag) => tag.toLowerCase().includes(searchQuery));
        return titleMatch || summaryMatch || tagMatch;
      })
      .slice(0, limits.projects || defaultLimit)
      .map((project) => ({
        _id: project._id,
        title: project.title,
        summary: project.summary,
        slug: project.slug,
        images: project.images || [],
        views: project.views || 0,
        stage: project.stage,
        createdAt: project.createdAt,
      }));

    // Recherche dans les actions
    const allActions = await ctx.db.query("actions").collect();
    const matchingActions = allActions
      .filter((action) => {
        const titleMatch = action.title.toLowerCase().includes(searchQuery);
        const descriptionMatch = action.description?.toLowerCase().includes(searchQuery);
        const tagMatch = action.tags?.some((tag) => tag.toLowerCase().includes(searchQuery));
        return titleMatch || descriptionMatch || tagMatch;
      })
      .slice(0, limits.actions || defaultLimit)
      .map((action) => ({
        _id: action._id,
        title: action.title,
        description: action.description,
        slug: action.slug,
        type: action.type,
        status: action.status,
        participants: action.participants || 0,
        deadline: action.deadline,
        createdAt: action.createdAt,
      }));

    // Recherche dans les débats
    const allDebates = await ctx.db
      .query("debates")
      .withIndex("status", (q) => q.eq("status", "open"))
      .collect();
    const matchingDebates = allDebates
      .filter((debat) => {
        const questionMatch = debat.question.toLowerCase().includes(searchQuery);
        const descriptionMatch = debat.description?.toLowerCase().includes(searchQuery);
        return questionMatch || descriptionMatch;
      })
      .slice(0, limits.debates || defaultLimit)
      .map((debat) => ({
        _id: debat._id,
        question: debat.question,
        description: debat.description,
        slug: debat.slug,
        argumentsForCount: debat.argumentsForCount || 0,
        argumentsAgainstCount: debat.argumentsAgainstCount || 0,
        polarizationScore: debat.polarizationScore || 0,
        createdAt: debat.createdAt,
      }));

    // Recherche dans les catégories
    const allCategories = await ctx.db.query("categories").collect();
    const matchingCategories = allCategories
      .filter((category) => {
        const nameMatch = category.name.toLowerCase().includes(searchQuery);
        const descriptionMatch = category.description?.toLowerCase().includes(searchQuery);
        return nameMatch || descriptionMatch;
      })
      .slice(0, limits.categories || defaultLimit)
      .map((category) => ({
        _id: category._id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        description: category.description,
      }));

    return {
      articles: articlesWithData,
      projects: matchingProjects,
      actions: matchingActions,
      debates: matchingDebates,
      categories: matchingCategories,
    };
  },
});

