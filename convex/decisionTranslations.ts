import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Helper function pour appeler OpenAI API pour la traduction
 */
async function callOpenAI(
  apiKey: string,
  prompt: string,
  options?: {
    maxTokens?: number;
  }
): Promise<string | null> {
  try {
    const body: any = {
      model: "gpt-4o-mini", // Utiliser gpt-4o-mini pour la traduction (plus économique)
      messages: [
        {
          role: "system",
          content:
            "Tu es un traducteur professionnel expert. Tu traduis de manière précise et fidèle, en conservant le style et le ton du texte original.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Température plus basse pour des traductions plus fidèles
      max_tokens: options?.maxTokens ?? 2000,
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

/**
 * Récupère la traduction d'une Decision Card pour une langue donnée
 */
export const getDecisionTranslation = query({
  args: {
    decisionId: v.id("decisions"),
    language: v.string(), // Code langue (ex: "en", "es", "de")
  },
  handler: async (ctx, args) => {
    const translation = await ctx.db
      .query("decisionTranslations")
      .withIndex("decisionId_language", (q) =>
        q.eq("decisionId", args.decisionId).eq("language", args.language)
      )
      .first();

    return translation;
  },
});

/**
 * Récupère toutes les traductions d'une Decision Card
 */
export const getDecisionTranslations = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const translations = await ctx.db
      .query("decisionTranslations")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    return translations;
  },
});

/**
 * Crée ou met à jour une traduction d'une Decision Card
 */
export const upsertDecisionTranslation = mutation({
  args: {
    decisionId: v.id("decisions"),
    language: v.string(),
    title: v.string(),
    question: v.string(),
    answer1: v.string(),
    answer2: v.string(),
    answer3: v.string(),
    officialText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("decisionTranslations")
      .withIndex("decisionId_language", (q) =>
        q.eq("decisionId", args.decisionId).eq("language", args.language)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Mettre à jour la traduction existante
      await ctx.db.patch(existing._id, {
        title: args.title,
        question: args.question,
        answer1: args.answer1,
        answer2: args.answer2,
        answer3: args.answer3,
        officialText: args.officialText,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Créer une nouvelle traduction
      const translationId = await ctx.db.insert("decisionTranslations", {
        decisionId: args.decisionId,
        language: args.language,
        title: args.title,
        question: args.question,
        answer1: args.answer1,
        answer2: args.answer2,
        answer3: args.answer3,
        officialText: args.officialText,
        createdAt: now,
        updatedAt: now,
      });
      return translationId;
    }
  },
});

/**
 * Traduit automatiquement une Decision Card dans une langue cible
 * (Action pour bot - utilise une API de traduction externe)
 */
export const translateDecision = action({
  args: {
    decisionId: v.id("decisions"),
    targetLanguage: v.string(), // Code langue cible (ex: "en", "es", "de")
    sourceLanguage: v.optional(v.string()), // Code langue source (défaut: "fr")
  },
  handler: async (ctx, args): Promise<Id<"decisionTranslations">> => {
    // Récupérer la décision
    const decision = await ctx.runQuery(api.decisions.getDecisionById, {
      decisionId: args.decisionId,
    });

    if (!decision) {
      throw new Error("Decision not found");
    }

    const sourceLang = args.sourceLanguage || "fr";

    // Vérifier si la traduction existe déjà
    const existing = await ctx.runQuery(
      api.decisionTranslations.getDecisionTranslation,
      {
        decisionId: args.decisionId,
        language: args.targetLanguage,
      }
    );

    if (existing) {
      return existing._id;
    }

    // ✅ Traduction avec OpenAI
    const openaiKeyEnv = process.env.OPENAI_API_KEY;
    if (!openaiKeyEnv) {
      throw new Error("OPENAI_API_KEY not configured");
    }
    const openaiKey: string = openaiKeyEnv; // Type guard pour TypeScript

    // Noms de langues pour le prompt
    const languageNames: Record<string, string> = {
      fr: "français",
      en: "anglais",
      es: "espagnol",
      de: "allemand",
      it: "italien",
      pt: "portugais",
      nl: "néerlandais",
      pl: "polonais",
      ru: "russe",
      zh: "chinois",
      ja: "japonais",
      ko: "coréen",
      ar: "arabe",
    };

    const sourceLangName = languageNames[sourceLang] || sourceLang;
    const targetLangName = languageNames[args.targetLanguage] || args.targetLanguage;

    // Fonction helper pour traduire un texte
    async function translateText(text: string, context: string): Promise<string> {
      const prompt = `Tu es un traducteur professionnel expert en actualité internationale et géopolitique.

Traduis ce texte de ${sourceLangName} vers ${targetLangName}.

CONTEXTE: ${context}

TEXTE À TRADUIRE:
${text}

INSTRUCTIONS:
- Traduis de manière précise et fidèle au sens original
- Conserve le style journalistique et factuel
- Adapte les expressions idiomatiques naturellement
- Garde les noms propres (personnes, pays, institutions) tels quels
- Assure-toi que la traduction est naturelle et fluide dans la langue cible

Réponds UNIQUEMENT avec la traduction, sans commentaire ni explication.`;

      try {
        const result = await callOpenAI(openaiKey, prompt, {
          maxTokens: 1000,
        });
        return result || text; // Fallback sur le texte original si erreur
      } catch (error) {
        console.error(`Error translating text (${context}):`, error);
        return text; // Fallback sur le texte original
      }
    }

    // Traduire tous les textes en parallèle pour performance
    console.log(`[${new Date().toISOString()}] 🌍 Translating decision ${args.decisionId} from ${sourceLang} to ${args.targetLanguage}...`);
    
    const [translatedTitle, translatedQuestion, translatedAnswer1, translatedAnswer2, translatedAnswer3, translatedOfficialText] = await Promise.all([
      translateText(decision.title, "Titre de la décision"),
      translateText(decision.question, "Question objective"),
      translateText(decision.answer1, "Réponse 1 (option positive)"),
      translateText(decision.answer2, "Réponse 2 (option partielle)"),
      translateText(decision.answer3, "Réponse 3 (option négative)"),
      decision.officialText ? translateText(decision.officialText, "Texte officiel de la décision") : Promise.resolve(undefined),
    ]);

    console.log(`[${new Date().toISOString()}] ✅ Translation completed for decision ${args.decisionId}`);

    // Créer la traduction
    const translationId = await ctx.runMutation(
      api.decisionTranslations.upsertDecisionTranslation,
      {
        decisionId: args.decisionId,
        language: args.targetLanguage,
        title: translatedTitle,
        question: translatedQuestion,
        answer1: translatedAnswer1,
        answer2: translatedAnswer2,
        answer3: translatedAnswer3,
        officialText: translatedOfficialText,
      }
    );

    return translationId;
  },
});

/**
 * Traduit automatiquement une Decision Card dans toutes les langues supportées
 * (Action pour bot - batch translation)
 */
export const translateDecisionToAllLanguages = action({
  args: {
    decisionId: v.id("decisions"),
    languages: v.array(v.string()), // Liste des codes langues (ex: ["en", "es", "de", ...])
  },
  handler: async (
    ctx,
    args
  ): Promise<Id<"decisionTranslations">[]> => {
    const results = await Promise.all(
      args.languages.map((lang) =>
        ctx.runAction(api.decisionTranslations.translateDecision, {
          decisionId: args.decisionId,
          targetLanguage: lang,
        })
      )
    );

    return results;
  },
});

