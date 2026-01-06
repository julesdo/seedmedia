import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

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

    // TODO: Intégrer une API de traduction (DeepL, Google Translate, etc.)
    // Pour l'instant, on simule la traduction
    // Dans la vraie implémentation, on appellerait l'API ici

    // Exemple de structure pour l'appel API (à implémenter) :
    // const translated = await translateWithAPI({
    //   text: decision.title,
    //   sourceLang,
    //   targetLang: args.targetLanguage,
    // });

    // Pour l'instant, on retourne les textes originaux (à remplacer par la vraie traduction)
    const translatedTitle: string = decision.title; // TODO: Traduire
    const translatedQuestion: string = decision.question; // TODO: Traduire
    const translatedAnswer1: string = decision.answer1; // TODO: Traduire
    const translatedAnswer2: string = decision.answer2; // TODO: Traduire
    const translatedAnswer3: string = decision.answer3; // TODO: Traduire
    const translatedOfficialText: string = decision.officialText; // TODO: Traduire

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

