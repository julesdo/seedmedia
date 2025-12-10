import { MetadataRoute } from "next";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://seed.media";
  const currentDate = new Date().toISOString();

  try {
    // Récupérer tous les contenus publics
    const [articles, projects, actions, debates, dossiers] = await Promise.all([
      convex.query(api.content.getLatestArticles, { limit: 1000 }).catch(() => []),
      convex.query(api.content.getLatestProjects, { limit: 1000 }).catch(() => []),
      convex.query(api.content.getLatestActions, { limit: 1000 }).catch(() => []),
      convex.query(api.debates.getOpenDebates, { limit: 1000, sortBy: "recent" }).catch(() => []),
      convex.query(api.dossiers.getDossiers, { limit: 1000 }).catch(() => []),
    ]);

    const sitemapEntries: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${baseUrl}/articles`,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/projets`,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/actions`,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/debats`,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/dossiers`,
        lastModified: currentDate,
        changeFrequency: "weekly",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/gouvernance`,
        lastModified: currentDate,
        changeFrequency: "weekly",
        priority: 0.8,
      },
    ];

    // Ajouter les articles
    if (Array.isArray(articles)) {
      articles.forEach((article) => {
        if (article.slug && article.status === "published") {
          sitemapEntries.push({
            url: `${baseUrl}/articles/${article.slug}`,
            lastModified: article.publishedAt
              ? new Date(article.publishedAt).toISOString()
              : currentDate,
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      });
    }

    // Ajouter les projets
    if (Array.isArray(projects)) {
      projects.forEach((project) => {
        if (project.slug) {
          sitemapEntries.push({
            url: `${baseUrl}/projets/${project.slug}`,
            lastModified: project.updatedAt
              ? new Date(project.updatedAt).toISOString()
              : currentDate,
            changeFrequency: "monthly",
            priority: 0.7,
          });
        }
      });
    }

    // Ajouter les actions
    if (Array.isArray(actions)) {
      actions.forEach((action) => {
        if (action.slug && action.status === "active") {
          sitemapEntries.push({
            url: `${baseUrl}/actions/${action.slug}`,
            lastModified: action.updatedAt
              ? new Date(action.updatedAt).toISOString()
              : currentDate,
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      });
    }

    // Ajouter les débats
    if (Array.isArray(debates)) {
      debates.forEach((debat) => {
        if (debat.slug) {
          sitemapEntries.push({
            url: `${baseUrl}/debats/${debat.slug}`,
            lastModified: debat.updatedAt
              ? new Date(debat.updatedAt).toISOString()
              : currentDate,
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      });
    }

    // Ajouter les dossiers
    if (Array.isArray(dossiers)) {
      dossiers.forEach((dossier) => {
        if (dossier.slug) {
          sitemapEntries.push({
            url: `${baseUrl}/dossiers/${dossier.slug}`,
            lastModified: dossier.updatedAt
              ? new Date(dossier.updatedAt).toISOString()
              : currentDate,
            changeFrequency: "monthly",
            priority: 0.7,
          });
        }
      });
    }

    return sitemapEntries;
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Retourner au moins les pages principales en cas d'erreur
    return [
      {
        url: baseUrl,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 1,
      },
    ];
  }
}

