import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import {
  getAllSources,
  getSourcesByReliability,
} from "./newsSources";
import { updateBotActivity } from "./helpers";

/**
 * Évalue l'importance d'une décision géopolitique avec l'IA
 * Retourne un score d'importance (0-10) et un booléen indiquant si c'est une vraie décision importante
 */
async function evaluateDecisionImportance(
  title: string,
  summary: string | undefined,
  openaiKey: string | undefined
): Promise<{ isImportant: boolean; score: number; reason: string }> {
  // Si pas de clé OpenAI, utiliser un filtre basique
  if (!openaiKey) {
    // Filtre basique : vérifier si c'est une décision concrète (pas juste un article)
    const hasDecisionKeywords = [
      "décide", "annonce", "approuve", "vote", "adopte", "impose", "lève", "impose",
      "sanction", "embargo", "intervention", "accord", "traité", "rupture"
    ].some(keyword => title.toLowerCase().includes(keyword));
    
    return {
      isImportant: hasDecisionKeywords,
      score: hasDecisionKeywords ? 5 : 2,
      reason: hasDecisionKeywords ? "Contient des mots-clés de décision" : "Pas de mots-clés de décision"
    };
  }

  try {
    const prompt = `Tu es un expert en géopolitique, économie, technologie et affaires mondiales. Évalue l'importance de cette annonce pour déterminer si c'est un ÉVÉNEMENT MAJEUR à impact prédictible (positif ou négatif).

Titre: ${title}
Résumé: ${summary || "Aucun résumé disponible"}

Critères d'importance (score 0-10):
- 8-10: Événement majeur avec impact mondial/régional significatif
  Négatifs: "Trump décide d'envahir le Venezuela", "Séisme majeur au Japon", "Krach boursier", "Coup d'État"
  Positifs: "Accord de paix historique", "Découverte médicale majeure", "Accord climat ambitieux", "Innovation technologique révolutionnaire", "Élection démocratique majeure"
- 5-7: Événement important avec impact mesurable
  Négatifs: "Crise économique nationale", "Catastrophe naturelle régionale"
  Positifs: "Accord commercial majeur", "Progrès scientifique significatif", "Réforme démocratique", "Transition énergétique"
- 2-4: Événement notable mais impact limité (ex: "Sommet international prévu", "Crise diplomatique en cours", "Événement local")
- 0-1: Article d'analyse, commentaire, ou événement mineur (ex: "Expert analyse la situation", "Article général", "Événement sans impact prévisible")

THÉMATIQUES COUVERTES (positifs ET négatifs):
- Géopolitique: décisions, sanctions, accords, coups d'État, élections, conflits, accords de paix, coopération internationale
- Économie: crises, krachs, inflation, décisions de banques centrales, croissance, investissements majeurs, accords commerciaux
- Écologie: catastrophes naturelles, décisions climatiques, crises environnementales, transition énergétique, protection environnement
- Technologie: réglementations majeures, cyberattaques, découvertes scientifiques, innovations, avancées médicales
- Social: réformes démocratiques, droits de l'homme, éducation, santé publique, coopération humanitaire

IMPORTANT: 
- Un ÉVÉNEMENT MAJEUR = quelque chose qui s'est passé ou a été décidé et qui aura un impact prédictible dans les 3-6 prochains mois
- Inclure TOUS les événements majeurs: positifs (progrès, découvertes, accords) ET négatifs (crises, catastrophes, conflits)
- L'impact peut être positif (faire progresser le monde) ou négatif (créer des défis)
- Exclure: articles d'analyse, commentaires, événements passés sans impact actuel, articles boursiers quotidiens, événements locaux mineurs

Réponds UNIQUEMENT avec du JSON valide:
{
  "isImportant": true/false,
  "score": 0-10,
  "reason": "explication courte"
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini", // GPT-5-mini selon la doc 2026
        messages: [
          {
            role: "system",
            content: "Tu es un expert en géopolitique. Tu évalues objectivement l'importance des décisions géopolitiques. Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        reasoning_effort: "minimal", // Pour gpt-5-mini, utiliser "minimal" au lieu de "none"
        // temperature n'est pas supporté avec reasoning_effort: "minimal" pour gpt-5-mini (seule valeur par défaut 1)
        max_completion_tokens: 200, // Pour gpt-5-mini, utiliser max_completion_tokens au lieu de max_tokens
        // Note: response_format peut ne pas être compatible avec reasoning_effort pour gpt-5-mini
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      // Si erreur 400, peut-être que response_format n'est pas compatible avec reasoning_effort
      // On réessaie sans response_format
      if (response.status === 400) {
        try {
          const retryResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-5-mini",
              messages: [
                {
                  role: "system",
                  content: "Tu es un expert en géopolitique. Tu évalues objectivement l'importance des décisions géopolitiques. Réponds UNIQUEMENT avec du JSON valide.",
                },
                {
                  role: "user",
                  content: prompt,
                },
              ],
              reasoning_effort: "none",
              temperature: 0.1,
              max_tokens: 200,
            }),
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            const retryContent = retryData.choices?.[0]?.message?.content;
            if (retryContent) {
              // Parser le JSON même s'il n'est pas dans response_format
              try {
                const jsonMatch = retryContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  return {
                    isImportant: parsed.isImportant === true && parsed.score >= 4, // Seuil abaissé à 4/10 pour capturer plus d'événements
                    score: parsed.score || 0,
                    reason: parsed.reason || "Non évalué",
                  };
                }
              } catch (parseError) {
                console.error("Error parsing retry response:", parseError);
              }
            }
          }
        } catch (retryError) {
          console.error("Error in retry:", retryError);
        }
      }
      return { isImportant: false, score: 0, reason: "Erreur API" };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return { isImportant: false, score: 0, reason: "Pas de réponse" };
    }

    // Parser le JSON (peut être dans un bloc markdown ou texte brut)
    let jsonString = content.trim();
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
    
    const parsed = JSON.parse(jsonString);
    return {
      isImportant: parsed.isImportant === true && parsed.score >= 4, // Seuil abaissé à 4/10 pour capturer plus d'événements
      score: parsed.score || 0,
      reason: parsed.reason || "Non évalué",
    };
  } catch (error) {
    console.error("Error evaluating decision importance:", error);
    return { isImportant: false, score: 0, reason: "Erreur d'évaluation" };
  }
}

/**
 * Récupère un flux RSS et le parse (utilisé pour toutes les sources RSS)
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
    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    return parseRSSFeed(xml);
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error);
    return [];
  }
}

/**
 * Parse un flux RSS (générique, fonctionne pour Google News et autres sources)
 */
function parseRSSFeed(xml: string): Array<{
  title: string;
  url: string;
  publishedAt: number;
  summary?: string;
}> {
  const items: Array<{
    title: string;
    url: string;
    publishedAt: number;
    summary?: string;
  }> = [];

  try {
    // Extraire les items du RSS
    const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi);

    for (const match of itemMatches) {
      const itemXml = match[1];

      const titleMatch =
        itemXml.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/i) ||
        itemXml.match(/<title[^>]*>(.*?)<\/title>/i);
      const linkMatch = itemXml.match(/<link[^>]*>(.*?)<\/link>/i);
      const pubDateMatch = itemXml.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i);
      const descriptionMatch =
        itemXml.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>/i) ||
        itemXml.match(/<description[^>]*>(.*?)<\/description>/i);

      if (titleMatch && linkMatch) {
        const title = titleMatch[1].trim();
        let url = linkMatch[1].trim();

        // Google News URLs sont des redirects, extraire l'URL réelle
        if (url.startsWith("https://news.google.com")) {
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
  } catch (error) {
    console.error("Error parsing Google News RSS:", error);
  }

  return items;
}

/**
 * Détecte automatiquement les nouvelles décisions importantes
 * Utilise Google News RSS pour trouver des annonces de décisions
 */
/**
 * Regroupe des articles similaires en événements majeurs
 */
function groupArticlesByEvent(
  articles: Array<{
    title: string;
    url: string;
    publishedAt: number;
    source: string;
    content?: string;
  }>
): Array<{
  articles: Array<{
    title: string;
    url: string;
    publishedAt: number;
    source: string;
    content?: string;
  }>;
  keywords: string[];
}> {
  const groups: Array<{
    articles: typeof articles;
    keywords: string[];
  }> = [];

  for (const article of articles) {
    // Extraire les mots-clés principaux du titre
    const titleWords = article.title
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4 && !["décision", "international", "monde", "pays", "gouvernement"].includes(w))
      .slice(0, 5);

    // Chercher un groupe existant avec des mots-clés similaires
    let foundGroup = false;
    for (const group of groups) {
      const commonKeywords = titleWords.filter((kw) =>
        group.keywords.some((gk) => gk.includes(kw) || kw.includes(gk))
      );
      
      // Si au moins 1 mot-clé en commun, ajouter à ce groupe (assoupli pour capturer plus d'événements)
      if (commonKeywords.length >= 1) {
        group.articles.push(article);
        group.keywords = [...new Set([...group.keywords, ...titleWords])];
        foundGroup = true;
        break;
      }
    }

    // Si aucun groupe trouvé, créer un nouveau groupe
    if (!foundGroup) {
      groups.push({
        articles: [article],
        keywords: titleWords,
      });
    }
  }

  // Filtrer les groupes : accepter événements avec 1 article si très important, sinon minimum 2 articles
  // Cela permet de capturer plus d'événements majeurs même s'ils sont moins couverts médiatiquement
  return groups.filter((g) => g.articles.length >= 1);
}

/**
 * Utilise l'IA pour générer des requêtes de recherche optimisées pour l'actualité chaude
 */
async function generateHotNewsSearchQueries(
  openaiKey: string | undefined,
  now: number
): Promise<string[]> {
  if (!openaiKey) {
    // Fallback : requêtes par défaut
    return [
      "actualité chaude cette semaine",
      "événement majeur cette semaine",
      "news importante cette semaine",
      "breaking news cette semaine",
    ];
  }

  try {
    const weekAgo = new Date(now - 14 * 24 * 60 * 60 * 1000); // 14 jours pour plus d'actualité
    const dateStr = weekAgo.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const prompt = `Tu es un expert en actualité internationale. Génère 25 requêtes de recherche optimisées pour trouver les événements majeurs les plus chauds et récents de ces 2 dernières semaines (depuis le ${dateStr}).

Les requêtes doivent :
- Cibler l'actualité géopolitique, économique, écologique, technologique et sociale la plus récente
- Être en français
- Être spécifiques pour capturer les événements majeurs (pas les articles généraux)
- Inclure des termes temporels pour cibler cette semaine ("cette semaine", "récent", "actualité chaude", etc.)

Exemples de bonnes requêtes :
- "actualité chaude géopolitique cette semaine"
- "événement majeur économique récent"
- "breaking news internationale cette semaine"
- "crise diplomatique récente"
- "décision importante cette semaine"

Réponds UNIQUEMENT avec un JSON array de 15 requêtes :
["requête 1", "requête 2", ...]`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: "Tu es un expert en actualité internationale. Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        reasoning_effort: "minimal",
        max_completion_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parser le JSON (peut être dans un bloc markdown)
    let jsonString = content.trim();
    const jsonMatch = jsonString.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    try {
            const queries = JSON.parse(jsonString);
            if (Array.isArray(queries) && queries.length > 0) {
              return queries.slice(0, 25);
            }
    } catch (parseError) {
      console.error("Error parsing AI search queries:", parseError);
    }
  } catch (error) {
    console.error("Error generating search queries with AI:", error);
  }

  // Fallback
  return [
    "actualité chaude cette semaine",
    "événement majeur cette semaine",
    "news importante cette semaine",
    "breaking news cette semaine",
  ];
}

export const detectDecisions = action({
  args: {
    limit: v.optional(v.number()), // Nombre max d'événements majeurs à détecter
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const now = Date.now();
    const weekAgo = now - 14 * 24 * 60 * 60 * 1000; // 14 jours en millisecondes pour capturer plus d'actualité
    
    const allArticles: Array<{
      title: string;
      url: string;
      publishedAt: number;
      source: string;
      content?: string;
    }> = [];

    // 0. Générer des requêtes optimisées avec l'IA pour l'actualité chaude
    const openaiKey = process.env.OPENAI_API_KEY;
    const aiSearchQueries = await generateHotNewsSearchQueries(openaiKey, now);
    console.log(`🔍 ${aiSearchQueries.length} requêtes générées par l'IA pour l'actualité chaude`);

    // 1. Google News RSS avec requêtes IA + requêtes par défaut
    try {
      const searchQueries = [
        ...aiSearchQueries, // Priorité aux requêtes générées par l'IA
        // Requêtes par défaut (fallback)
        // Décisions formelles
        "décision président",
        "sanction internationale pays",
        "accord diplomatique",
        "rupture diplomatique",
        "embargo international",
        "sommet international",
        "traité international",
        // Événements géopolitiques (positifs et négatifs)
        "intervention militaire",
        "coup d'état",
        "crise géopolitique",
        "élection présidentielle",
        "référendum",
        "conflit armé",
        "guerre",
        "accord de paix",
        "réconciliation",
        "coopération internationale",
        "résolution conflit",
        // Événements économiques (positifs et négatifs)
        "crise économique",
        "krach boursier",
        "inflation",
        "banque centrale",
        "récession",
        "croissance économique",
        "investissement majeur",
        "accord commercial",
        "partenariat économique",
        // Événements écologiques (positifs et négatifs)
        "catastrophe naturelle",
        "changement climatique",
        "COP",
        "accord climat",
        "sécheresse",
        "inondation",
        "transition énergétique",
        "énergies renouvelables",
        "protection environnement",
        // Événements technologiques (positifs et négatifs)
        "réglementation intelligence artificielle",
        "cyberattaque",
        "découverte scientifique",
        "innovation technologique",
        "avancée médicale",
        "traitement maladie",
        "vaccin",
        "breakthrough scientifique",
        // Progrès sociaux et humains
        "réforme démocratique",
        "droits de l'homme",
        "égalité",
        "éducation",
        "santé publique",
        "coopération humanitaire",
        "aide internationale",
      ];

      // Utiliser plus de requêtes pour couvrir l'actualité chaude mondiale (priorité aux requêtes IA)
      // Limité à 30 requêtes pour éviter les timeouts (on peut augmenter progressivement)
      const queriesToProcess = searchQueries.slice(0, 30);
      console.log(`📡 Traitement de ${queriesToProcess.length} requêtes de recherche...`);

      for (const query of queriesToProcess) {
        try {
          // Ajouter un filtre de date pour cette semaine (when:7d = 7 derniers jours)
          const googleNewsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(
            query
          )}&hl=fr&gl=FR&ceid=FR:fr&when=14d`; // Filtre 14 derniers jours pour plus d'actualité
          
          const response = await fetch(googleNewsUrl);
          if (!response.ok) continue;

          const xml = await response.text();
          const items = parseRSSFeed(xml);
          
          // Filtrer les articles de cette semaine uniquement et limiter à 20 articles par requête pour éviter les timeouts
          const recentItems = items.filter((item) => item.publishedAt >= weekAgo).slice(0, 20);

          for (const item of recentItems) {
            // Filtrer pour ne garder que les VRAIES décisions géopolitiques (pas les articles boursiers)
            const titleLower = item.title.toLowerCase();
            const summaryLower = (item.summary || "").toLowerCase();
            const fullText = `${titleLower} ${summaryLower}`;
            
            // Mots-clés pour les événements majeurs (positifs ET négatifs)
            const majorEventsKeywords = [
              // Décisions formelles
              "décision président", "décision gouvernement", "sanction contre", "embargo contre",
              "accord diplomatique", "rupture diplomatique", "sommet international", "traité international",
              // Événements géopolitiques (positifs et négatifs)
              "coup d'état", "intervention militaire", "crise diplomatique", "crise géopolitique",
              "élection présidentielle", "référendum", "onu", "otan", "conseil de sécurité", "conflit armé", "guerre",
              "accord de paix", "réconciliation", "coopération internationale", "résolution conflit",
              // Événements économiques (positifs et négatifs)
              "crise économique", "krach boursier", "inflation", "banque centrale", "récession", "faillite",
              "croissance économique", "investissement majeur", "accord commercial", "partenariat économique",
              // Événements écologiques (positifs et négatifs)
              "catastrophe naturelle", "sécheresse", "inondation", "ouragan", "tremblement de terre", "tsunami",
              "changement climatique", "COP", "accord climat", "transition énergétique", "énergies renouvelables", "protection environnement",
              // Événements technologiques (positifs et négatifs)
              "réglementation intelligence artificielle", "cyberattaque", "découverte scientifique",
              "innovation technologique", "avancée médicale", "traitement maladie", "vaccin", "breakthrough scientifique",
              // Progrès sociaux et humains
              "réforme démocratique", "droits de l'homme", "égalité", "éducation", "santé publique", "coopération humanitaire", "aide internationale"
            ];
            
            // Mots-clés à EXCLURE (articles boursiers, économie, etc.)
            const excludeKeywords = [
              "boursorama", "bourse", "cac 40", "sbf 120", "srd", "cours", "action", "titre",
              "indice", "eurostoxx", "dow jones", "nasdaq", "wall street", "trading", "investissement",
              "dividende", "rendement", "portefeuille", "marché financier", "analyse technique"
            ];
            
            // Vérifier les exclusions d'abord
            const isExcluded = excludeKeywords.some(
              keyword => fullText.includes(keyword)
            );
            
            if (isExcluded) {
              continue; // Ignorer cet article
            }
            
            // Vérifier si c'est un événement majeur
            const isMajorEvent = majorEventsKeywords.some(
              keyword => fullText.includes(keyword)
            );
            
            if (!isMajorEvent) {
              continue; // Ignorer si pas un événement majeur
            }
            
            // Vérifier les doublons par URL
            if (allArticles.some((d) => d.url === item.url)) {
              continue; // Ignorer les doublons
            }
            
            // Évaluer l'importance avec l'IA (si disponible)
            const openaiKey = process.env.OPENAI_API_KEY;
            const evaluation = await evaluateDecisionImportance(
              item.title,
              item.summary,
              openaiKey
            );
            
            // Ne garder que les décisions importantes (score >= 4 pour capturer plus d'événements)
            if (!evaluation.isImportant || evaluation.score < 4) {
              console.log(`Décision filtrée (score: ${evaluation.score}): ${item.title.substring(0, 60)}... - ${evaluation.reason}`);
              continue;
            }
            
            // Ajouter l'article à la liste (on les regroupera après)
            allArticles.push({
              title: item.title,
              url: item.url,
              publishedAt: item.publishedAt,
              source: "Google News",
              content: item.summary,
            });
            console.log(`✅ Article important détecté (score: ${evaluation.score}): ${item.title.substring(0, 60)}...`);
          }
        } catch (error) {
          console.error(`Error fetching Google News for query "${query}":`, error);
        }
      }
    } catch (error) {
      console.error("Error in Google News RSS detection:", error);
    }

    // 2. RSS feeds de médias internationaux (sources fiables)
    console.log(`📰 Récupération des articles depuis les sources RSS...`);
    try {
      const highReliabilitySources = getSourcesByReliability("high");
      const mediumReliabilitySources = getSourcesByReliability("medium");

      // Prioriser les sources haute fiabilité, limiter pour éviter les timeouts
      // Réduit pour optimiser les performances (on peut augmenter progressivement)
      const sourcesToCheck = [
        ...highReliabilitySources.slice(0, 30), // 30 sources haute fiabilité (réduit de 50)
        ...mediumReliabilitySources.slice(0, 10), // 10 sources moyenne fiabilité (réduit de 20)
      ];

      console.log(`📡 Vérification de ${sourcesToCheck.length} sources RSS...`);

      let totalRSSItems = 0;
      for (const source of sourcesToCheck) {
        try {
          const items = await fetchRSSFeed(source.url);
          totalRSSItems += items.length;
          
          // Filtrer les articles de cette semaine uniquement
          const recentItems = items.filter((item) => item.publishedAt >= weekAgo);
          
          // Filtrer pour ne garder que les événements majeurs
          for (const item of recentItems) {
            const titleLower = item.title.toLowerCase();
            const summaryLower = (item.summary || "").toLowerCase();
            const fullText = `${titleLower} ${summaryLower}`;

            // Mots-clés pour les événements majeurs
            const majorEventsKeywords = [
              "décision président", "décision gouvernement", "sanction contre", "embargo contre",
              "accord diplomatique", "rupture diplomatique", "sommet international", "traité international",
              "coup d'état", "intervention militaire", "crise diplomatique", "crise géopolitique",
              "élection présidentielle", "référendum", "onu", "otan", "conseil de sécurité", "conflit armé", "guerre",
              "accord de paix", "réconciliation", "coopération internationale", "résolution conflit",
              "crise économique", "krach boursier", "inflation", "banque centrale", "récession", "faillite",
              "croissance économique", "investissement majeur", "accord commercial", "partenariat économique",
              "catastrophe naturelle", "sécheresse", "inondation", "ouragan", "tremblement de terre", "tsunami",
              "changement climatique", "COP", "accord climat", "transition énergétique", "énergies renouvelables",
              "réglementation intelligence artificielle", "cyberattaque", "découverte scientifique",
              "innovation technologique", "avancée médicale", "traitement maladie", "vaccin", "breakthrough scientifique",
              "réforme démocratique", "droits de l'homme", "égalité", "éducation", "santé publique", "coopération humanitaire",
            ];

            const excludeKeywords = [
              "boursorama", "bourse", "cac 40", "sbf 120", "srd", "cours", "action", "titre",
              "indice", "eurostoxx", "dow jones", "nasdaq", "wall street", "trading", "investissement",
              "dividende", "rendement", "portefeuille", "marché financier", "analyse technique"
            ];

            const isExcluded = excludeKeywords.some(keyword => fullText.includes(keyword));
            if (isExcluded) continue;

            const isMajorEvent = majorEventsKeywords.some(keyword => fullText.includes(keyword));
            if (!isMajorEvent) continue;

            // Vérifier les doublons par URL
            if (allArticles.some((d) => d.url === item.url)) {
              continue;
            }

            // Évaluer l'importance avec l'IA (si disponible)
            const evaluation = await evaluateDecisionImportance(
              item.title,
              item.summary,
              openaiKey
            );

            // Ne garder que les événements importants (score >= 4 pour capturer plus d'événements)
            if (!evaluation.isImportant || evaluation.score < 4) {
              console.log(`Événement filtré (score: ${evaluation.score}): ${item.title.substring(0, 60)}... - ${evaluation.reason}`);
              continue;
            }

            // Ajouter l'article à la liste
            allArticles.push({
              title: item.title,
              url: item.url,
              publishedAt: item.publishedAt,
              source: source.source,
              content: item.summary,
            });
          }
        } catch (error) {
          console.error(`Error fetching RSS feed ${source.source}:`, error);
          // Continuer avec les autres sources même en cas d'erreur
        }
      }
      console.log(`   ✅ Total articles RSS collectés: ${totalRSSItems}`);
    } catch (error) {
      console.error("Error fetching RSS feeds:", error);
    }

    console.log(`📊 Total articles collectés: ${allArticles.length}`);
    console.log(`📅 Période: ${new Date(weekAgo).toLocaleDateString("fr-FR")} - ${new Date(now).toLocaleDateString("fr-FR")}`);

    // Regrouper les articles similaires en événements majeurs
    const eventGroups = groupArticlesByEvent(allArticles);
    console.log(`🔗 Groupes d'événements formés: ${eventGroups.length}`);
    
    // Trier par nombre d'articles (plus d'articles = événement plus majeur)
    eventGroups.sort((a, b) => b.articles.length - a.articles.length);
    
    // Prendre les N premiers événements majeurs
    const majorEvents = eventGroups.slice(0, limit).map((group) => ({
      articles: group.articles,
      // Utiliser l'article le plus récent comme référence principale
      mainArticle: group.articles.sort((a, b) => b.publishedAt - a.publishedAt)[0],
    }));

    console.log(`✅ Événements majeurs retenus: ${majorEvents.length}`);

    // Mettre à jour les stats du bot Détecteur
    await updateBotActivity(ctx, {
      botSlug: "detecteur",
      logMessage: `${majorEvents.length} événements majeurs détectés sur ${allArticles.length} articles analysés`,
      logLevel: majorEvents.length > 0 ? "success" : "info",
      functionName: "detectDecisions",
    });

    return {
      detected: majorEvents.length,
      events: majorEvents,
    };
  },
});

/**
 * Vérifie si une décision similaire existe déjà
 */
export const checkDuplicateDecision = action({
  args: {
    title: v.string(),
    sourceUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{
    isDuplicate: boolean;
    existingDecision: any | null;
  }> => {
    // Récupérer toutes les décisions existantes
    const existingDecisions = await ctx.runQuery(api.decisions.getDecisions, {
      limit: 1000, // Limite élevée pour vérifier les doublons
    });

    // Vérifier les doublons par titre ou URL source
    const duplicate = existingDecisions.find(
      (d: any) =>
        d.title.toLowerCase() === args.title.toLowerCase() ||
        d.sourceUrl === args.sourceUrl
    );

    return {
      isDuplicate: !!duplicate,
      existingDecision: duplicate || null,
    };
  },
});

