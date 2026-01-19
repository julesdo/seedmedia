import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";

// Prix des skins en Seeds
const SKIN_PRICES: Record<string, number> = {
  default: 0, // Gratuit
  neon: 200,
  stamp: 300,
  gold: 500,
};

/**
 * 🎯 FEATURE 5: LES SKINS DE VOTE - Récupère les skins possédés par l'utilisateur
 */
export const getUserSkins = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return { skins: [], selectedSkin: "default" };
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return { skins: [], selectedSkin: "default" };
    }

    // Récupérer tous les skins possédés
    const ownedSkins = await ctx.db
      .query("voteSkins")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .collect();

    const skinTypes = ownedSkins.map((skin) => skin.skinType);
    
    // Toujours inclure "default" (gratuit)
    if (!skinTypes.includes("default")) {
      skinTypes.push("default");
    }

    return {
      skins: skinTypes,
      selectedSkin: (appUser as any).selectedVoteSkin || "default",
    };
  },
});

/**
 * 🎯 FEATURE 5: LES SKINS DE VOTE - Achète un skin
 */
export const purchaseSkin = mutation({
  args: {
    skinType: v.union(
      v.literal("neon"),
      v.literal("stamp"),
      v.literal("gold")
    ),
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

    // Vérifier si l'utilisateur possède déjà ce skin
    const existingSkin = await ctx.db
      .query("voteSkins")
      .withIndex("userId_skinType", (q) =>
        q.eq("userId", appUser._id).eq("skinType", args.skinType)
      )
      .first();

    if (existingSkin) {
      throw new Error("Vous possédez déjà ce skin.");
    }

    // Vérifier le prix
    const price = SKIN_PRICES[args.skinType];
    if (!price || price === 0) {
      throw new Error("Ce skin ne peut pas être acheté.");
    }

    // Vérifier que l'utilisateur a assez de Seeds
    if ((appUser.seedsBalance || 0) < price) {
      throw new Error(`Vous n'avez pas assez de Seeds. Vous avez ${appUser.seedsBalance || 0} Seeds, mais vous devez payer ${price} Seeds.`);
    }

    const now = Date.now();

    // Créer l'entrée de skin
    await ctx.db.insert("voteSkins", {
      userId: appUser._id,
      skinType: args.skinType,
      purchasedAt: now,
    });

    // Débiter les Seeds de l'utilisateur
    const levelBefore = appUser.level || 1;
    await ctx.db.patch(appUser._id, {
      seedsBalance: (appUser.seedsBalance || 0) - price,
      updatedAt: now,
    });

    // Calculer le nouveau niveau
    const newSeedsBalance = (appUser.seedsBalance || 0) - price;
    const levelAfter = Math.floor(Math.sqrt(newSeedsBalance / 100)) + 1;

    // Créer une transaction de dépense
    await ctx.db.insert("seedsTransactions", {
      userId: appUser._id,
      type: "lost",
      amount: price,
      reason: "vote_skin_purchase",
      relatedId: args.skinType,
      relatedType: "vote_skin",
      levelBefore,
      levelAfter,
      createdAt: now,
    });

    return { success: true };
  },
});

/**
 * 🎯 FEATURE 5: LES SKINS DE VOTE - Sélectionne un skin (change le skin actif)
 */
export const selectSkin = mutation({
  args: {
    skinType: v.union(
      v.literal("default"),
      v.literal("neon"),
      v.literal("stamp"),
      v.literal("gold")
    ),
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

    // Si ce n'est pas "default", vérifier que l'utilisateur possède le skin
    if (args.skinType !== "default") {
      const ownedSkin = await ctx.db
        .query("voteSkins")
        .withIndex("userId_skinType", (q) =>
          q.eq("userId", appUser._id).eq("skinType", args.skinType)
        )
        .first();

      if (!ownedSkin) {
        throw new Error("Vous ne possédez pas ce skin.");
      }
    }

    // Mettre à jour le skin sélectionné
    await ctx.db.patch(appUser._id, {
      selectedVoteSkin: args.skinType,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

