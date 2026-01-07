import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { updateBotActivity } from "./helpers";

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

    // Générer un titre et une description journalistiques AVANT l'extraction
    const openaiKeyForSynthesis = process.env.OPENAI_API_KEY;
    if (openaiKeyForSynthesis) {
      try {
        const articlesText = articles
          .slice(0, 10) // Limiter à 10 articles pour éviter un prompt trop long
          .map((a, i) => `Article ${i + 1} (${a.source}): ${a.title}\n${a.content || ""}`)
          .join("\n\n---\n\n");

        const eventSynthesisPrompt = `Tu es un journaliste expert en actualité internationale. Analyse cet ENSEMBLE D'ARTICLES qui couvrent le MÊME ÉVÉNEMENT MAJEUR et génère un titre journalistique clair et une description factuelle.

ARTICLES (${articles.length} articles couvrant le même événement):
${articlesText}

INSTRUCTIONS STRICTES:

1. TITRE (max 80 caractères):
   - Style journalistique professionnel, factuel et clair
   - Doit expliquer l'événement de manière compréhensible pour le grand public
   - Mentionne l'acteur principal (personne, pays, institution) et l'action/événement
   - Pas de citation d'article, juste les faits essentiels
   - Exemples de BONS titres:
     * "Maduro plaide non coupable devant un tribunal de New York"
     * "L'ONU lève les sanctions contre la Syrie"
     * "Accord de paix signé entre Israël et la Palestine"
   - Exemples de MAUVAIS titres (trop génériques ou citant un article):
     * "Le président syrien salue la décision du Conseil de sécurité"
     * "Événement majeur en Syrie"
     * "Décision importante prise"

2. DESCRIPTION (2-3 phrases, max 250 caractères):
   - Style journalistique factuel et neutre
   - Résume l'événement de manière claire et compréhensible
   - Mentionne les acteurs principaux, le contexte et l'impact
   - Pas de citation d'article, juste les faits essentiels
   - Exemple de BONNE description:
     "Nicolás Maduro, président du Venezuela, a plaidé non coupable devant un tribunal fédéral de New York. Il se déclare 'prisonnier de guerre' dans le cadre de son procès pour trafic de drogue. Cette affaire pourrait avoir des conséquences majeures sur les relations entre le Venezuela et les États-Unis."
   - Exemple de MAUVAISE description (trop vague):
     "Un événement important s'est produit concernant le Venezuela."

Réponds UNIQUEMENT avec du JSON valide:
{
  "title": "titre journalistique clair et factuel",
  "description": "description journalistique factuelle en 2-3 phrases"
}`;

        const synthesisResult = await callOpenAI(openaiKeyForSynthesis, eventSynthesisPrompt, {
          maxTokens: 300,
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

    // Questions prédictives par défaut (seront améliorées par l'IA)
    let question = `Dans les 3 prochains mois, quelles seront les conséquences de cette décision ?`;
    let answer1 = `Scénario optimiste : Les objectifs sont atteints rapidement avec des effets positifs mesurables.`;
    let answer2 = `Scénario mitigé : Résultats partiels avec des effets positifs et négatifs qui s'équilibrent.`;
    let answer3 = `Scénario pessimiste : Les objectifs ne sont pas atteints, avec des conséquences négatives significatives.`;

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
          maxTokens: 500,
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

        // Génération de question prédictive avec scénarios accessibles au grand public
        const questionPrompt = `Tu es un journaliste expert qui explique l'actualité internationale au grand public. Analyse cet ÉVÉNEMENT MAJEUR et génère une question prédictive CLAIRE, ainsi que trois scénarios courts et ACCESSIBLES (sans jargon technique).

═══════════════════════════════════════════════════════════════
ÉVÉNEMENT MAJEUR À ANALYSER:
═══════════════════════════════════════════════════════════════
Titre: ${eventTitle}
Description: ${eventDescription}
Acteur/Décideur: ${extracted.decider}
Type d'événement: ${extracted.type}
Domaines impactés: ${extracted.impactedDomains.join(", ") || "À déterminer"}
Articles (${articles.length}): ${articles.map((a) => a.title).join("; ")}

═══════════════════════════════════════════════════════════════
INSTRUCTIONS STRICTES:
═══════════════════════════════════════════════════════════════

1. QUESTION PRÉDICTIVE (OBLIGATOIRE):
   ✓ Doit être COURTE et DIRECTE (maximum 12-15 mots)
   ✓ Doit être SPÉCIFIQUE à cet événement précis (pas générique)
   ✓ Doit mentionner le décideur OU le pays/région (pas besoin des deux)
   ✓ Doit avoir un horizon temporel: "3 prochains mois" ou "6 prochains mois"
   ✓ Ton simple et direct, comme une conversation (éviter les formulations pompeuses)
   ✓ Éviter les énumérations de pays/acteurs multiples dans la question
   
   ✅ EXEMPLES BONS (courts et directs):
   - "Que va-t-il se passer au Venezuela dans les 3 prochains mois ?"
   - "Comment la Syrie va-t-elle réagir à la levée des sanctions ?"
   - "Quelles seront les conséquences pour l'Iran dans les 3 prochains mois ?"
   - "Comment cette découverte va-t-elle changer les choses ?"
   - "Quel impact aura cet accord de paix dans les 6 prochains mois ?"
   - "Comment Kim Jong Un va-t-il utiliser ce tir de missiles ?"
   
   ❌ EXEMPLES MAUVAIS (trop longs et pompeux):
   - "Dans les 3 prochains mois, comment Kim Jong Un et la Corée du Nord vont-ils utiliser ce tir de missiles hypersoniques pour influencer la sécurité et la diplomatie dans la péninsule coréenne et les relations avec la Corée du Sud, le Japon et les États-Unis ?"
   - "Quelles seront les conséquences économiques, politiques et sociales de cette décision pour les populations concernées ?"
   - "Comment cet événement va-t-il transformer les relations internationales et l'équilibre géopolitique dans la région ?"
   
   ❌ EXEMPLES MAUVAIS (trop génériques):
   - "Quelles seront les conséquences ?"
   - "Que va-t-il se passer ?"
   - "Quels seront les impacts ?"

2. TROIS SCÉNARIOS ACCESSIBLES AU GRAND PUBLIC:

   IMPORTANT: Les scénarios doivent être COMPRÉHENSIBLES par tous, sans jargon technique ou économique complexe.
   
   Pour événements NÉGATIFS (crises, catastrophes, conflits):
   Scénario A (PESSIMISTE) - Conséquences négatives probables:
   ✓ Langage simple et accessible (ex: "les prix augmentent" plutôt que "inflation de X%")
   ✓ Conséquences concrètes pour les populations (ex: "difficultés à se nourrir", "services publics perturbés")
   ✓ Mention des pays/régions concernés de manière claire
   ✓ 2-3 phrases maximum, style journalistique simple
   ✓ Exemple: "La situation se détériore. Les prix des produits de base augmentent fortement, les services publics fonctionnent mal et la population rencontre des difficultés quotidiennes."
   
   Scénario B (NEUTRE/MITIGÉ) - Scénario intermédiaire réaliste:
   ✓ Situation stabilisée mais sans amélioration majeure
   ✓ Langage simple, conséquences équilibrées (du bon et du moins bon)
   ✓ 2-3 phrases maximum
   ✓ Exemple: "La situation reste tendue mais se stabilise progressivement. Certains secteurs s'améliorent tandis que d'autres continuent de rencontrer des difficultés."
   
   Scénario C (OPTIMISTE/INTERVENTION) - Stabilisation ou amélioration:
   ✓ Intervention ou résolution positive expliquée simplement
   ✓ Améliorations concrètes pour les populations
   ✓ 2-3 phrases maximum
   ✓ Exemple: "La situation s'améliore grâce à une intervention internationale. Les conditions de vie de la population commencent à se normaliser et les services essentiels reprennent progressivement."
   
   Pour événements POSITIFS (découvertes, accords, innovations):
   Scénario A (LIMITÉ) - Impact positif mais limité:
   ✓ Progrès réels mais avec des limites expliquées simplement
   ✓ 2-3 phrases maximum
   ✓ Exemple: "Des progrès sont réalisés mais restent limités. Certaines améliorations sont visibles mais des défis importants persistent."
   
   Scénario B (MODÉRÉ) - Impact positif significatif:
   ✓ Progrès concrets et bénéfices pour les populations
   ✓ Langage simple et accessible
   ✓ 2-3 phrases maximum
   ✓ Exemple: "Des améliorations significatives sont observées. Les populations concernées bénéficient de changements positifs dans leur quotidien."
   
   Scénario C (MAJEUR) - Impact positif transformateur:
   ✓ Transformation majeure expliquée simplement
   ✓ Bénéfices larges et durables
   ✓ 2-3 phrases maximum
   ✓ Exemple: "Une transformation majeure est en cours. Les bénéfices sont larges et durables, améliorant significativement les conditions de vie des populations concernées."

═══════════════════════════════════════════════════════════════
RÈGLES ABSOLUES:
═══════════════════════════════════════════════════════════════
- Langage SIMPLE et ACCESSIBLE (éviter: taux, pourcentages techniques, jargon économique)
- Chaque scénario: 2-3 phrases MAXIMUM
- Style journalistique grand public (comme un article de presse généraliste)
- Mentionner les pays/régions de manière claire
- Conséquences CONCRÈTES pour les populations (pas de détails techniques)
- Sois FACTUEL et OBJECTIF, pas idéologique
- Évite les termes techniques: préfère "les prix augmentent" à "inflation de X%"

Réponds UNIQUEMENT avec du JSON valide (format json_object):
{
  "question": "question prédictive COURTE (max 12-15 mots), directe et simple, avec horizon temporel",
  "answer1": "Scénario A (pessimiste) - 2-3 phrases courtes, langage simple, conséquences concrètes pour les populations",
  "answer2": "Scénario B (neutre/mitigé) - 2-3 phrases courtes, langage simple, situation équilibrée",
  "answer3": "Scénario C (optimiste/intervention) - 2-3 phrases courtes, langage simple, améliorations concrètes"
}`;

        const questionResult = await callOpenAI(openaiKeyForSynthesis, questionPrompt, {
          maxTokens: 4000,
        });

        if (questionResult) {
          try {
            // Parser le JSON (peut être dans un bloc markdown ou texte brut)
            let jsonString = questionResult.trim();
            const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonString = jsonMatch[0];
            }
            const parsed = JSON.parse(jsonString);
            
            if (parsed.question) question = parsed.question;
            if (parsed.answer1) answer1 = parsed.answer1;
            if (parsed.answer2) answer2 = parsed.answer2;
            if (parsed.answer3) answer3 = parsed.answer3;
          } catch (parseError) {
            console.error("Error parsing AI question result:", parseError);
            console.error("Raw response:", questionResult);
            // En cas d'erreur de parsing, utiliser des valeurs par défaut spécifiques
            question = `Dans les 3 prochains mois, quelles seront les conséquences de cette décision pour ${extracted.decider} ?`;
            answer1 = `Scénario pessimiste : Conséquences négatives significatives pour ${extracted.decider} avec détérioration des conditions économiques et politiques.`;
            answer2 = `Scénario mitigé : Résultats partiels avec des effets positifs et négatifs qui s'équilibrent pour ${extracted.decider}.`;
            answer3 = `Scénario optimiste : Stabilisation ou amélioration de la situation pour ${extracted.decider} avec intervention ou résolution positive.`;
          }
        } else {
          // Si l'IA ne retourne rien, utiliser des valeurs par défaut spécifiques
          question = `Dans les 3 prochains mois, quelles seront les conséquences de cette décision pour ${extracted.decider} ?`;
          answer1 = `Scénario pessimiste : Conséquences négatives significatives pour ${extracted.decider} avec détérioration des conditions économiques et politiques.`;
          answer2 = `Scénario mitigé : Résultats partiels avec des effets positifs et négatifs qui s'équilibrent pour ${extracted.decider}.`;
          answer3 = `Scénario optimiste : Stabilisation ou amélioration de la situation pour ${extracted.decider} avec intervention ou résolution positive.`;
        }
      }
    } catch (error) {
      console.error("Error using AI for decision generation:", error);
      // Continuer avec les valeurs par défaut
    }

    // Génération des métadonnées de gamification avec IA
    try {
      if (openaiKeyForSynthesis) {
        const gamificationPrompt = `Analyse cet événement majeur et génère des métadonnées pour la gamification:

Titre: ${eventTitle}
Description: ${eventDescription}
Type: ${extracted.type}
Décideur: ${extracted.decider}
Articles: ${articles.length} articles couvrant cet événement

INSTRUCTIONS:
1. Sentiment: "positive" (progrès, découverte, accord de paix, innovation), "negative" (crise, conflit, catastrophe), ou "neutral"
2. Heat (0-100): Score d'urgence/importance
   - 0-30: Froid (événement passé, peu d'impact actuel)
   - 31-60: Tiède (événement récent, impact modéré)
   - 61-80: Chaud (événement très récent, impact important)
   - 81-100: Brûlant (événement en cours, impact majeur et urgent)
3. Emoji: Un emoji unique et représentatif de l'événement (ex: 🚨 pour crise, 🎉 pour découverte, ⚔️ pour conflit, 🌍 pour accord, 💰 pour économique, etc.)
   - Utilise UNIQUEMENT un emoji (pas de texte)
   - Choisis un emoji qui représente bien l'événement

Réponds UNIQUEMENT avec du JSON valide:
{
  "sentiment": "positive|negative|neutral",
  "heat": 0-100,
  "emoji": "un seul emoji"
}`;

        const gamificationResult = await callOpenAI(openaiKeyForSynthesis, gamificationPrompt, {
          maxTokens: 200,
        });

        if (gamificationResult) {
          try {
            let jsonString = gamificationResult.trim();
            const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              jsonString = jsonMatch[0];
            }
            const parsed = JSON.parse(jsonString);
            
            if (parsed.sentiment && ["positive", "negative", "neutral"].includes(parsed.sentiment)) {
              sentiment = parsed.sentiment as "positive" | "negative" | "neutral";
            }
            if (typeof parsed.heat === "number" && parsed.heat >= 0 && parsed.heat <= 100) {
              heat = Math.round(parsed.heat);
            }
            if (parsed.emoji) {
              emoji = parsed.emoji.trim();
            }

            // Calculer la couleur du badge selon le heat (bleu → vert → rouge)
            badgeColor = calculateBadgeColor(heat, sentiment);
          } catch (parseError) {
            console.error("Error parsing AI gamification result:", parseError);
            // Utiliser les valeurs par défaut
            badgeColor = calculateBadgeColor(heat, sentiment);
          }
        } else {
          // Calculer la couleur même sans réponse IA
          badgeColor = calculateBadgeColor(heat, sentiment);
        }
      } else {
        // Pas de clé OpenAI, utiliser les valeurs par défaut
        badgeColor = calculateBadgeColor(heat, sentiment);
      }
    } catch (error) {
      console.error("Error generating gamification metadata:", error);
      // Utiliser les valeurs par défaut en cas d'erreur
      badgeColor = calculateBadgeColor(heat, sentiment);
    }

    // Utiliser l'IA pour générer une requête optimale (priorité absolue)
    let imageQuery: string;
    
    if (openaiKeyForSynthesis) {
      try {
        const imageQueryPrompt = `Tu es un expert en recherche d'images pour l'actualité internationale. Analyse le CONTEXTE et le SENS de cet événement majeur pour générer une requête de recherche d'image INTELLIGENTE et PERTINENTE (2-4 mots-clés en anglais).

ÉVÉNEMENT:
Titre: ${eventTitle}
Description: ${eventDescription}
Décideur/Acteur principal: ${extracted.decider}
Type d'événement: ${extracted.type}
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
UNIQUEMENT la requête (2-4 mots-clés en anglais), sans texte avant ou après, sans guillemets, sans explication.`;

        const aiImageQuery = await callOpenAI(openaiKeyForSynthesis, imageQueryPrompt);
        if (aiImageQuery) {
          // Nettoyer la réponse de l'IA et s'assurer qu'elle est en anglais pour Pexels
          let cleanedQuery = aiImageQuery.trim().replace(/["'`]/g, "").substring(0, 50);
          
          // Vérifier si la requête contient des mots français courants et les traduire
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
          
          const lowerQuery = cleanedQuery.toLowerCase();
          for (const [french, english] of Object.entries(frenchToEnglish)) {
            if (lowerQuery.includes(french)) {
              cleanedQuery = cleanedQuery.replace(new RegExp(french, "gi"), english);
            }
          }
          
          if (cleanedQuery.length > 5) {
            imageQuery = cleanedQuery;
          } else {
            // Fallback si la réponse de l'IA est trop courte
            imageQuery = buildImageSearchQuery(
              extracted.decider,
              extracted.deciderType,
              extracted.type,
              extracted.impactedDomains,
              eventTitle
            );
          }
        } else {
          // Fallback si l'IA ne retourne rien
          imageQuery = buildImageSearchQuery(
            extracted.decider,
            extracted.deciderType,
            extracted.type,
            extracted.impactedDomains,
            eventTitle
          );
        }
      } catch (error) {
        console.error("Error generating image query with AI:", error);
        // Fallback si l'IA échoue
        imageQuery = buildImageSearchQuery(
          extracted.decider,
          extracted.deciderType,
          extracted.type,
          extracted.impactedDomains,
          eventTitle
        );
      }
    } else {
      // Fallback si pas de clé OpenAI
      imageQuery = buildImageSearchQuery(
        extracted.decider,
        extracted.deciderType,
        extracted.type,
        extracted.impactedDomains,
        eventTitle
      );
    }

    // Rechercher image libre de droits
    let imageUrl: string | undefined;
    let imageSource: string | undefined;
    try {
      const imageResult = await ctx.runAction(
        api.bots.generateDecision.searchFreeImage,
        {
          query: imageQuery,
        }
      );
      if (imageResult) {
        imageUrl = imageResult.url;
        imageSource = imageResult.source;
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

    // Créer la Decision Card
    const decisionId = await ctx.runMutation(api.decisions.createDecision, {
      title: eventTitle,
      description: eventDescription || eventTitle, // Fallback si description vide
      slug: finalSlug,
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
      answer2,
      answer3,
      imageUrl,
      imageSource,
      createdBy: "bot",
      sentiment,
      heat,
      emoji,
      badgeColor,
    });

    // Sauvegarder tous les articles comme sources associées
    for (const article of articles) {
      try {
        await ctx.runMutation(api.news.createNewsItem, {
          decisionId,
          title: article.title,
          url: article.url,
          source: article.source,
          publishedAt: article.publishedAt,
          summary: article.content,
          imageUrl: undefined, // Les images seront récupérées lors de l'agrégation
          relevanceScore: 100, // Tous les articles du groupe sont pertinents
        });
      } catch (error) {
        console.error(`Error saving article as news item:`, error);
      }
    }

    // Mettre à jour les stats du bot Générateur
    await updateBotActivity(ctx, {
      botSlug: "generateur",
      decisionsCreated: 1,
      logMessage: `Décision créée: ${eventTitle.substring(0, 50)}...`,
      logLevel: "success",
      functionName: "generateDecision",
    });

    return decisionId;
  },
});

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
 * Recherche une image libre de droits pertinente
 */
export const searchFreeImage = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    // Pexels API (gratuite, optionnelle)
    try {
      const pexelsKey = process.env.PEXELS_API_KEY;
      if (pexelsKey) {
        // Essayer plusieurs variantes de la requête pour trouver la meilleure image
        // Priorité: requête complète → nom principal seul → premier mot si nom composé
        const queryWords = args.query.split(" ").filter(w => w.length > 0);
        const queryVariants = [
          args.query, // Requête originale complète (priorité absolue)
          queryWords.slice(0, 2).join(" "), // Premiers 2 mots (ex: "Nicolas Maduro")
          queryWords[0], // Premier mot seulement (ex: "Nicolas" ou "Venezuela")
        ].filter(v => v && v.length > 2); // Filtrer les variantes trop courtes

        let bestImage = null;
        for (const variant of queryVariants) {
          try {
            const response = await fetch(
              `https://api.pexels.com/v1/search?query=${encodeURIComponent(
                variant
              )}&per_page=5&orientation=landscape`, // Augmenté à 5 pour plus de choix
              {
                headers: {
                  Authorization: pexelsKey,
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data.photos && data.photos.length > 0) {
                // Prendre la première photo (la plus pertinente selon Pexels)
                // Pexels classe déjà les résultats par pertinence
                const photo = data.photos[0];
                bestImage = {
                  url: photo.src?.large || photo.src?.original || "",
                  source: "Pexels",
                  photographer: photo.photographer || "Unknown",
                };
                console.log(`✅ Image trouvée avec la requête: "${variant}"`);
                break; // On a trouvé une image pertinente, on s'arrête
              }
            }
          } catch (error) {
            console.error(`Error fetching Pexels image for variant "${variant}":`, error);
            // Continuer avec la variante suivante
          }
        }

        if (bestImage) {
          return bestImage;
        }
      }
    } catch (error) {
      console.error("Error fetching Pexels image:", error);
    }

    return null;
  },
});

/**
 * Construit une requête de recherche d'image pertinente basée sur la décision
 */
function buildImageSearchQuery(
  decider: string,
  deciderType: "country" | "institution" | "leader" | "organization" | "natural" | "economic",
  type: "law" | "sanction" | "tax" | "agreement" | "policy" | "regulation" | "crisis" | "disaster" | "conflict" | "discovery" | "election" | "economic_event" | "other",
  impactedDomains: string[],
  title: string
): string {
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

  // Ne PAS ajouter de mots-clés génériques selon le type (trop vague)
  // Ne PAS ajouter de domaines impactés (trop générique)
  // Ne PAS extraire du titre (peut être trop vague)

  // Construire la requête finale (maximum 2 mots-clés, priorité au décideur)
  const finalQuery = keywords
    .filter((k) => k && k.length > 2)
    .slice(0, 2) // Limiter à 2 mots-clés maximum pour plus de précision
    .join(" ");

  return finalQuery || "international news"; // Fallback minimal si aucune requête valide
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


