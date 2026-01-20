import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { updateBotActivity } from "./helpers";

/**
 * Catégories de contenu selon la stratégie Seed
 */
type ContentCategory = "geopolitics" | "pop_culture" | "tech_future_sport";

/**
 * Détecte la catégorie de contenu d'un événement
 */
function detectContentCategory(
  title: string,
  description: string,
  articles: Array<{ title: string; content?: string }>
): ContentCategory {
  const fullText = `${title} ${description} ${articles.map(a => `${a.title} ${a.content || ""}`).join(" ")}`.toLowerCase();
  
  // Pop Culture (40%)
  const popCultureKeywords = [
    "film", "cinéma", "série", "télévision", "album", "musique", "influenceur", "abonnés",
    "oscars", "césars", "miss france", "eurovision", "jeu vidéo", "créateur contenu",
    "célébrité", "divertissement", "hype", "trending", "box office", "casting",
    "charts", "top charts", "cérémonie récompenses", "réseau social", "viral", "partageable"
  ];
  
  // Tech & Sport Narratif (40%)
  const techSportKeywords = [
    "entreprise tech", "intelligence artificielle", "lancement fusée", "nouveau produit tech",
    "transfert", "joueur", "coach", "record du monde", "joueur football", "météo",
    "réglementation", "cyberattaque", "découverte", "innovation", "avancée médicale",
    "breakthrough", "sport narratif", "mercato", "découverte scientifique"
  ];
  
  const hasPopCulture = popCultureKeywords.some(kw => fullText.includes(kw));
  const hasTechSport = techSportKeywords.some(kw => fullText.includes(kw));
  
  if (hasPopCulture) return "pop_culture";
  if (hasTechSport) return "tech_future_sport";
  return "geopolitics"; // Par défaut : géopolitique
}

interface DetectedDecision {
  title: string;
  url: string;
  publishedAt: number;
  source: string;
  content?: string;
}

/**
 * Génère une Decision Card à partir d'une décision détectée
 * Utilise l'IA pour extraire les informations et générer question/réponses objectives
 */
export const generateDecision = action({
  args: {
    detectedEvent: v.object({
      articles: v.array(
        v.object({
          title: v.string(),
          url: v.string(),
          publishedAt: v.number(),
          source: v.string(),
          content: v.optional(v.string()),
        })
      ),
      mainArticle: v.object({
        title: v.string(),
        url: v.string(),
        publishedAt: v.number(),
        source: v.string(),
        content: v.optional(v.string()),
      }),
    }),
    createdInThisBatch: v.optional(
      v.array(
        v.object({
          title: v.string(),
          sourceUrl: v.string(),
          slug: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args): Promise<Id<"decisions"> | null> => {
    const { detectedEvent, createdInThisBatch = [] } = args;
    const { articles, mainArticle } = detectedEvent;

    // Métadonnées de gamification (par défaut)
    let sentiment: "positive" | "negative" | "neutral" = "neutral";
    let heat = 50; // Score par défaut (moyen)
    let emoji = "📰"; // Emoji par défaut
    let badgeColor = "#3b82f6"; // Bleu par défaut

    // Vérification initiale rapide : titre exact ou URL source (sans description)
    // 1. Vérifier d'abord dans le cache de la batch actuelle
    const duplicateInBatch = createdInThisBatch.find(
      (d) =>
        d.title.toLowerCase() === mainArticle.title.toLowerCase() ||
        d.sourceUrl === mainArticle.url
    );
    
    if (duplicateInBatch) {
      console.log("Event duplicate detected (in current batch), skipping:", mainArticle.title);
      return null;
    }
    
    // 2. Vérifier dans la base de données
    try {
      const initialDuplicateCheck = await ctx.runAction(
        // @ts-ignore - Type instantiation is excessively deep (known Convex type issue)
        api.bots.detectDecisions.checkDuplicateDecision,
        {
          title: mainArticle.title,
          sourceUrl: mainArticle.url,
        }
      );

      if (initialDuplicateCheck?.isDuplicate) {
        console.log("Event duplicate detected (initial check), skipping:", mainArticle.title);
        return null;
      }
    } catch (error) {
      // Si la vérification échoue, continuer quand même
      console.warn("Error checking duplicates (initial), continuing:", error);
    }

    // Titre et description de l'événement majeur (à générer par IA)
    let eventTitle = mainArticle.title; // Par défaut
    let eventDescription = ""; // À générer par IA

    // Détecter la catégorie de contenu pour adapter le tone of voice
    const contentCategory = detectContentCategory(mainArticle.title, "", articles);

    // Générer un titre et une description journalistiques AVANT l'extraction
    const openaiKeyForSynthesis = process.env.OPENAI_API_KEY;
    if (openaiKeyForSynthesis) {
      try {
        const articlesText = articles
          .slice(0, 10) // Limiter à 10 articles pour éviter un prompt trop long
          .map((a, i) => `Article ${i + 1} (${a.source}): ${a.title}\n${a.content || ""}`)
          .join("\n\n---\n\n");

        // Adapter le prompt selon la catégorie
        const categoryPrompts: Record<ContentCategory, string> = {
          geopolitics: `Tu es un journaliste expert en actualité internationale. Analyse cet ENSEMBLE D'ARTICLES qui couvrent le MÊME ÉVÉNEMENT MAJEUR et génère un titre journalistique clair et une description factuelle.`,
          pop_culture: `Tu es un journaliste expert en pop culture et divertissement. Analyse cet ENSEMBLE D'ARTICLES qui couvrent le MÊME ÉVÉNEMENT MAJEUR et génère un titre accrocheur et une description engageante pour le grand public.`,
          tech_future_sport: `Tu es un journaliste expert en tech, futur et sport narratif. Analyse cet ENSEMBLE D'ARTICLES qui couvrent le MÊME ÉVÉNEMENT MAJEUR et génère un titre clair et une description factuelle qui engage la communauté curieuse.`,
        };

        const eventSynthesisPrompt = `${categoryPrompts[contentCategory]}

ARTICLES (${articles.length} articles couvrant le même événement):
${articlesText}

INSTRUCTIONS STRICTES:

1. TITRE (max 80 caractères):
   ${contentCategory === "geopolitics" ? `- Style journalistique professionnel, factuel et clair
   - Doit expliquer l'événement de manière compréhensible pour le grand public
   - Mentionne l'acteur principal (personne, pays, institution) et l'action/événement
   - Exemples: "Maduro plaide non coupable devant un tribunal de New York", "L'ONU lève les sanctions contre la Syrie"` : contentCategory === "pop_culture" ? `- Style accrocheur et viral, adapté au grand public (Gen Z / Millennials)
   - Doit être partageable sur Instagram/TikTok
   - Mentionne l'acteur principal (artiste, influenceur, événement) et l'action/événement
   - Exemples: "Ce jeu vidéo très attendu sortira-t-il dans les 6 prochains mois ?", "Cet album numéro 1 en France"` : `- Style clair et factuel, adapté à la communauté tech/sport
   - Doit engager les passionnés de tech, futur et sport narratif
   - Mentionne l'acteur principal (entreprise, joueur, événement) et l'action/événement
   - Exemples: "Ce joueur marquera-t-il plus de 30 buts cette saison ?", "Cette fusée réussira-t-elle son amerrissage ?"`}
   - Pas de citation d'article, juste les faits essentiels

2. DESCRIPTION (2-3 phrases, max 250 caractères):
   ${contentCategory === "geopolitics" ? `- Style journalistique factuel et neutre
   - Résume l'événement de manière claire et compréhensible
   - Mentionne les acteurs principaux, le contexte et l'impact` : contentCategory === "pop_culture" ? `- Style engageant et accessible au grand public
   - Résume l'événement de manière claire et partageable
   - Mentionne les acteurs principaux et l'impact viral/communautaire` : `- Style factuel et technique, adapté aux passionnés
   - Résume l'événement de manière claire et engageante
   - Mentionne les acteurs principaux et l'impact tech/sport`}
   - Pas de citation d'article, juste les faits essentiels

Réponds UNIQUEMENT avec du JSON valide:
{
  "title": "titre journalistique clair et factuel",
  "description": "description journalistique factuelle en 2-3 phrases"
}`;

        const synthesisResult = await callOpenAI(openaiKeyForSynthesis, eventSynthesisPrompt, {
          maxTokens: 200, // ✅ OPTIMISÉ: Réduit de 300 à 200 (titre + description courts)
        });

        if (synthesisResult) {
          try {
            let jsonString = synthesisResult.trim();
            const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonString = jsonMatch[0];
            }
            const parsed = JSON.parse(jsonString);
            if (parsed.title) eventTitle = parsed.title;
            if (parsed.description) eventDescription = parsed.description;
          } catch (parseError) {
            console.error("Error parsing event synthesis result:", parseError);
          }
        }
      } catch (error) {
        console.error("Error generating event title/description:", error);
      }
    }

    // Extraire les informations avec IA (si disponible)
    let extracted: {
      decider: string;
      deciderType: "country" | "institution" | "leader" | "organization" | "natural" | "economic";
      type: "law" | "sanction" | "tax" | "agreement" | "policy" | "regulation" | "crisis" | "disaster" | "conflict" | "discovery" | "election" | "economic_event" | "other";
      officialText: string;
      impactedDomains: string[];
      indicatorIds: Id<"indicators">[];
    } = {
      decider: "À déterminer",
      deciderType: "country",
      type: "other",
      officialText: articles.map((a) => a.content || a.title).join("\n\n"),
      impactedDomains: [],
      indicatorIds: [],
    };

    // Prédictions binaires par défaut (seront améliorées par l'IA)
    // ✅ Système binaire : seulement OUI/NON, pas besoin de scénario détaillé
    let question = `Est-ce que cette décision aura des conséquences positives dans les 3 prochains mois ?`;
    let answer1 = `OUI`; // Valeur minimale (requis par le schéma mais non utilisé dans l'UI binaire)
    
    // 🚀 Paramètres IPO (seront calculés par le Master Prompt ou par défaut)
    let targetPrice = 50; // Par défaut : probabilité moyenne
    let depthFactor = 5000; // Par défaut : profondeur modérée

    // Utiliser l'IA si disponible (OpenAI)
    try {
      if (openaiKeyForSynthesis) {
        // Extraction des informations avec GPT-5-mini
        const extractionPrompt = `Extrait les informations suivantes de cet ÉVÉNEMENT MAJEUR de manière OBJECTIVE et FACTUELLE:

Titre: ${eventTitle}
Description: ${eventDescription}
Articles (${articles.length}): ${articles.map((a) => a.title).join("; ")}

INSTRUCTIONS:
1. Décideur/Acteur: Identifie le décideur ou l'acteur principal
   - Répondre UNIQUEMENT avec le nom exact (ex: "États-Unis", "ONU", "Conseil de sécurité de l'ONU", "Joe Biden", "Nature", "Marchés financiers")
   - Si aucun décideur clair (ex: catastrophe naturelle, krach boursier), utiliser "Forces naturelles", "Marchés", "Économie mondiale", etc.
   - Si ambigu, choisir l'acteur principal

2. Type de décideur/acteur: "country" (pays), "institution" (ONU, Otan, etc.), "leader" (dirigeant), "organization" (organisation), "natural" (forces naturelles), "economic" (marchés, économie)

3. Type d'événement: Choisir UNIQUEMENT parmi:
   - "sanction" (sanction, embargo, gel d'avoirs)
   - "accord" (accord diplomatique, traité, sommet)
   - "crisis" (crise économique, diplomatique, financière)
   - "disaster" (catastrophe naturelle: séisme, ouragan, inondation, sécheresse)
   - "conflict" (conflit armé, guerre, intervention militaire)
   - "discovery" (découverte scientifique majeure)
   - "election" (élection majeure, référendum)
   - "economic_event" (krach boursier, inflation majeure, décision banque centrale)
   - "loi" (loi, législation)
   - "politique" (politique gouvernementale)
   - "réglementation" (réglementation, décret)
   - "autre" (si aucun ne correspond)

4. Domaines impactés: Liste de 1-3 domaines parmi:
   économie, énergie, diplomatie, santé, éducation, environnement, social, sécurité, commerce, technologie, climat

Réponds UNIQUEMENT avec du JSON valide (format json_object):
{
  "decider": "nom exact du décideur",
  "deciderType": "country|institution|leader|organization|natural|economic",
  "type": "sanction|accord|intervention|loi|politique|réglementation|autre",
  "impactedDomains": ["domaine1", "domaine2", "domaine3"]
}`;

        const extractionResult = await callOpenAI(openaiKeyForSynthesis, extractionPrompt, {
          responseFormat: "json_object",
          temperature: 0.1,
          maxTokens: 300, // ✅ OPTIMISÉ: Réduit de 500 à 300 (JSON court suffisant)
        });

        if (extractionResult) {
          try {
            // Parser le JSON (peut être dans un bloc markdown ou texte brut)
            let jsonString = extractionResult.trim();
            const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonString = jsonMatch[0];
            }
            const parsed = JSON.parse(jsonString);
            
            if (parsed.decider) extracted.decider = parsed.decider;
            if (parsed.deciderType && ["country", "institution", "leader", "organization", "natural", "economic"].includes(parsed.deciderType)) {
              extracted.deciderType = parsed.deciderType as "country" | "institution" | "leader" | "organization" | "natural" | "economic";
            }
            // Mapper les types français vers anglais (incluant les nouveaux types)
            const typeMap: Record<string, "law" | "sanction" | "tax" | "agreement" | "policy" | "regulation" | "crisis" | "disaster" | "conflict" | "discovery" | "election" | "economic_event" | "other"> = {
              loi: "law",
              sanction: "sanction",
              taxe: "tax",
              accord: "agreement",
              politique: "policy",
              réglementation: "regulation",
              regulation: "regulation",
              crise: "crisis",
              disaster: "disaster",
              catastrophe: "disaster",
              conflit: "conflict",
              guerre: "conflict",
              découverte: "discovery",
              élection: "election",
              election: "election",
              événement_économique: "economic_event",
              economic_event: "economic_event",
              krach: "economic_event",
              autre: "other",
              other: "other",
            };
            if (parsed.type) {
              const normalizedType = parsed.type.toLowerCase().trim();
              if (typeMap[normalizedType]) {
                extracted.type = typeMap[normalizedType];
              }
            }
            if (Array.isArray(parsed.impactedDomains)) {
              extracted.impactedDomains = parsed.impactedDomains.slice(0, 3);
            }
          } catch (parseError) {
            console.error("Error parsing AI extraction result:", parseError);
          }
        }

        // 🚀 MASTER PROMPT : Génération complète du marché en une seule fois
        // Calculer les dates dynamiques pour les exemples
        const now = Date.now();
        const currentYear = new Date(now).getFullYear();
        const nextYear = currentYear + 1;
        const currentMonth = new Date(now).getMonth() + 1; // 1-12
        const isSummer = currentMonth >= 6 && currentMonth <= 8;
        const summerMonths = isSummer ? "cet été" : "l'été prochain";
        const nextYearMonth = currentMonth <= 6 ? "dans les 6 prochains mois" : `avant ${nextYear}`;

        const categoryTones: Record<ContentCategory, string> = {
          geopolitics: "Sérieux & Précis",
          pop_culture: "Provocateur & Hype",
          tech_future_sport: "Sérieux & Précis",
        };

        const masterPrompt = `Tu es l'architecte des marchés de prédiction Seed. Crée un marché binaire (OUI/NON) équilibré et captivant.

SOURCE:
Titre: ${eventTitle}
Description: ${eventDescription}
Contexte: ${articles.map(a => a.title).join(" | ")}
Acteur/Décideur: ${extracted.decider}
Type d'événement: ${extracted.type}
Domaines impactés: ${extracted.impactedDomains.join(", ") || "À déterminer"}

TA MISSION :
Transforme cette news en un marché financier ludique.

1. LA QUESTION (Crucial) :
   - Doit avoir une date limite explicite (ex: "avant le 31 décembre ${nextYear}").
   - Doit être résolvable par OUI ou NON sans ambiguïté.
   - Ton : ${categoryTones[contentCategory]}.
   - Maximum 12-15 mots, compréhensible par un enfant de 12 ans.

2. LES CRITÈRES DE RÉSOLUTION (L'Oracle) :
   - Précise EXACTEMENT quelle source validera le résultat (ex: "Compte Instagram officiel de X", "Site de l'INSEE", "Communiqué de la Maison Blanche").

3. PARAMÈTRES IPO (Psychologie de marché) :
   - initialProbability: Quelle est la probabilité actuelle (0-100%) que le OUI l'emporte selon le sentiment public ?
   - volatilityScore: Est-ce un sujet stable (loi) ou explosif (clash/crypto) ? (Score 0-100).

4. MÉTADONNÉES :
   - sentiment: "positive" (progrès, découverte), "negative" (crise, conflit), ou "neutral"
   - heat: Score d'urgence/importance (0-100)
   - emoji: Un emoji unique représentatif

🛡️ RÈGLES ÉTHIQUES :
- NE JAMAIS générer de questions sur des morts, décès, victimes
- Privilégier les conséquences politiques, économiques, diplomatiques

Réponds en JSON strict :
{
  "marketTitle": "Titre court et percutant (max 50 chars)",
  "marketQuestion": "La question précise avec deadline ?",
  "marketDescription": "Contexte court + mention de l'Oracle/Source de vérité.",
  "resolutionCriteria": "Le OUI l'emporte si [Source] annonce X avant le [Date].",
  "initialProbability": 45,
  "volatilityScore": 80,
  "sentiment": "positive|negative|neutral",
  "heat": 0-100,
  "emoji": "🔥"
}`;

        const masterResult = await callOpenAI(openaiKeyForSynthesis, masterPrompt, {
          responseFormat: "json_object",
          maxTokens: 500,
        });

        if (masterResult) {
          try {
            let jsonString = masterResult.trim();
            const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonString = jsonMatch[0];
            }
            const parsed = JSON.parse(jsonString);
            
            // Extraire les données du Master Prompt
            if (parsed.marketQuestion) question = parsed.marketQuestion;
            if (parsed.marketDescription) eventDescription = parsed.marketDescription;
            if (parsed.marketTitle) eventTitle = parsed.marketTitle;
            
            // Métadonnées de gamification
            if (parsed.sentiment && ["positive", "negative", "neutral"].includes(parsed.sentiment)) {
              sentiment = parsed.sentiment as "positive" | "negative" | "neutral";
            }
            if (typeof parsed.heat === "number" && parsed.heat >= 0 && parsed.heat <= 100) {
              heat = Math.round(parsed.heat);
            }
            if (parsed.emoji) {
              emoji = parsed.emoji.trim();
            }
            
            // 🚀 CALCUL DYNAMIQUE IPO 2.0 basé sur les données du Master Prompt
            targetPrice = typeof parsed.initialProbability === "number" 
              ? Math.max(1, Math.min(99, Math.round(parsed.initialProbability))) 
              : 50;
            
            // La profondeur dépend de la volatilité
            // Plus c'est volatil, MOINS on met de profondeur (permet variations rapides = Gamification)
            // Moins c'est volatil, PLUS on met de profondeur (stabilise)
            const volatilityScore = typeof parsed.volatilityScore === "number" 
              ? Math.max(0, Math.min(100, parsed.volatilityScore)) 
              : 50;
            
            depthFactor = 10000 - (volatilityScore * 80);
            depthFactor = Math.max(2000, Math.min(10000, Math.round(depthFactor)));

            // Calculer la couleur du badge
            badgeColor = calculateBadgeColor(heat, sentiment);
            
            // Stocker les critères de résolution pour utilisation future
            const resolutionCriteria = parsed.resolutionCriteria || "";
            
          } catch (parseError) {
            console.error("Error parsing AI master result:", parseError);
            console.error("Raw response:", masterResult);
            // En cas d'erreur, utiliser les valeurs par défaut
            question = `Est-ce que cette décision aura des conséquences positives pour ${extracted.decider} dans les 3 prochains mois ?`;
            badgeColor = calculateBadgeColor(heat, sentiment);
          }
        } else {
          // Si l'IA ne retourne rien, utiliser les valeurs par défaut
          question = `Est-ce que cette décision aura des conséquences positives pour ${extracted.decider} dans les 3 prochains mois ?`;
          badgeColor = calculateBadgeColor(heat, sentiment);
        }
      }
    } catch (error) {
      console.error("Error using AI for decision generation:", error);
      // Continuer avec les valeurs par défaut
      badgeColor = calculateBadgeColor(heat, sentiment);
    }

    // ✅ Utiliser l'IA pour générer PLUSIEURS requêtes optimales (Phase 1 : Multi-requêtes)
    let imageQueries: string[] = [];
    
    if (openaiKeyForSynthesis) {
      try {
        const imageQueryPrompt = `Tu es un expert en recherche d'images pour l'actualité internationale. Analyse le CONTEXTE et le SENS de cet événement majeur pour générer 3-5 requêtes de recherche d'image INTELLIGENTES et PERTINENTES (2-4 mots-clés en anglais chacune).

ÉVÉNEMENT:
Titre: ${eventTitle}
Description: ${eventDescription}
Décideur/Acteur principal: ${extracted.decider}
Type d'événement: ${extracted.type}
Domaines impactés: ${extracted.impactedDomains.join(", ") || "Non spécifié"}
Sentiment: ${sentiment}
Articles sources (${articles.length}): ${articles.slice(0, 3).map(a => a.title).join("; ")}

INSTRUCTIONS CRITIQUES:
1. **COMPRENDS LE SENS** de l'événement, pas juste les entités nommées
   - Qu'est-ce qui se passe concrètement ? (procès, négociations, catastrophe, découverte, etc.)
   - Quel est le contexte visuel le plus représentatif ?
   - Quelle image illustrerait le mieux l'événement pour un lecteur ?

2. **PRIORITÉ AU CONTEXTE VISUEL** plutôt qu'aux noms propres
   - Si c'est un procès → "courtroom trial" ou "court hearing"
   - Si c'est une négociation de paix → "peace talks" ou "diplomatic meeting"
   - Si c'est une catastrophe → "natural disaster" ou le type spécifique (ex: "earthquake", "flood")
   - Si c'est une découverte scientifique → "scientific discovery" ou le domaine (ex: "medical breakthrough")
   - Si c'est un conflit → "military conflict" ou "war zone"
   - Si c'est une élection → "election voting" ou "ballot box"

3. **AJOUTER L'ENTITÉ PRINCIPALE** seulement si elle apporte de la pertinence
   - Si l'événement est spécifiquement lié à une personne connue → ajouter son nom
   - Si l'événement est lié à un lieu spécifique → ajouter le nom du pays/lieu
   - Sinon, privilégier le contexte visuel seul

4. **ÉVITER** les mots génériques sans contexte
   ❌ MAUVAIS: "politics", "news", "international", "government", "leader"
   ✅ BON: "courtroom", "peace negotiations", "election campaign", "scientific laboratory"

EXEMPLES INTELLIGENTS:
- "Maduro plaide non coupable devant un tribunal" → "courtroom trial" ou "court hearing" (le contexte visuel est le procès, pas juste Maduro)
- "Accord de paix pour l'Ukraine" → "peace talks" ou "diplomatic meeting" (le contexte est la négociation)
- "Séisme majeur au Japon" → "earthquake Japan" (catastrophe + lieu)
- "Découverte médicale majeure" → "medical breakthrough" ou "scientific discovery" (le contexte est la découverte)
- "Élection présidentielle en Centrafrique" → "election voting" ou "ballot box" (le contexte est l'élection)
- "Tentative de coup d'État au Burkina Faso" → "military coup" ou "political unrest" (le contexte est le coup d'État)

FORMAT:
- 2-4 mots-clés maximum en anglais
- Toujours en anglais (Pexels est en anglais)
- Priorité au contexte visuel, puis à l'entité si pertinente
- Pas de mots génériques ou abstraits

RÉPONSE ATTENDUE:
JSON avec un tableau de 3-5 requêtes différentes, chacune avec une approche différente (contextuelle, entité, type, domaine):
{
  "queries": [
    "requête 1 (approche contextuelle)",
    "requête 2 (approche entité si pertinente)",
    "requête 3 (approche type d'événement)",
    "requête 4 (approche domaine impacté)",
    "requête 5 (combinaison optimale)"
  ]
}

Chaque requête doit être 2-4 mots-clés en anglais, sans guillemets.`;

        const aiImageQueriesResult = await callOpenAI(openaiKeyForSynthesis, imageQueryPrompt, {
          maxTokens: 150, // ✅ OPTIMISÉ: Réduit de 200 à 150 (JSON avec 3-5 requêtes)
        });
        
        if (aiImageQueriesResult) {
          try {
            // Parser le JSON
            let jsonString = aiImageQueriesResult.trim();
            const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonString = jsonMatch[0];
            }
            const parsed = JSON.parse(jsonString);
            
            if (parsed.queries && Array.isArray(parsed.queries) && parsed.queries.length > 0) {
              // Nettoyer et valider chaque requête
              const frenchToEnglish: Record<string, string> = {
                "france": "France",
                "états-unis": "United States",
                "royaume-uni": "United Kingdom",
                "corée du nord": "North Korea",
                "corée du sud": "South Korea",
                "centrafrique": "Central African Republic",
                "république centrafricaine": "Central African Republic",
                "burkina faso": "Burkina Faso",
              };
              
              imageQueries = parsed.queries
                .map((q: string) => {
                  let cleaned = q.trim().replace(/["'`]/g, "").substring(0, 50);
                  const lower = cleaned.toLowerCase();
                  for (const [french, english] of Object.entries(frenchToEnglish)) {
                    if (lower.includes(french)) {
                      cleaned = cleaned.replace(new RegExp(french, "gi"), english);
                    }
                  }
                  return cleaned;
                })
                .filter((q: string) => q.length > 5)
                .slice(0, 5); // Max 5 requêtes
              
              console.log(`✅ ${imageQueries.length} requêtes générées par IA`);
            }
          } catch (parseError) {
            console.error("Error parsing AI image queries:", parseError);
            // Fallback : essayer d'extraire une seule requête du texte
            const singleQuery = aiImageQueriesResult.trim().replace(/["'`]/g, "").substring(0, 50);
            if (singleQuery.length > 5) {
              imageQueries = [singleQuery];
            }
          }
        }
        
        // Fallback si pas de requêtes valides
        if (imageQueries.length === 0) {
          const fallbackQuery = buildImageSearchQuery(
            extracted.decider,
            extracted.deciderType,
            extracted.type,
            extracted.impactedDomains,
            eventTitle
          );
          imageQueries = [fallbackQuery];
        }
      } catch (error) {
        console.error("Error generating image queries with AI:", error);
        // Fallback si l'IA échoue
        const fallbackQuery = buildImageSearchQuery(
          extracted.decider,
          extracted.deciderType,
          extracted.type,
          extracted.impactedDomains,
          eventTitle
        );
        imageQueries = [fallbackQuery];
      }
    } else {
      // Fallback si pas de clé OpenAI
      const fallbackQuery = buildImageSearchQuery(
        extracted.decider,
        extracted.deciderType,
        extracted.type,
        extracted.impactedDomains,
        eventTitle
      );
      imageQueries = [fallbackQuery];
    }

    // ✅ Rechercher image libre de droits avec validation IA (Phase 2)
    let imageUrl: string | undefined;
    let imageSource: string | undefined;
    try {
      const imageResult = await ctx.runAction(
        api.bots.generateDecision.searchFreeImage,
        {
          queries: imageQueries, // ✅ Multi-requêtes
          eventContext: { // ✅ Contexte pour validation
            title: eventTitle,
            description: eventDescription || eventTitle,
            type: extracted.type,
            decider: extracted.decider,
            sentiment: sentiment,
          },
        }
      );
      if (imageResult) {
        imageUrl = imageResult.url;
        imageSource = imageResult.source;
        console.log(`✅ Image sélectionnée avec score: ${imageResult.relevanceScore}/100`);
      }
    } catch (error) {
      console.error("Error searching for image:", error);
    }

    // Générer un slug unique basé sur le titre de l'événement
    const slug = eventTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 100);

    // Vérification finale après génération du titre (plus précis)
    // Cette vérification utilise le titre final généré par l'IA + description pour comparaison sémantique
    // 1. Vérifier d'abord dans le cache de la batch actuelle (avec le titre généré)
    const duplicateInBatchFinal = createdInThisBatch.find(
      (d) =>
        d.title.toLowerCase() === eventTitle.toLowerCase() ||
        d.sourceUrl === mainArticle.url
    );
    
    if (duplicateInBatchFinal) {
      console.log("Event duplicate detected (in current batch, final check), skipping:", eventTitle);
      return null;
    }
    
    // 2. Vérifier dans la base de données
    try {
      const finalDuplicateCheck = await ctx.runAction(
        // @ts-ignore - Type instantiation is excessively deep (known Convex type issue)
        api.bots.detectDecisions.checkDuplicateDecision,
        {
          title: eventTitle, // Titre final généré
          sourceUrl: mainArticle.url,
          description: eventDescription || eventTitle, // Description pour comparaison sémantique
        }
      );

      if (finalDuplicateCheck?.isDuplicate) {
        console.log("Event duplicate detected (final check with generated title), skipping:", eventTitle);
        return null;
      }
    } catch (error) {
      // Si la vérification échoue, continuer quand même (ne pas bloquer la création)
      console.warn("Error checking duplicates (final), continuing:", error);
    }

    // Vérifier que le slug est unique
    const existing = await ctx.runQuery(api.decisions.getDecisionBySlug, {
      slug,
    });

    let finalSlug = slug;
    if (existing) {
      // Ajouter un suffixe numérique si le slug existe déjà
      let counter = 1;
      while (existing) {
        finalSlug = `${slug}-${counter}`;
        const check = await ctx.runQuery(api.decisions.getDecisionBySlug, {
          slug: finalSlug,
        });
        if (!check) break;
        counter++;
      }
    }

    // ✅ Générer le hash de contenu pour déduplication optimisée
    // Note: On doit importer generateContentHash depuis detectDecisions ou le recréer ici
    // Pour éviter les dépendances circulaires, on le recrée ici
    function generateContentHash(title: string, sourceUrl: string): string {
      const content = `${title.toLowerCase().trim()}|${sourceUrl}`;
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
    }
    
    const contentHash = generateContentHash(eventTitle, mainArticle.url);

    // 🛡️ FILTRE ÉTHIQUE : Vérifier que la décision ne contient pas de contenu sensible/morbide
    const shouldBlockDecision = checkEthicalFilter({
      title: eventTitle,
      description: eventDescription || eventTitle,
      question: question,
      type: extracted.type,
    });

    if (shouldBlockDecision) {
      console.log(`🚫 Decision blocked by ethical filter: ${eventTitle}`);
      return null;
    }

    // 🚀 Les paramètres IPO sont déjà calculés par le Master Prompt
    // Si pas de Master Prompt (pas d'IA), utiliser calculateIPOParameters en fallback
    if (targetPrice === 50 && depthFactor === 5000) {
      // Fallback : utiliser l'ancienne méthode si pas de Master Prompt
      const fallbackIPO = calculateIPOParameters({
        heat,
        sentiment,
        type: extracted.type,
      });
      targetPrice = fallbackIPO.targetPrice;
      depthFactor = fallbackIPO.depthFactor;
    }

    // Créer la Decision Card
    const decisionId = await ctx.runMutation(api.decisions.createDecision, {
      title: eventTitle,
      description: eventDescription || eventTitle, // Fallback si description vide
      slug: finalSlug,
      contentHash, // ✅ Ajouter le hash pour déduplication optimisée
      decider: extracted.decider,
      deciderType: extracted.deciderType,
      date: mainArticle.publishedAt, // Date de l'article principal
      type: extracted.type,
      officialText: extracted.officialText,
      sourceUrl: mainArticle.url, // URL de l'article principal
      sourceName: mainArticle.source,
      impactedDomains: extracted.impactedDomains,
      indicatorIds: extracted.indicatorIds,
      question,
      answer1,
      // answer2 et answer3 supprimés (système binaire)
      // 🚀 PARAMÈTRES IPO CALCULÉS DYNAMIQUEMENT
      targetPrice, // Prix de départ (1-99 Seeds)
      depthFactor, // Profondeur du marché (500-10000)
      imageUrl,
      imageSource,
      createdBy: "bot",
      sentiment,
      heat,
      emoji,
      badgeColor,
    });

    // ⚠️ SUPPRIMÉ: Sauvegarde des articles en base (plus nécessaire)
    // Les actualités sont maintenant récupérées côté client via RelatedNewsClient (RSS)
    // Cela évite les coûts de stockage et d'API backend

    // Mettre à jour les stats du bot Générateur
    await updateBotActivity(ctx, {
      botSlug: "generateur",
      decisionsCreated: 1,
      logMessage: `Décision créée: ${eventTitle.substring(0, 50)}...`,
      logLevel: "success",
      functionName: "generateDecision",
    });

    // ✅ Traduire automatiquement la décision dans toutes les langues supportées
    try {
      const supportedLanguages = ["en", "es", "de", "it", "pt"]; // Langues supportées
      console.log(`[${new Date().toISOString()}] 🌍 Starting automatic translation for decision ${decisionId}...`);
      
      // Traduire en parallèle (mais avec un délai pour éviter de surcharger l'API)
      for (const lang of supportedLanguages) {
        try {
          await ctx.runAction(api.decisionTranslations.translateDecision, {
            decisionId,
            targetLanguage: lang,
            sourceLanguage: "fr",
          });
          console.log(`[${new Date().toISOString()}] ✅ Translated to ${lang}`);
        } catch (error) {
          console.error(`[${new Date().toISOString()}] ❌ Error translating to ${lang}:`, error);
          // Continuer avec les autres langues même en cas d'erreur
        }
        // Petit délai entre chaque traduction pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`[${new Date().toISOString()}] ✅ Automatic translation completed for decision ${decisionId}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Error in automatic translation:`, error);
      // Ne pas faire échouer la création de la décision si la traduction échoue
    }

    return decisionId;
  },
});

/**
 * 🛡️ Filtre éthique : Vérifie si une décision doit être bloquée
 * 
 * Bloque les décisions qui :
 * - Font référence à des morts, décès, victimes de manière morbide
 * - Sont trop sensibles ou exploitent des tragédies humaines
 * - Contiennent des prédictions sur des catastrophes avec pertes humaines
 */
function checkEthicalFilter(params: {
  title: string;
  description: string;
  question: string;
  type: string;
}): boolean {
  const { title, description, question, type } = params;
  
  // Mots-clés sensibles à bloquer (morts, décès, victimes, etc.)
  const sensitiveKeywords = [
    // Morts et décès
    /\b(mort|morts|décès|décédé|décédés|victime|victimes|tué|tués|assassiné|assassinés)\b/i,
    // Catastrophes avec pertes humaines
    /\b(plus de \d+ morts?|au moins \d+ morts?|au moins \d+ décès|plus de \d+ décès|plus de \d+ victimes)\b/i,
    // Formulations morbides
    /\b(périr|péris|mourir|mourront|mourra|mouriront)\b/i,
    // Tragédies humaines
    /\b(tragédie|tragédies|massacre|massacres|génocide|génocides)\b/i,
  ];

  // Vérifier dans le titre, la description et la question
  const textToCheck = `${title} ${description} ${question}`.toLowerCase();
  
  // Vérifier si un mot-clé sensible est présent
  for (const keyword of sensitiveKeywords) {
    if (keyword.test(textToCheck)) {
      return true; // Bloquer la décision
    }
  }

  // Bloquer spécifiquement les questions qui demandent des prédictions sur des morts
  const deathPredictionPatterns = [
    /\b(y aura-t-il|y aura|il y aura|sera-t-il|seront-ils)\s+(plus de|au moins|au moins)\s+\d+\s+(mort|morts|décès|victime|victimes)\b/i,
    /\b(combien de|nombre de)\s+(mort|morts|décès|victime|victimes)\b/i,
  ];

  for (const pattern of deathPredictionPatterns) {
    if (pattern.test(question)) {
      return true; // Bloquer la décision
    }
  }

  return false; // Ne pas bloquer
}

/**
 * 🚀 Calcule les paramètres IPO (Initial Political Offering) dynamiquement
 * 
 * @param params - Paramètres de la décision
 * @returns targetPrice (1-99 Seeds) et depthFactor (500-10000)
 * 
 * STRATÉGIE :
 * - targetPrice : Probabilité initiale perçue
 *   - Heat élevé + Sentiment positif → Prix élevé (événement probable)
 *   - Heat faible + Sentiment négatif → Prix faible (événement improbable)
 * 
 * - depthFactor : Volatilité du marché
 *   - Type volatile (crisis, conflict, disaster) + Heat élevé → Faible profondeur (marché "Meme Coin")
 *   - Type stable (election, law, regulation) + Heat faible → Élevée profondeur (marché "Blue Chip")
 */
function calculateIPOParameters(params: {
  heat: number; // 0-100
  sentiment: "positive" | "negative" | "neutral";
  type: "law" | "sanction" | "tax" | "agreement" | "policy" | "regulation" | "crisis" | "disaster" | "conflict" | "discovery" | "election" | "economic_event" | "other";
}): { targetPrice: number; depthFactor: number } {
  const { heat, sentiment, type } = params;
  
  // 🎯 CALCUL DU TARGET PRICE (1-99 Seeds) - Probabilité initiale
  // Base : 50 Seeds (probabilité moyenne)
  let targetPrice = 50;
  
  // Ajustement selon le sentiment
  if (sentiment === "positive") {
    // Événements positifs tendent à être plus probables (optimisme)
    targetPrice += 15; // +15 Seeds
  } else if (sentiment === "negative") {
    // Événements négatifs tendent à être moins probables (espoir qu'ils n'arrivent pas)
    targetPrice -= 15; // -15 Seeds
  }
  // Neutral reste à 50
  
  // Ajustement selon le heat (0-100)
  // Heat élevé = événement plus "réel" et donc plus probable
  const heatAdjustment = (heat - 50) * 0.4; // -20 à +20 Seeds selon heat
  targetPrice += heatAdjustment;
  
  // Ajustement selon le type d'événement
  const typeAdjustments: Record<string, number> = {
    // Événements généralement plus probables
    "election": +10, // Les élections arrivent souvent
    "law": +5, // Les lois sont souvent adoptées
    "regulation": +5,
    "agreement": +8, // Les accords sont souvent signés
    
    // Événements généralement moins probables
    "disaster": -10, // Les catastrophes sont rares
    "discovery": -5, // Les découvertes majeures sont rares
    "conflict": -8, // Les conflits majeurs sont moins fréquents
    
    // Événements neutres
    "crisis": 0,
    "economic_event": 0,
    "sanction": 0,
    "tax": 0,
    "policy": 0,
    "other": 0,
  };
  
  targetPrice += typeAdjustments[type] || 0;
  
  // Clamper entre 1 et 99 Seeds
  targetPrice = Math.max(1, Math.min(99, Math.round(targetPrice)));
  
  // 🎯 CALCUL DU DEPTH FACTOR (500-10000) - Volatilité du marché
  // Base : 5000 (marché modéré)
  let depthFactor = 5000;
  
  // Types volatils (marché "Meme Coin" - peu de Seeds = gros mouvement)
  const volatileTypes: string[] = ["crisis", "conflict", "disaster", "economic_event"];
  if (volatileTypes.includes(type)) {
    depthFactor -= 2000; // Réduire la profondeur (plus volatile)
  }
  
  // Types stables (marché "Blue Chip" - beaucoup de Seeds = petit mouvement)
  const stableTypes: string[] = ["election", "law", "regulation", "policy"];
  if (stableTypes.includes(type)) {
    depthFactor += 3000; // Augmenter la profondeur (plus stable)
  }
  
  // Ajustement selon le heat
  // Heat élevé = plus de buzz = plus volatile
  const heatVolatilityAdjustment = (heat - 50) * 20; // -1000 à +1000 selon heat
  depthFactor -= heatVolatilityAdjustment;
  
  // Clamper entre 500 (très volatile) et 10000 (très stable)
  depthFactor = Math.max(500, Math.min(10000, Math.round(depthFactor)));
  
  return { targetPrice, depthFactor };
}

/**
 * Calcule la couleur du badge selon le heat (0-100) et le sentiment
 * Bleu (froid) → Vert (tiède) → Rouge (chaud)
 */
function calculateBadgeColor(heat: number, sentiment: "positive" | "negative" | "neutral"): string {
  // Normaliser le heat entre 0 et 1
  const normalizedHeat = Math.max(0, Math.min(100, heat)) / 100;

  // Ajuster selon le sentiment
  let hue: number;
  if (sentiment === "positive") {
    // Vert pour positif (120° en HSL)
    hue = 120 - (normalizedHeat * 30); // 120° (vert) à 90° (vert-jaune)
  } else if (sentiment === "negative") {
    // Rouge pour négatif (0° en HSL)
    hue = 0 + (normalizedHeat * 30); // 0° (rouge) à 30° (rouge-orange)
  } else {
    // Bleu pour neutre (210° en HSL) qui devient vert puis rouge avec le heat
    hue = 210 - (normalizedHeat * 210); // 210° (bleu) → 0° (rouge)
  }

  // Saturation et luminosité
  const saturation = 60 + (normalizedHeat * 30); // 60% à 90%
  const lightness = 50 - (normalizedHeat * 10); // 50% à 40% (plus sombre = plus chaud)

  // Convertir HSL en hex
  const h = hue / 360;
  const s = saturation / 100;
  const l = lightness / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h * 6 < 1) {
    r = c; g = x; b = 0;
  } else if (h * 6 < 2) {
    r = x; g = c; b = 0;
  } else if (h * 6 < 3) {
    r = 0; g = c; b = x;
  } else if (h * 6 < 4) {
    r = 0; g = x; b = c;
  } else if (h * 6 < 5) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * ✅ Valide la pertinence d'une image avec scoring IA (Phase 2)
 */
async function validateImageRelevance(
  image: {
    url: string;
    photographer: string;
    alt?: string;
    description?: string;
  },
  eventContext: {
    title: string;
    description: string;
    type: string;
    decider: string;
    sentiment: "positive" | "negative" | "neutral";
  },
  openaiKey: string
): Promise<{ score: number; reason: string }> {
  try {
    const validationPrompt = `Tu es un expert en validation d'images pour l'actualité internationale. Analyse si cette image est pertinente pour illustrer cet événement.

ÉVÉNEMENT:
- Titre: ${eventContext.title}
- Description: ${eventContext.description}
- Type: ${eventContext.type}
- Décideur/Acteur: ${eventContext.decider}
- Sentiment: ${eventContext.sentiment}

IMAGE:
- Description/Tags: ${image.description || image.alt || "Non disponible"}
- Photographe: ${image.photographer}

INSTRUCTIONS:
1. Score de pertinence de 0 à 100
2. 0-30 = Complètement hors sujet
3. 31-50 = Légèrement lié mais pas vraiment pertinent
4. 51-70 = Assez pertinent mais pourrait être mieux
5. 71-85 = Très pertinent
6. 86-100 = Parfaitement pertinent

Réponds UNIQUEMENT avec du JSON:
{
  "score": 75,
  "reason": "L'image montre un contexte de procès qui correspond bien à l'événement"
}`;

    const result = await callOpenAI(openaiKey, validationPrompt, {
      maxTokens: 100, // ✅ OPTIMISÉ: Réduit de 200 à 100 (JSON court suffisant)
    });

    if (result) {
      try {
        let jsonString = result.trim();
        const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
        const parsed = JSON.parse(jsonString);
        return {
          score: Math.max(0, Math.min(100, parsed.score || 0)),
          reason: parsed.reason || "Score généré",
        };
      } catch (parseError) {
        console.error("Error parsing validation result:", parseError);
      }
    }
  } catch (error) {
    console.error("Error validating image relevance:", error);
  }

  // Fallback : score neutre si validation échoue
  return { score: 50, reason: "Validation échouée, score par défaut" };
}

/**
 * ✅ Recherche une image libre de droits pertinente avec validation IA (Phase 1 + 2)
 */
export const searchFreeImage = action({
  args: {
    queries: v.optional(v.array(v.string())), // ✅ Multi-requêtes (nouveau)
    query: v.optional(v.string()), // ✅ Ancienne signature (compatibilité)
    eventContext: v.optional(v.object({ // ✅ Contexte pour validation
      title: v.string(),
      description: v.string(),
      type: v.string(),
      decider: v.string(),
      sentiment: v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral")),
    })),
  },
  handler: async (ctx, args) => {
    // ✅ Compatibilité avec ancienne signature
    let queries: string[] = [];
    if (args.queries && args.queries.length > 0) {
      queries = args.queries;
    } else if (args.query) {
      queries = [args.query];
    } else {
      return null;
    }

    // ✅ Fallback si pas de contexte (ancien comportement)
    if (!args.eventContext) {
      // Mode compatibilité : pas de validation IA, retourner première image
      const pexelsKey = process.env.PEXELS_API_KEY;
      if (!pexelsKey) {
        return null;
      }

      try {
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(
            queries[0]
          )}&per_page=1&orientation=landscape`,
          {
            headers: {
              Authorization: pexelsKey,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.photos && data.photos.length > 0) {
            const photo = data.photos[0];
            return {
              url: photo.src?.large || photo.src?.original || "",
              source: "Pexels",
              photographer: photo.photographer || "Unknown",
              relevanceScore: 50, // Score par défaut
            };
          }
        }
      } catch (error) {
        console.error("Error fetching Pexels image (compat mode):", error);
      }

      return null;
    }

    const eventContext = args.eventContext;
    const pexelsKey = process.env.PEXELS_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!pexelsKey) {
      return null;
    }

    // ✅ OPTIMISÉ: Récupérer top 3 images pour chaque requête (au lieu de 5) pour réduire consommation OpenAI
    const allCandidates: Array<{
      url: string;
      photographer: string;
      alt?: string;
      description?: string;
      query: string;
    }> = [];

    for (const query of queries) {
      try {
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(
            query
          )}&per_page=3&orientation=landscape`, // ✅ OPTIMISÉ: 3 images au lieu de 5
          {
            headers: {
              Authorization: pexelsKey,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.photos && data.photos.length > 0) {
            for (const photo of data.photos) {
              allCandidates.push({
                url: photo.src?.large || photo.src?.original || "",
                photographer: photo.photographer || "Unknown",
                alt: photo.alt || undefined,
                description: photo.alt || undefined,
                query: query,
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching Pexels images for query "${query}":`, error);
        // Continuer avec la requête suivante
      }
    }

    if (allCandidates.length === 0) {
      return null;
    }

    // ✅ OPTIMISÉ: Valider seulement les 5 meilleures images (au lieu de toutes) pour réduire consommation OpenAI
    if (openaiKey && eventContext) {
      // Limiter à 5 images pour validation (les plus prometteuses)
      const imagesToValidate = allCandidates.slice(0, 5);
      console.log(`🔍 Validation de ${imagesToValidate.length} images candidates (sur ${allCandidates.length} totales)...`);
      
      const scoredImages = await Promise.all(
        imagesToValidate.map(async (img) => {
          const validation = await validateImageRelevance(img, eventContext, openaiKey);
          return {
            ...img,
            relevanceScore: validation.score,
            reason: validation.reason,
          };
        })
      );
      
      // Ajouter les images non validées avec score par défaut (50)
      const unvalidatedImages = allCandidates.slice(5).map(img => ({
        ...img,
        relevanceScore: 50,
        reason: "Non validée (limite de validation)",
      }));
      
      const allScoredImages = [...scoredImages, ...unvalidatedImages];

      // ✅ Filtrer et trier : score >= 70, puis par score décroissant
      const validImages = allScoredImages
        .filter((img) => img.relevanceScore >= 70)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      if (validImages.length > 0) {
        const bestImage = validImages[0];
        console.log(`✅ Image sélectionnée: score ${bestImage.relevanceScore}/100 (${bestImage.reason})`);
        return {
          url: bestImage.url,
          source: "Pexels",
          photographer: bestImage.photographer,
          relevanceScore: bestImage.relevanceScore,
        };
      } else {
        // Aucune image avec score >= 70, prendre la meilleure disponible
        const bestAvailable = allScoredImages.sort((a, b) => b.relevanceScore - a.relevanceScore)[0];
        console.log(`⚠️ Aucune image avec score >= 70, meilleure disponible: ${bestAvailable.relevanceScore}/100`);
        return {
          url: bestAvailable.url,
          source: "Pexels",
          photographer: bestAvailable.photographer,
          relevanceScore: bestAvailable.relevanceScore,
        };
      }
    } else {
      // ✅ Fallback si pas d'OpenAI : prendre la première image (comportement original)
      console.log(`⚠️ Pas de clé OpenAI, utilisation de la première image trouvée`);
      return {
        url: allCandidates[0].url,
        source: "Pexels",
        photographer: allCandidates[0].photographer,
        relevanceScore: 50, // Score par défaut
      };
    }
  },
});

/**
 * Construit une requête de recherche d'image contextuelle et abstraite
 * Évite les images génériques en privilégiant l'abstraction et le style
 */
function buildImageSearchQuery(
  decider: string,
  deciderType: "country" | "institution" | "leader" | "organization" | "natural" | "economic",
  type: "law" | "sanction" | "tax" | "agreement" | "policy" | "regulation" | "crisis" | "disaster" | "conflict" | "discovery" | "election" | "economic_event" | "other",
  impactedDomains: string[],
  title: string
): string {
  // Mots-clés de style pour Pexels/Unsplash (éviter les images génériques)
  const styleKeywords = ["cinematic", "moody", "dark", "neon", "abstract", "atmospheric", "dramatic"];
  const randomStyle = styleKeywords[Math.floor(Math.random() * styleKeywords.length)];
  // PRIORITÉ ABSOLUE: Le décideur/acteur principal (personne, pays, institution)
  const keywords: string[] = [];

  if (decider && decider !== "À déterminer" && decider !== "non spécifié") {
    // Nettoyer le nom du décideur (enlever les titres, etc.)
    const cleanDecider = decider
      .replace(/^(président|premier ministre|gouvernement|état|pays|régime|régime de|régime du|le|la|les)\s+/i, "")
      .trim();
    
    if (cleanDecider.length > 2) {
      // Traduire les noms de pays et institutions courants en anglais (Pexels est en anglais)
      const translations: Record<string, string> = {
        // Pays en français → anglais
        "france": "France",
        "états-unis": "United States",
        "usa": "United States",
        "royaume-uni": "United Kingdom",
        "uk": "United Kingdom",
        "allemagne": "Germany",
        "espagne": "Spain",
        "italie": "Italy",
        "chine": "China",
        "russie": "Russia",
        "japon": "Japan",
        "corée du nord": "North Korea",
        "corée du sud": "South Korea",
        "vénézuéla": "Venezuela",
        "venezuela": "Venezuela",
        "syrie": "Syria",
        "ukraine": "Ukraine",
        "iran": "Iran",
        "israël": "Israel",
        "palestine": "Palestine",
        "burkina faso": "Burkina Faso",
        "centrafrique": "Central African Republic",
        "république centrafricaine": "Central African Republic",
        "australie": "Australia",
        "canada": "Canada",
        "mexique": "Mexico",
        "brésil": "Brazil",
        "inde": "India",
        "pakistan": "Pakistan",
        "afghanistan": "Afghanistan",
        "irak": "Iraq",
        "iraq": "Iraq",
        "arabie saoudite": "Saudi Arabia",
        "égypte": "Egypt",
        "turquie": "Turkey",
        "grèce": "Greece",
        "portugal": "Portugal",
        "pays-bas": "Netherlands",
        "belgique": "Belgium",
        "suisse": "Switzerland",
        "autriche": "Austria",
        "pologne": "Poland",
        "hongrie": "Hungary",
        "roumanie": "Romania",
        "bulgarie": "Bulgaria",
        "serbie": "Serbia",
        "croatie": "Croatia",
        "afrique du sud": "South Africa",
        "nigeria": "Nigeria",
        "kenya": "Kenya",
        "éthiopie": "Ethiopia",
        "soudan": "Sudan",
        "libye": "Libya",
        "tunisie": "Tunisia",
        "algérie": "Algeria",
        "maroc": "Morocco",
        "yémen": "Yemen",
        "jordanie": "Jordan",
        "liban": "Lebanon",
        // Institutions en français → anglais
        "onu": "United Nations",
        "nations unies": "United Nations",
        "otan": "NATO",
        "union européenne": "European Union",
        "ue": "European Union",
        "fmi": "IMF",
        "fonds monétaire international": "IMF",
        "banque mondiale": "World Bank",
        "oms": "WHO",
        "organisation mondiale de la santé": "WHO",
      };
      
      const lowerDecider = cleanDecider.toLowerCase();
      if (translations[lowerDecider]) {
        // Traduire en anglais pour Pexels
        keywords.push(translations[lowerDecider]);
      } else {
        // Si c'est un nom de personne (commence par majuscule, plusieurs mots), garder tel quel
        // Les noms de personnes sont généralement les mêmes en français et anglais
        // Si c'est un pays/institution non traduit, essayer de le garder tel quel
        // (peut être déjà en anglais ou un nom propre international)
        keywords.push(cleanDecider);
      }
    }
  }

  // Adapter selon la catégorie de contenu et le type d'événement
  // Pop Culture : vibrant, énergique (priorité)
  if (impactedDomains.includes("divertissement") || impactedDomains.includes("musique")) {
    if (keywords.length > 0) {
      return `${keywords[0]} concert crowd atmosphere neon`;
    }
    return "concert crowd atmosphere neon";
  }
  
  // Adapter selon le type d'événement
  switch (type) {
    case "conflict":
    case "crisis":
    case "sanction":
      // Géopolitique / Conflit : sérieux, sombre, abstrait
      if (keywords.length > 0) {
        return `${keywords[0]} city street night ${randomStyle} abstract`;
      }
      return `city street night ${randomStyle} abstract`;
    
    case "discovery":
    case "economic_event":
      // Tech/Sport / Découverte : moderne, dynamique
      if (keywords.length > 0) {
        return `${keywords[0]} technology innovation ${randomStyle}`;
      }
      return `technology innovation ${randomStyle}`;
    
    default:
      // Fallback intelligent : décideur + style
      if (keywords.length > 0) {
        return `${keywords[0]} ${randomStyle}`;
      }
      return `international news ${randomStyle}`;
  }
}

/**
 * Appelle l'API OpenAI pour générer du contenu
 */
async function callOpenAI(
  apiKey: string,
  prompt: string,
  options?: {
    responseFormat?: "json_object" | "text";
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string | null> {
  try {
    const body: any = {
      model: "gpt-5-mini", // GPT-5-mini selon la doc 2026
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant objectif et factuel. Tu réponds uniquement avec des faits, sans opinion ni orientation politique.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      reasoning_effort: "minimal", // Pour gpt-5-mini, utiliser "minimal" au lieu de "none"
      // temperature n'est pas supporté avec reasoning_effort: "minimal" pour gpt-5-mini (seule valeur par défaut 1)
      max_completion_tokens: options?.maxTokens ?? 4000, // Pour gpt-5-mini, utiliser max_completion_tokens au lieu de max_tokens
    };

    // Note: response_format peut ne pas être compatible avec reasoning_effort pour gpt-5-mini
    // On parse le JSON manuellement si nécessaire
    // if (options?.responseFormat === "json_object") {
    //   body.response_format = { type: "json_object" };
    // }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return null;
  }
}


