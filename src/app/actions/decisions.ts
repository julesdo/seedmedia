"use server";

/**
 * Server Actions pour les mutations de décisions (style NextFaster)
 * Réduit le JavaScript client et améliore la sécurité
 */

import { revalidateTag, revalidatePath } from 'next/cache';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { CACHE_TAGS, revalidateDecision } from '@/lib/cache-utils';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Server Action pour sauvegarder une décision (favoris)
 * Invalide le cache après mutation
 */
export async function saveDecision(decisionId: string) {
  try {
    // Appel Convex via Server Action
    await convex.mutation(api.favorites.toggleFavorite, {
      decisionId: decisionId as any,
    });

    // Invalider le cache
    revalidateTag(CACHE_TAGS.DECISIONS);
    revalidatePath('/');
    revalidatePath('/saved');

    return { success: true };
  } catch (error) {
    console.error('Error saving decision:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Server Action pour investir dans une décision
 * Invalide le cache après mutation
 */
export async function investInDecision(
  decisionId: string,
  position: "yes" | "no",
  seedAmount: number
) {
  try {
    // Appel Convex via Server Action
    await convex.mutation(api.trading.buyShares, {
      decisionId: decisionId as any,
      position,
      seedAmount,
    });

    // Invalider le cache de la décision spécifique
    const decision = await convex.query(api.decisions.getDecisionById, {
      decisionId: decisionId as any,
    });

    if (decision?.slug) {
      await revalidateDecision(decision.slug, decisionId as any);
    }

    return { success: true };
  } catch (error) {
    console.error('Error investing in decision:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

