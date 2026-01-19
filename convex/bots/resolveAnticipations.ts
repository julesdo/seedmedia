import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Calcule le niveau d'un utilisateur basé sur son total de Seeds
 */
function calculateLevel(totalSeeds: number): {
  level: number;
  seedsToNextLevel: number;
  seedsForCurrentLevel: number;
} {
  // Formule simple : niveau = racine carrée du total de Seeds / 10
  // Niveau 1 : 0-100 Seeds
  // Niveau 2 : 100-400 Seeds
  // Niveau 3 : 400-900 Seeds
  // Niveau 4 : 900-1600 Seeds
  // etc.

  if (totalSeeds < 0) {
    return {
      level: 1,
      seedsToNextLevel: 100,
      seedsForCurrentLevel: 0,
    };
  }

  // Calculer le niveau actuel
  const level = Math.floor(Math.sqrt(totalSeeds / 100)) + 1;

  // Calculer les Seeds nécessaires pour le niveau actuel
  const seedsForCurrentLevel = Math.pow(level - 1, 2) * 100;

  // Calculer les Seeds nécessaires pour le niveau suivant
  const seedsForNextLevel = Math.pow(level, 2) * 100;

  // Calculer les Seeds restants pour le niveau suivant
  const seedsToNextLevel = seedsForNextLevel - totalSeeds;

  return {
    level,
    seedsToNextLevel: Math.max(0, seedsToNextLevel),
    seedsForCurrentLevel,
  };
}

/**
 * Résout toutes les anticipations pour une décision résolue
 */
export const resolveAnticipationsForDecision = action({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args): Promise<{
    processed: number;
    resolved: number;
    errors: number;
  }> => {
    // Récupérer la résolution
    const resolution = await ctx.runQuery(
      api.resolutions.getResolutionByDecision,
      {
        decisionId: args.decisionId,
      }
    );

    if (!resolution) {
      throw new Error("Resolution not found for this decision");
    }

    // Récupérer toutes les anticipations non résolues pour cette décision
    const anticipations = await ctx.runQuery(
      api.anticipations.getAnticipationsForDecision,
      {
        decisionId: args.decisionId,
      }
    );

    const unresolvedAnticipations = anticipations.filter(
      (a: { resolved: boolean }) => !a.resolved
    );

    let resolved = 0;
    let errors = 0;

    // Résoudre chaque anticipation
    for (const anticipation of unresolvedAnticipations) {
      try {
        // Calculer les gains/pertes (système binaire)
        // La liquidation des pools a déjà été effectuée par liquidatePools
        // On vérifie juste si l'anticipation était correcte
        const isCorrect = anticipation.position === resolution.issue; // "yes" ou "no"
        
        // seedsEarned a déjà été calculé et crédité par liquidatePools
        // On récupère la valeur depuis l'anticipation mise à jour
        const seedsEarned = anticipation.seedsEarned || 0;
        
        // Mettre à jour l'anticipation
        await ctx.runMutation(api.anticipations.updateAnticipation, {
          anticipationId: anticipation._id,
          resolved: true,
          result: isCorrect ? "won" : "lost",
          seedsEarned: seedsEarned,
        });

        // Mettre à jour la balance de Seeds de l'utilisateur (si seedsEarned > 0)
        if (seedsEarned !== 0) {
          const user = await ctx.runQuery(api.users.getUserById, {
            userId: anticipation.userId,
          });

          if (user) {
            // Récupérer la balance actuelle
            const oldBalance = Number((user as any).seedsBalance || 0);
            const oldLevel = user.level || 1;
            const newBalance = oldBalance + seedsEarned;

            // Calculer le nouveau niveau
            const levelInfo = calculateLevel(newBalance);

            // Mettre à jour l'utilisateur
            await ctx.runMutation(api.users.updateUserSeeds, {
              userId: anticipation.userId,
              seedsBalance: newBalance,
              level: levelInfo.level,
              seedsToNextLevel: levelInfo.seedsToNextLevel,
            });

            // Créer une transaction Seeds
            await ctx.runMutation(api.seedsTransactions.createTransaction, {
              userId: anticipation.userId,
              type: seedsEarned > 0 ? "earned" : "lost",
              amount: Math.abs(seedsEarned),
              reason: isCorrect ? "anticipation_won" : "anticipation_lost",
              relatedId: anticipation._id.toString(),
              relatedType: "anticipation",
              levelBefore: oldLevel,
              levelAfter: levelInfo.level,
            });
          }
        }

        resolved++;
      } catch (error) {
        console.error(
          `Error resolving anticipation ${anticipation._id}:`,
          error
        );
        errors++;
      }
    }

    return {
      processed: unresolvedAnticipations.length,
      resolved,
      errors,
    };
  },
});

/**
 * Résout toutes les anticipations pour toutes les décisions résolues
 */
export const resolveAllAnticipations = action({
  args: {},
  handler: async (ctx): Promise<{
    processed: number;
    resolved: number;
    errors: number;
  }> => {
    // Récupérer toutes les résolutions
    const resolutions = await ctx.runQuery(api.resolutions.getAllResolutions, {
      limit: 100,
    });

    let totalProcessed = 0;
    let totalResolved = 0;
    let totalErrors = 0;

    for (const resolution of resolutions) {
      try {
        const result = await ctx.runAction(
          api.bots.resolveAnticipations.resolveAnticipationsForDecision,
          {
            decisionId: resolution.decisionId,
          }
        );

        totalProcessed += result.processed;
        totalResolved += result.resolved;
        totalErrors += result.errors;
      } catch (error) {
        console.error(
          `Error resolving anticipations for decision ${resolution.decisionId}:`,
          error
        );
        totalErrors++;
      }
    }

    return {
      processed: totalProcessed,
      resolved: totalResolved,
      errors: totalErrors,
    };
  },
});

