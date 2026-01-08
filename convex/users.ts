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
      username: appUser.username, // S'assurer que le username de Convex est prioritaire
      _id: appUser._id,
    };
  },
});

/**
 * Mutation pour s'assurer qu'un utilisateur existe (appelable depuis le client)
 * Crée l'utilisateur s'il n'existe pas encore
 */
export const ensureUserExists = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("🚀 ensureUserExists MUTATION CALLED - Entry point");
    try {
      const result = await ensureUserExistsHelper(ctx);
      console.log("✅ ensureUserExists MUTATION SUCCESS", { userId: result });
      return result;
    } catch (error) {
      console.error("❌ ensureUserExists MUTATION ERROR", { error });
      throw error;
    }
  },
});

/**
 * Génère un username unique à partir d'un nom ou d'un email
 */
function generateUsername(base: string): string {
  // Nettoyer : minuscules, enlever espaces et caractères spéciaux, garder seulement lettres, chiffres et underscore
  let clean = base
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "") // Seulement lettres, chiffres et underscore
    .replace(/\s+/g, "_"); // Remplacer les espaces par des underscores
  
  // Si vide après nettoyage, utiliser "user"
  if (clean.length === 0) {
    clean = "user";
  }
  
  // Limiter à 30 caractères (limite du schéma)
  if (clean.length > 30) {
    clean = clean.substring(0, 30);
  }
  
  // S'assurer qu'il fait au moins 3 caractères
  if (clean.length < 3) {
    clean = clean + "_" + Math.floor(Math.random() * 100).toString().padStart(2, "0");
  }
  
  return clean;
}

/**
 * Trouve un username unique en ajoutant un suffixe si nécessaire
 */
async function findUniqueUsername(ctx: any, baseUsername: string): Promise<string> {
  let username = baseUsername;
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("username", (q: any) => q.eq("username", username))
      .first();
    
    if (!existingUser) {
      return username; // Username disponible
    }
    
    // Ajouter un suffixe numérique
    const base = baseUsername.substring(0, Math.min(baseUsername.length, 25)); // Laisser de la place pour le suffixe
    const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    username = `${base}_${suffix}`;
    
    // S'assurer qu'on ne dépasse pas 30 caractères
    if (username.length > 30) {
      username = username.substring(0, 30);
    }
    
    attempts++;
  }
  
  // Si on n'a pas trouvé après 100 tentatives, utiliser un timestamp
  const timestamp = Date.now().toString().slice(-6);
  return `user_${timestamp}`;
}

/**
 * Helper pour s'assurer qu'un utilisateur existe (utilisé par les mutations)
 * Crée l'utilisateur s'il n'existe pas encore
 */
export async function ensureUserExistsHelper(ctx: any): Promise<Id<"users">> {
  console.log("🔍 ensureUserExistsHelper: Starting...");
  
  const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx);
  if (!betterAuthUser) {
    console.error("❌ ensureUserExistsHelper: Not authenticated - betterAuthUser is null");
    throw new Error("Not authenticated");
  }
  
  console.log(`✅ ensureUserExistsHelper: Authenticated as ${betterAuthUser.email}`);

  // Vérifier si l'utilisateur existe déjà
  let appUser = await ctx.db
    .query("users")
    .withIndex("email", (q: any) => q.eq("email", betterAuthUser.email))
    .first();

  if (appUser) {
    console.log(`✅ ensureUserExistsHelper: User ${betterAuthUser.email} already exists with ID: ${appUser._id}`);
    
    // Si l'utilisateur existe mais n'a pas de username, en générer un
    if (!appUser.username) {
      console.log(`🔄 ensureUserExistsHelper: User exists but has no username, generating one...`);
      const nameOrEmail = appUser.name || betterAuthUser.name || betterAuthUser.email.split("@")[0] || "user";
      const baseUsername = generateUsername(nameOrEmail);
      const uniqueUsername = await findUniqueUsername(ctx, baseUsername);
      
      await ctx.db.patch(appUser._id, { username: uniqueUsername });
      console.log(`✅ ensureUserExistsHelper: Generated username "${uniqueUsername}" for existing user`);
    }
    
    return appUser._id;
  }

  // Créer l'utilisateur s'il n'existe pas
  console.log(`🔄 ensureUserExistsHelper: Creating new user for ${betterAuthUser.email}...`);
  const now = Date.now();
  
  // Valeurs initiales (alignées avec le trigger onCreate)
  const initialLevel = 1;
  const initialReachRadius = 10;
  
  try {
    const userData: any = {
      email: betterAuthUser.email,
      level: initialLevel,
      reachRadius: initialReachRadius,
      tags: [],
      links: [],
      profileCompletion: 0,
      premiumTier: "free",
      boostCredits: 0,
      credibilityScore: 0, // Score initial de crédibilité
      role: "explorateur", // Rôle par défaut
      expertiseDomains: [], // Domaines d'expertise (vide au départ)
      seedsBalance: 100, // Seeds de départ
      seedsToNextLevel: 100, // Seeds nécessaires pour passer au niveau 2
      preferredLanguage: "fr",
      isPublic: false, // Profil privé par défaut
      lastLoginDate: undefined, // Sera défini au premier daily login
      loginStreak: 0, // Streak initialisé à 0
      createdAt: now,
      updatedAt: now,
    };
    
    // Ajouter name et image seulement s'ils existent
    if (betterAuthUser.name) {
      userData.name = betterAuthUser.name;
    }
    if (betterAuthUser.image) {
      userData.image = betterAuthUser.image;
    }
    
    // Générer automatiquement un username à partir du name ou de l'email
    const nameOrEmail = betterAuthUser.name || betterAuthUser.email.split("@")[0] || "user";
    const baseUsername = generateUsername(nameOrEmail);
    const uniqueUsername = await findUniqueUsername(ctx, baseUsername);
    userData.username = uniqueUsername;
    
    console.log(`✅ ensureUserExistsHelper: Generated username "${uniqueUsername}" from "${nameOrEmail}"`);
    
    // Log pour déboguer - vérifier que tous les champs sont présents
    console.log("📋 ensureUserExistsHelper: User data to insert:", JSON.stringify(userData, null, 2));
    console.log("📋 ensureUserExistsHelper: Checking required fields:", {
      boostCredits: userData.boostCredits,
      credibilityScore: userData.credibilityScore,
      profileCompletion: userData.profileCompletion,
      reachRadius: userData.reachRadius,
      premiumTier: userData.premiumTier,
      tags: userData.tags,
      links: userData.links,
      expertiseDomains: userData.expertiseDomains,
      username: userData.username,
    });
    
    const userId = await ctx.db.insert("users", userData);
    console.log(`✅ ensureUserExistsHelper: Successfully created user ${betterAuthUser.email} with ID: ${userId}`);
    return userId;
  } catch (error) {
    console.error(`❌ ensureUserExistsHelper: Failed to create user ${betterAuthUser.email}:`, error);
    throw error;
  }
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

/**
 * Récupère les usernames des utilisateurs populaires (pour generateStaticParams)
 * Utilisé pour pré-générer les pages de profil les plus visitées
 */
export const getPopularUserUsernames = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    // Récupérer tous les utilisateurs avec username et profil public
    const allUsers = await ctx.db
      .query("users")
      .filter((q) => 
        q.and(
          q.neq(q.field("username"), undefined),
          q.eq(q.field("isPublic"), true)
        )
      )
      .collect();
    
    // Calculer un score de popularité basé sur :
    // - Nombre d'anticipations
    // - Niveau de l'utilisateur
    // - Date de dernière activité
    const usersWithScore = await Promise.all(
      allUsers.map(async (user) => {
        const anticipations = await ctx.db
          .query("anticipations")
          .withIndex("userId", (q) => q.eq("userId", user._id))
          .collect();
        
        const score = 
          (anticipations.length * 10) + // 10 points par anticipation
          (user.level * 5) + // 5 points par niveau
          (user.updatedAt ? 1 : 0); // 1 point si profil mis à jour
        
        return {
          username: user.username!,
          score,
        };
      })
    );
    
    // Trier par score décroissant et limiter
    usersWithScore.sort((a, b) => b.score - a.score);
    const topUsers = usersWithScore.slice(0, limit);
    
    return topUsers.map((user) => ({
      username: user.username,
    }));
  },
});