import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Récupère les statistiques globales de la plateforme
 */
export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    // Compter tous les utilisateurs
    const allUsers = await ctx.db.query("users").collect();
    const totalUsers = allUsers.length;

    // Compter les utilisateurs par rôle
    const usersByRole = {
      explorateur: allUsers.filter((u) => u.role === "explorateur").length,
      contributeur: allUsers.filter((u) => u.role === "contributeur").length,
      editeur: allUsers.filter((u) => u.role === "editeur").length,
    };

    // Compter les articles
    const allArticles = await ctx.db.query("articles").collect();
    const publishedArticles = allArticles.filter((a) => a.status === "published");
    const pendingArticles = allArticles.filter((a) => a.status === "pending");
    const rejectedArticles = allArticles.filter((a) => a.status === "rejected");

    // Compter les votes sur les articles
    const articleVotes = await ctx.db.query("articleVotes").collect();
    const positiveVotes = articleVotes.filter((v) => v.voteType === "solide").length;
    const negativeVotes = articleVotes.filter((v) => v.voteType === "biaise" || v.voteType === "non_etaye").length;

    // Compter les corrections
    const corrections = await ctx.db.query("articleCorrections").collect();
    const approvedCorrections = corrections.filter((c) => c.status === "approved").length;
    const pendingCorrections = corrections.filter((c) => c.status === "pending").length;
    const rejectedCorrections = corrections.filter((c) => c.status === "rejected").length;

    // Compter les propositions de gouvernance
    const governanceProposals = await ctx.db.query("governanceProposals").collect();
    const openProposals = governanceProposals.filter((p) => p.status === "open").length;
    const closedProposals = governanceProposals.filter((p) => p.status === "closed").length;
    const approvedProposals = governanceProposals.filter((p) => p.result === "approved").length;
    const rejectedProposals = governanceProposals.filter((p) => p.result === "rejected").length;

    // Compter les actions
    const allActions = await ctx.db.query("actions").collect();
    const activeActions = allActions.filter((a) => a.status === "active").length;
    const completedActions = allActions.filter((a) => a.status === "completed").length;
    const cancelledActions = allActions.filter((a) => a.status === "cancelled").length;

    // Compter les projets
    const projects = await ctx.db.query("projects").collect();

    // Compter les organisations
    const organizations = await ctx.db.query("organizations").collect();
    const verifiedOrgs = organizations.filter((o) => o.verified).length;

    // Compter les débats
    const allDebates = await ctx.db.query("debates").collect();
    const openDebates = allDebates.filter((d) => d.status === "open").length;
    const closedDebates = allDebates.filter((d) => d.status === "closed").length;

    // Compter les commentaires
    const comments = await ctx.db.query("comments").collect();

    // Compter les follows
    const follows = await ctx.db.query("follows").collect();
    const userFollows = follows.filter((f) => f.targetType === "user").length;
    const orgFollows = follows.filter((f) => f.targetType === "organization").length;
    const tagFollows = follows.filter((f) => f.targetType === "tag").length;

    // Compter les favoris
    const favorites = await ctx.db.query("favorites").collect();

    // Compter les utilisateurs actifs (avec au moins 1 article publié)
    const activeUsers = new Set(publishedArticles.map((a) => a.authorId));

    // Statistiques de crédibilité moyenne
    const usersWithCredibility = allUsers.filter((u) => u.credibilityScore !== undefined);
    const avgCredibility =
      usersWithCredibility.length > 0
        ? usersWithCredibility.reduce((sum, u) => sum + (u.credibilityScore || 0), 0) /
          usersWithCredibility.length
        : 0;

    // Statistiques par période (30 derniers jours)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentArticles = publishedArticles.filter((a) => a.createdAt >= thirtyDaysAgo).length;
    const recentUsers = allUsers.filter((u) => u.createdAt >= thirtyDaysAgo).length;
    const recentComments = comments.filter((c) => c.createdAt >= thirtyDaysAgo).length;

    return {
      // Utilisateurs
      totalUsers,
      activeUsersCount: activeUsers.size,
      usersByRole,
      avgCredibility: Math.round(avgCredibility * 100) / 100,

      // Articles
      articlesCount: publishedArticles.length,
      pendingArticlesCount: pendingArticles.length,
      rejectedArticlesCount: rejectedArticles.length,
      recentArticles,

      // Votes
      votesCount: articleVotes.length,
      positiveVotes,
      negativeVotes,

      // Corrections
      correctionsCount: corrections.length,
      approvedCorrections,
      pendingCorrections,
      rejectedCorrections,

      // Gouvernance
      proposalsCount: governanceProposals.length,
      openProposals,
      closedProposals,
      approvedProposals,
      rejectedProposals,

      // Actions
      activeActionsCount: activeActions,
      completedActionsCount: completedActions,
      cancelledActionsCount: cancelledActions,
      totalActionsCount: allActions.length,

      // Projets
      projectsCount: projects.length,

      // Organisations
      organizationsCount: organizations.length,
      verifiedOrgsCount: verifiedOrgs,

      // Débats
      openDebatesCount: openDebates,
      closedDebatesCount: closedDebates,
      totalDebatesCount: allDebates.length,

      // Commentaires
      commentsCount: comments.length,
      recentComments,

      // Follows
      followsCount: follows.length,
      userFollows,
      orgFollows,
      tagFollows,

      // Favoris
      favoritesCount: favorites.length,

      // Croissance
      recentUsers,
    };
  },
});

