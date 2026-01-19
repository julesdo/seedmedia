import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { betterAuthComponent } from "./auth";
import { api } from "./_generated/api";
import { ensureUserExistsHelper } from "./users";

/**
 * Calcule le niveau d'un utilisateur basé sur son total de Seeds
 * Formule : level = floor(sqrt(seedsBalance / 100)) + 1
 */
function calculateLevel(totalSeeds: number): {
  level: number;
  seedsToNextLevel: number;
  seedsForCurrentLevel: number;
} {
  // Calculer le niveau : level = floor(sqrt(seedsBalance / 100)) + 1
  const level = Math.floor(Math.sqrt(totalSeeds / 100)) + 1;
  
  // Seeds nécessaires pour le niveau actuel
  const seedsForCurrentLevel = Math.pow(level - 1, 2) * 100;
  
  // Seeds nécessaires pour le niveau suivant
  const seedsForNextLevel = Math.pow(level, 2) * 100;
  
  // Seeds restants pour atteindre le niveau suivant
  const seedsToNextLevel = seedsForNextLevel - totalSeeds;
  
  return {
    level,
    seedsToNextLevel: Math.max(0, seedsToNextLevel),
    seedsForCurrentLevel,
  };
}

/**
 * Query publique pour calculer le niveau d'un utilisateur
 */
export const getLevelInfo = query({
  args: {
    totalSeeds: v.number(),
  },
  handler: async (ctx, args) => {
    return calculateLevel(args.totalSeeds);
  },
});

/**
 * Réclame le bonus de connexion quotidienne
 * 
 * Mécanisme :
 * - Base : +10 seeds
 * - Streak bonus : +5 seeds par jour consécutif (max +50/jour)
 * - Variable reward : 10% de chance de x2
 */
export const claimDailyLogin = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await ensureUserExistsHelper(ctx);
    const user = await ctx.db.get(userId);
    
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const lastLogin = user.lastLoginDate 
      ? new Date(user.lastLoginDate).setHours(0, 0, 0, 0)
      : null;
    
    // Vérifier si déjà réclamé aujourd'hui
    if (lastLogin === todayTimestamp) {
      return { 
        claimed: false, 
        reason: "already_claimed_today",
        streak: user.loginStreak || 0,
      };
    }
    
    // Calculer le streak
    const yesterday = todayTimestamp - 86400000; // 24h en ms
    const isConsecutive = lastLogin === yesterday || lastLogin === null;
    const newStreak = isConsecutive ? (user.loginStreak || 0) + 1 : 1;
    
    // Calculer les seeds gagnés
    const baseSeeds = 10;
    const streakBonus = Math.min(newStreak * 5, 50); // Max 50 bonus
    const totalSeeds = baseSeeds + streakBonus;
    
    // Variable reward : 10% de chance de x2
    const luckyBonus = Math.random() < 0.1 ? totalSeeds : 0;
    const finalSeeds = totalSeeds + luckyBonus;
    
    // Calculer le nouveau niveau
    const oldBalance = user.seedsBalance || 0;
    const newBalance = oldBalance + finalSeeds;
    const levelInfo = calculateLevel(newBalance);
    const oldLevel = user.level || 1;
    
    // Mettre à jour l'utilisateur
    await ctx.db.patch(userId, {
      lastLoginDate: todayTimestamp,
      loginStreak: newStreak,
      seedsBalance: newBalance,
      level: levelInfo.level,
      seedsToNextLevel: levelInfo.seedsToNextLevel,
      updatedAt: now,
    });
    
    // Créer une transaction Seeds
    await ctx.runMutation(api.seedsTransactions.createTransaction, {
      userId,
      type: "earned",
      amount: finalSeeds,
      reason: luckyBonus > 0 
        ? `Connexion quotidienne (streak ${newStreak} jours) - Bonus chanceux x2!`
        : `Connexion quotidienne (streak ${newStreak} jours)`,
      relatedId: undefined,
      relatedType: "daily_login",
      levelBefore: oldLevel,
      levelAfter: levelInfo.level,
    });
    
    return {
      claimed: true,
      seedsEarned: finalSeeds,
      baseSeeds,
      streakBonus,
      luckyBonus: luckyBonus > 0,
      streak: newStreak,
      levelUp: levelInfo.level > oldLevel,
      newLevel: levelInfo.level,
    };
  },
});

/**
 * Vérifie si l'utilisateur peut réclamer le daily login
 */
export const canClaimDailyLogin = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return { canClaim: false, reason: "not_authenticated" };
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return { canClaim: false, reason: "user_not_found" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const lastLogin = appUser.lastLoginDate 
      ? new Date(appUser.lastLoginDate).setHours(0, 0, 0, 0)
      : null;

    const canClaim = lastLogin !== todayTimestamp;
    const streak = appUser.loginStreak || 0;

    return {
      canClaim,
      streak,
      lastLoginDate: appUser.lastLoginDate,
    };
  },
});

/**
 * Récompense pour participation (anticiper une décision)
 * 
 * Mécanisme :
 * - Base : +5 seeds
 * - Premier anticipateur : +10 seeds bonus
 * - Décision "hot" (heat > 70) : +15 seeds bonus
 * 
 * Note: Action au lieu de mutation pour pouvoir être appelée depuis d'autres mutations
 */
export const awardParticipationReward = action({
  args: {
    userId: v.id("users"),
    decisionId: v.id("decisions"),
    anticipationId: v.id("anticipations"),
  },
  handler: async (ctx, args): Promise<{
    awarded: boolean;
    reason?: string;
    seedsEarned?: number;
    baseSeeds?: number;
    firstBonus?: number;
    hotBonus?: number;
    levelUp?: boolean;
    newLevel?: number;
  }> => {
    // Récupérer les données via queries
    const user: any = await ctx.runQuery(api.users.getUserById, { userId: args.userId });
    const decision: any = await ctx.runQuery(api.decisions.getDecisionById, { decisionId: args.decisionId });
    
    if (!user || !decision) {
      return { awarded: false, reason: "user_or_decision_not_found" };
    }

    // Vérifier si déjà récompensé (une seule fois par anticipation)
    const existingTransactions: any[] | undefined = await ctx.runQuery(api.seedsTransactions.getUserTransactions, {
      userId: args.userId,
      limit: 100,
    });
    
    const existingTransaction = existingTransactions?.find(
      (t: any) => t.relatedId === args.anticipationId.toString() && t.relatedType === "anticipation_participation"
    );

    if (existingTransaction) {
      return { awarded: false, reason: "already_awarded" };
    }

    // Calculer les récompenses (valeurs réduites pour éviter les gains trop élevés)
    const baseSeeds = 2; // Base : +2 seeds pour participer
    
    // Vérifier si premier anticipateur
    const allAnticipations: any[] | undefined = await ctx.runQuery(api.anticipations.getAnticipationsForDecision, {
      decisionId: args.decisionId,
    });
    
    // Trier par date de création
    const sortedAnticipations: any[] = (allAnticipations || []).sort((a: any, b: any) => a.createdAt - b.createdAt);
    const isFirst: boolean = sortedAnticipations.length > 0 && sortedAnticipations[0]._id === args.anticipationId;
    const firstBonus: number = isFirst ? 3 : 0; // Premier anticipateur : +3 seeds bonus
    
    // Bonus décision "hot" (heat > 70)
    const hotBonus: number = (decision.heat || 0) > 70 ? 5 : 0; // Décision "hot" : +5 seeds bonus
    
    const totalSeeds: number = baseSeeds + firstBonus + hotBonus;
    
    if (totalSeeds <= 0) {
      return { awarded: false, reason: "no_reward" };
    }

    // Calculer le nouveau niveau
    const oldBalance: number = user.seedsBalance || 0;
    const newBalance: number = oldBalance + totalSeeds;
    const levelInfo = calculateLevel(newBalance);
    const oldLevel: number = user.level || 1;
    
    // Mettre à jour l'utilisateur via mutation
    await ctx.runMutation(api.users.updateUserSeeds, {
      userId: args.userId,
      seedsBalance: newBalance,
      level: levelInfo.level,
      seedsToNextLevel: levelInfo.seedsToNextLevel,
    });
    
    // Créer une transaction Seeds
    let reason = "Participation à la décision";
    if (isFirst) reason += " (premier anticipateur)";
    if (hotBonus > 0) reason += " (décision importante)";
    
    await ctx.runMutation(api.seedsTransactions.createTransaction, {
      userId: args.userId,
      type: "earned",
      amount: totalSeeds,
      reason,
      relatedId: args.anticipationId.toString(),
      relatedType: "anticipation_participation",
      levelBefore: oldLevel,
      levelAfter: levelInfo.level,
    });
    
    return {
      awarded: true,
      seedsEarned: totalSeeds,
      baseSeeds,
      firstBonus,
      hotBonus,
      levelUp: levelInfo.level > oldLevel,
      newLevel: levelInfo.level,
    };
  },
});

/**
 * Récompense pour action sociale
 * 
 * Types :
 * - follow : +2 seeds
 * - comment : +3 seeds
 * - share : +5 seeds
 * - source_added : +10 seeds (validée) / +5 seeds (pending)
 */
export const awardSocialAction = mutation({
  args: {
    userId: v.id("users"),
    actionType: v.union(
      v.literal("follow"),
      v.literal("comment"),
      v.literal("share"),
      v.literal("source_added")
    ),
    relatedId: v.optional(v.string()),
    relatedType: v.optional(v.string()),
    validated: v.optional(v.boolean()), // Pour source_added
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      return { awarded: false, reason: "user_not_found" };
    }

    // Calculer les seeds selon le type d'action
    let seedsEarned = 0;
    let reason = "";

    switch (args.actionType) {
      case "follow":
        seedsEarned = 2;
        reason = "Suivi d'un utilisateur";
        break;
      case "comment":
        seedsEarned = 3;
        reason = "Commentaire sur une décision";
        break;
      case "share":
        seedsEarned = 5;
        reason = "Partage d'une décision";
        break;
      case "source_added":
        seedsEarned = args.validated ? 10 : 5;
        reason = args.validated 
          ? "Source ajoutée et validée"
          : "Source ajoutée (en attente de validation)";
        break;
    }

    if (seedsEarned <= 0) {
      return { awarded: false, reason: "invalid_action_type" };
    }

    // Vérifier si déjà récompensé (pour éviter les doublons)
    if (args.relatedId) {
      const existingTransaction = await ctx.db
        .query("seedsTransactions")
        .withIndex("userId", (q) => q.eq("userId", args.userId))
        .filter((q) => 
          q.and(
            q.eq(q.field("relatedId"), args.relatedId),
            q.eq(q.field("relatedType"), args.actionType)
          )
        )
        .first();

      if (existingTransaction) {
        return { awarded: false, reason: "already_awarded" };
      }
    }

    // Calculer le nouveau niveau
    const oldBalance = user.seedsBalance || 0;
    const newBalance = oldBalance + seedsEarned;
    const levelInfo = calculateLevel(newBalance);
    const oldLevel = user.level || 1;
    
    // Mettre à jour l'utilisateur
    await ctx.db.patch(args.userId, {
      seedsBalance: newBalance,
      level: levelInfo.level,
      seedsToNextLevel: levelInfo.seedsToNextLevel,
      updatedAt: Date.now(),
    });
    
    // Créer une transaction Seeds
    await ctx.runMutation(api.seedsTransactions.createTransaction, {
      userId: args.userId,
      type: "earned",
      amount: seedsEarned,
      reason,
      relatedId: args.relatedId,
      relatedType: args.actionType,
      levelBefore: oldLevel,
      levelAfter: levelInfo.level,
    });
    
    return {
      awarded: true,
      seedsEarned,
      levelUp: levelInfo.level > oldLevel,
      newLevel: levelInfo.level,
    };
  },
});

/**
 * Récupère le leaderboard hebdomadaire (top utilisateurs par seeds gagnés cette semaine)
 */
export const getWeeklyLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    // Calculer le début de la semaine (lundi)
    const now = Date.now();
    const today = new Date(now);
    const dayOfWeek = today.getDay(); // 0 = dimanche, 1 = lundi, etc.
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.getTime();

    // Récupérer toutes les transactions de cette semaine
    const weeklyTransactions = await ctx.db
      .query("seedsTransactions")
      .withIndex("createdAt", (q) => q.gte("createdAt", weekStart))
      .filter((q) => q.eq(q.field("type"), "earned"))
      .collect();

    // Grouper par utilisateur et calculer le total
    const userTotals = new Map<Id<"users">, number>();
    
    for (const transaction of weeklyTransactions) {
      const current = userTotals.get(transaction.userId) || 0;
      userTotals.set(transaction.userId, current + transaction.amount);
    }

    // Convertir en array et trier
    const leaderboard = Array.from(userTotals.entries())
      .map(([userId, total]) => ({ userId, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

    // Enrichir avec les infos utilisateur
    const enriched = await Promise.all(
      leaderboard.map(async (entry) => {
        const user = await ctx.db.get(entry.userId);
        return {
          userId: entry.userId,
          username: user?.username,
          name: user?.name,
          image: user?.image,
          totalSeeds: entry.total,
          level: user?.level || 1,
          rank: leaderboard.indexOf(entry) + 1,
        };
      })
    );

    return enriched;
  },
});

