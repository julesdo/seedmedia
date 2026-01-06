/**
 * Helpers pour les bots - Mise à jour des stats et logs
 * 
 * Note: Ces fonctions doivent être utilisées depuis des actions (ActionCtx)
 * car elles appellent des mutations et queries
 */

import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { ActionCtx } from "../_generated/server";

/**
 * Récupère l'ID d'un bot par son slug
 */
export async function getBotIdBySlug(
  ctx: ActionCtx,
  slug: string
): Promise<Id<"bots"> | null> {
  // @ts-expect-error - Type instantiation is excessively deep due to complex return type from getBotBySlug
  const bot = await ctx.runQuery(api.bots.getBotBySlug, { slug });
  return bot?._id || null;
}

/**
 * Met à jour les stats d'un bot et crée un log
 * 
 * Usage dans une action:
 * ```typescript
 * await updateBotActivity(ctx, {
 *   botSlug: "generateur",
 *   decisionsCreated: 1,
 *   logMessage: "Décision créée avec succès",
 *   logLevel: "success"
 * });
 * ```
 */
export async function updateBotActivity(
  ctx: ActionCtx,
  options: {
    botSlug: string;
    decisionsCreated?: number;
    decisionsResolved?: number;
    newsAggregated?: number;
    indicatorsTracked?: number;
    logLevel?: "info" | "success" | "warning" | "error";
    logMessage?: string;
    logDetails?: any;
    functionName?: string;
    executionTime?: number;
  }
): Promise<void> {
  try {
    // Récupérer l'ID du bot
    const botId = await getBotIdBySlug(ctx, options.botSlug);
    if (!botId) {
      console.warn(`Bot with slug "${options.botSlug}" not found`);
      return;
    }

    // Mettre à jour les stats si nécessaire
    const hasStatsUpdate =
      options.decisionsCreated !== undefined ||
      options.decisionsResolved !== undefined ||
      options.newsAggregated !== undefined ||
      options.indicatorsTracked !== undefined;

    if (hasStatsUpdate) {
      await ctx.runMutation(api.bots.updateBotStats, {
        botId,
        decisionsCreated: options.decisionsCreated,
        decisionsResolved: options.decisionsResolved,
        newsAggregated: options.newsAggregated,
        indicatorsTracked: options.indicatorsTracked,
        increment: true, // Toujours incrémenter au lieu de remplacer
      });
    }

    // Créer un log si un message est fourni
    if (options.logMessage) {
      await ctx.runMutation(api.bots.createBotLog, {
        botId,
        level: options.logLevel || "info",
        message: options.logMessage,
        details: options.logDetails,
        functionName: options.functionName,
        executionTime: options.executionTime,
      });
    }
  } catch (error) {
    console.error(`Error updating bot activity for ${options.botSlug}:`, error);
    // Ne pas faire échouer l'action principale si la mise à jour des stats échoue
  }
}

