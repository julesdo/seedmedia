import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { getRuleValueAsNumber } from "./configurableRules.helpers";
import { internal } from "./_generated/api";

/**
 * Récupère tous les commentaires d'un contenu avec leurs réponses (threads)
 */
export const getComments = query({
  args: {
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action"),
      v.literal("proposal")
    ),
    targetId: v.union(
      v.id("articles"),
      v.id("projects"),
      v.id("actions"),
      v.id("governanceProposals")
    ),
  },
  handler: async (ctx, args) => {
    // Récupérer tous les commentaires pour ce contenu
    const allComments = await ctx.db
      .query("comments")
      .withIndex("targetType_targetId", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .collect();

    // Enrichir avec les données utilisateur et les réactions
    const enriched = await Promise.all(
      allComments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        
        // Récupérer les réactions sur ce commentaire
        const reactions = await ctx.db
          .query("reactions")
          .withIndex("targetType_targetId", (q) =>
            q.eq("targetType", "comment").eq("targetId", comment._id)
          )
          .collect();

        // Compter les réactions par type
        const reactionCounts = {
          like: reactions.filter((r) => r.type === "like").length,
          love: reactions.filter((r) => r.type === "love").length,
          useful: reactions.filter((r) => r.type === "useful").length,
        };

        return {
          _id: comment._id,
          userId: comment.userId,
          targetType: comment.targetType,
          targetId: comment.targetId,
          content: comment.content,
          parentId: comment.parentId,
          usefulCount: comment.usefulCount,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                email: user.email,
                image: user.image,
                credibilityScore: user.credibilityScore || 0,
                level: user.level || 1,
              }
            : null,
          reactions: reactionCounts,
          reactionsCount: reactions.length,
        };
      })
    );

    // Organiser en threads (commentaires parents et leurs réponses)
    const parentComments = enriched.filter((c) => !c.parentId);
    const replies = enriched.filter((c) => c.parentId);

    // Associer les réponses à leurs parents
    const threads = parentComments.map((parent) => ({
      ...parent,
      replies: replies
        .filter((reply) => reply.parentId === parent._id)
        .sort((a, b) => a.createdAt - b.createdAt),
    }));

    // Trier les threads par date (plus récent en premier)
    threads.sort((a, b) => b.createdAt - a.createdAt);

    return threads;
  },
});

/**
 * Ajoute un commentaire (avec vérification de crédibilité minimale)
 */
export const addComment = mutation({
  args: {
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action"),
      v.literal("proposal")
    ),
    targetId: v.union(
      v.id("articles"),
      v.id("projects"),
      v.id("actions"),
      v.id("governanceProposals")
    ),
    content: v.string(),
    parentId: v.optional(v.id("comments")), // Pour répondre à un commentaire
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

    // Vérifier la crédibilité minimale requise pour commenter
    const minCredibilityForComments = await getRuleValueAsNumber(
      ctx,
      "min_credibility_to_comment"
    ) || 10; // Valeur par défaut : 10 points de crédibilité

    if ((appUser.credibilityScore || 0) < minCredibilityForComments) {
      throw new Error(
        `Vous devez avoir au moins ${minCredibilityForComments} points de crédibilité pour commenter. Votre score actuel : ${appUser.credibilityScore || 0}`
      );
    }

    const now = Date.now();
    const commentId = await ctx.db.insert("comments", {
      userId: appUser._id,
      targetType: args.targetType,
      targetId: args.targetId,
      content: args.content,
      parentId: args.parentId,
      usefulCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Incrémenter le compteur de commentaires sur le contenu
    if (args.targetType === "article") {
      const article = await ctx.db.get(args.targetId as Id<"articles">);
      if (article) {
        await ctx.db.patch(args.targetId as Id<"articles">, {
          comments: article.comments + 1,
        });
      }
    } else if (args.targetType === "project") {
      const project = await ctx.db.get(args.targetId as Id<"projects">);
      if (project) {
        await ctx.db.patch(args.targetId as Id<"projects">, {
          comments: project.comments + 1,
        });
      }
    } else if (args.targetType === "proposal") {
      // Les propositions n'ont pas de compteur de commentaires dans le schéma
      // On peut l'ajouter plus tard si nécessaire
    }

    // Envoyer une notification à l'auteur du contenu (si ce n'est pas l'auteur qui commente)
    if (args.targetType === "article") {
      const article = await ctx.db.get(args.targetId as Id<"articles">);
      if (article && article.authorId !== appUser._id) {
        await ctx.runMutation(internal.notifications.createNotificationInternal, {
          userId: article.authorId,
          type: "comment",
          title: "Nouveau commentaire",
          message: `${appUser.name || appUser.email?.split("@")[0] || "Un utilisateur"} a commenté votre article "${article.title}"`,
          link: `/articles/${article.slug}`,
          metadata: {
            targetType: args.targetType,
            targetId: args.targetId,
            commentId,
            commenterId: appUser._id,
            articleId: args.targetId as Id<"articles">,
          },
        });
      }
    } else if (args.targetType === "project") {
      const project = await ctx.db.get(args.targetId as Id<"projects">);
      if (project && project.authorId !== appUser._id) {
        await ctx.runMutation(internal.notifications.createNotificationInternal, {
          userId: project.authorId,
          type: "comment",
          title: "Nouveau commentaire",
          message: `${appUser.name || appUser.email?.split("@")[0] || "Un utilisateur"} a commenté votre projet "${project.title}"`,
          link: `/projects/${project.slug}`,
          metadata: {
            targetType: args.targetType,
            targetId: args.targetId,
            commentId,
            commenterId: appUser._id,
          },
        });
      }
    } else if (args.targetType === "action") {
      const action = await ctx.db.get(args.targetId as Id<"actions">);
      if (action && action.authorId !== appUser._id) {
        await ctx.runMutation(internal.notifications.createNotificationInternal, {
          userId: action.authorId,
          type: "comment",
          title: "Nouveau commentaire",
          message: `${appUser.name || appUser.email?.split("@")[0] || "Un utilisateur"} a commenté votre action "${action.title}"`,
          link: `/actions/${action.slug}`,
          metadata: {
            targetType: args.targetType,
            targetId: args.targetId,
            commentId,
            commenterId: appUser._id,
          },
        });
      }
    } else if (args.targetType === "proposal") {
      const proposal = await ctx.db.get(args.targetId as Id<"governanceProposals">);
      if (proposal && proposal.proposerId !== appUser._id) {
        await ctx.runMutation(internal.notifications.createNotificationInternal, {
          userId: proposal.proposerId,
          type: "comment",
          title: "Nouveau commentaire",
          message: `${appUser.name || appUser.email?.split("@")[0] || "Un utilisateur"} a commenté votre proposition "${proposal.title}"`,
          link: `/gouvernance/${proposal.slug}`,
          metadata: {
            targetType: args.targetType,
            targetId: args.targetId,
            commentId,
            commenterId: appUser._id,
          },
        });
      }
    }

    // Si c'est une réponse à un commentaire, notifier l'auteur du commentaire parent
    if (args.parentId) {
      const parentComment = await ctx.db.get(args.parentId);
      if (parentComment && parentComment.userId !== appUser._id) {
        // Récupérer le contenu pour le lien
        let contentLink = "#";
        if (args.targetType === "article") {
          const article = await ctx.db.get(args.targetId as Id<"articles">);
          if (article) contentLink = `/articles/${article.slug}`;
        } else if (args.targetType === "project") {
          const project = await ctx.db.get(args.targetId as Id<"projects">);
          if (project) contentLink = `/projects/${project.slug}`;
        } else if (args.targetType === "action") {
          const action = await ctx.db.get(args.targetId as Id<"actions">);
          if (action) contentLink = `/actions/${action.slug}`;
        } else if (args.targetType === "proposal") {
          const proposal = await ctx.db.get(args.targetId as Id<"governanceProposals">);
          if (proposal) contentLink = `/gouvernance/${proposal.slug}`;
        }

        await ctx.runMutation(internal.notifications.createNotificationInternal, {
          userId: parentComment.userId,
          type: "comment_reply",
          title: "Réponse à votre commentaire",
          message: `${appUser.name || appUser.email?.split("@")[0] || "Un utilisateur"} a répondu à votre commentaire`,
          link: contentLink,
          metadata: {
            targetType: args.targetType,
            targetId: args.targetId,
            commentId,
            parentCommentId: args.parentId,
            commenterId: appUser._id,
          },
        });
      }
    }

    return { success: true, commentId };
  },
});

/**
 * Ajoute ou retire une réaction sur un commentaire
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

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    if (existingReaction) {
      // Retirer la réaction
      await ctx.db.delete(existingReaction._id);
      
      // Décrémenter usefulCount si c'était une réaction "useful"
      if (args.type === "useful" && comment.usefulCount > 0) {
        await ctx.db.patch(args.commentId, {
          usefulCount: comment.usefulCount - 1,
        });
      }

      return { success: true, added: false };
    } else {
      // Ajouter la réaction
      await ctx.db.insert("reactions", {
        userId: appUser._id,
        targetType: "comment",
        targetId: args.commentId,
        type: args.type,
        createdAt: Date.now(),
      });

      // Incrémenter usefulCount si c'est une réaction "useful"
      if (args.type === "useful") {
        await ctx.db.patch(args.commentId, {
          usefulCount: comment.usefulCount + 1,
        });
      }

      // Notifier l'auteur du commentaire (si ce n'est pas lui qui réagit)
      if (comment.userId !== appUser._id) {
        // Récupérer le contenu pour le lien
        let contentLink = "#";
        if (comment.targetType === "article") {
          const article = await ctx.db.get(comment.targetId as Id<"articles">);
          if (article) contentLink = `/articles/${article.slug}`;
        } else if (comment.targetType === "project") {
          const project = await ctx.db.get(comment.targetId as Id<"projects">);
          if (project) contentLink = `/projects/${project.slug}`;
        } else if (comment.targetType === "action") {
          const action = await ctx.db.get(comment.targetId as Id<"actions">);
          if (action) contentLink = `/actions/${action.slug}`;
        } else if (comment.targetType === "proposal") {
          const proposal = await ctx.db.get(comment.targetId as Id<"governanceProposals">);
          if (proposal) contentLink = `/gouvernance/${proposal.slug}`;
        }

        const reactionLabels: Record<string, string> = {
          like: "aimé",
          love: "adoré",
          useful: "trouvé utile",
        };

        await ctx.runMutation(internal.notifications.createNotificationInternal, {
          userId: comment.userId,
          type: "comment_reaction",
          title: "Réaction sur votre commentaire",
          message: `${appUser.name || appUser.email?.split("@")[0] || "Un utilisateur"} a ${reactionLabels[args.type] || "réagi à"} votre commentaire`,
          link: contentLink,
          metadata: {
            commentId: args.commentId,
            reactionType: args.type,
            reactorId: appUser._id,
            targetType: comment.targetType,
            targetId: comment.targetId,
          },
        });
      }

      return { success: true, added: true };
    }
  },
});

