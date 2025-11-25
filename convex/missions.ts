import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { getRuleValueAsNumber } from "./configurableRules.helpers";
import { DEFAULT_MISSIONS } from "./missions.defaults";
import { internal } from "./_generated/api";

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
    const credibilityScore = appUser.credibilityScore || 0;
    const maxLevel = await getRuleValueAsNumber(ctx, "max_user_level").catch(() => 5);
    const nextLevel = currentLevel < maxLevel ? currentLevel + 1 : null;

    // Récupérer les seuils pour afficher les informations
    const level2Threshold = await getRuleValueAsNumber(ctx, "level_2_credibility_threshold").catch(() => 20);
    const level3Threshold = await getRuleValueAsNumber(ctx, "level_3_credibility_threshold").catch(() => 40);
    const level4Threshold = await getRuleValueAsNumber(ctx, "level_4_credibility_threshold").catch(() => 60);
    const level5Threshold = await getRuleValueAsNumber(ctx, "level_5_credibility_threshold").catch(() => 80);

    const thresholds: Record<number, number> = {
      2: level2Threshold,
      3: level3Threshold,
      4: level4Threshold,
      5: level5Threshold,
    };

    return {
      currentLevel,
      credibilityScore,
      nextLevel,
      nextLevelThreshold: nextLevel ? thresholds[nextLevel] : null,
      maxLevel,
    };
  },
});

/**
 * Crée les missions initiales pour un nouvel utilisateur (mutation interne)
 * Peut être appelée depuis d'autres mutations
 */
export const initializeMissionsInternal = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Récupérer toutes les missions actives (par défaut + créées par admin)
    const allActiveMissions = await ctx.db
      .query("missionTemplates")
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // Si aucune mission template n'existe, utiliser les missions par défaut
    if (allActiveMissions.length === 0) {
      for (const defaultMission of DEFAULT_MISSIONS) {
        await ctx.db.insert("missions", {
          userId: args.userId,
          type: defaultMission.type,
          category: defaultMission.category,
          title: defaultMission.title,
          description: defaultMission.description,
          target: defaultMission.target,
          progress: 0,
          completed: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      // Créer les missions depuis les templates actifs
      for (const template of allActiveMissions) {
        await ctx.db.insert("missions", {
          userId: args.userId,
          type: template.type,
          category: template.category,
          title: template.title,
          description: template.description,
          target: template.target,
          progress: 0,
          completed: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { success: true };
  },
});

/**
 * Crée les missions initiales pour l'utilisateur connecté (mutation publique)
 * Pour les appels depuis le client
 */
export const initializeMissions = mutation({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      throw new Error("User not found in database");
    }

    // Vérifier si l'utilisateur a déjà des missions
    const existingMissions = await ctx.db
      .query("missions")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .collect();

    if (existingMissions.length > 0) {
      return { success: false, message: "Missions already initialized" };
    }

    const now = Date.now();

    // Récupérer toutes les missions actives (par défaut + créées par admin)
    const allActiveMissions = await ctx.db
      .query("missionTemplates")
      .filter((q) => q.eq(q.field("active"), true))
      .collect();

    // Si aucune mission template n'existe, utiliser les missions par défaut
    if (allActiveMissions.length === 0) {
      for (const defaultMission of DEFAULT_MISSIONS) {
        await ctx.db.insert("missions", {
          userId: appUser._id,
          type: defaultMission.type,
          category: defaultMission.category,
          title: defaultMission.title,
          description: defaultMission.description,
          target: defaultMission.target,
          progress: 0,
          completed: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      // Créer les missions depuis les templates actifs
      for (const template of allActiveMissions) {
        await ctx.db.insert("missions", {
          userId: appUser._id,
          type: template.type,
          category: template.category,
          title: template.title,
          description: template.description,
          target: template.target,
          progress: 0,
          completed: false,
          createdAt: now,
          updatedAt: now,
        });
      }
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
    const wasCompleted = mission.completed;
    const completed = newProgress >= mission.target;

    await ctx.db.patch(args.missionId, {
      progress: newProgress,
      completed,
      completedAt: completed && !wasCompleted ? Date.now() : mission.completedAt,
      updatedAt: Date.now(),
    });

    // Si la mission vient d'être complétée, ajouter des points de crédibilité
    if (completed && !wasCompleted) {
      try {
        const pointsPerMission = await getRuleValueAsNumber(ctx, "credibility_mission_completed_points").catch(() => 2);
        const user = await ctx.db.get(mission.userId);
        if (user) {
          const newScore = Math.min((user.credibilityScore || 0) + pointsPerMission, 100);
          await ctx.db.patch(mission.userId, {
            credibilityScore: newScore,
            updatedAt: Date.now(),
          });
          
          // Enregistrer dans l'historique
          await ctx.db.insert("credibilityHistory", {
            userId: mission.userId,
            previousScore: user.credibilityScore || 0,
            newScore,
            pointsGained: pointsPerMission,
            actionType: "mission_completed",
            actionDetails: {
              missionId: args.missionId,
              reason: `Mission complétée: ${mission.title}`,
            },
            createdAt: Date.now(),
          });
        }
      } catch (error) {
        console.error("Erreur ajout crédibilité mission:", error);
      }
    }

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

    const wasCompleted = mission.completed;

    await ctx.db.patch(args.missionId, {
      progress: mission.target,
      completed: true,
      completedAt: wasCompleted ? mission.completedAt : Date.now(),
      updatedAt: Date.now(),
    });

    // Si la mission vient d'être complétée, ajouter des points de crédibilité
    if (!wasCompleted) {
      try {
        const pointsPerMission = await getRuleValueAsNumber(ctx, "credibility_mission_completed_points").catch(() => 2);
        const user = await ctx.db.get(mission.userId);
        if (user) {
          const newScore = Math.min((user.credibilityScore || 0) + pointsPerMission, 100);
          await ctx.db.patch(mission.userId, {
            credibilityScore: newScore,
            updatedAt: Date.now(),
          });
          
          // Enregistrer dans l'historique
          await ctx.db.insert("credibilityHistory", {
            userId: mission.userId,
            previousScore: user.credibilityScore || 0,
            newScore,
            pointsGained: pointsPerMission,
            actionType: "mission_completed",
            actionDetails: {
              missionId: args.missionId,
              reason: `Mission complétée: ${mission.title}`,
            },
            createdAt: Date.now(),
          });
        }
      } catch (error) {
        console.error("Erreur ajout crédibilité mission:", error);
      }
    }

    return { success: true };
  },
});

/**
 * Calcule le niveau basé sur le score de crédibilité en utilisant les règles configurables
 * Les seuils sont récupérés depuis les règles configurables (modifiables par gouvernance)
 */
export async function calculateLevelFromCredibility(
  ctx: any,
  credibilityScore: number
): Promise<number> {
  // Récupérer les seuils depuis les règles configurables
  const level2Threshold = await getRuleValueAsNumber(ctx, "level_2_credibility_threshold").catch(() => 20);
  const level3Threshold = await getRuleValueAsNumber(ctx, "level_3_credibility_threshold").catch(() => 40);
  const level4Threshold = await getRuleValueAsNumber(ctx, "level_4_credibility_threshold").catch(() => 60);
  const level5Threshold = await getRuleValueAsNumber(ctx, "level_5_credibility_threshold").catch(() => 80);
  const maxLevel = await getRuleValueAsNumber(ctx, "max_user_level").catch(() => 5);

  if (credibilityScore >= level5Threshold && maxLevel >= 5) return 5;
  if (credibilityScore >= level4Threshold && maxLevel >= 4) return 4;
  if (credibilityScore >= level3Threshold && maxLevel >= 3) return 3;
  if (credibilityScore >= level2Threshold && maxLevel >= 2) return 2;
  return 1;
}

/**
 * Vérifie et applique la montée de niveau basée sur le score de crédibilité
 * Cette fonction est appelée automatiquement quand le score de crédibilité change
 */
export const checkLevelUp = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false };
    }

    const currentLevel = user.level;
    const credibilityScore = user.credibilityScore || 0;
    const newLevel = await calculateLevelFromCredibility(ctx, credibilityScore);
    const maxLevel = await getRuleValueAsNumber(ctx, "max_user_level").catch(() => 5);

    // Si le niveau a augmenté, mettre à jour et envoyer une notification
    if (newLevel > currentLevel && newLevel <= maxLevel) {
      await ctx.db.patch(args.userId, {
        level: newLevel,
        updatedAt: Date.now(),
      });

      // Créer une notification de montée de niveau
      await ctx.runMutation(internal.notifications.createNotificationInternal, {
        userId: args.userId,
        type: "level_up",
        title: `Félicitations ! Vous êtes passé au niveau ${newLevel}`,
        message: `Votre score de crédibilité de ${credibilityScore} points vous permet d'accéder au niveau ${newLevel}.`,
        link: "/studio/credibilite",
      });

      return { success: true, newLevel, previousLevel: currentLevel };
    }

    return { success: false, currentLevel };
  },
});

/**
 * Vérifie et applique la montée de niveau (mutation publique)
 * Pour les appels depuis le client si nécessaire
 */
export const checkLevelUpPublic = mutation({
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

    const currentLevel = appUser.level;
    const credibilityScore = appUser.credibilityScore || 0;
    const newLevel = await calculateLevelFromCredibility(ctx, credibilityScore);
    const maxLevel = await getRuleValueAsNumber(ctx, "max_user_level").catch(() => 5);

    // Si le niveau a augmenté, mettre à jour et envoyer une notification
    if (newLevel > currentLevel && newLevel <= maxLevel) {
      await ctx.db.patch(appUser._id, {
        level: newLevel,
        updatedAt: Date.now(),
      });

      // Créer une notification de montée de niveau
      await ctx.runMutation(internal.notifications.createNotificationInternal, {
        userId: appUser._id,
        type: "level_up",
        title: `Félicitations ! Vous êtes passé au niveau ${newLevel}`,
        message: `Votre score de crédibilité de ${credibilityScore} points vous permet d'accéder au niveau ${newLevel}.`,
        link: "/studio/credibilite",
      });

      return { success: true, newLevel, previousLevel: currentLevel };
    }

    return { success: false, currentLevel };
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
          updatedAt: Date.now(),
        });

        // Si la mission vient d'être complétée, ajouter des points de crédibilité
        if (completed) {
          try {
            const pointsPerMission = await getRuleValueAsNumber(ctx, "credibility_mission_completed_points").catch(() => 2);
            const user = await ctx.db.get(mission.userId);
            if (user) {
              const newScore = Math.min((user.credibilityScore || 0) + pointsPerMission, 100);
              await ctx.db.patch(mission.userId, {
                credibilityScore: newScore,
                updatedAt: Date.now(),
              });
              
              // Enregistrer dans l'historique
              await ctx.db.insert("credibilityHistory", {
                userId: mission.userId,
                previousScore: user.credibilityScore || 0,
                newScore,
                pointsGained: pointsPerMission,
                actionType: "mission_completed",
                actionDetails: {
                  missionId: mission._id,
                  reason: `Mission complétée: ${mission.title}`,
                },
                createdAt: Date.now(),
              });
            }
          } catch (error) {
            console.error("Erreur ajout crédibilité mission:", error);
          }
        }
      }
    }

    return { success: true };
  },
});

/**
 * Met à jour la progression de la mission "view_10_projects" (mutation interne)
 * Appelée depuis incrementProjectViews
 */
export const updateViewProjectMissionInternal = internalMutation({
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
        updatedAt: Date.now(),
      });

      // Si la mission vient d'être complétée, ajouter des points de crédibilité
      if (completed) {
        try {
          const pointsPerMission = await getRuleValueAsNumber(ctx, "credibility_mission_completed_points").catch(() => 2);
          const user = await ctx.db.get(args.userId);
          if (user) {
            const newScore = Math.min((user.credibilityScore || 0) + pointsPerMission, 100);
            await ctx.db.patch(args.userId, {
              credibilityScore: newScore,
              updatedAt: Date.now(),
            });
            
            // Enregistrer dans l'historique
            await ctx.db.insert("credibilityHistory", {
              userId: args.userId,
              previousScore: user.credibilityScore || 0,
              newScore,
              pointsGained: pointsPerMission,
              actionType: "mission_completed",
              actionDetails: {
                missionId: mission._id,
                reason: `Mission complétée: ${mission.title}`,
              },
              createdAt: Date.now(),
            });
          }
        } catch (error) {
          console.error("Erreur ajout crédibilité mission:", error);
        }
      }
    }

    return { success: true };
  },
});

/**
 * Met à jour la progression de la mission "view_10_projects" (mutation publique)
 * Pour les appels depuis le client si nécessaire
 */
export const updateViewProjectMission = mutation({
  args: {
    userId: v.id("users"),
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

    if (!appUser || appUser._id !== args.userId) {
      throw new Error("Unauthorized");
    }

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
        updatedAt: Date.now(),
      });

      // Si la mission vient d'être complétée, ajouter des points de crédibilité
      if (completed) {
        try {
          const pointsPerMission = await getRuleValueAsNumber(ctx, "credibility_mission_completed_points").catch(() => 2);
          const user = await ctx.db.get(args.userId);
          if (user) {
            const newScore = Math.min((user.credibilityScore || 0) + pointsPerMission, 100);
            await ctx.db.patch(args.userId, {
              credibilityScore: newScore,
              updatedAt: Date.now(),
            });
            
            // Enregistrer dans l'historique
            await ctx.db.insert("credibilityHistory", {
              userId: args.userId,
              previousScore: user.credibilityScore || 0,
              newScore,
              pointsGained: pointsPerMission,
              actionType: "mission_completed",
              actionDetails: {
                missionId: mission._id,
                reason: `Mission complétée: ${mission.title}`,
              },
              createdAt: Date.now(),
            });
          }
        } catch (error) {
          console.error("Erreur ajout crédibilité mission:", error);
        }
      }
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

// ============================================
// ADMIN - GESTION DES MISSIONS (TEMPLATES)
// ============================================

/**
 * Récupère toutes les missions templates (pour admin)
 */
export const getAllMissionTemplates = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    // Vérifier si super admin
    const normalizedEmail = betterAuthUser.email.toLowerCase().trim();
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    // Récupérer toutes les missions templates
    const templates = await ctx.db
      .query("missionTemplates")
      .order("desc")
      .collect();

    return templates;
  },
});

/**
 * Crée une nouvelle mission template (pour admin)
 */
export const createMissionTemplate = mutation({
  args: {
    type: v.string(),
    category: v.union(
      v.literal("habit"),
      v.literal("discovery"),
      v.literal("contribution"),
      v.literal("engagement")
    ),
    title: v.string(),
    description: v.string(),
    target: v.number(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    // Vérifier si super admin
    const normalizedEmail = betterAuthUser.email.toLowerCase().trim();
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    // Vérifier si le type existe déjà
    const existing = await ctx.db
      .query("missionTemplates")
      .filter((q) => q.eq(q.field("type"), args.type))
      .first();

    if (existing) {
      throw new Error(`Mission template with type "${args.type}" already exists`);
    }

    const now = Date.now();

    await ctx.db.insert("missionTemplates", {
      type: args.type,
      category: args.category,
      title: args.title,
      description: args.description,
      target: args.target,
      active: args.active,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Met à jour une mission template (pour admin)
 */
export const updateMissionTemplate = mutation({
  args: {
    templateId: v.id("missionTemplates"),
    type: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("habit"),
        v.literal("discovery"),
        v.literal("contribution"),
        v.literal("engagement")
      )
    ),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    target: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    // Vérifier si super admin
    const normalizedEmail = betterAuthUser.email.toLowerCase().trim();
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Mission template not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.type !== undefined) {
      // Vérifier si le nouveau type existe déjà (sauf pour le template actuel)
      if (args.type !== template.type) {
        const existing = await ctx.db
          .query("missionTemplates")
          .filter((q) => q.eq(q.field("type"), args.type))
          .first();

        if (existing) {
          throw new Error(`Mission template with type "${args.type}" already exists`);
        }
      }
      updates.type = args.type;
    }
    if (args.category !== undefined) updates.category = args.category;
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.target !== undefined) updates.target = args.target;
    if (args.active !== undefined) updates.active = args.active;

    await ctx.db.patch(args.templateId, updates);

    return { success: true };
  },
});

/**
 * Supprime une mission template (pour admin)
 */
export const deleteMissionTemplate = mutation({
  args: {
    templateId: v.id("missionTemplates"),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser || !betterAuthUser.email) {
      throw new Error("Not authenticated");
    }

    // Vérifier si super admin
    const normalizedEmail = betterAuthUser.email.toLowerCase().trim();
    const isAdmin = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!isAdmin) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Mission template not found");
    }

    await ctx.db.delete(args.templateId);

    return { success: true };
  },
});
