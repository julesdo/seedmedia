import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { getCredibilityRules, getRuleValueAsNumber } from "./configurableRules.helpers";

/**
 * Calcule le score de crédibilité d'un utilisateur (0-100)
 * Basé sur :
 * - Publications approuvées
 * - Qualité des sources proposées
 * - Votes reçus sur articles
 * - Corrections proposées et approuvées
 * - Expertise déclarée + validée
 * - Comportements positifs (fact-check)
 */
export async function calculateCredibilityScore(
  ctx: any,
  userId: Id<"users">
): Promise<number> {
  const user = await ctx.db.get(userId);
  if (!user) {
    return 0;
  }

  // Récupérer les règles de crédibilité depuis les règles configurables
  const credibilityRules = await getCredibilityRules(ctx);

  let score = 0;

  // 1. Publications approuvées
  const publishedArticles = await ctx.db
    .query("articles")
    .withIndex("authorId", (q: any) => q.eq("authorId", userId))
    .filter((q: any) => q.eq(q.field("status"), "published"))
    .collect();

  const highQualityArticles = publishedArticles.filter(
    (a: any) => a.qualityScore >= credibilityRules.highQualityThreshold
  ).length;
  const pointsPerArticle = credibilityRules.publicationWeight / credibilityRules.articlesPerPoints;
  score += Math.min(highQualityArticles * pointsPerArticle, credibilityRules.publicationWeight);

  // 2. Qualité des sources proposées
  let highQualitySources = 0;
  try {
    const claimSources = await ctx.db
      .query("claimSources")
      .collect();

    const userSources = claimSources.filter((s: any) => s.addedBy === userId);
    highQualitySources = userSources.filter((s: any) => (s.reliabilityScore || 0) >= credibilityRules.highQualityThreshold).length;
  } catch {
    highQualitySources = 0;
  }
  const pointsPerSource = credibilityRules.sourcesWeight / credibilityRules.sourcesPerPoints;
  score += Math.min(highQualitySources * pointsPerSource, credibilityRules.sourcesWeight);

  // 3. Votes reçus sur articles
  const allArticleVotes = await ctx.db
    .query("articleVotes")
    .collect();

  const userArticlesIds = publishedArticles.map((a: any) => a._id);
  const votesOnUserArticles = allArticleVotes.filter(
    (v: any) => userArticlesIds.includes(v.articleId)
  );
  const positiveVotes = votesOnUserArticles.filter(
    (v: any) => v.voteType === "solide"
  ).length;
  score += Math.min(positiveVotes, credibilityRules.votesWeight);

  // 4. Corrections proposées et approuvées
  const allCorrections = await ctx.db
    .query("articleCorrections")
    .collect();

  const userCorrections = allCorrections.filter((c: any) => c.proposerId === userId);
  const approvedCorrections = userCorrections.filter(
    (c: any) => c.status === "approved"
  ).length;
  const pointsPerCorrection = credibilityRules.correctionsWeight / credibilityRules.correctionsPerPoints;
  score += Math.min(approvedCorrections * pointsPerCorrection, credibilityRules.correctionsWeight);

  // 5. Expertise déclarée + validée
  if (user.role === "editeur") {
    score += credibilityRules.expertiseWeight;
  } else if (user.role === "contributeur") {
    score += credibilityRules.expertiseWeight / 2;
  }
  
  const expertiseBonus = Math.min((user.expertiseDomains?.length || 0) * credibilityRules.expertiseDomainBonus, credibilityRules.expertiseWeight / 2);
  score += expertiseBonus;

  // 6. Comportements positifs (fact-check, vérifications)
  let expertVerifications = 0;
  let totalVerifications = 0;
  try {
    const allClaimVerifications = await ctx.db
      .query("claimVerifications")
      .collect();

    const userVerifications = allClaimVerifications.filter(
      (v: any) => v.verifierId === userId
    );
    totalVerifications = userVerifications.length;
    expertVerifications = userVerifications.filter((v: any) => v.isExpert).length;
  } catch {
    expertVerifications = 0;
    totalVerifications = 0;
  }
  score += Math.min(
    expertVerifications * credibilityRules.expertVerificationPoints + 
    totalVerifications * credibilityRules.regularVerificationPoints, 
    credibilityRules.behaviorWeight
  );

  return Math.min(Math.round(score), 100); // Score final entre 0 et 100
}

/**
 * Fonction helper pour mettre à jour le score de crédibilité (utilisable dans mutations)
 * @internal - Utilisée en interne, utiliser updateCredibilityScoreWithAction pour les appels externes
 */
async function updateCredibilityScoreHelper(
  ctx: any,
  userId: Id<"users">,
  actionType?: "article_published" | "source_added" | "vote_received" | "correction_approved" | "expertise_granted" | "verification_done" | "mission_completed" | "recalculation",
  actionDetails?: {
    articleId?: Id<"articles">;
    sourceId?: string;
    voteId?: string;
    correctionId?: Id<"articleCorrections">;
    verificationId?: string;
    missionId?: Id<"missions">;
    reason?: string;
  }
): Promise<number> {
  // Récupérer l'ancien score
  const user = await ctx.db.get(userId);
  const previousScore = user?.credibilityScore || 0;

  // Calculer le nouveau score
  const newScore = await calculateCredibilityScore(ctx, userId);
  const pointsGained = newScore - previousScore;

  // Mettre à jour le score de l'utilisateur
  await ctx.db.patch(userId, {
    credibilityScore: newScore,
    updatedAt: Date.now(),
  });

  // Enregistrer dans l'historique si le score a changé et qu'une action est spécifiée
  if (pointsGained !== 0 && actionType) {
    await ctx.db.insert("credibilityHistory", {
      userId,
      previousScore,
      newScore,
      pointsGained,
      actionType,
      actionDetails: actionDetails || undefined,
      createdAt: Date.now(),
    });
  }

  // Vérifier si le niveau doit être mis à jour (basé sur le score de crédibilité)
  if (pointsGained !== 0) {
    try {
      await ctx.runMutation(internal.missions.checkLevelUp, {
        userId,
      });
    } catch (error) {
      // Ignorer les erreurs de checkLevelUp (peut ne pas exister ou échouer)
      console.error("Erreur vérification montée de niveau:", error);
    }
  }

  return newScore;
}

/**
 * Fonction helper exportée pour mettre à jour le score avec une action spécifique
 * À utiliser depuis d'autres fichiers Convex
 */
export async function updateCredibilityScoreWithAction(
  ctx: any,
  userId: Id<"users">,
  actionType: "article_published" | "source_added" | "vote_received" | "correction_approved" | "expertise_granted" | "verification_done" | "mission_completed" | "recalculation",
  actionDetails?: {
    articleId?: Id<"articles">;
    sourceId?: string;
    voteId?: string;
    correctionId?: Id<"articleCorrections">;
    verificationId?: string;
    missionId?: Id<"missions">;
    reason?: string;
  }
): Promise<number> {
  return updateCredibilityScoreHelper(ctx, userId, actionType, actionDetails);
}

/**
 * Met à jour le score de crédibilité d'un utilisateur (mutation interne)
 * Peut être appelée depuis d'autres mutations via ctx.runMutation
 */
export const updateUserCredibilityScoreInternal = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const newScore = await updateCredibilityScoreHelper(ctx, args.userId);
    return { credibilityScore: newScore };
  },
});

/**
 * Met à jour le score de crédibilité d'un utilisateur (mutation publique)
 * Pour les appels depuis le client
 */
export const updateUserCredibilityScore = mutation({
  args: {
    userId: v.id("users"),
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

    // Seuls les éditeurs ou l'utilisateur lui-même peuvent mettre à jour le score
    if (appUser.role !== "editeur" && appUser._id !== args.userId) {
      throw new Error("Unauthorized");
    }

    const newScore = await updateCredibilityScoreHelper(ctx, args.userId);
    return { credibilityScore: newScore };
  },
});

/**
 * Récupère le score de crédibilité d'un utilisateur (avec calcul si nécessaire)
 */
export const getUserCredibilityScore = query({
  args: {
    userId: v.id("users"),
    recalculate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Si recalcul demandé ou score manquant, calculer
    if (args.recalculate || user.credibilityScore === undefined) {
      const newScore = await calculateCredibilityScore(ctx, args.userId);
      // Note: On ne peut pas faire de mutation dans une query, donc on retourne juste le score calculé
      return {
        userId: user._id,
        credibilityScore: newScore,
        role: user.role,
        expertiseDomains: user.expertiseDomains || [],
      };
    }

    return {
      userId: user._id,
      credibilityScore: user.credibilityScore || 0,
      role: user.role,
      expertiseDomains: user.expertiseDomains || [],
    };
  },
});

/**
 * Récupère la décomposition détaillée du score de crédibilité d'un utilisateur
 */
export const getCredibilityBreakdown = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Récupérer les règles de crédibilité
    const credibilityRules = await getCredibilityRules(ctx);

    // 1. Publications approuvées
    const publishedArticles = await ctx.db
      .query("articles")
      .withIndex("authorId", (q: any) => q.eq("authorId", args.userId))
      .filter((q: any) => q.eq(q.field("status"), "published"))
      .collect();

    const highQualityArticles = publishedArticles.filter(
      (a: any) => a.qualityScore >= credibilityRules.highQualityThreshold
    ).length;
    const pointsPerArticle = credibilityRules.publicationWeight / credibilityRules.articlesPerPoints;
    const publicationsPoints = Math.min(highQualityArticles * pointsPerArticle, credibilityRules.publicationWeight);

    // 2. Qualité des sources proposées
    let highQualitySources = 0;
    try {
      const claimSources = await ctx.db
        .query("claimSources")
        .collect();
      const userSources = claimSources.filter((s: any) => s.addedBy === args.userId);
      highQualitySources = userSources.filter((s: any) => (s.reliabilityScore || 0) >= credibilityRules.highQualityThreshold).length;
    } catch {
      highQualitySources = 0;
    }
    const pointsPerSource = credibilityRules.sourcesWeight / credibilityRules.sourcesPerPoints;
    const sourcesPoints = Math.min(highQualitySources * pointsPerSource, credibilityRules.sourcesWeight);

    // 3. Votes reçus sur articles
    const allArticleVotes = await ctx.db
      .query("articleVotes")
      .collect();
    const userArticlesIds = publishedArticles.map((a: any) => a._id);
    const votesOnUserArticles = allArticleVotes.filter(
      (v: any) => userArticlesIds.includes(v.articleId)
    );
    const positiveVotes = votesOnUserArticles.filter(
      (v: any) => v.voteType === "solide"
    ).length;
    const votesPoints = Math.min(positiveVotes, credibilityRules.votesWeight);

    // 4. Corrections proposées et approuvées
    const allCorrections = await ctx.db
      .query("articleCorrections")
      .collect();
    const userCorrections = allCorrections.filter((c: any) => c.proposerId === args.userId);
    const approvedCorrections = userCorrections.filter(
      (c: any) => c.status === "approved"
    ).length;
    const pointsPerCorrection = credibilityRules.correctionsWeight / credibilityRules.correctionsPerPoints;
    const correctionsPoints = Math.min(approvedCorrections * pointsPerCorrection, credibilityRules.correctionsWeight);

    // 5. Expertise déclarée + validée
    let expertisePoints = 0;
    if (user.role === "editeur") {
      expertisePoints += credibilityRules.expertiseWeight;
    } else if (user.role === "contributeur") {
      expertisePoints += credibilityRules.expertiseWeight / 2;
    }
    const expertiseBonus = Math.min((user.expertiseDomains?.length || 0) * credibilityRules.expertiseDomainBonus, credibilityRules.expertiseWeight / 2);
    expertisePoints += expertiseBonus;

    // 6. Comportements positifs (fact-check, vérifications)
    let expertVerifications = 0;
    let totalVerifications = 0;
    try {
      const allClaimVerifications = await ctx.db
        .query("claimVerifications")
        .collect();
      const userVerifications = allClaimVerifications.filter(
        (v: any) => v.verifierId === args.userId
      );
      totalVerifications = userVerifications.length;
      expertVerifications = userVerifications.filter((v: any) => v.isExpert).length;
    } catch {
      expertVerifications = 0;
      totalVerifications = 0;
    }
    const behaviorPoints = Math.min(
      expertVerifications * credibilityRules.expertVerificationPoints + 
      totalVerifications * credibilityRules.regularVerificationPoints, 
      credibilityRules.behaviorWeight
    );

    const totalScore = Math.min(
      Math.round(publicationsPoints + sourcesPoints + votesPoints + correctionsPoints + expertisePoints + behaviorPoints),
      100
    );

    return {
      totalScore,
      breakdown: {
        publications: {
          points: Math.round(publicationsPoints),
          maxPoints: credibilityRules.publicationWeight,
          count: highQualityArticles,
          label: "Articles de qualité publiés",
        },
        sources: {
          points: Math.round(sourcesPoints),
          maxPoints: credibilityRules.sourcesWeight,
          count: highQualitySources,
          label: "Sources de qualité proposées",
        },
        votes: {
          points: Math.round(votesPoints),
          maxPoints: credibilityRules.votesWeight,
          count: positiveVotes,
          label: "Votes positifs reçus",
        },
        corrections: {
          points: Math.round(correctionsPoints),
          maxPoints: credibilityRules.correctionsWeight,
          count: approvedCorrections,
          label: "Corrections approuvées",
        },
        expertise: {
          points: Math.round(expertisePoints),
          maxPoints: credibilityRules.expertiseWeight,
          role: user.role,
          domainsCount: user.expertiseDomains?.length || 0,
          label: "Expertise et rôle",
        },
        behavior: {
          points: Math.round(behaviorPoints),
          maxPoints: credibilityRules.behaviorWeight,
          expertVerifications,
          totalVerifications,
          label: "Vérifications et fact-check",
        },
      },
    };
  },
});

/**
 * Récupère l'historique des gains de crédibilité d'un utilisateur
 */
export const getCredibilityHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Vérifier que l'utilisateur existe
    const user = await ctx.db.get(args.userId);
    if (!user) {
      // Retourner un tableau vide si l'utilisateur n'existe pas
      return [];
    }

    const limit = args.limit || 50;

    try {
      // Essayer d'abord avec l'index userId_createdAt
      let history;
      try {
        history = await ctx.db
          .query("credibilityHistory")
          .withIndex("userId_createdAt", (q: any) => q.eq("userId", args.userId))
          .order("desc")
          .take(limit);
      } catch (indexError) {
        // Si l'index n'existe pas encore, utiliser l'index userId comme fallback
        try {
          const allHistory = await ctx.db
            .query("credibilityHistory")
            .withIndex("userId", (q: any) => q.eq("userId", args.userId))
            .collect();
          
          // Trier manuellement par createdAt et prendre les N premiers
          history = allHistory
            .sort((a: any, b: any) => b.createdAt - a.createdAt)
            .slice(0, limit);
        } catch (fallbackError) {
          // Si même le fallback échoue, retourner un tableau vide
          console.error("Error fetching credibility history (fallback):", fallbackError);
          return [];
        }
      }

      return history.map((entry: any) => ({
        _id: entry._id,
        previousScore: entry.previousScore,
        newScore: entry.newScore,
        pointsGained: entry.pointsGained,
        actionType: entry.actionType,
        actionDetails: entry.actionDetails || {},
        createdAt: entry.createdAt,
      }));
    } catch (error) {
      // Si tout échoue, retourner un tableau vide
      console.error("Error fetching credibility history:", error);
      return [];
    }
  },
});

/**
 * Récupère les points estimés pour chaque action de crédibilité
 * Utilisé pour afficher les gains potentiels dans l'UI
 */
export const getCredibilityPoints = query({
  args: {},
  handler: async (ctx) => {
    const credibilityRules = await getCredibilityRules(ctx);

    // Calculer les points par action
    const pointsPerArticle = credibilityRules.publicationWeight / credibilityRules.articlesPerPoints;
    const pointsPerSource = credibilityRules.sourcesWeight / credibilityRules.sourcesPerPoints;
    const pointsPerCorrection = credibilityRules.correctionsWeight / credibilityRules.correctionsPerPoints;

    const pointsPerMission = await getRuleValueAsNumber(ctx, "credibility_mission_completed_points").catch(() => 2);

    return {
      articlePublished: Math.round(pointsPerArticle * 10) / 10, // Arrondir à 1 décimale
      sourceAdded: Math.round(pointsPerSource * 10) / 10,
      correctionApproved: Math.round(pointsPerCorrection * 10) / 10,
      voteReceived: 1, // 1 point par vote positif (jusqu'à max)
      verificationDone: Math.round(credibilityRules.regularVerificationPoints * 10) / 10,
      expertVerificationDone: Math.round(credibilityRules.expertVerificationPoints * 10) / 10,
      missionCompleted: pointsPerMission,
    };
  },
});

/**
 * Récupère le top des experts (utilisateurs avec score de crédibilité élevé)
 */
export const getTopExperts = query({
  args: {
    limit: v.optional(v.number()),
    domain: v.optional(v.string()), // Filtrer par domaine d'expertise
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Récupérer tous les utilisateurs
    const allUsers = await ctx.db
      .query("users")
      .collect();

    // Filtrer par rôle éditeur/contributeur et domaine si spécifié
    let experts = allUsers.filter(
      (u) =>
        (u.role === "editeur" || u.role === "contributeur") &&
        (u.credibilityScore || 0) > 0 &&
        (!args.domain || (u.expertiseDomains || []).includes(args.domain))
    );

    // Trier par score de crédibilité
    experts.sort((a, b) => (b.credibilityScore || 0) - (a.credibilityScore || 0));

    // Enrichir avec les statistiques
    const expertsWithStats = await Promise.all(
      experts.slice(0, limit).map(async (expert) => {
        // Compter les articles publiés
        const publishedArticles = await ctx.db
          .query("articles")
          .withIndex("authorId", (q) => q.eq("authorId", expert._id))
          .filter((q) => q.eq(q.field("status"), "published"))
          .collect();

        // Déterminer le domaine principal
        const mainDomain =
          expert.expertiseDomains && expert.expertiseDomains.length > 0
            ? expert.expertiseDomains[0]
            : "Général";

        return {
          _id: expert._id,
          email: expert.email,
          name: expert.name || expert.email.split("@")[0] || "Expert",
          image: expert.image,
          credibilityScore: expert.credibilityScore || 0,
          role: expert.role,
          domain: mainDomain,
          articlesCount: publishedArticles.length,
        };
      })
    );

    return expertsWithStats;
  },
});

