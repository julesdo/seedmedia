import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

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
    // Pour name et image, on utilise la valeur de la table users si elle existe, sinon Better Auth
    return {
      ...appUser,
      email: betterAuthUser.email,
      name: appUser.name || betterAuthUser.name || appUser.email.split("@")[0],
      image: appUser.image || betterAuthUser.image || null,
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
      const userData: any = {
        email: betterAuthUser.email,
        level: 1,
        reachRadius: 10,
        tags: [],
        links: [],
        profileCompletion: 0,
        premiumTier: "free",
        boostCredits: 0,
        credibilityScore: 0,
        role: "explorateur",
        expertiseDomains: [],
        createdAt: now,
        updatedAt: now,
      };
      
      // Ajouter name et image depuis Better Auth si disponibles
      if (betterAuthUser.name) {
        userData.name = betterAuthUser.name;
      }
      if (betterAuthUser.image) {
        userData.image = betterAuthUser.image;
      }
      
      const userId = await ctx.db.insert("users", userData);
      
      // Initialiser les missions pour le nouvel utilisateur
      await ctx.runMutation(internal.missions.initializeMissionsInternal, {
        userId,
      });
      
      return userId;
    }

    // Sinon, synchroniser les données depuis Better Auth si nécessaire
    const updates: any = {
      updatedAt: Date.now(),
    };
    
    // Synchroniser l'email si nécessaire
    if (appUser.email !== betterAuthUser.email) {
      updates.email = betterAuthUser.email;
    }
    
    // Synchroniser le nom si l'utilisateur n'en a pas ou si Better Auth en a un
    if (betterAuthUser.name && (!appUser.name || appUser.name === appUser.email.split("@")[0])) {
      updates.name = betterAuthUser.name;
    }
    
    // Synchroniser l'image si l'utilisateur n'en a pas et que Better Auth en a une
    if (betterAuthUser.image && !appUser.image) {
      updates.image = betterAuthUser.image;
    }
    
    // Appliquer les mises à jour si nécessaire
    if (Object.keys(updates).length > 1) { // Plus que updatedAt
      await ctx.db.patch(appUser._id, updates);
    }

    return appUser._id;
  },
});

/**
 * Récupère un profil utilisateur public (amélioré avec Better Auth)
 */
export const getUserPublic = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Vérifier si c'est le profil de l'utilisateur connecté
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    const isOwnProfile = betterAuthUser ? await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first()
      .then((appUser) => appUser?._id === args.userId) : false;

    // Récupérer les données Better Auth pour le nom et l'image
    // Pour l'instant, on utilise l'email comme nom par défaut
    const name = user.email.split("@")[0] || "Utilisateur";
    const image = isOwnProfile && betterAuthUser?.image ? betterAuthUser.image : null;

    return {
      ...user,
      name,
      image,
      isOwnProfile,
      // Données publiques uniquement
      email: isOwnProfile ? user.email : undefined, // Email seulement si c'est son propre profil
    };
  },
});

/**
 * Récupère un profil utilisateur public (version simple, pour compatibilité)
 * Délègue à getUserPublic
 */
export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Vérifier si c'est le profil de l'utilisateur connecté
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    const isOwnProfile = betterAuthUser ? await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first()
      .then((appUser) => appUser?._id === args.userId) : false;

    // Récupérer les données Better Auth pour le nom et l'image
    const name = user.email.split("@")[0] || "Utilisateur";
    const image = isOwnProfile && betterAuthUser?.image ? betterAuthUser.image : null;

    return {
      ...user,
      name,
      image,
      isOwnProfile,
      // Données publiques uniquement
      email: isOwnProfile ? user.email : undefined,
    };
  },
});

/**
 * Récupère les statistiques publiques d'un utilisateur
 */
export const getUserStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Compter les followers
    const followers = await ctx.db
      .query("follows")
      .withIndex("targetType_targetId", (q) =>
        q.eq("targetType", "user").eq("targetId", args.userId)
      )
      .collect();

    // Articles publiés
    const articles = await ctx.db
      .query("articles")
      .withIndex("authorId", (q) => q.eq("authorId", args.userId))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Projets (si l'utilisateur a des projets)
    const projects = await ctx.db
      .query("projects")
      .withIndex("authorId", (q) => q.eq("authorId", args.userId))
      .collect();

    // Actions (si l'utilisateur a des actions)
    const actions = await ctx.db
      .query("actions")
      .withIndex("authorId", (q) => q.eq("authorId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Corrections approuvées
    const corrections = await ctx.db
      .query("articleCorrections")
      .collect();
    const approvedCorrections = corrections.filter(
      (c) => c.proposerId === args.userId && c.status === "approved"
    );

    return {
      followersCount: followers.length,
      articlesCount: articles.length,
      projectsCount: projects.length,
      actionsCount: actions.length,
      correctionsCount: approvedCorrections.length,
      credibilityScore: (await ctx.db.get(args.userId))?.credibilityScore || 0,
    };
  },
});

/**
 * Récupère les articles publics d'un utilisateur
 */
export const getUserArticlesPublic = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const articles = await ctx.db
      .query("articles")
      .withIndex("authorId", (q) => q.eq("authorId", args.userId))
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    return articles.sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt));
  },
});

/**
 * Récupère les corrections publiques d'un utilisateur avec les slugs des articles
 */
export const getUserCorrectionsPublic = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const corrections = await ctx.db
      .query("articleCorrections")
      .collect();

    const userCorrections = corrections.filter((c) => c.proposerId === args.userId);

    // Enrichir avec les slugs des articles
    const correctionsWithSlugs = await Promise.all(
      userCorrections.map(async (correction) => {
        const article = await ctx.db.get(correction.articleId);
        return {
          ...correction,
          articleSlug: article?.slug || null,
        };
      })
    );

    return correctionsWithSlugs.sort((a, b) => b.createdAt - a.createdAt);
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
 * Récupère tous les utilisateurs (pour les sélecteurs, réservé aux éditeurs)
 */
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return [];
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    // Seuls les éditeurs peuvent voir tous les utilisateurs
    if (!appUser || appUser.role !== "editeur") {
      return [];
    }

    const users = await ctx.db.query("users").collect();
    return users.map((user) => ({
      _id: user._id,
      email: user.email,
      name: user.name || user.email.split("@")[0],
    }));
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
    name: v.optional(v.string()), // Nom d'affichage (synchronisé avec Better Auth si possible)
    username: v.optional(v.string()), // Nom d'utilisateur unique
    image: v.optional(v.string()), // URL de l'image de profil (synchronisé avec Better Auth si possible)
    coverImage: v.optional(v.string()), // URL de l'image de couverture
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
        credibilityScore: 0,
        role: "explorateur",
        expertiseDomains: [],
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

    // Note: name et image sont stockés localement mais Better Auth reste la source de vérité
    // Pour une synchronisation complète, il faudrait utiliser l'API Better Auth
    if (args.name !== undefined) {
      // On pourrait synchroniser avec Better Auth ici, mais pour l'instant on stocke juste localement
      updates.name = args.name;
    }
    if (args.username !== undefined) updates.username = args.username;
    if (args.image !== undefined) {
      // On pourrait synchroniser avec Better Auth ici
      updates.image = args.image;
    }
    if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
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
        updatedUser.name || betterAuthUser.name,
        updatedUser.image || betterAuthUser.image,
        updatedUser.bio,
        updatedUser.location,
        updatedUser.tags.length > 0,
        updatedUser.links.length > 0,
        updatedUser.coverImage,
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
        credibilityScore: 0,
        role: "explorateur",
        expertiseDomains: [],
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
        credibilityScore: 0,
        role: "explorateur",
        expertiseDomains: [],
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
