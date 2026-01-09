import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import {
  getAllSources,
  getSourcesByReliability,
} from "./newsSources";
import { updateBotActivity } from "./helpers";

/**
 * ✅ Génère un hash unique pour une décision (titre + sourceUrl)
 * Utilisé pour déduplication optimisée (O(1) lookup au lieu de scan complet)
 */
function generateContentHash(title: string, sourceUrl: string): string {
  const content = `${title.toLowerCase().trim()}|${sourceUrl}`;
  // Utiliser une fonction de hash simple mais efficace (compatible Convex)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convertir en hexadécimal et prendre les 32 premiers caractères
  return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
}

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
  Négatifs: "Crise économique nationale", "Catastrophe naturelle régionale", "Intervention militaire", "Rupture diplomatique majeure"
  Positifs: "Accord commercial majeur", "Progrès scientifique significatif", "Réforme démocratique", "Transition énergétique"
- 3-4: Décision ou événement concret avec impact prévisible (ACCEPTER ces événements)
  Négatifs: "Rupture diplomatique", "Sanction annoncée", "Crise diplomatique majeure", "Tentative de coup d'État", "Intervention militaire en cours"
  Positifs: "Accord bilatéral", "Coopération internationale", "Réforme politique", "Décision gouvernementale majeure"
  IMPORTANT: Si c'est une DÉCISION CONCRÈTE (rupture, sanction, accord, intervention), donner au moins 3/10 même si l'impact semble limité
- 0-2: Article d'analyse, commentaire, ou événement mineur (ex: "Expert analyse la situation", "Article général", "Événement sans impact prévisible", "Commentaire de sportif")

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
                    isImportant: parsed.isImportant === true && parsed.score >= 3, // Seuil abaissé à 3/10 pour capturer les décisions concrètes
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
      isImportant: parsed.isImportant === true && parsed.score >= 3, // Seuil abaissé à 3/10 pour capturer les décisions concrètes
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
  mainTopic?: string; // Sujet principal identifié pour diversité
}> {
  const groups: Array<{
    articles: typeof articles;
    keywords: string[];
    mainTopic?: string;
  }> = [];

  for (const article of articles) {
    // Extraire les mots-clés principaux du titre
    const titleWords = article.title
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4 && !["décision", "international", "monde", "pays", "gouvernement"].includes(w))
      .slice(0, 5);

    // Identifier le sujet principal (pays, organisation, ou entité principale)
    const mainTopic = identifyMainTopic(article.title, titleWords);

    // Chercher un groupe existant avec des mots-clés similaires
    let foundGroup = false;
    for (const group of groups) {
      const commonKeywords = titleWords.filter((kw) =>
        group.keywords.some((gk) => gk.includes(kw) || kw.includes(gk))
      );
      
      // Exiger au moins 2 mots-clés en commun pour éviter les regroupements trop larges
      // Cela permet de mieux séparer les différents aspects d'un même sujet
      if (commonKeywords.length >= 2) {
        group.articles.push(article);
        group.keywords = [...new Set([...group.keywords, ...titleWords])];
        // Mettre à jour le sujet principal si plus spécifique
        if (mainTopic && (!group.mainTopic || mainTopic.length < group.mainTopic.length)) {
          group.mainTopic = mainTopic;
        }
        foundGroup = true;
        break;
      }
    }

    // Si aucun groupe trouvé, créer un nouveau groupe
    if (!foundGroup) {
      groups.push({
        articles: [article],
        keywords: titleWords,
        mainTopic,
      });
    }
  }

  // Filtrer les groupes : accepter événements avec 1 article si très important, sinon minimum 2 articles
  // Cela permet de capturer plus d'événements majeurs même s'ils sont moins couverts médiatiquement
  return groups.filter((g) => g.articles.length >= 1);
}

/**
 * Identifie le sujet principal d'un article (pays, organisation, etc.)
 * Utilisé pour la diversité thématique
 */
function identifyMainTopic(title: string, keywords: string[]): string | undefined {
  // Liste de pays et organisations majeurs (non exhaustive, peut être étendue)
  const majorEntities = [
    "venezuela", "maduro", "trump", "usa", "états-unis", "syrie", "assad",
    "ukraine", "russie", "poutine", "chine", "iran", "israël", "palestine",
    "france", "macron", "allemagne", "europe", "otan", "onu", "ue"
  ];

  const titleLower = title.toLowerCase();
  
  // Chercher une entité majeure dans le titre
  for (const entity of majorEntities) {
    if (titleLower.includes(entity)) {
      return entity;
    }
  }

  // Sinon, utiliser le premier mot-clé significatif
  if (keywords.length > 0) {
    return keywords[0];
  }

  return undefined;
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

/**
 * Analyse le sentiment d'un événement (positif, négatif, neutre)
 */
async function analyzeEventSentiment(
  title: string,
  summary: string | undefined,
  openaiKey: string | undefined
): Promise<"positive" | "negative" | "neutral"> {
  // Si pas de clé OpenAI, utiliser un filtre basique
  if (!openaiKey) {
    const titleLower = title.toLowerCase();
    const summaryLower = (summary || "").toLowerCase();
    const fullText = `${titleLower} ${summaryLower}`;
    
    // Mots-clés positifs
    const positiveKeywords = [
      "accord", "paix", "réconciliation", "coopération", "découverte", "innovation",
      "progrès", "réforme", "transition", "croissance", "investissement", "partenariat",
      "réussite", "victoire", "avancée", "breakthrough", "succès"
    ];
    
    // Mots-clés négatifs
    const negativeKeywords = [
      "crise", "conflit", "guerre", "sanction", "embargo", "rupture", "coup d'état",
      "catastrophe", "krach", "récession", "faillite", "attaque", "intervention militaire"
    ];
    
    const hasPositive = positiveKeywords.some(kw => fullText.includes(kw));
    const hasNegative = negativeKeywords.some(kw => fullText.includes(kw));
    
    if (hasPositive && !hasNegative) return "positive";
    if (hasNegative && !hasPositive) return "negative";
    return "neutral";
  }
  
  try {
    const prompt = `Analyse le sentiment de cet événement géopolitique/économique/technologique:

Titre: ${title}
Résumé: ${summary || "Aucun résumé disponible"}

Détermine si l'événement est:
- "positive": Progrès, découverte, accord de paix, innovation, réforme démocratique, coopération internationale, croissance économique
- "negative": Crise, conflit, catastrophe, sanction, rupture diplomatique, krach, récession, guerre
- "neutral": Événement factuel sans connotation clairement positive ou négative

Réponds UNIQUEMENT avec du JSON valide:
{
  "sentiment": "positive|negative|neutral",
  "reason": "explication courte"
}`;

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
            content: "Tu es un expert en analyse de sentiment géopolitique. Réponds UNIQUEMENT avec du JSON valide.",
          },
          { role: "user", content: prompt },
        ],
        reasoning_effort: "minimal",
        max_completion_tokens: 150,
      }),
    });

    if (!response.ok) {
      return "neutral"; // Fallback en cas d'erreur
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return "neutral";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (["positive", "negative", "neutral"].includes(parsed.sentiment)) {
        return parsed.sentiment as "positive" | "negative" | "neutral";
      }
    }
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
  }
  
  return "neutral";
}

export const detectDecisions = action({
  args: {
    limit: v.optional(v.number()), // Nombre max d'événements majeurs à détecter
    preferredSentiment: v.optional(v.union(
      v.literal("positive"),
      v.literal("negative")
    )), // ✅ Sentiment préféré pour équilibrage
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
            
            // Ne garder que les décisions importantes (score >= 3 pour capturer plus d'événements, y compris les décisions concrètes)
            if (!evaluation.isImportant || evaluation.score < 3) {
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

            // Ne garder que les événements importants (score >= 3 pour capturer plus d'événements, y compris les décisions concrètes)
            if (!evaluation.isImportant || evaluation.score < 3) {
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
    
    // Récupérer les sujets récemment traités (24 dernières heures) pour favoriser la diversité
    const recentDecisions = await ctx.runQuery(api.decisions.getDecisions, {
      limit: 20, // Récupérer les 20 dernières décisions
    });
    
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    const recentlyTreatedTopics = new Set<string>();
    
    // Extraire les sujets principaux des décisions récentes (24h)
    for (const decision of recentDecisions) {
      if (decision.date >= twentyFourHoursAgo) {
        const topic = identifyMainTopic(decision.title, extractImportantKeywords(decision.title));
        if (topic) {
          recentlyTreatedTopics.add(topic.toLowerCase());
        }
      }
    }
    
    console.log(`📌 Sujets récemment traités (24h): ${Array.from(recentlyTreatedTopics).join(", ") || "aucun"}`);
    
    // Calculer un score combinant popularité et diversité
    const scoredEvents = eventGroups.map((group) => {
      const popularityScore = group.articles.length; // Score basé sur le nombre d'articles
      const diversityPenalty = group.mainTopic && recentlyTreatedTopics.has(group.mainTopic.toLowerCase()) ? 0.3 : 1.0; // Pénalité de 70% si sujet récent
      const recencyBonus = Math.max(0, group.articles.reduce((max, a) => Math.max(max, a.publishedAt), 0) - (now - 7 * 24 * 60 * 60 * 1000)) / (7 * 24 * 60 * 60 * 1000); // Bonus pour articles récents
      
      // Score final = popularité × diversité × (1 + bonus récence)
      const finalScore = popularityScore * diversityPenalty * (1 + recencyBonus * 0.2);
      
      return {
        group,
        score: finalScore,
        popularityScore,
        diversityPenalty,
      };
    });
    
    // Trier par score final (diversité + popularité)
    scoredEvents.sort((a, b) => b.score - a.score);
    
    console.log(`📊 Top 5 événements par score (popularité × diversité):`);
    scoredEvents.slice(0, 5).forEach((event, i) => {
      console.log(`  ${i + 1}. Score: ${event.score.toFixed(2)} (pop: ${event.popularityScore}, div: ${event.diversityPenalty.toFixed(2)}) - ${event.group.mainTopic || "sujet inconnu"}`);
    });
    
    // Prendre les N premiers événements majeurs (après tri par diversité)
    let majorEvents = scoredEvents.slice(0, limit * 2).map((scored) => ({
      articles: scored.group.articles,
      // Utiliser l'article le plus récent comme référence principale
      mainArticle: scored.group.articles.sort((a, b) => b.publishedAt - a.publishedAt)[0],
    }));

    // ✅ Filtrer par sentiment préféré si fourni (pour équilibrage)
    if (args.preferredSentiment) {
      const openaiKey = process.env.OPENAI_API_KEY;
      console.log(`⚖️ Filtrage par sentiment préféré: ${args.preferredSentiment}`);
      
      // Analyser le sentiment de chaque événement
      const eventsWithSentiment = await Promise.all(
        majorEvents.map(async (event) => {
          const sentiment = await analyzeEventSentiment(
            event.mainArticle.title,
            event.mainArticle.content,
            openaiKey
          );
          return { event, sentiment };
        })
      );
      
      // Filtrer pour garder seulement les événements du sentiment préféré
      const filteredEvents = eventsWithSentiment
        .filter(({ sentiment }) => sentiment === args.preferredSentiment)
        .map(({ event }) => event);
      
      // Si on a assez d'événements du sentiment préféré, les utiliser
      // Sinon, utiliser tous les événements (mieux vaut avoir des événements que rien)
      if (filteredEvents.length >= limit / 2) {
        majorEvents = filteredEvents.slice(0, limit);
        console.log(`✅ ${filteredEvents.length} événements ${args.preferredSentiment} trouvés, ${majorEvents.length} retenus`);
      } else {
        console.log(`⚠️ Seulement ${filteredEvents.length} événements ${args.preferredSentiment} trouvés, utilisation de tous les événements`);
        majorEvents = majorEvents.slice(0, limit);
      }
    } else {
      majorEvents = majorEvents.slice(0, limit);
    }

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
 * Extrait les mots-clés importants d'un titre (pour comparaison textuelle)
 */
function extractImportantKeywords(title: string): string[] {
  const stopWords = new Set([
    "le", "la", "les", "un", "une", "des", "de", "du", "dans", "pour", "avec", "sur", "par",
    "et", "ou", "mais", "donc", "car", "que", "qui", "quoi", "où", "quand", "comment",
    "announce", "annonce", "décision", "international", "monde", "pays", "gouvernement",
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had"
  ]);

  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 8); // Max 8 mots-clés
}

/**
 * Calcule la similarité entre deux ensembles de mots-clés (0-1)
 */
function calculateKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
  if (keywords1.length === 0 || keywords2.length === 0) return 0;

  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  
  const intersection = [...set1].filter(k => set2.has(k));
  const union = [...new Set([...keywords1, ...keywords2])];
  
  return intersection.length / union.length;
}

/**
 * Compare sémantiquement deux décisions avec l'IA (avec timeout)
 */
async function checkSemanticSimilarity(
  title1: string,
  description1: string,
  title2: string,
  description2: string,
  openaiKey: string
): Promise<boolean> {
  try {
    const prompt = `Compare ces deux événements et détermine s'ils parlent du MÊME ÉVÉNEMENT RÉEL.

ÉVÉNEMENT 1:
Titre: ${title1}
Description: ${description1 || ""}

ÉVÉNEMENT 2:
Titre: ${title2}
Description: ${description2 || ""}

Réponds UNIQUEMENT avec du JSON:
{
  "duplicate": true/false,
  "reason": "explication courte"
}`;

    // Timeout de 5 secondes pour chaque appel IA
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
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
              content: "Tu es un expert en actualité internationale. Compare objectivement si deux événements sont identiques.",
            },
            { role: "user", content: prompt },
          ],
          reasoning_effort: "minimal",
          max_completion_tokens: 150,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return false; // En cas d'erreur, considérer comme non-duplicate pour ne pas bloquer
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) return false;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.duplicate === true;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("Semantic comparison timeout, skipping");
      }
      return false; // En cas d'erreur/timeout, considérer comme non-duplicate
    }
  } catch (error) {
    console.warn("Error in semantic comparison:", error);
    return false;
  }

  return false;
}

/**
 * ✅ Vérifie si une décision similaire existe déjà (version optimisée avec hash)
 * - Utilise un index de hash pour lookup O(1) au lieu de scan complet
 * - Fallback sur vérification textuelle (7 derniers jours) si hash non trouvé
 * - Comparaison sémantique IA limitée (max 5 décisions) seulement si nécessaire
 */
export const checkDuplicateDecision = action({
  args: {
    title: v.string(),
    sourceUrl: v.string(),
    description: v.optional(v.string()), // Pour comparaison sémantique
  },
  handler: async (ctx, args): Promise<{
    isDuplicate: boolean;
    existingDecision: any | null;
  }> => {
    // ✅ 1. Générer le hash du contenu
    const contentHash = generateContentHash(args.title, args.sourceUrl);
    
    // ✅ 2. Vérification O(1) via index hash (TOUTE la base de données)
    try {
      const existingByHash = await ctx.runQuery(
        api.decisions.getDecisionByContentHash,
        { contentHash }
      );
      
      if (existingByHash) {
        console.log(`✅ Doublon détecté via hash: ${args.title.substring(0, 50)}...`);
        return {
          isDuplicate: true,
          existingDecision: existingByHash,
        };
      }
    } catch (error) {
      // Si la query échoue (index pas encore créé), continuer avec fallback
      console.warn("Error checking hash (index may not exist yet):", error);
    }

    // ✅ 3. Fallback : Vérification textuelle (7 derniers jours seulement)
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const allRecentDecisions = await ctx.runQuery(api.decisions.getDecisions, {
      limit: 50,
    });

    const recentDecisions = allRecentDecisions
      .filter((d: any) => d.date >= sevenDaysAgo)
      .slice(0, 20); // Réduit à 20 pour performance

    // Vérification rapide : titre exact ou URL source
    const exactDuplicate = recentDecisions.find(
      (d: any) =>
        d.title.toLowerCase() === args.title.toLowerCase() ||
        d.sourceUrl === args.sourceUrl
    );

    if (exactDuplicate) {
      return {
        isDuplicate: true,
        existingDecision: exactDuplicate,
      };
    }

    // 2. Comparaison textuelle améliorée (fallback sans IA)
    const newKeywords = extractImportantKeywords(args.title);
    const newTopic = identifyMainTopic(args.title, newKeywords);
    
    for (const decision of recentDecisions.slice(0, 20)) {
      const existingKeywords = extractImportantKeywords(decision.title);
      const existingTopic = identifyMainTopic(decision.title, existingKeywords);
      const similarity = calculateKeywordSimilarity(newKeywords, existingKeywords);
      
      // Si même sujet principal ET similarité élevée, considérer comme doublon
      if (newTopic && existingTopic && newTopic.toLowerCase() === existingTopic.toLowerCase() && similarity > 0.5) {
        return {
          isDuplicate: true,
          existingDecision: decision,
        };
      }
      
      // Si similarité > 70% (même sans même sujet), considérer comme doublon potentiel
      if (similarity > 0.7) {
        return {
          isDuplicate: true,
          existingDecision: decision,
        };
      }
    }

    // 3. Comparaison sémantique avec IA (seulement si description fournie et IA disponible)
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && args.description) {
      // Limiter à 10 décisions les plus récentes pour comparaison IA (performance)
      const topRecentDecisions = recentDecisions.slice(0, 10);
      
      // Comparer en parallèle avec timeout (max 5s par comparaison)
      const comparisons = topRecentDecisions.map(async (decision: any) => {
        try {
          const isDuplicate = await checkSemanticSimilarity(
            args.title,
            args.description || "",
            decision.title,
            decision.description || "",
            openaiKey
          );
          return isDuplicate ? decision : null;
        } catch (error) {
          // En cas d'erreur, ignorer cette comparaison
          return null;
        }
      });

      // Attendre les comparaisons (avec timeout global de 30s pour toutes)
      const results = await Promise.allSettled(comparisons);
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          return {
            isDuplicate: true,
            existingDecision: result.value,
          };
        }
      }
    }

    return {
      isDuplicate: false,
      existingDecision: null,
    };
  },
});

