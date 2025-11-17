import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";

/**
 * Récupère l'utilisateur connecté avec toutes ses données
 * Crée automatiquement l'utilisateur dans la table users s'il n'existe pas encore
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return null;
    }

    let appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    // Si l'utilisateur n'existe pas encore dans la table users
    // (peut arriver si le hook onCreateUser n'a pas encore été appelé ou a échoué)
    if (!appUser) {
      // On ne peut pas faire d'insert dans une query, donc on retourne juste Better Auth data
      // avec des valeurs par défaut pour que l'UI fonctionne
      // La sidebar appellera ensureUserExists() automatiquement
      return {
        _id: undefined as any, // Pas d'ID car pas encore dans la DB
        email: betterAuthUser.email,
        name: betterAuthUser.name || betterAuthUser.email.split("@")[0] || "Utilisateur",
        image: betterAuthUser.image || null,
        level: 1,
        reachRadius: 10,
        tags: [],
        links: [],
        profileCompletion: 0,
        premiumTier: "free" as const,
        boostCredits: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        emailVerified: betterAuthUser.emailVerified || false,
      };
    }

    // Merge app user data with Better Auth user data
    // Better Auth data prend la priorité pour email, name, image
    return {
      ...appUser,
      email: betterAuthUser.email,
      name: betterAuthUser.name || appUser.email.split("@")[0],
      image: betterAuthUser.image || null,
      emailVerified: betterAuthUser.emailVerified || false,
    };
  },
});

/**
 * Crée ou synchronise l'utilisateur dans la table users
 * À appeler après une connexion OAuth pour s'assurer que l'utilisateur existe
 */
export const ensureUserExists = mutation({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    let appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    // Si l'utilisateur n'existe pas, le créer
    if (!appUser) {
      const now = Date.now();
      const userId = await ctx.db.insert("users", {
        email: betterAuthUser.email,
        level: 1,
        reachRadius: 10,
        tags: [],
        links: [],
        profileCompletion: 0,
        premiumTier: "free",
        boostCredits: 0,
        createdAt: now,
        updatedAt: now,
      });
      return userId;
    }

    // Sinon, mettre à jour l'email si nécessaire
    if (appUser.email !== betterAuthUser.email) {
      await ctx.db.patch(appUser._id, {
        email: betterAuthUser.email,
        updatedAt: Date.now(),
      });
    }

    return appUser._id;
  },
});

/**
 * Récupère un profil utilisateur public
 */
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Get Better Auth user data if available
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    
    // Only return public profile data
    return {
      _id: user._id,
      email: user.email,
      level: user.level,
      region: user.region,
      location: user.location,
      bio: user.bio,
      tags: user.tags,
      links: user.links,
      profileCompletion: user.profileCompletion,
      premiumTier: user.premiumTier,
      createdAt: user.createdAt,
      // Add name and image from Better Auth if current user
      name: betterAuthUser?.name,
      image: betterAuthUser?.image,
    };
  },
});

/**
 * Récupère les statistiques d'activité d'un utilisateur
 */
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Vues de profil
    const profileViews = await ctx.db
      .query("views")
      .withIndex("targetType_targetId", (q) =>
        q.eq("targetType", "profile").eq("targetId", args.userId)
      )
      .filter((q) => q.gte(q.field("createdAt"), oneMonthAgo))
      .collect();

    // Articles de l'utilisateur
    const articles = await ctx.db
      .query("articles")
      .withIndex("authorId", (q) => q.eq("authorId", args.userId))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Calcul des moyennes
    const totalArticleViews = articles.reduce((sum, a) => sum + a.views, 0);
    const totalArticleComments = articles.reduce((sum, a) => sum + a.comments, 0);
    const totalArticleReactions = articles.reduce((sum, a) => sum + a.reactions, 0);

    const articleCount = articles.length;

    return {
      profileViews: profileViews.length,
      averageViewsPerArticle: articleCount > 0 ? Math.round(totalArticleViews / articleCount) : 0,
      averageCommentsPerArticle: articleCount > 0 ? Math.round(totalArticleComments / articleCount) : 0,
      averageReactionsPerArticle: articleCount > 0 ? Math.round(totalArticleReactions / articleCount) : 0,
    };
  },
});

/**
 * Récupère uniquement le nom d'un utilisateur (pour le breadcrumb)
 */
export const getUserName = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    // Utiliser l'email comme nom par défaut (le nom est dans Better Auth, mais on utilise l'email ici pour simplifier)
    const name = user.email.split("@")[0] || "Utilisateur";
    return { name };
  },
});

/**
 * Calcule le rayon d'audience selon le niveau
 */
export const getUserReach = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Calcul du rayon selon niveau
    const reachByLevel: Record<number, number> = {
      1: 10,   // 10km
      2: 25,   // 25km
      3: 50,   // 50km (régional)
      4: 100,  // 100km
      5: 200,  // 200km+
    };

    const reachRadius = reachByLevel[user.level] || 10;

    return {
      level: user.level,
      reachRadius,
      region: user.region,
      location: user.location,
    };
  },
});

/**
 * Met à jour le profil utilisateur
 */
export const updateProfile = mutation({
  args: {
    bio: v.optional(v.string()),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    tags: v.optional(v.array(v.string())),
    links: v.optional(
      v.array(
        v.object({
          type: v.string(),
          url: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    let appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      // Créer l'utilisateur s'il n'existe pas
      const now = Date.now();
      const userId = await ctx.db.insert("users", {
        email: betterAuthUser.email,
        level: 1,
        reachRadius: 10,
        tags: [],
        links: [],
        profileCompletion: 0,
        premiumTier: "free",
        boostCredits: 0,
        createdAt: now,
        updatedAt: now,
      });
      appUser = await ctx.db.get(userId);
      if (!appUser) {
        throw new Error("Failed to create user");
      }
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.location !== undefined) updates.location = args.location;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.links !== undefined) updates.links = args.links;

    await ctx.db.patch(appUser._id, updates);

    // Recalculer le % de complétion
    const updatedUser = await ctx.db.get(appUser._id);
    if (updatedUser) {
      let completion = 0;
      const fields = [
        updatedUser.bio,
        updatedUser.location,
        updatedUser.tags.length > 0,
        updatedUser.links.length > 0,
      ];
      const completedFields = fields.filter(Boolean).length;
      completion = Math.round((completedFields / fields.length) * 100);
      
      await ctx.db.patch(appUser._id, {
        profileCompletion: completion,
      });
    }

    return { success: true };
  },
});

/**
 * Change la région sélectionnée
 */
export const updateRegion = mutation({
  args: {
    region: v.string(),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    let appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      // Créer l'utilisateur s'il n'existe pas
      const now = Date.now();
      const userId = await ctx.db.insert("users", {
        email: betterAuthUser.email,
        level: 1,
        reachRadius: 10,
        tags: [],
        links: [],
        profileCompletion: 0,
        premiumTier: "free",
        boostCredits: 0,
        createdAt: now,
        updatedAt: now,
      });
      appUser = await ctx.db.get(userId);
      if (!appUser) {
        throw new Error("Failed to create user");
      }
    }

    await ctx.db.patch(appUser._id, {
      region: args.region,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Recalcule le % de complétion du profil
 */
export const calculateProfileCompletion = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return;
    }

    let completion = 0;
    const fields = [
      user.bio,
      user.location,
      user.tags.length > 0,
      user.links.length > 0,
    ];

    const completedFields = fields.filter(Boolean).length;
    completion = Math.round((completedFields / fields.length) * 100);

    await ctx.db.patch(args.userId, {
      profileCompletion: completion,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Monte de niveau (si conditions remplies)
 */
export const upgradeLevel = mutation({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    let appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      // Créer l'utilisateur s'il n'existe pas
      const now = Date.now();
      const userId = await ctx.db.insert("users", {
        email: betterAuthUser.email,
        level: 1,
        reachRadius: 10,
        tags: [],
        links: [],
        profileCompletion: 0,
        premiumTier: "free",
        boostCredits: 0,
        createdAt: now,
        updatedAt: now,
      });
      appUser = await ctx.db.get(userId);
      if (!appUser) {
        throw new Error("Failed to create user");
      }
    }

    // Vérifier si toutes les missions du niveau actuel sont complétées
    const missions = await ctx.db
      .query("missions")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();

    // Si toutes les missions sont complétées, monter de niveau
    if (missions.length === 0 && appUser.level < 5) {
      const newLevel = appUser.level + 1;
      const reachByLevel: Record<number, number> = {
        1: 10,
        2: 25,
        3: 50,
        4: 100,
        5: 200,
      };

      await ctx.db.patch(appUser._id, {
        level: newLevel,
        reachRadius: reachByLevel[newLevel] || 200,
        updatedAt: Date.now(),
      });

      return { success: true, newLevel };
    }

    return { success: false, message: "Missions not completed" };
  },
});
