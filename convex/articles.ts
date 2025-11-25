import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { getEditorialRulesForArticleType, getArticleQualityRules, getRuleValueAsNumber } from "./configurableRules.helpers";
import { getDefaultCategory } from "./categories.defaults";
import { updateCredibilityScoreWithAction } from "./credibility";

// ============================================
// HELPER FUNCTIONS
// ============================================

async function updateArticleQualityScore(ctx: any, articleId: Id<"articles">) {
  const article = await ctx.db.get(articleId);
  if (!article) return;

  // Récupérer les règles de qualité configurables
  const qualityRules = await getArticleQualityRules(ctx);

  let qualityScore = 0;
  
  // Bonus selon le type d'article (depuis les règles configurables)
  const typeBonus: Record<string, number> = {
    scientific: qualityRules.scientificBonus,
    expert: qualityRules.expertBonus,
    tutorial: qualityRules.tutorialBonus,
    news: qualityRules.newsBonus,
    opinion: qualityRules.opinionBonus,
    other: qualityRules.otherBonus,
  };
  qualityScore += typeBonus[article.articleType] || qualityRules.otherBonus;

  // Bonus selon le ratio de vérification
  if (article.totalClaimsCount > 0) {
    const verificationRatio = article.verifiedClaimsCount / article.totalClaimsCount;
    qualityScore += verificationRatio * qualityRules.verificationRatioWeight;
  }

  // Bonus vérifications expertes
  qualityScore += Math.min(article.expertReviewCount * qualityRules.expertReviewPoints, qualityRules.expertReviewMax);

  // Bonus score communautaire
  qualityScore += (article.communityVerificationScore / 100) * qualityRules.communityWeight;

  // Score final entre 0 et 100
  qualityScore = Math.min(Math.round(qualityScore), 100);

  await ctx.db.patch(articleId, {
    qualityScore,
    updatedAt: Date.now(),
  });
}

// ============================================
// QUERIES
// ============================================

/**
 * Récupère les articles publiés, triés par qualité et pertinence
 */
/**
 * ⚠️ IMPORTANT : Ne PAS filtrer par rayon géographique (reachRadius/location)
 * Le filtrage se fait uniquement par :
 * - Réputation (qualityScore, credibilityScore)
 * - Gouvernance (status: published = déjà validé)
 * - Type, tags, tri (recent, popular, verified)
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
    minQualityScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Récupérer la limite par défaut depuis les règles configurables
    const defaultLimit = await getRuleValueAsNumber(ctx, "default_list_limit").catch(() => 20);
    const limit = args.limit || defaultLimit;
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

    // Enrichir avec les données de l'auteur et les catégories
    const articlesWithAuthor = await Promise.all(
      articles.slice(0, limit).map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        
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
          author: author
            ? {
                _id: author._id,
                email: author.email,
                name: author.name || author.email.split("@")[0] || "Auteur",
                image: author.image || null,
              }
            : null,
          categories,
        };
      })
    );

    return articlesWithAuthor;
  },
});

/**
 * Récupère les articles en attente de validation (pour les éditeurs)
 */
export const getPendingArticles = query({
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

    const defaultLimit = await getRuleValueAsNumber(ctx, "default_list_limit").catch(() => 20);
    const limit = args.limit || defaultLimit;

    // Récupérer tous les articles avec statut "pending"
    const allArticles = await ctx.db
      .query("articles")
      .withIndex("status", (q) => q.eq("status", "pending"))
      .collect();

    // Trier par date de création (plus récents en premier)
    const sortedArticles = allArticles
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);

    // Enrichir avec les données de l'auteur
    const articlesWithAuthor = await Promise.all(
      sortedArticles.map(async (article) => {
        const author = await ctx.db.get(article.authorId);
        
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
          author: author
            ? {
                _id: author._id,
                email: author.email || "",
                name: author.name || author.email?.split("@")[0] || "Auteur",
                image: author.image || null,
                role: author.role || "explorateur",
                credibilityScore: author.credibilityScore || 0,
              }
            : null,
          categories,
        };
      })
    );

    return articlesWithAuthor;
  },
});

/**
 * Récupère les articles de l'utilisateur connecté
 */
export const getMyArticles = query({
  args: {
    limit: v.optional(v.number()),
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
      return [];
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return [];
    }

    // Récupérer la limite par défaut depuis les règles configurables
    const defaultLimit = await getRuleValueAsNumber(ctx, "default_list_limit").catch(() => 20);
    const limit = args.limit || defaultLimit;

    let articles = await ctx.db
      .query("articles")
      .withIndex("authorId", (q) => q.eq("authorId", appUser._id))
      .collect();

    // Filtrer par statut si spécifié
    if (args.status) {
      articles = articles.filter((a) => a.status === args.status);
    }

    // Trier par date de création (plus récents en premier)
    articles.sort((a, b) => b.createdAt - a.createdAt);

    return articles.slice(0, limit);
  },
});

/**
 * Récupère un article par son ID (pour les brouillons qui n'ont pas encore de slug)
 */
export const getArticleById = query({
  args: {
    articleId: v.id("articles"),
  },
  handler: async (ctx, args) => {
    const article = await ctx.db.get(args.articleId);
    
    if (!article) return null;

    const author = await ctx.db.get(article.authorId);

    return {
      ...article,
      author: author
        ? {
            _id: author._id,
            email: author.email,
            name: author.name || author.email.split("@")[0] || "Auteur",
            image: author.image || null,
          }
        : null,
    };
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
      author: author
        ? {
            _id: author._id,
            email: author.email,
            name: author.name || author.email.split("@")[0] || "Auteur",
            image: author.image || null,
          }
        : null,
      categories,
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

        return {
          ...claim,
          sources,
        };
      })
    );

    return claimsWithSources;
  },
});

/**
 * Récupère toutes les sources d'un article (toutes les sources de tous les claims)
 */
export const getArticleSources = query({
  args: {
    articleId: v.id("articles"),
  },
  handler: async (ctx, args) => {
    // Récupérer tous les claims de l'article
    const claims = await ctx.db
      .query("articleClaims")
      .withIndex("articleId", (q) => q.eq("articleId", args.articleId))
      .collect();

    // Récupérer toutes les sources de tous les claims
    const allSources = await Promise.all(
      claims.map(async (claim) => {
        const sources = await ctx.db
          .query("claimSources")
          .withIndex("claimId", (q) => q.eq("claimId", claim._id))
          .collect();
        
        // Enrichir avec les données de l'utilisateur qui a ajouté la source
        const sourcesWithUser = await Promise.all(
          sources.map(async (source) => {
            const addedByUser = await ctx.db.get(source.addedBy);
            return {
              ...source,
              addedByUser: addedByUser
                ? {
                    _id: addedByUser._id,
                    email: addedByUser.email || "",
                    name: addedByUser.email?.split("@")[0] || "Utilisateur",
                  }
                : null,
            };
          })
        );
        
        return sourcesWithUser;
      })
    );

    // Aplatir la liste et dédupliquer par URL si présent
    const flattenedSources = allSources.flat();
    const uniqueSources = flattenedSources.filter((source, index, self) => {
      if (!source.url) return true; // Garder les sources sans URL
      return index === self.findIndex((s) => s.url === source.url);
    });

    // Trier par score de fiabilité décroissant
    uniqueSources.sort((a, b) => (b.reliabilityScore || 0) - (a.reliabilityScore || 0));

    return uniqueSources;
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
    content: v.string(), // JSON stringifié du contenu Plate.js
    tags: v.array(v.string()),
    categoryIds: v.optional(v.array(v.id("categories"))),
    categorySlugs: v.optional(v.array(v.string())), // Pour les catégories par défaut (pas encore en base)
    coverImage: v.optional(v.string()),
    articleType: v.union(
      v.literal("scientific"),
      v.literal("expert"),
      v.literal("opinion"),
      v.literal("news"),
      v.literal("tutorial"),
      v.literal("other")
    ),
    status: v.union(v.literal("draft"), v.literal("pending"), v.literal("published")),
    // Structure obligatoire selon NEW_SEED.md
    these: v.optional(v.string()),
    counterArguments: v.optional(v.array(v.string())),
    conclusion: v.optional(v.string()),
    sourcesCount: v.optional(v.number()),
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

    const now = Date.now();

    // Forcer le statut "pending" pour les explorateurs (ils ne peuvent pas publier directement)
    let finalStatus = args.status;
    if (appUser.role === "explorateur" && args.status === "published") {
      finalStatus = "pending";
    }

    // Validation si création directe en "published" (seulement pour contributeurs et éditeurs)
    if (finalStatus === "published") {
      // Récupérer les règles éditoriales pour ce type d'article
      const editorialRules = await getEditorialRulesForArticleType(ctx, args.articleType);
      
      // Vérifier les champs obligatoires selon les règles configurables
      if (editorialRules.requireThesis) {
        if (!args.these || !args.these.trim()) {
          throw new Error("La thèse est obligatoire pour publier un article");
        }
      }
      
      if (editorialRules.requireConclusion) {
        if (!args.conclusion || !args.conclusion.trim()) {
          throw new Error("La conclusion est obligatoire pour publier un article");
        }
      }
      
      if (editorialRules.requireCounterArguments) {
        if ((args.counterArguments || []).length < 1) {
          throw new Error("Au moins 1 contre-argument est obligatoire pour publier un article");
        }
      }
      
      // Vérifier le nombre minimum de sources selon le type d'article
      if ((args.sourcesCount || 0) < editorialRules.minSources) {
        throw new Error(
          `Au moins ${editorialRules.minSources} source${editorialRules.minSources > 1 ? "s" : ""} ${editorialRules.minSources > 1 ? "sont" : "est"} obligatoire${editorialRules.minSources > 1 ? "s" : ""} pour publier un article de type "${args.articleType}"`
        );
      }
      
      // Vérifier la longueur de l'article
      const contentLength = args.content?.length || 0;
      if (contentLength < editorialRules.minLength) {
        throw new Error(
          `L'article doit contenir au moins ${editorialRules.minLength} caractères (actuellement ${contentLength})`
        );
      }
      if (contentLength > editorialRules.maxLength) {
        throw new Error(
          `L'article ne peut pas dépasser ${editorialRules.maxLength} caractères (actuellement ${contentLength})`
        );
      }
      
      // Vérifier le nombre de tags
      if ((args.tags || []).length > editorialRules.maxTags) {
        throw new Error(
          `Un article ne peut pas avoir plus de ${editorialRules.maxTags} tags`
        );
      }
      
      // Vérifier que le contenu n'est pas vide
      try {
        const contentObj = JSON.parse(args.content || "[]");
        if (!Array.isArray(contentObj) || contentObj.length === 0) {
          throw new Error("Le développement est obligatoire pour publier un article");
        }
      } catch {
        throw new Error("Le contenu de l'article est invalide");
      }
    }

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
              proposedBy: appUser._id, // L'utilisateur qui crée l'article
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

    const articleId = await ctx.db.insert("articles", {
      title: args.title,
      slug: args.slug,
      summary: args.summary,
      content: args.content,
      authorId: appUser._id,
      tags: args.tags,
      categoryIds: finalCategoryIds.length > 0 ? finalCategoryIds : undefined,
      coverImage: args.coverImage,
      featured: false,
      publishedAt: args.status === "published" ? now : undefined,
      views: 0,
      reactions: 0,
      comments: 0,
      qualityScore: 0,
      verifiedClaimsCount: 0,
      totalClaimsCount: 0,
      expertReviewCount: 0,
      communityVerificationScore: 0,
      articleType: args.articleType,
      status: finalStatus,
      // Structure obligatoire
      these: args.these || "",
      counterArguments: args.counterArguments || [],
      conclusion: args.conclusion || "",
      sourcesCount: args.sourcesCount || 0,
      createdAt: now,
      updatedAt: now,
    });

    // Calculer le score de qualité initial
    await updateArticleQualityScore(ctx, articleId);

    // Mettre à jour le score de crédibilité de l'auteur si l'article est publié
    if (finalStatus === "published") {
      await updateCredibilityScoreWithAction(
        ctx,
        appUser._id,
        "article_published",
        { articleId }
      );
    }

    // Si l'article est en attente, notifier tous les éditeurs
    if (finalStatus === "pending") {
      // Récupérer tous les éditeurs
      const editors = await ctx.db
        .query("users")
        .filter((q: any) => q.eq(q.field("role"), "editeur"))
        .collect();

      // Envoyer une notification à chaque éditeur
      await Promise.all(
        editors.map((editor) =>
          ctx.runMutation(internal.notifications.createNotificationInternal, {
            userId: editor._id,
            type: "article_pending",
            title: "Nouvel article en attente de validation",
            message: `Un nouvel article "${args.title}" a été soumis et nécessite votre validation.`,
            link: `/studio/articles/en-attente`,
            metadata: {
              articleId: articleId,
            },
          })
        )
      );
    }

    return articleId;
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
    categoryIds: v.optional(v.array(v.id("categories"))),
    categorySlugs: v.optional(v.array(v.string())), // Pour les catégories par défaut (pas encore en base)
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
    status: v.optional(v.union(v.literal("draft"), v.literal("pending"), v.literal("published"))),
    // Structure obligatoire
    these: v.optional(v.string()),
    counterArguments: v.optional(v.array(v.string())),
    conclusion: v.optional(v.string()),
    sourcesCount: v.optional(v.number()),
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
      throw new Error("Unauthorized");
    }

    const updateData: any = {
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
                proposedBy: appUser._id, // L'utilisateur qui modifie l'article
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
      
      updateData.categoryIds = finalCategoryIds.length > 0 ? finalCategoryIds : undefined;
    }

    if (args.title !== undefined) updateData.title = args.title;
    if (args.summary !== undefined) updateData.summary = args.summary;
    if (args.content !== undefined) updateData.content = args.content;
    if (args.tags !== undefined) updateData.tags = args.tags;
    if (args.coverImage !== undefined) updateData.coverImage = args.coverImage;
    if (args.articleType !== undefined) updateData.articleType = args.articleType;
    if (args.status !== undefined) {
      // Forcer le statut "pending" pour les explorateurs (ils ne peuvent pas publier directement)
      let finalStatus = args.status;
      if (appUser.role === "explorateur" && args.status === "published") {
        finalStatus = "pending";
      }
      
      updateData.status = finalStatus;
      if (finalStatus === "published" && !article.publishedAt) {
        updateData.publishedAt = Date.now();
      }
      
      // Si l'article passe en "pending", notifier les éditeurs
      if (finalStatus === "pending" && article.status !== "pending") {
        // Récupérer tous les éditeurs
        const editors = await ctx.db
          .query("users")
          .filter((q: any) => q.eq(q.field("role"), "editeur"))
          .collect();

        // Envoyer une notification à chaque éditeur
        await Promise.all(
          editors.map((editor) =>
            ctx.runMutation(internal.notifications.createNotificationInternal, {
              userId: editor._id,
              type: "article_pending",
              title: "Nouvel article en attente de validation",
              message: `Un article "${article.title}" a été soumis et nécessite votre validation.`,
              link: `/studio/articles/en-attente`,
              metadata: {
                articleId: args.articleId,
              },
            })
          )
        );
      }
    }
    
    // Structure obligatoire
    if (args.these !== undefined) updateData.these = args.these;
    if (args.counterArguments !== undefined) updateData.counterArguments = args.counterArguments;
    if (args.conclusion !== undefined) updateData.conclusion = args.conclusion;
    if (args.sourcesCount !== undefined) updateData.sourcesCount = args.sourcesCount;

    // Validation de la structure obligatoire si passage à "published"
    if (args.status === "published" && article.status !== "published") {
      const finalArticle = { ...article, ...updateData };
      
      // Récupérer les règles éditoriales pour ce type d'article
      const editorialRules = await getEditorialRulesForArticleType(ctx, finalArticle.articleType);
      
      // Vérifier les champs obligatoires selon les règles configurables
      if (editorialRules.requireThesis) {
        if (!finalArticle.these || !finalArticle.these.trim()) {
          throw new Error("La thèse est obligatoire pour publier un article");
        }
      }
      
      if (editorialRules.requireConclusion) {
        if (!finalArticle.conclusion || !finalArticle.conclusion.trim()) {
          throw new Error("La conclusion est obligatoire pour publier un article");
        }
      }
      
      if (editorialRules.requireCounterArguments) {
        if ((finalArticle.counterArguments || []).length < 1) {
          throw new Error("Au moins 1 contre-argument est obligatoire pour publier un article");
        }
      }
      
      // Vérifier le nombre minimum de sources selon le type d'article
      if ((finalArticle.sourcesCount || 0) < editorialRules.minSources) {
        throw new Error(
          `Au moins ${editorialRules.minSources} source${editorialRules.minSources > 1 ? "s" : ""} ${editorialRules.minSources > 1 ? "sont" : "est"} obligatoire${editorialRules.minSources > 1 ? "s" : ""} pour publier un article de type "${finalArticle.articleType}"`
        );
      }
      
      // Vérifier la longueur de l'article
      const contentLength = finalArticle.content?.length || 0;
      if (contentLength < editorialRules.minLength) {
        throw new Error(
          `L'article doit contenir au moins ${editorialRules.minLength} caractères (actuellement ${contentLength})`
        );
      }
      if (contentLength > editorialRules.maxLength) {
        throw new Error(
          `L'article ne peut pas dépasser ${editorialRules.maxLength} caractères (actuellement ${contentLength})`
        );
      }
      
      // Vérifier le nombre de tags
      if ((finalArticle.tags || []).length > editorialRules.maxTags) {
        throw new Error(
          `Un article ne peut pas avoir plus de ${editorialRules.maxTags} tags`
        );
      }
      
      // Vérifier que le contenu n'est pas vide
      try {
        const contentObj = JSON.parse(finalArticle.content || "[]");
        if (!Array.isArray(contentObj) || contentObj.length === 0) {
          throw new Error("Le développement est obligatoire pour publier un article");
        }
      } catch {
        throw new Error("Le contenu de l'article est invalide");
      }
    }

    await ctx.db.patch(args.articleId, updateData);

    // Recalculer le score de qualité
    await updateArticleQualityScore(ctx, args.articleId);

    // Mettre à jour le score de crédibilité de l'auteur si l'article vient d'être publié
    if (args.status === "published" && article.status !== "published") {
      await updateCredibilityScoreWithAction(
        ctx,
        article.authorId,
        "article_published",
        { articleId: args.articleId }
      );
    }

    return { success: true };
  },
});

/**
 * Approuve un article en attente (réservé aux éditeurs)
 */
export const approveArticle = mutation({
  args: {
    articleId: v.id("articles"),
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
      throw new Error("Seuls les éditeurs peuvent approuver des articles");
    }

    const article = await ctx.db.get(args.articleId);
    if (!article) {
      throw new Error("Article not found");
    }

    if (article.status !== "pending") {
      throw new Error("Cet article n'est pas en attente de validation");
    }

    const now = Date.now();

    // Publier l'article
    await ctx.db.patch(args.articleId, {
      status: "published",
      publishedAt: now,
      updatedAt: now,
    });

    // Mettre à jour le score de crédibilité de l'auteur
    await updateCredibilityScoreWithAction(
      ctx,
      article.authorId,
      "article_published",
      { articleId: args.articleId }
    );

    // Envoyer une notification à l'auteur
    await ctx.runMutation(internal.notifications.createNotificationInternal, {
      userId: article.authorId,
      type: "article_approved",
      title: "Article approuvé",
      message: `Votre article "${article.title}" a été approuvé et publié.`,
      link: `/articles/${article.slug}`,
      metadata: {
        articleId: args.articleId,
      },
    });

    return { success: true };
  },
});

/**
 * Rejette un article en attente (réservé aux éditeurs)
 */
export const rejectArticle = mutation({
  args: {
    articleId: v.id("articles"),
    reason: v.optional(v.string()), // Raison du rejet
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
      throw new Error("Seuls les éditeurs peuvent rejeter des articles");
    }

    const article = await ctx.db.get(args.articleId);
    if (!article) {
      throw new Error("Article not found");
    }

    if (article.status !== "pending") {
      throw new Error("Cet article n'est pas en attente de validation");
    }

    const now = Date.now();

    // Rejeter l'article
    await ctx.db.patch(args.articleId, {
      status: "rejected",
      updatedAt: now,
    });

    // Envoyer une notification à l'auteur
    await ctx.runMutation(internal.notifications.createNotificationInternal, {
      userId: article.authorId,
      type: "article_rejected",
      title: "Article rejeté",
      message: args.reason 
        ? `Votre article "${article.title}" a été rejeté. Raison : ${args.reason}`
        : `Votre article "${article.title}" a été rejeté.`,
      link: `/studio/articles/${article.slug}`,
      metadata: {
        articleId: args.articleId,
      },
    });

    return { success: true };
  },
});

/**
 * Ajoute un claim à un article
 */
export const addClaim = mutation({
  args: {
    articleId: v.id("articles"),
    claimText: v.string(),
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

    const claimId = await ctx.db.insert("articleClaims", {
      articleId: args.articleId,
      claimText: args.claimText,
      verificationStatus: "unverified",
      verificationScore: 0,
      sourcesCount: 0,
      expertVerificationsCount: 0,
      position: 0, // Position dans l'article (optionnel)
      createdAt: now,
      updatedAt: now,
    });

    // Mettre à jour le nombre total de claims de l'article
    await ctx.db.patch(args.articleId, {
      totalClaimsCount: article.totalClaimsCount + 1,
      updatedAt: now,
    });

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
    sourceUrl: v.string(),
    sourceTitle: v.optional(v.string()),
    reliabilityScore: v.optional(v.number()),
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

    const now = Date.now();

    // Récupérer le score de fiabilité par défaut depuis les règles configurables
    const defaultReliabilityScore = await getRuleValueAsNumber(ctx, "default_source_reliability_score").catch(() => 50);

    await ctx.db.insert("claimSources", {
      claimId: args.claimId,
      sourceType: args.sourceType,
      title: args.sourceTitle || "",
      url: args.sourceUrl,
      reliabilityScore: args.reliabilityScore || defaultReliabilityScore,
      addedBy: appUser._id,
      createdAt: now,
    });

    return { success: true };
  },
});
