/**
 * Système de classement régional pour les Municipales 2026
 * 
 * Calcule et met à jour les classements par région basés sur les prédictions correctes
 */

import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Met à jour les stats municipales d'un utilisateur après résolution d'une anticipation
 * Appelé automatiquement quand une anticipation municipale est résolue
 */
export const updateUserMunicipalesStats = internalMutation({
  args: {
    userId: v.id("users"),
    decisionId: v.id("decisions"),
    isCorrect: v.boolean(), // true si la prédiction était correcte
  },
  handler: async (ctx, args) => {
    // Vérifier que la décision est une municipale
    const decision = await ctx.db.get(args.decisionId);
    if (!decision || decision.specialEvent !== "municipales_2026") {
      return; // Pas une municipale, on ignore
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return;
    }

    // Initialiser ou mettre à jour municipales2026
    const currentMunicipales = user.municipales2026 || {
      selectedRegion: undefined,
      correctPredictions: 0,
      totalPredictions: 0,
      regionRank: undefined,
    };

    // Mettre à jour les stats
    const updatedStats = {
      ...currentMunicipales,
      totalPredictions: currentMunicipales.totalPredictions + 1,
      correctPredictions: currentMunicipales.correctPredictions + (args.isCorrect ? 1 : 0),
    };

    // Mettre à jour l'utilisateur
    await ctx.db.patch(args.userId, {
      municipales2026: updatedStats,
    });

    // Si l'utilisateur a une région, recalculer le classement régional
    if (updatedStats.selectedRegion) {
      await ctx.scheduler.runAfter(0, internal.municipalesRankings.recalculateRegionRanking, {
        region: updatedStats.selectedRegion,
      });
    }
  },
});

/**
 * Recalcule le classement pour une région donnée
 */
export const recalculateRegionRanking = internalMutation({
  args: {
    region: v.string(),
  },
  handler: async (ctx, args) => {
    // Récupérer tous les utilisateurs de cette région avec des stats municipales
    const users = await ctx.db
      .query("users")
      .collect();

    const regionUsers = users
      .filter((u) => u.municipales2026?.selectedRegion === args.region)
      .filter((u) => u.municipales2026 && u.municipales2026.totalPredictions > 0)
      .map((u) => ({
        userId: u._id,
        correctPredictions: u.municipales2026!.correctPredictions,
        totalPredictions: u.municipales2026!.totalPredictions,
        accuracy: u.municipales2026!.totalPredictions > 0
          ? (u.municipales2026!.correctPredictions / u.municipales2026!.totalPredictions) * 100
          : 0,
      }))
      .sort((a, b) => {
        // Trier par précision décroissante, puis par nombre de prédictions correctes
        if (Math.abs(a.accuracy - b.accuracy) > 0.01) {
          return b.accuracy - a.accuracy;
        }
        return b.correctPredictions - a.correctPredictions;
      });

    // Mettre à jour le classement de chaque utilisateur
    for (let i = 0; i < regionUsers.length; i++) {
      const user = await ctx.db.get(regionUsers[i].userId);
      if (user && user.municipales2026) {
        await ctx.db.patch(regionUsers[i].userId, {
          municipales2026: {
            ...user.municipales2026,
            regionRank: i + 1, // Classement (1 = premier)
          },
        });
      }
    }
  },
});

/**
 * Récupère le classement d'une région (top 10)
 */
export const getRegionRanking = query({
  args: {
    region: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    // Récupérer tous les utilisateurs de cette région avec des stats municipales
    const users = await ctx.db
      .query("users")
      .collect();

    const regionUsers = users
      .filter((u) => u.municipales2026?.selectedRegion === args.region)
      .filter((u) => u.municipales2026 && u.municipales2026.totalPredictions > 0)
      .map((u) => ({
        userId: u._id,
        name: u.name || u.email || "Utilisateur anonyme",
        username: u.username,
        image: u.image,
        correctPredictions: u.municipales2026!.correctPredictions,
        totalPredictions: u.municipales2026!.totalPredictions,
        accuracy: u.municipales2026!.totalPredictions > 0
          ? (u.municipales2026!.correctPredictions / u.municipales2026!.totalPredictions) * 100
          : 0,
        regionRank: u.municipales2026!.regionRank,
      }))
      .sort((a, b) => {
        // Trier par précision décroissante, puis par nombre de prédictions correctes
        if (Math.abs(a.accuracy - b.accuracy) > 0.01) {
          return b.accuracy - a.accuracy;
        }
        return b.correctPredictions - a.correctPredictions;
      })
      .slice(0, limit);

    return regionUsers;
  },
});

/**
 * Récupère le classement de toutes les régions (top 3 par région)
 */
export const getAllRegionsRankings = query({
  args: {
    limitPerRegion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limitPerRegion = args.limitPerRegion || 3;

    // Liste des régions françaises
    const regions = [
      "Auvergne-Rhône-Alpes",
      "Bourgogne-Franche-Comté",
      "Bretagne",
      "Centre-Val de Loire",
      "Corse",
      "Grand Est",
      "Hauts-de-France",
      "Île-de-France",
      "Normandie",
      "Nouvelle-Aquitaine",
      "Occitanie",
      "Pays de la Loire",
      "Provence-Alpes-Côte d'Azur",
      "Guadeloupe",
      "Martinique",
      "Guyane",
      "La Réunion",
      "Mayotte",
    ];

    const rankings: Array<{
      region: string;
      topUsers: Array<{
        userId: Id<"users">;
        name: string;
        username?: string;
        image?: string;
        correctPredictions: number;
        totalPredictions: number;
        accuracy: number;
        regionRank?: number;
      }>;
    }> = [];

    for (const region of regions) {
      const topUsers = await ctx.runQuery(internal.municipalesRankings.getRegionRankingInternal, {
        region,
        limit: limitPerRegion,
      });

      if (topUsers.length > 0) {
        rankings.push({
          region,
          topUsers,
        });
      }
    }

    // Trier les régions par nombre total de participants
    rankings.sort((a, b) => {
      const aTotal = a.topUsers.reduce((sum, u) => sum + u.totalPredictions, 0);
      const bTotal = b.topUsers.reduce((sum, u) => sum + u.totalPredictions, 0);
      return bTotal - aTotal;
    });

    return rankings;
  },
});

/**
 * Query interne pour récupérer le classement d'une région (utilisé par getAllRegionsRankings)
 */
export const getRegionRankingInternal = internalQuery({
  args: {
    region: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;

    const users = await ctx.db
      .query("users")
      .collect();

    const regionUsers = users
      .filter((u) => u.municipales2026?.selectedRegion === args.region)
      .filter((u) => u.municipales2026 && u.municipales2026.totalPredictions > 0)
      .map((u) => ({
        userId: u._id,
        name: u.name || u.email || "Utilisateur anonyme",
        username: u.username,
        image: u.image,
        correctPredictions: u.municipales2026!.correctPredictions,
        totalPredictions: u.municipales2026!.totalPredictions,
        accuracy: u.municipales2026!.totalPredictions > 0
          ? (u.municipales2026!.correctPredictions / u.municipales2026!.totalPredictions) * 100
          : 0,
        regionRank: u.municipales2026!.regionRank,
      }))
      .sort((a, b) => {
        if (Math.abs(a.accuracy - b.accuracy) > 0.01) {
          return b.accuracy - a.accuracy;
        }
        return b.correctPredictions - a.correctPredictions;
      })
      .slice(0, limit);

    return regionUsers;
  },
});

