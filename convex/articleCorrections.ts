import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { internal } from "./_generated/api";

/**
 * Récupère les corrections en attente (pour les éditeurs)
 */
export const getPendingCorrections = query({
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

    // Vérifier que l'utilisateur est éditeur
    if (appUser.role !== "editeur") {
      return [];
    }

    const limit = args.limit || 20;

    // Récupérer toutes les corrections et filtrer par statut
    const allCorrections = await ctx.db
      .query("articleCorrections")
      .collect();
    
    const corrections = allCorrections
      .filter((c) => c.status === "pending")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    // Enrichir avec les données de l'article et du proposant
    const correctionsWithDetails = await Promise.all(
      corrections.map(async (correction) => {
        const article = await ctx.db.get(correction.articleId);
        const proposer = await ctx.db.get(correction.proposerId);
        
        return {
          ...correction,
          article: article
            ? {
                _id: article._id,
                title: article.title,
                slug: article.slug,
              }
            : null,
          proposer: proposer
            ? {
                _id: proposer._id,
                email: proposer.email || "",
                name: proposer.email?.split("@")[0] || "Auteur",
              }
            : null,
        };
      })
    );

    return correctionsWithDetails;
  },
});

/**
 * Récupère les corrections proposées sur les articles de l'utilisateur connecté (pour les auteurs)
 */
export const getCorrectionsForMyArticles = query({
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

    const limit = args.limit || 20;

    // Récupérer tous les articles de l'utilisateur
    const myArticles = await ctx.db
      .query("articles")
      .withIndex("authorId", (q) => q.eq("authorId", appUser._id))
      .collect();

    const myArticleIds = myArticles.map((a) => a._id);

    if (myArticleIds.length === 0) {
      return [];
    }

    // Récupérer toutes les corrections pour ces articles
    const allCorrections = await ctx.db
      .query("articleCorrections")
      .collect();

    const corrections = allCorrections
      .filter((c) => myArticleIds.includes(c.articleId))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    // Enrichir avec les données de l'article et du proposant
    const correctionsWithDetails = await Promise.all(
      corrections.map(async (correction) => {
        const article = await ctx.db.get(correction.articleId);
        const proposer = await ctx.db.get(correction.proposerId);

        return {
          ...correction,
          article: article
            ? {
                _id: article._id,
                title: article.title,
                slug: article.slug,
              }
            : null,
          proposer: proposer
            ? {
                _id: proposer._id,
                email: proposer.email || "",
                name: proposer.name || proposer.email?.split("@")[0] || "Auteur",
                image: proposer.image || null,
              }
            : null,
        };
      })
    );

    return correctionsWithDetails;
  },
});

/**
 * Récupère les corrections proposées par l'utilisateur connecté
 */
export const getMyCorrections = query({
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

    const limit = args.limit || 20;

    // Récupérer toutes les corrections de l'utilisateur
    const allCorrections = await ctx.db
      .query("articleCorrections")
      .collect();
    
    const corrections = allCorrections
      .filter((c) => c.proposerId === appUser._id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    // Enrichir avec les données de l'article
    const correctionsWithDetails = await Promise.all(
      corrections.map(async (correction) => {
        const article = await ctx.db.get(correction.articleId);
        const reviewedBy =
          correction.reviewedBy ? await ctx.db.get(correction.reviewedBy) : null;

        return {
          ...correction,
          article: article
            ? {
                _id: article._id,
                title: article.title,
                slug: article.slug,
              }
            : null,
          reviewer: reviewedBy
            ? {
                _id: reviewedBy._id,
                email: reviewedBy.email || "",
                name: reviewedBy.email?.split("@")[0] || "Éditeur",
              }
            : null,
        };
      })
    );

    return correctionsWithDetails;
  },
});

/**
 * Propose une correction sur un article
 */
export const proposeCorrection = mutation({
  args: {
    articleId: v.id("articles"),
    correctionType: v.union(
      v.literal("source"),
      v.literal("contre_argument"),
      v.literal("fact_check"),
      v.literal("other")
    ),
    title: v.string(),
    description: v.string(),
    content: v.optional(v.string()),
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

    const now = Date.now();

    const correctionId = await ctx.db.insert("articleCorrections", {
      articleId: args.articleId,
      proposerId: appUser._id,
      correctionType: args.correctionType,
      title: args.title,
      description: args.description,
      content: args.content,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    // Envoyer une notification à l'auteur de l'article (si ce n'est pas le proposant)
    if (article.authorId !== appUser._id) {
      await ctx.runMutation(internal.notifications.createNotificationInternal, {
        userId: article.authorId,
        type: "correction_proposed",
        title: "Nouvelle contribution proposée",
        message: `Une contribution "${args.title}" a été proposée sur votre article "${article.title}".`,
        link: `/articles/${article.slug}`,
        metadata: {
          articleId: args.articleId,
          correctionId: correctionId,
        },
      });
    }

    return { correctionId };
  },
});

/**
 * Approuve une correction (réservé aux éditeurs)
 */
export const approveCorrection = mutation({
  args: {
    correctionId: v.id("articleCorrections"),
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
      throw new Error("Seuls les éditeurs peuvent approuver des corrections");
    }

    const correction = await ctx.db.get(args.correctionId);
    if (!correction) {
      throw new Error("Correction not found");
    }

    if (correction.status !== "pending") {
      throw new Error("Cette correction a déjà été traitée");
    }

    await ctx.db.patch(args.correctionId, {
      status: "approved",
      reviewedBy: appUser._id,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // TODO: Appliquer la correction à l'article selon le type
    // - Si source : ajouter à l'article
    // - Si contre-argument : ajouter aux contre-arguments
    // - Si fact-check : modifier l'article ou créer un claim

    // Mettre à jour le score de crédibilité du proposant
    const { updateCredibilityScoreWithAction } = await import("./credibility");
    await updateCredibilityScoreWithAction(
      ctx,
      correction.proposerId,
      "correction_approved",
      { correctionId: args.correctionId }
    );

    // Récupérer l'article pour le lien
    const article = await ctx.db.get(correction.articleId);
    const articleLink = article ? `/articles/${article.slug}` : undefined;

    // Créer une notification pour le proposant
    await ctx.runMutation(internal.notifications.createNotificationInternal, {
      userId: correction.proposerId,
      type: "correction_approved",
      title: "Correction approuvée",
      message: `Votre correction "${correction.title}" a été approuvée par un éditeur.`,
      link: articleLink,
      metadata: {
        articleId: correction.articleId,
        correctionId: args.correctionId,
      },
    });

    return { success: true };
  },
});

/**
 * Rejette une correction (réservé aux éditeurs)
 */
export const rejectCorrection = mutation({
  args: {
    correctionId: v.id("articleCorrections"),
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
      throw new Error("Seuls les éditeurs peuvent rejeter des corrections");
    }

    const correction = await ctx.db.get(args.correctionId);
    if (!correction) {
      throw new Error("Correction not found");
    }

    if (correction.status !== "pending") {
      throw new Error("Cette correction a déjà été traitée");
    }

    await ctx.db.patch(args.correctionId, {
      status: "rejected",
      reviewedBy: appUser._id,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Récupérer l'article pour le lien
    const article = await ctx.db.get(correction.articleId);
    const articleLink = article ? `/articles/${article.slug}` : undefined;

    // Créer une notification pour le proposant
    await ctx.runMutation(internal.notifications.createNotificationInternal, {
      userId: correction.proposerId,
      type: "correction_rejected",
      title: "Correction rejetée",
      message: `Votre correction "${correction.title}" a été rejetée par un éditeur.`,
      link: articleLink,
      metadata: {
        articleId: correction.articleId,
        correctionId: args.correctionId,
      },
    });

    return { success: true };
  },
});

