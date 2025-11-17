import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { betterAuthComponent } from "./auth";

/**
 * Calcul du score de qualité d'un article
 * Basé sur :
 * - Ratio de claims vérifiés
 * - Nombre de vérifications par experts
 * - Score de vérification communautaire
 * - Type d'article (scientifique > expert > opinion)
 */
function calculateQualityScore(
  verifiedClaimsCount: number,
  totalClaimsCount: number,
  expertReviewCount: number,
  communityVerificationScore: number,
  articleType: "scientific" | "expert" | "opinion" | "news" | "tutorial" | "other"
): number {
  // Ratio de vérification (0-40 points)
  const verificationRatio = totalClaimsCount > 0 
    ? (verifiedClaimsCount / totalClaimsCount) * 40 
    : 0;

  // Bonus pour vérifications expertes (0-30 points)
  const expertBonus = Math.min(expertReviewCount * 5, 30);

  // Score communautaire (0-20 points)
  const communityScore = (communityVerificationScore / 100) * 20;

  // Bonus selon le type d'article (0-10 points)
  const typeBonus = {
    scientific: 10,
    expert: 7,
    tutorial: 5,
    news: 3,
    opinion: 2,
    other: 1,
  }[articleType];

  return Math.min(Math.round(verificationRatio + expertBonus + communityScore + typeBonus), 100);
}

/**
 * Calcul du score de vérification communautaire d'un article
 * Basé sur les vérifications de tous les claims de l'article
 */
async function calculateCommunityVerificationScore(
  ctx: any,
  articleId: string
): Promise<number> {
  // Récupérer tous les claims de l'article
  const claims = await ctx.db
    .query("articleClaims")
    .withIndex("articleId", (q: any) => q.eq("articleId", articleId as any))
    .collect();

  if (claims.length === 0) return 50; // Score neutre par défaut

  // Récupérer toutes les vérifications de tous les claims
  const allVerifications = await Promise.all(
    claims.map(async (claim: any) => {
      return await ctx.db
        .query("claimVerifications")
        .withIndex("claimId", (q: any) => q.eq("claimId", claim._id))
        .collect();
    })
  );

  const verifications = allVerifications.flat();

  if (verifications.length === 0) return 50; // Score neutre par défaut

  let verifiedCount = 0;
  let disputedCount = 0;
  let falseCount = 0;
  let expertWeight = 0;

  for (const verification of verifications) {
    const weight = verification.isExpert ? 3 : 1; // Les experts ont 3x plus de poids
    expertWeight += weight;

    if (verification.verificationResult === "verified") {
      verifiedCount += weight;
    } else if (verification.verificationResult === "disputed") {
      disputedCount += weight;
    } else if (verification.verificationResult === "false") {
      falseCount += weight;
    }
  }

  const total = verifiedCount + disputedCount + falseCount;
  if (total === 0) return 50;

  // Score basé sur le ratio de vérifications positives
  const score = (verifiedCount / total) * 100;
  // Pénalité pour les vérifications négatives
  const penalty = (falseCount / total) * 50;

  return Math.max(0, Math.min(100, score - penalty));
}

/**
 * Mise à jour du score de qualité d'un article
 */
async function updateArticleQualityScore(ctx: any, articleId: string) {
  const article = await ctx.db.get(articleId as any);
  if (!article) return;

  const claims = await ctx.db
    .query("articleClaims")
    .withIndex("articleId", (q: any) => q.eq("articleId", articleId as any))
    .collect();

  const verifiedClaims = claims.filter(
    (c: any) => c.verificationStatus === "verified"
  ).length;

  const communityScore = await calculateCommunityVerificationScore(ctx, articleId);

  const qualityScore = calculateQualityScore(
    verifiedClaims,
    claims.length,
    article.expertReviewCount,
    communityScore,
    article.articleType
  );

  await ctx.db.patch(articleId as any, {
    qualityScore,
    verifiedClaimsCount: verifiedClaims,
    totalClaimsCount: claims.length,
    communityVerificationScore: communityScore,
    updatedAt: Date.now(),
  });
}

// ============================================
// QUERIES
// ============================================

/**
 * Récupère les articles publiés, triés par qualité et pertinence
 */
export const getArticles = query({
  args: {
    limit: v.optional(v.number()),
    sortBy: v.optional(
      v.union(
        v.literal("quality"), // Par qualité (défaut)
        v.literal("recent"), // Plus récents
        v.literal("popular"), // Plus populaires
        v.literal("verified") // Plus vérifiés
      )
    ),
    articleType: v.optional(
      v.union(
        v.literal("scientific"),
        v.literal("expert"),
        v.literal("opinion"),
        v.literal("news"),
        v.literal("tutorial"),
        v.literal("other")
      )
    ),
    minQualityScore: v.optional(v.number()), // Filtre par score minimum
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const sortBy = args.sortBy || "quality";
    const minQualityScore = args.minQualityScore || 0;

    let articles = await ctx.db
      .query("articles")
      .withIndex("status", (q) => q.eq("status", "published"))
      .filter((q) => q.gte(q.field("qualityScore"), minQualityScore))
      .collect();

    // Filtrer par type si spécifié
    if (args.articleType) {
      articles = articles.filter((a) => a.articleType === args.articleType);
    }

    // Trier selon le critère
    switch (sortBy) {
      case "quality":
        articles.sort((a, b) => b.qualityScore - a.qualityScore);
        break;
      case "recent":
        articles.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
        break;
      case "popular":
        articles.sort((a, b) => b.views - a.views);
        break;
      case "verified":
        articles.sort((a, b) => {
          const ratioA = a.totalClaimsCount > 0 
            ? a.verifiedClaimsCount / a.totalClaimsCount 
            : 0;
          const ratioB = b.totalClaimsCount > 0 
            ? b.verifiedClaimsCount / b.totalClaimsCount 
            : 0;
          return ratioB - ratioA;
        });
        break;
    }

    // Enrichir avec les données de l'auteur
    const articlesWithAuthor = await Promise.all(
      articles.slice(0, limit).map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        return {
          ...article,
          author: author
            ? {
                _id: author._id,
                email: author.email,
                name: author.email.split("@")[0] || "Auteur", // Utiliser l'email comme nom par défaut
                image: null, // L'image viendra de Better Auth côté client
              }
            : null,
        };
      })
    );

    return articlesWithAuthor;
  },
});

/**
 * Récupère un article par son slug
 */
export const getArticleBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const article = await ctx.db
      .query("articles")
      .withIndex("slug", (q: any) => q.eq("slug", args.slug))
      .first();

    if (!article) return null;

    const author = await ctx.db.get(article.authorId);
    const claims = await ctx.db
      .query("articleClaims")
      .withIndex("articleId", (q: any) => q.eq("articleId", article._id))
      .collect();

    return {
      ...article,
      author: author
        ? {
            _id: author._id,
            email: author.email,
            name: author.email.split("@")[0] || "Auteur", // Utiliser l'email comme nom par défaut
            image: null, // L'image viendra de Better Auth côté client
          }
        : null,
      claims,
    };
  },
});

/**
 * Récupère les claims d'un article avec leurs sources
 */
export const getArticleClaims = query({
  args: {
    articleId: v.id("articles"),
  },
  handler: async (ctx, args) => {
    const claims = await ctx.db
      .query("articleClaims")
      .withIndex("articleId", (q) => q.eq("articleId", args.articleId))
      .collect();

    const claimsWithSources = await Promise.all(
      claims.map(async (claim) => {
        const sources = await ctx.db
          .query("claimSources")
          .withIndex("claimId", (q) => q.eq("claimId", claim._id))
          .collect();

        const verifications = await ctx.db
          .query("claimVerifications")
          .withIndex("claimId", (q) => q.eq("claimId", claim._id))
          .collect();

        return {
          ...claim,
          sources,
          verifications,
        };
      })
    );

    return claimsWithSources;
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Crée un nouvel article
 */
export const createArticle = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    summary: v.string(),
    content: v.string(),
    tags: v.array(v.string()),
    coverImage: v.optional(v.string()),
    articleType: v.union(
      v.literal("scientific"),
      v.literal("expert"),
      v.literal("opinion"),
      v.literal("news"),
      v.literal("tutorial"),
      v.literal("other")
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("published")
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
      .query("articles")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Un article avec ce slug existe déjà");
    }

    const now = Date.now();

    const articleId = await ctx.db.insert("articles", {
      title: args.title,
      slug: args.slug,
      summary: args.summary,
      content: args.content,
      authorId: appUser._id,
      tags: args.tags,
      coverImage: args.coverImage,
      articleType: args.articleType,
      featured: false,
      publishedAt: args.status === "published" ? now : undefined,
      views: 0,
      reactions: 0,
      comments: 0,
      qualityScore: 0, // Sera calculé quand des claims seront ajoutés
      verifiedClaimsCount: 0,
      totalClaimsCount: 0,
      expertReviewCount: 0,
      communityVerificationScore: 50, // Score neutre par défaut
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });

    return { articleId };
  },
});

/**
 * Met à jour un article
 */
export const updateArticle = mutation({
  args: {
    articleId: v.id("articles"),
    title: v.optional(v.string()),
    summary: v.optional(v.string()),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    coverImage: v.optional(v.string()),
    articleType: v.optional(
      v.union(
        v.literal("scientific"),
        v.literal("expert"),
        v.literal("opinion"),
        v.literal("news"),
        v.literal("tutorial"),
        v.literal("other")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("pending"),
        v.literal("published"),
        v.literal("rejected")
      )
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

    const article = await ctx.db.get(args.articleId);
    if (!article) {
      throw new Error("Article not found");
    }

    // Vérifier que l'utilisateur est l'auteur
    if (article.authorId !== appUser._id) {
      throw new Error("Vous n'êtes pas l'auteur de cet article");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.summary !== undefined) updates.summary = args.summary;
    if (args.content !== undefined) updates.content = args.content;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
    if (args.articleType !== undefined) updates.articleType = args.articleType;
    if (args.status !== undefined) {
      updates.status = args.status;
      if (args.status === "published" && !article.publishedAt) {
        updates.publishedAt = Date.now();
      }
    }

    await ctx.db.patch(args.articleId, updates);

    // Recalculer le score de qualité si nécessaire
    if (args.content !== undefined || args.status === "published") {
      await updateArticleQualityScore(ctx, args.articleId);
    }

    return { success: true };
  },
});

/**
 * Ajoute un claim (affirmation) à un article
 */
export const addClaim = mutation({
  args: {
    articleId: v.id("articles"),
    claimText: v.string(),
    position: v.optional(v.number()),
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

    // Vérifier que l'utilisateur est l'auteur
    if (article.authorId !== appUser._id) {
      throw new Error("Vous n'êtes pas l'auteur de cet article");
    }

    const now = Date.now();

    const claimId = await ctx.db.insert("articleClaims", {
      articleId: args.articleId,
      claimText: args.claimText,
      position: args.position,
      verificationStatus: "unverified",
      verificationScore: 0,
      sourcesCount: 0,
      expertVerificationsCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Mettre à jour le nombre de claims de l'article
    await ctx.db.patch(args.articleId, {
      totalClaimsCount: article.totalClaimsCount + 1,
      updatedAt: now,
    });

    // Recalculer le score de qualité
    await updateArticleQualityScore(ctx, args.articleId);

    return { claimId };
  },
});

/**
 * Ajoute une source à un claim
 */
export const addSourceToClaim = mutation({
  args: {
    claimId: v.id("articleClaims"),
    sourceType: v.union(
      v.literal("scientific_paper"),
      v.literal("expert_statement"),
      v.literal("official_data"),
      v.literal("news_article"),
      v.literal("website"),
      v.literal("other")
    ),
    title: v.string(),
    url: v.optional(v.string()),
    author: v.optional(v.string()),
    publicationDate: v.optional(v.number()),
    reliabilityScore: v.number(), // Score de fiabilité (0-100)
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

    const claim = await ctx.db.get(args.claimId);
    if (!claim) {
      throw new Error("Claim not found");
    }

    const sourceId = await ctx.db.insert("claimSources", {
      claimId: args.claimId,
      sourceType: args.sourceType,
      title: args.title,
      url: args.url,
      author: args.author,
      publicationDate: args.publicationDate,
      reliabilityScore: args.reliabilityScore,
      addedBy: appUser._id,
      createdAt: Date.now(),
    });

    // Mettre à jour le nombre de sources du claim
    await ctx.db.patch(args.claimId, {
      sourcesCount: claim.sourcesCount + 1,
      updatedAt: Date.now(),
    });

    // Si le claim a maintenant des sources, améliorer son statut
    if (claim.sourcesCount === 0 && args.reliabilityScore >= 70) {
      await ctx.db.patch(args.claimId, {
        verificationStatus: "verified",
        verificationScore: args.reliabilityScore,
        updatedAt: Date.now(),
      });
    }

    // Recalculer le score de qualité de l'article
    await updateArticleQualityScore(ctx, claim.articleId);

    return { sourceId };
  },
});

/**
 * Vérifie un claim (par la communauté ou un expert)
 */
export const verifyClaim = mutation({
  args: {
    claimId: v.id("articleClaims"),
    verificationResult: v.union(
      v.literal("verified"),
      v.literal("disputed"),
      v.literal("false")
    ),
    comment: v.optional(v.string()),
    isExpert: v.optional(v.boolean()),
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

    const claim = await ctx.db.get(args.claimId);
    if (!claim) {
      throw new Error("Claim not found");
    }

    // Vérifier si l'utilisateur a déjà vérifié ce claim
    const existingVerification = await ctx.db
      .query("claimVerifications")
      .withIndex("claimId", (q) => q.eq("claimId", args.claimId))
      .filter((q) => q.eq(q.field("verifierId"), appUser._id))
      .first();

    if (existingVerification) {
      // Mettre à jour la vérification existante
      await ctx.db.patch(existingVerification._id, {
        verificationResult: args.verificationResult,
        comment: args.comment,
        isExpert: args.isExpert || false,
      });
    } else {
      // Créer une nouvelle vérification
      await ctx.db.insert("claimVerifications", {
        claimId: args.claimId,
        verifierId: appUser._id,
        isExpert: args.isExpert || false,
        verificationResult: args.verificationResult,
        comment: args.comment,
        createdAt: Date.now(),
      });
    }

    // Mettre à jour le statut du claim basé sur les vérifications
    const verifications = await ctx.db
      .query("claimVerifications")
      .withIndex("claimId", (q) => q.eq("claimId", args.claimId))
      .collect();

    const expertVerifications = verifications.filter((v) => v.isExpert);
    const verifiedCount = verifications.filter(
      (v) => v.verificationResult === "verified"
    ).length;
    const disputedCount = verifications.filter(
      (v) => v.verificationResult === "disputed"
    ).length;
    const falseCount = verifications.filter(
      (v) => v.verificationResult === "false"
    ).length;

    let newStatus: "unverified" | "verified" | "disputed" | "false" = "unverified";
    let newScore = 0;

    if (expertVerifications.length > 0) {
      // Si des experts ont vérifié, donner plus de poids
      const expertVerified = expertVerifications.filter(
        (v) => v.verificationResult === "verified"
      ).length;
      const expertFalse = expertVerifications.filter(
        (v) => v.verificationResult === "false"
      ).length;

      if (expertVerified > expertFalse) {
        newStatus = "verified";
        newScore = 80 + (expertVerified * 5);
      } else if (expertFalse > expertVerified) {
        newStatus = "false";
        newScore = 20;
      } else {
        newStatus = "disputed";
        newScore = 50;
      }
    } else if (verifications.length > 0) {
      // Sinon, utiliser la majorité communautaire
      if (verifiedCount > disputedCount && verifiedCount > falseCount) {
        newStatus = "verified";
        newScore = 60 + (verifiedCount * 2);
      } else if (falseCount > verifiedCount && falseCount > disputedCount) {
        newStatus = "false";
        newScore = 30;
      } else {
        newStatus = "disputed";
        newScore = 50;
      }
    }

    await ctx.db.patch(args.claimId, {
      verificationStatus: newStatus,
      verificationScore: Math.min(100, newScore),
      expertVerificationsCount: expertVerifications.length,
      updatedAt: Date.now(),
    });

    // Mettre à jour le nombre de vérifications expertes de l'article
    const article = await ctx.db.get(claim.articleId);
    if (article) {
      const allClaims = await ctx.db
        .query("articleClaims")
        .withIndex("articleId", (q) => q.eq("articleId", claim.articleId))
        .collect();

      const totalExpertVerifications = allClaims.reduce(
        (sum, c) => sum + c.expertVerificationsCount,
        0
      );

      await ctx.db.patch(claim.articleId, {
        expertReviewCount: totalExpertVerifications,
        updatedAt: Date.now(),
      });
    }

    // Recalculer le score de qualité de l'article
    await updateArticleQualityScore(ctx, claim.articleId);

    return { success: true };
  },
});

