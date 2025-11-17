import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";

/**
 * Liste toutes les missions avec progression pour l'utilisateur connecté
 */
export const getMissionsForUser = query({
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

    if (!appUser) {
      return [];
    }

    const missions = await ctx.db
      .query("missions")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .collect();

    return missions;
  },
});

/**
 * Informations sur le niveau actuel et suivant
 */
export const getLevelInfo = query({
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

    const currentLevel = appUser.level;
    const nextLevel = currentLevel < 5 ? currentLevel + 1 : null;

    const reachByLevel: Record<number, number> = {
      1: 10,
      2: 25,
      3: 50,
      4: 100,
      5: 200,
    };

    return {
      currentLevel,
      currentReach: reachByLevel[currentLevel] || 10,
      nextLevel,
      nextReach: nextLevel ? reachByLevel[nextLevel] : null,
    };
  },
});

/**
 * Crée les missions initiales pour un nouvel utilisateur
 */
export const initializeMissions = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const missions = [
      {
        userId: args.userId,
        type: "login_3_days",
        category: "habit" as const,
        title: "Se connecter 3 jours différents dans la même semaine",
        description: "Connecte-toi 3 jours différents cette semaine pour débloquer cette mission",
        target: 3,
        progress: 0,
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: args.userId,
        type: "login_7_days",
        category: "habit" as const,
        title: "Se connecter 7 jours d'affilée",
        description: "Connecte-toi 7 jours consécutifs",
        target: 7,
        progress: 0,
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: args.userId,
        type: "view_10_projects",
        category: "discovery" as const,
        title: "Consulter 10 projets dans ton rayon",
        description: "Découvre 10 projets dans ta région",
        target: 10,
        progress: 0,
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: args.userId,
        type: "open_5_orgs",
        category: "discovery" as const,
        title: "Ouvrir 5 profils d'organisations différentes",
        description: "Explore 5 organisations différentes",
        target: 5,
        progress: 0,
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: args.userId,
        type: "save_5_favorites",
        category: "discovery" as const,
        title: "Enregistrer 5 contenus dans tes favoris",
        description: "Sauvegarde 5 articles ou projets",
        target: 5,
        progress: 0,
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: args.userId,
        type: "follow_5_tags",
        category: "discovery" as const,
        title: "Suivre 5 sujets (tags) différents",
        description: "Suis 5 tags différents pour personnaliser ton feed",
        target: 5,
        progress: 0,
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: args.userId,
        type: "complete_profile",
        category: "discovery" as const,
        title: "Compléter 100% de ton profil",
        description: "Complete ta bio, localisation, tags et liens",
        target: 100,
        progress: 0,
        completed: false,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const mission of missions) {
      await ctx.db.insert("missions", mission);
    }

    return { success: true };
  },
});

/**
 * Met à jour la progression d'une mission
 */
export const updateMissionProgress = mutation({
  args: {
    missionId: v.id("missions"),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    const mission = await ctx.db.get(args.missionId);
    if (!mission) {
      throw new Error("Mission not found");
    }

    const newProgress = Math.min(args.progress, mission.target);
    const completed = newProgress >= mission.target;

    await ctx.db.patch(args.missionId, {
      progress: newProgress,
      completed,
      completedAt: completed ? Date.now() : undefined,
      updatedAt: Date.now(),
    });

    // Si la mission est complétée, on vérifiera le niveau up ailleurs
    // (éviter les appels récursifs)

    return { success: true, completed };
  },
});

/**
 * Marque une mission comme complétée
 */
export const completeMission = mutation({
  args: {
    missionId: v.id("missions"),
  },
  handler: async (ctx, args) => {
    const mission = await ctx.db.get(args.missionId);
    if (!mission) {
      throw new Error("Mission not found");
    }

    await ctx.db.patch(args.missionId, {
      progress: mission.target,
      completed: true,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Le niveau up sera vérifié ailleurs

    return { success: true };
  },
});

/**
 * Vérifie et applique la montée de niveau
 */
export const checkLevelUp = mutation({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return { success: false };
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return { success: false };
    }

    // Vérifier si toutes les missions du niveau actuel sont complétées
    const incompleteMissions = await ctx.db
      .query("missions")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();

    if (incompleteMissions.length === 0 && appUser.level < 5) {
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

    return { success: false };
  },
});

/**
 * Enregistre une connexion (pour missions "se connecter X jours")
 */
export const trackLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return { success: false };
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return { success: false };
    }

    // Mettre à jour les missions de connexion
    const loginMissions = await ctx.db
      .query("missions")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("type"), "login_3_days"),
          q.eq(q.field("type"), "login_7_days")
        )
      )
      .collect();

    for (const mission of loginMissions) {
      if (!mission.completed) {
        const newProgress = mission.progress + 1;
        const completed = newProgress >= mission.target;
        await ctx.db.patch(mission._id, {
          progress: newProgress,
          completed,
          completedAt: completed ? Date.now() : undefined,
        });
      }
    }

    return { success: true };
  },
});

/**
 * Met à jour la progression de la mission "view_10_projects"
 * Appelée après qu'une vue de projet soit enregistrée
 */
export const updateViewProjectMission = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const mission = await ctx.db
      .query("missions")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("type"), "view_10_projects"))
      .first();

    if (mission && !mission.completed) {
      const newProgress = mission.progress + 1;
      const completed = newProgress >= mission.target;
      await ctx.db.patch(mission._id, {
        progress: newProgress,
        completed,
        completedAt: completed ? Date.now() : undefined,
      });
    }

    return { success: true };
  },
});

/**
 * Enregistre un commentaire utile (pour missions de contribution)
 */
export const trackUsefulComment = mutation({
  args: {
    commentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    // Cette fonction sera appelée quand un commentaire reçoit des votes "utile"
    const comment = await ctx.db.get(args.commentId);
    if (comment && comment.usefulCount > 0) {
      // Mission de contribution pourrait être ajoutée ici
      // Pour l'instant, on retourne juste le commentaire
    }
    return { success: true };
  },
});

