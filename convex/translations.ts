import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";

/**
 * Récupère une traduction depuis le cache
 */
export const getCachedTranslation = query({
  args: {
    text: v.string(),
    sourceLanguage: v.string(),
    targetLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    // Vérifier le cache
    const cacheKey = `${args.sourceLanguage}_${args.targetLanguage}_${args.text}`;
    const cached = await ctx.db
      .query("translationCache")
      .withIndex("cacheKey", (q) => q.eq("cacheKey", cacheKey))
      .first();

    return cached?.translatedText || null;
  },
});

/**
 * Sauvegarde une traduction dans le cache
 */
export const saveTranslation = mutation({
  args: {
    text: v.string(),
    translatedText: v.string(),
    sourceLanguage: v.string(),
    targetLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    const cacheKey = `${args.sourceLanguage}_${args.targetLanguage}_${args.text}`;
    
    // Vérifier si déjà en cache
    const existing = await ctx.db
      .query("translationCache")
      .withIndex("cacheKey", (q) => q.eq("cacheKey", cacheKey))
      .first();

    if (existing) {
      return existing._id;
    }

    // Sauvegarder dans le cache
    const id = await ctx.db.insert("translationCache", {
      cacheKey,
      sourceText: args.text,
      translatedText: args.translatedText,
      sourceLanguage: args.sourceLanguage,
      targetLanguage: args.targetLanguage,
      createdAt: Date.now(),
    });

    return id;
  },
});


/**
 * Récupère la langue préférée de l'utilisateur
 */
export const getUserLanguage = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return "fr"; // Langue par défaut
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    return appUser?.preferredLanguage || "fr";
  },
});

/**
 * Met à jour la langue préférée de l'utilisateur
 */
export const updateUserLanguage = mutation({
  args: {
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      throw new Error("User not found");
    }

    await ctx.db.patch(appUser._id, {
      preferredLanguage: args.language,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

