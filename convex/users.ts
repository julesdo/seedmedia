import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { betterAuthComponent } from "./auth";

/**
 * Récupère l'utilisateur actuellement connecté
 * Compatible avec l'ancienne API pour éviter les erreurs
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return null;
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return null;
    }

    // Prioriser le nom de appUser s'il existe et est différent de celui de Better Auth
    // Cela permet à l'utilisateur de modifier son nom dans l'app même si Better Auth en a un
    const displayName = appUser.name && appUser.name !== betterAuthUser.name 
      ? appUser.name 
      : (betterAuthUser.name || appUser.name);

    return {
      ...appUser,
      ...betterAuthUser,
      name: displayName, // Utiliser le nom prioritaire
      _id: appUser._id,
    };
  },
});

/**
 * Helper pour s'assurer qu'un utilisateur existe (utilisé par les mutations)
 * Crée l'utilisateur s'il n'existe pas encore
 */
export async function ensureUserExistsHelper(ctx: any): Promise<Id<"users">> {
  const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx);
  if (!betterAuthUser) {
    throw new Error("Not authenticated");
  }

  // Vérifier si l'utilisateur existe déjà
  let appUser = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", betterAuthUser.email))
    .first();

    if (!appUser) {
      // Créer l'utilisateur s'il n'existe pas
      const now = Date.now();
      const userId = await ctx.db.insert("users", {
        email: betterAuthUser.email,
        name: betterAuthUser.name || null,
        image: betterAuthUser.image || null,
        level: 1,
        seedsBalance: 100, // Seeds de départ
        seedsToNextLevel: 100, // Seeds nécessaires pour passer au niveau 2
        preferredLanguage: "fr",
        role: "explorateur",
        isPublic: false, // Profil privé par défaut
        createdAt: now,
        updatedAt: now,
      });
      return userId;
    }

  return appUser._id;
}

/**
 * Récupère un utilisateur par son ID
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

/**
 * Met à jour la balance de Seeds et le niveau d'un utilisateur
 */
export const updateUserSeeds = mutation({
  args: {
    userId: v.id("users"),
    seedsBalance: v.number(),
    level: v.number(),
    seedsToNextLevel: v.number(),
  },
  handler: async (ctx, args) => {
    const updateData: any = {
      level: args.level,
      updatedAt: Date.now(),
    };
    
    if (args.seedsBalance !== undefined) {
      updateData.seedsBalance = args.seedsBalance;
    }
    
    if (args.seedsToNextLevel !== undefined) {
      updateData.seedsToNextLevel = args.seedsToNextLevel;
    }

    await ctx.db.patch(args.userId, updateData);

    return args.userId;
  },
});

/**
 * Met à jour le profil utilisateur (nom, bio, etc.)
 */
export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    showBreakingNews: v.optional(v.boolean()),
    preferredLanguage: v.optional(v.string()),
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

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.username !== undefined) {
      // Nettoyer le username (enlever @ si présent, mettre en minuscules, enlever espaces)
      const cleanUsername = args.username
        .trim()
        .toLowerCase()
        .replace(/^@/, "")
        .replace(/[^a-z0-9_]/g, ""); // Seulement lettres, chiffres et underscore

      if (cleanUsername.length === 0) {
        throw new Error("Le nom d'utilisateur ne peut pas être vide");
      }

      if (cleanUsername.length < 3) {
        throw new Error("Le nom d'utilisateur doit contenir au moins 3 caractères");
      }

      if (cleanUsername.length > 30) {
        throw new Error("Le nom d'utilisateur ne peut pas dépasser 30 caractères");
      }

      // Vérifier l'unicité (sauf si c'est le même username que l'utilisateur actuel)
      if (cleanUsername !== appUser.username) {
        const existingUser = await ctx.db
          .query("users")
          .withIndex("username", (q) => q.eq("username", cleanUsername))
          .first();

        if (existingUser) {
          throw new Error("Ce nom d'utilisateur est déjà pris");
        }
      }

      updates.username = cleanUsername;
    }

    if (args.bio !== undefined) {
      updates.bio = args.bio;
    }

    if (args.isPublic !== undefined) {
      updates.isPublic = args.isPublic;
    }

    if (args.showBreakingNews !== undefined) {
      updates.showBreakingNews = args.showBreakingNews;
    }

    if (args.preferredLanguage !== undefined) {
      updates.preferredLanguage = args.preferredLanguage;
    }

    await ctx.db.patch(appUser._id, updates);

    return { success: true };
  },
});

/**
 * Vérifie si un nom d'utilisateur est disponible
 */
export const isUsernameAvailable = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    const currentUser = betterAuthUser
      ? await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
          .first()
      : null;

    // Nettoyer le username
    const cleanUsername = args.username
      .trim()
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9_]/g, "");

    if (cleanUsername.length < 3) {
      return { available: false, reason: "too_short" };
    }

    if (cleanUsername.length > 30) {
      return { available: false, reason: "too_long" };
    }

    // Vérifier si le username existe déjà
    const existingUser = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", cleanUsername))
      .first();

    // Si c'est le username actuel de l'utilisateur, il est disponible
    if (existingUser && currentUser && existingUser._id === currentUser._id) {
      return { available: true };
    }

    if (existingUser) {
      return { available: false, reason: "taken" };
    }

    return { available: true };
  },
});

/**
 * Récupère un utilisateur par son username
 */
export const getUserByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    // Enlever le @ si présent
    const cleanUsername = args.username.startsWith("@") 
      ? args.username.slice(1) 
      : args.username;

    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", cleanUsername))
      .first();

    if (!user) {
      return null;
    }

    // Si le profil est privé, retourner seulement les infos de base
    if (!user.isPublic) {
      return {
        _id: user._id,
        name: user.name,
        username: user.username,
        image: user.image,
        bio: user.bio,
        isPublic: false,
      };
    }

    // Si public, retourner toutes les infos
    return user;
  },
});

/**
 * Récupère le profil utilisateur complet
 */
export const getUserProfile = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Récupérer les statistiques de l'utilisateur
    const anticipations = await ctx.db
      .query("anticipations")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .collect();

    const resolvedAnticipations = anticipations.filter((a) => a.resolved);
    const correctAnticipations = resolvedAnticipations.filter(
      (a) => a.result === a.issue
    );

    return {
      ...user,
      stats: {
        totalAnticipations: anticipations.length,
        resolvedAnticipations: resolvedAnticipations.length,
        correctAnticipations: correctAnticipations.length,
        accuracy:
          resolvedAnticipations.length > 0
            ? Math.round(
                (correctAnticipations.length / resolvedAnticipations.length) *
                  100
              )
            : 0,
      },
    };
  },
});
