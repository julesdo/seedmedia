import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Récupère les types d'articles avec le nombre d'articles et le dernier article de chaque type
 */
export const getArticleTypes = query({
  args: {},
  handler: async (ctx) => {
    const articleTypes = [
      { value: "scientific", label: "Scientifique", icon: "atom-bold" },
      { value: "expert", label: "Expert", icon: "user-id-bold" },
      { value: "opinion", label: "Opinion", icon: "chat-round-bold" },
      { value: "news", label: "Actualité", icon: "newspaper-bold" },
      { value: "tutorial", label: "Tutoriel", icon: "book-bold" },
      { value: "other", label: "Autre", icon: "document-text-bold" },
    ];

    // Récupérer tous les articles publiés
    const articles = await ctx.db
      .query("articles")
      .withIndex("publishedAt", (q) => q.gte("publishedAt", 0))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Pour chaque type, compter les articles et trouver le dernier
    const typesWithContent = await Promise.all(
      articleTypes.map(async (type) => {
        const articlesWithType = articles.filter((article) => article.articleType === type.value);
        const articleCount = articlesWithType.length;

        let latestArticle = null;
        if (articleCount > 0) {
          // Trier par date de publication (plus récent en premier)
          articlesWithType.sort((a, b) => {
            const dateA = a.publishedAt || a.createdAt;
            const dateB = b.publishedAt || b.createdAt;
            return dateB - dateA;
          });

          // Prendre le dernier article
          const latest = articlesWithType[0];
          const author = await ctx.db.get(latest.authorId);

          latestArticle = {
            _id: latest._id,
            title: latest.title,
            slug: latest.slug,
            coverImage: latest.coverImage,
            summary: latest.summary,
            publishedAt: latest.publishedAt || latest.createdAt,
            author: author
              ? {
                  name: author.name || author.email?.split("@")[0] || "Auteur",
                  image: author.image || null,
                }
              : null,
          };
        }

        return {
          type: {
            value: type.value,
            label: type.label,
            icon: type.icon,
          },
          articleCount,
          latestArticle,
        };
      })
    );

    // Trier par nombre d'articles décroissant
    return typesWithContent.sort((a, b) => b.articleCount - a.articleCount);
  },
});

/**
 * Récupère les types d'actions avec le nombre d'actions et la dernière action de chaque type
 */
export const getActionTypes = query({
  args: {},
  handler: async (ctx) => {
    const actionTypes = [
      { value: "petition", label: "Pétition", icon: "document-text-bold" },
      { value: "contribution", label: "Contribution", icon: "hand-stars-bold" },
      { value: "event", label: "Événement", icon: "calendar-bold" },
    ];

    const actions = await ctx.db
      .query("actions")
      .withIndex("status", (q) => q.eq("status", "active"))
      .collect();

    // Pour chaque type, compter les actions et trouver la dernière
    const typesWithContent = await Promise.all(
      actionTypes.map(async (type) => {
        const actionsWithType = actions.filter((action) => action.type === type.value);
        const actionCount = actionsWithType.length;

        let latestAction = null;
        if (actionCount > 0) {
          actionsWithType.sort((a, b) => b.createdAt - a.createdAt);
          const latest = actionsWithType[0];
          const author = await ctx.db.get(latest.authorId);

          latestAction = {
            _id: latest._id,
            title: latest.title,
            slug: latest.slug,
            summary: latest.summary,
            createdAt: latest.createdAt,
            author: author
              ? {
                  name: author.name || author.email?.split("@")[0] || "Auteur",
                  image: author.image || null,
                }
              : null,
          };
        }

        return {
          type: {
            value: type.value,
            label: type.label,
            icon: type.icon,
          },
          actionCount,
          latestAction,
        };
      })
    );

    // Trier par nombre d'actions décroissant
    return typesWithContent.sort((a, b) => b.actionCount - a.actionCount);
  },
});

/**
 * Récupère les stages de projets avec le nombre de projets et le dernier projet de chaque stage
 */
export const getProjectStages = query({
  args: {},
  handler: async (ctx) => {
    const projectStages = [
      { value: "idea", label: "Idée", icon: "lightbulb-bold" },
      { value: "prototype", label: "Prototype", icon: "flask-bold" },
      { value: "beta", label: "Bêta", icon: "test-tube-bold" },
      { value: "production", label: "Production", icon: "rocket-2-bold" },
    ];

    const projects = await ctx.db.query("projects").collect();

    // Pour chaque stage, compter les projets et trouver le dernier
    const stagesWithContent = await Promise.all(
      projectStages.map(async (stage) => {
        const projectsWithStage = projects.filter((project) => project.stage === stage.value);
        const projectCount = projectsWithStage.length;

        let latestProject = null;
        if (projectCount > 0) {
          projectsWithStage.sort((a, b) => b.createdAt - a.createdAt);
          const latest = projectsWithStage[0];
          const author = await ctx.db.get(latest.authorId);

          latestProject = {
            _id: latest._id,
            title: latest.title,
            slug: latest.slug,
            summary: latest.summary,
            images: latest.images,
            createdAt: latest.createdAt,
            author: author
              ? {
                  name: author.name || author.email?.split("@")[0] || "Auteur",
                  image: author.image || null,
                }
              : null,
          };
        }

        return {
          stage: {
            value: stage.value,
            label: stage.label,
            icon: stage.icon,
          },
          projectCount,
          latestProject,
        };
      })
    );

    // Trier par nombre de projets décroissant
    return stagesWithContent.sort((a, b) => b.projectCount - a.projectCount);
  },
});

