/**
 * Utilitaires pour la gestion du cache Next.js 16
 * Utilise revalidateTag() et updateTag() pour un contrôle précis du cache
 */

import { revalidateTag, revalidatePath } from 'next/cache';

/**
 * Tags de cache pour différentes ressources
 */
export const CACHE_TAGS = {
  DECISIONS: 'decisions',
  DECISION: (slug: string) => `decision-${slug}`,
  DECISION_ID: (id: string) => `decision-id-${id}`,
  CATEGORIES: 'categories',
  CATEGORY: (slug: string) => `category-${slug}`,
  ARTICLES: 'articles',
  ARTICLE: (slug: string) => `article-${slug}`,
  USERS: 'users',
  USER: (id: string) => `user-${id}`,
  TRENDING: 'trending',
  HOT_DECISIONS: 'hot-decisions',
  MARKET_GRID: 'market-grid',
} as const;

/**
 * Invalide le cache pour une décision spécifique
 */
export async function revalidateDecision(slug: string, id?: string) {
  revalidateTag(CACHE_TAGS.DECISIONS);
  revalidateTag(CACHE_TAGS.DECISION(slug));
  revalidateTag(CACHE_TAGS.MARKET_GRID);
  revalidateTag(CACHE_TAGS.TRENDING);
  revalidateTag(CACHE_TAGS.HOT_DECISIONS);
  
  if (id) {
    revalidateTag(CACHE_TAGS.DECISION_ID(id));
  }
  
  // Invalider aussi les chemins
  revalidatePath('/');
  revalidatePath(`/${slug}`);
  revalidatePath('/trending');
}

/**
 * Invalide le cache pour toutes les décisions
 */
export async function revalidateAllDecisions() {
  revalidateTag(CACHE_TAGS.DECISIONS);
  revalidateTag(CACHE_TAGS.MARKET_GRID);
  revalidateTag(CACHE_TAGS.TRENDING);
  revalidateTag(CACHE_TAGS.HOT_DECISIONS);
  
  revalidatePath('/');
  revalidatePath('/trending');
}

/**
 * Invalide le cache pour les catégories
 */
export async function revalidateCategories() {
  revalidateTag(CACHE_TAGS.CATEGORIES);
  revalidatePath('/');
}

/**
 * Invalide le cache pour un article
 */
export async function revalidateArticle(slug: string) {
  revalidateTag(CACHE_TAGS.ARTICLES);
  revalidateTag(CACHE_TAGS.ARTICLE(slug));
  revalidatePath(`/articles/${slug}`);
}

/**
 * Invalide le cache pour un utilisateur
 */
export async function revalidateUser(userId: string) {
  revalidateTag(CACHE_TAGS.USERS);
  revalidateTag(CACHE_TAGS.USER(userId));
  revalidatePath(`/u/${userId}`);
}

