import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import {
  getAllSources,
  getSourcesByLanguage,
  getSourcesByReliability,
} from "./newsSources";
import { updateBotActivity } from "./helpers";

/**
 * Agrège les actualités pour une Decision Card
 * Utilise plusieurs sources gratuites et diversifiées
 */
export const aggregateNewsForDecision = action({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const decision = await ctx.runQuery(api.decisions.getDecisionById, {
      decisionId: args.decisionId,
    });

    if (!decision) {
      throw new Error("Decision not found");
    }

    // Construire les mots-clés de recherche
    const keywords = [
      decision.decider,
      decision.title,
      ...decision.impactedDomains,
    ]
      .filter(Boolean)
      .join(" ");

    const newsItems: Array<{
      title: string;
      url: string;
      source: string;
      publishedAt: number;
      summary?: string;
      imageUrl?: string;
      relevanceScore: number;
    }> = [];

    // 1. Google News RSS (gratuit, pas d'API key)
    try {
      const googleNewsRss = `https://news.google.com/rss/search?q=${encodeURIComponent(
        keywords
      )}&hl=fr&gl=FR&ceid=FR:fr`;
      const rssItems = await fetchRSSFeed(googleNewsRss);
      newsItems.push(
        ...rssItems.map((item) => ({
          ...item,
          source: "Google News",
          relevanceScore: calculateRelevanceScore(item, decision),
        }))
      );
    } catch (error) {
      console.error("Error fetching Google News RSS:", error);
    }

    // 2. RSS feeds de médias internationaux (gratuits, pas d'API key)
    // Privilégier les sources fiables (high reliability) et éviter les sources partisanes
    const highReliabilitySources = getSourcesByReliability("high");
    const mediumReliabilitySources = getSourcesByReliability("medium");

    // Prioriser les sources haute fiabilité, puis moyenne
    // Limiter à 100 sources pour éviter les timeouts
    const sourcesToCheck = [
      ...highReliabilitySources.slice(0, 70), // 70 sources haute fiabilité
      ...mediumReliabilitySources.slice(0, 30), // 30 sources moyenne fiabilité
    ];

    for (const source of sourcesToCheck) {
      try {
        const items = await fetchRSSFeed(source.url);
        // Filtrer par pertinence avec les mots-clés
        const relevantItems = items
          .filter((item) =>
            keywords
              .toLowerCase()
              .split(" ")
              .some((keyword) =>
                item.title.toLowerCase().includes(keyword.toLowerCase())
              )
          )
          .map((item) => ({
            ...item,
            source: source.source,
            relevanceScore: calculateRelevanceScore(item, decision),
          }));
        newsItems.push(...relevantItems);
      } catch (error) {
        console.error(`Error fetching RSS feed ${source.source}:`, error);
        // Continuer avec les autres sources même en cas d'erreur
      }
    }

    // Dédupliquer par URL
    const uniqueNews = Array.from(
      new Map(newsItems.map((item) => [item.url, item])).values()
    );

    // Trier par score de pertinence
    uniqueNews.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Garder les 20 plus pertinents
    const topNews = uniqueNews.slice(0, 20);

    // Sauvegarder dans la base de données et récupérer les métadonnées (images)
    const savedNews: Id<"newsItems">[] = [];
    for (const news of topNews) {
      // Vérifier si l'actualité existe déjà
      const existing = await ctx.runQuery(api.news.getNewsByUrl, {
        url: news.url,
        decisionId: args.decisionId,
      });

      if (!existing) {
        // Récupérer les métadonnées (image de couverture) si pas déjà présente
        let imageUrl = news.imageUrl;
        if (!imageUrl) {
          try {
            const metadata = await ctx.runAction(api.bots.fetchMetadata.fetchUrlMetadata, {
              url: news.url,
            });
            if (metadata?.image) {
              imageUrl = metadata.image;
              console.log(`✅ Image récupérée pour ${news.title.substring(0, 50)}...`);
            }
          } catch (error) {
            console.error(`Error fetching metadata for ${news.url}:`, error);
            // Continuer même si la récupération des métadonnées échoue
          }
        }

        const newsId = await ctx.runMutation(api.news.createNewsItem, {
          decisionId: args.decisionId,
          title: news.title,
          url: news.url,
          source: news.source,
          publishedAt: news.publishedAt,
          summary: news.summary,
          imageUrl: imageUrl,
          relevanceScore: news.relevanceScore,
        });
        savedNews.push(newsId);
      } else if (!existing.imageUrl) {
        // Si l'actualité existe mais n'a pas d'image, essayer de la récupérer
        try {
          const metadata = await ctx.runAction(api.bots.fetchMetadata.fetchUrlMetadata, {
            url: news.url,
          });
          if (metadata?.image) {
            // Mettre à jour l'actualité existante avec l'image
            await ctx.runMutation(api.news.updateNewsItem, {
              newsId: existing._id,
              imageUrl: metadata.image,
            });
            console.log(`✅ Image mise à jour pour ${news.title.substring(0, 50)}...`);
          }
        } catch (error) {
          console.error(`Error fetching metadata for existing news ${news.url}:`, error);
        }
      }
    }

    // Mettre à jour les stats du bot Agrégateur
    await updateBotActivity(ctx, {
      botSlug: "agregateur",
      newsAggregated: savedNews.length,
      logMessage: `${savedNews.length} actualités agrégées pour la décision ${args.decisionId}`,
      logLevel: savedNews.length > 0 ? "success" : "info",
      functionName: "aggregateNewsForDecision",
    });

    return {
      aggregated: topNews.length,
      saved: savedNews.length,
    };
  },
});

/**
 * Récupère un flux RSS et le parse
 */
async function fetchRSSFeed(
  url: string
): Promise<
  Array<{
    title: string;
    url: string;
    publishedAt: number;
    summary?: string;
  }>
> {
  try {
    const response = await fetch(url);
    const xml = await response.text();

    // Parser RSS simple (pour Google News et autres RSS standards)
    const items: Array<{
      title: string;
      url: string;
      publishedAt: number;
      summary?: string;
    }> = [];

    // Extraire les items du RSS
    const itemMatches = xml.matchAll(
      /<item[^>]*>([\s\S]*?)<\/item>/gi
    );

    for (const match of itemMatches) {
      const itemXml = match[1];

      const titleMatch = itemXml.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i) ||
        itemXml.match(/<title[^>]*>(.*?)<\/title>/i);
      const linkMatch = itemXml.match(/<link[^>]*>(.*?)<\/link>/i);
      const pubDateMatch = itemXml.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i);
      const descriptionMatch =
        itemXml.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>/i) ||
        itemXml.match(/<description[^>]*>(.*?)<\/description>/i);

      if (titleMatch && linkMatch) {
        const title = titleMatch[1].trim();
        let url = linkMatch[1].trim();

        // Google News URLs sont des redirects, on les garde tels quels
        if (url.startsWith("https://news.google.com")) {
          // Extraire l'URL réelle depuis le paramètre url
          const urlMatch = url.match(/url=([^&]+)/);
          if (urlMatch) {
            url = decodeURIComponent(urlMatch[1]);
          }
        }

        let publishedAt = Date.now();
        if (pubDateMatch) {
          const dateStr = pubDateMatch[1].trim();
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            publishedAt = date.getTime();
          }
        }

        const summary = descriptionMatch
          ? descriptionMatch[1].trim().replace(/<[^>]+>/g, "")
          : undefined;

        items.push({
          title,
          url,
          publishedAt,
          summary,
        });
      }
    }

    return items;
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error);
    return [];
  }
}

/**
 * Calcule un score de pertinence entre une actualité et une décision
 */
function calculateRelevanceScore(
  news: {
    title: string;
    summary?: string;
  },
  decision: {
    title: string;
    decider: string;
    impactedDomains: string[];
  }
): number {
  let score = 0;
  const newsText = `${news.title} ${news.summary || ""}`.toLowerCase();

  // Score basé sur le titre de la décision
  const titleWords = decision.title.toLowerCase().split(/\s+/);
  titleWords.forEach((word) => {
    if (word.length > 3 && newsText.includes(word)) {
      score += 10;
    }
  });

  // Score basé sur le décideur
  if (newsText.includes(decision.decider.toLowerCase())) {
    score += 20;
  }

  // Score basé sur les domaines impactés
  decision.impactedDomains.forEach((domain) => {
    if (newsText.includes(domain.toLowerCase())) {
      score += 5;
    }
  });

  // Limiter à 100
  return Math.min(score, 100);
}

/**
 * Agrège les actualités pour toutes les Decision Cards actives
 * Utilise des sources internationales variées
 */
export const aggregateNewsForAllDecisions = action({
  args: {},
  handler: async (ctx): Promise<{
    processed: number;
    results: Array<{
      decisionId: Id<"decisions">;
      aggregated: number;
      saved: number;
    }>;
  }> => {
    // Récupérer toutes les décisions en cours de suivi
    const decisions = await ctx.runQuery(api.decisions.getDecisions, {
      limit: 100,
      status: "tracking",
    });

    const results: Array<{
      decisionId: Id<"decisions">;
      aggregated: number;
      saved: number;
    }> = [];

    for (const decision of decisions) {
      try {
        const result = await ctx.runAction(
          api.bots.aggregateNews.aggregateNewsForDecision,
          {
            decisionId: decision._id,
          }
        );
        results.push({
          decisionId: decision._id,
          aggregated: result.aggregated,
          saved: result.saved,
        });
      } catch (error) {
        console.error(
          `Error aggregating news for decision ${decision._id}:`,
          error
        );
      }
    }

    // Calculer le total d'actualités agrégées
    const totalSaved = results.reduce((sum, r) => sum + r.saved, 0);

    // Mettre à jour les stats du bot Agrégateur pour le batch
    if (totalSaved > 0) {
      await updateBotActivity(ctx, {
        botSlug: "agregateur",
        newsAggregated: totalSaved,
        logMessage: `${totalSaved} actualités agrégées pour ${decisions.length} décisions (batch complet)`,
        logLevel: "success",
        functionName: "aggregateNewsForAllDecisions",
      });
    }

    return {
      processed: decisions.length,
      results,
    };
  },
});

/**
 * Agrège les actualités pour les décisions récentes (moins de 24h)
 * Optimisé pour l'actualité chaude
 */
export const aggregateNewsForRecentDecisions = action({
  args: {},
  handler: async (ctx): Promise<{
    processed: number;
    results: Array<{
      decisionId: Id<"decisions">;
      aggregated: number;
      saved: number;
    }>;
  }> => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000; // 24 heures en millisecondes

    // Récupérer uniquement les décisions récentes (moins de 24h)
    const allDecisions = await ctx.runQuery(api.decisions.getDecisions, {
      limit: 100,
      status: "tracking",
    });

    // Filtrer les décisions récentes
    const recentDecisions = allDecisions.filter(
      (decision: { createdAt: number }) => decision.createdAt >= oneDayAgo
    );

    const results: Array<{
      decisionId: Id<"decisions">;
      aggregated: number;
      saved: number;
    }> = [];

    for (const decision of recentDecisions) {
      try {
        const result = await ctx.runAction(
          api.bots.aggregateNews.aggregateNewsForDecision,
          {
            decisionId: decision._id,
          }
        );
        results.push({
          decisionId: decision._id,
          aggregated: result.aggregated,
          saved: result.saved,
        });
      } catch (error) {
        console.error(
          `Error aggregating news for decision ${decision._id}:`,
          error
        );
      }
    }

    // Calculer le total d'actualités agrégées
    const totalSaved = results.reduce((sum, r) => sum + r.saved, 0);

    // Mettre à jour les stats du bot Agrégateur pour le batch récent
    if (totalSaved > 0) {
      await updateBotActivity(ctx, {
        botSlug: "agregateur",
        newsAggregated: totalSaved,
        logMessage: `${totalSaved} actualités agrégées pour ${recentDecisions.length} décisions récentes (batch)`,
        logLevel: "success",
        functionName: "aggregateNewsForRecentDecisions",
      });
    }

    return {
      processed: recentDecisions.length,
      results,
    };
  },
});

