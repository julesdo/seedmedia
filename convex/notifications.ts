import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { betterAuthComponent } from "./auth";

/**
 * Récupère les notifications non lues de l'utilisateur connecté
 */
export const getUnreadNotifications = query({
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

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("userId_read", (q) => q.eq("userId", appUser._id).eq("read", false))
      .order("desc")
      .take(50);

    return notifications;
  },
});

/**
 * Récupère toutes les notifications de l'utilisateur connecté (lues et non lues)
 */
export const getAllNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
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

    const limit = args.limit || 50;
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("userId_createdAt", (q) => q.eq("userId", appUser._id))
      .order("desc")
      .take(limit);

    return notifications;
  },
});

/**
 * Récupère le nombre de notifications non lues
 */
export const getUnreadNotificationsCount = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return 0;
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return 0;
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("userId_read", (q) => q.eq("userId", appUser._id).eq("read", false))
      .collect();

    return notifications.length;
  },
});

/**
 * Marque une notification comme lue
 */
export const markNotificationAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
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

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.userId !== appUser._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.notificationId, {
      read: true,
      readAt: Date.now(),
    });
  },
});

/**
 * Marque toutes les notifications comme lues
 */
export const markAllNotificationsAsRead = mutation({
  args: {},
  handler: async (ctx) => {
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

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("userId_read", (q) => q.eq("userId", appUser._id).eq("read", false))
      .collect();

    const now = Date.now();
    await Promise.all(
      notifications.map((notification) =>
        ctx.db.patch(notification._id, {
          read: true,
          readAt: now,
        })
      )
    );
  },
});

/**
 * Crée une notification (mutation publique pour les clients)
 */
export const createNotification = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("article_pending"),
      v.literal("article_approved"),
      v.literal("article_rejected"),
      v.literal("correction_proposed"),
      v.literal("correction_approved"),
      v.literal("correction_rejected"),
      v.literal("proposal_vote"),
      v.literal("proposal_closed"),
      v.literal("debat_argument"),
      v.literal("debate_new_argument"),
      v.literal("debate_argument_voted"),
      v.literal("debate_closed"),
      v.literal("article_comment"),
      v.literal("comment"),
      v.literal("comment_reply"),
      v.literal("comment_reaction"),
      v.literal("invitation_received"),
      v.literal("invitation_accepted"),
      v.literal("invitation_rejected"),
      v.literal("member_joined"),
      v.literal("role_changed"),
      v.literal("level_up"),
      v.literal("seeds_earned"),
      v.literal("other")
    ),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        articleId: v.optional(v.id("articles")),
        proposalId: v.optional(v.id("governanceProposals")),
        debateId: v.optional(v.id("debates")),
        correctionId: v.optional(v.id("articleCorrections")),
        organizationId: v.optional(v.id("organizations")),
        invitationId: v.optional(v.id("invitations")),
        acceptedBy: v.optional(v.id("users")),
        rejectedBy: v.optional(v.id("users")),
        targetType: v.optional(v.union(
          v.literal("article"),
          v.literal("project"),
          v.literal("action"),
          v.literal("proposal")
        )),
        targetId: v.optional(v.union(
          v.id("articles"),
          v.id("projects"),
          v.id("actions"),
          v.id("governanceProposals")
        )),
        commentId: v.optional(v.id("comments")),
        commenterId: v.optional(v.id("users")),
        parentCommentId: v.optional(v.id("comments")),
        reactionType: v.optional(v.union(
          v.literal("like"),
          v.literal("love"),
          v.literal("useful")
        )),
        reactorId: v.optional(v.id("users")),
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

    // Vérifier que l'utilisateur peut créer une notification pour lui-même
    if (args.userId !== appUser._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      link: args.link,
      read: false,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

/**
 * Crée une notification (mutation interne, appelée par d'autres mutations)
 */
export const createNotificationInternal = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("article_pending"), // Nouvel article en attente de validation
      v.literal("article_approved"), // Article approuvé
      v.literal("article_rejected"), // Article rejeté
      v.literal("correction_proposed"), // Nouvelle correction proposée sur un article
      v.literal("correction_approved"),
      v.literal("correction_rejected"),
      v.literal("proposal_vote"),
      v.literal("proposal_closed"),
      v.literal("debat_argument"),
      v.literal("debate_new_argument"),
      v.literal("debate_argument_voted"),
      v.literal("debate_closed"),
      v.literal("article_comment"), // Commentaire sur article (déprécié, utiliser comment)
      v.literal("comment"), // Commentaire sur un contenu
      v.literal("comment_reply"), // Réponse à un commentaire
      v.literal("comment_reaction"), // Réaction sur un commentaire
      v.literal("invitation_received"),
      v.literal("invitation_accepted"),
      v.literal("invitation_rejected"),
      v.literal("member_joined"),
      v.literal("role_changed"),
      v.literal("level_up"), // Montée de niveau
      v.literal("seeds_earned"), // Seeds gagnés
      v.literal("other")
    ),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        articleId: v.optional(v.id("articles")),
        proposalId: v.optional(v.id("governanceProposals")),
        debateId: v.optional(v.id("debates")),
        correctionId: v.optional(v.id("articleCorrections")),
        organizationId: v.optional(v.id("organizations")),
        invitationId: v.optional(v.id("invitations")),
        acceptedBy: v.optional(v.id("users")),
        rejectedBy: v.optional(v.id("users")),
        // Pour les commentaires
        targetType: v.optional(v.union(
          v.literal("article"),
          v.literal("project"),
          v.literal("action"),
          v.literal("proposal")
        )),
        targetId: v.optional(v.union(
          v.id("articles"),
          v.id("projects"),
          v.id("actions"),
          v.id("governanceProposals")
        )),
        commentId: v.optional(v.id("comments")),
        commenterId: v.optional(v.id("users")),
        parentCommentId: v.optional(v.id("comments")),
        reactionType: v.optional(v.union(
          v.literal("like"),
          v.literal("love"),
          v.literal("useful")
        )),
        reactorId: v.optional(v.id("users")),
      })
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      link: args.link,
      read: false,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

