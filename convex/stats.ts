import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Récupère les statistiques globales de la plateforme
 */
export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    // Compter les articles publiés
    const publishedArticles = await ctx.db
      .query("articles")
      .withIndex("status", (q) => q.eq("status", "published"))
      .collect();

    // Compter les votes sur les articles
    const articleVotes = await ctx.db
      .query("articleVotes")
      .collect();

    // Compter les corrections proposées
    const corrections = await ctx.db
      .query("articleCorrections")
      .collect();

    // Compter les propositions de gouvernance
    const governanceProposals = await ctx.db
      .query("governanceProposals")
      .collect();

    // Compter les actions actives
    const activeActions = await ctx.db
      .query("actions")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Compter les projets
    const projects = await ctx.db
      .query("projects")
      .collect();

    // Compter les utilisateurs actifs (avec au moins 1 article publié)
    const activeUsers = new Set(publishedArticles.map((a) => a.authorId));
    
    // Compter les débats ouverts
    const openDebates = await ctx.db
      .query("debates")
      .withIndex("status", (q) => q.eq("status", "open"))
      .collect();

    return {
      articlesCount: publishedArticles.length,
      votesCount: articleVotes.length,
      correctionsCount: corrections.length,
      proposalsCount: governanceProposals.length,
      activeActionsCount: activeActions.length,
      projectsCount: projects.length,
      activeUsersCount: activeUsers.size,
      openDebatesCount: openDebates.length,
    };
  },
});

