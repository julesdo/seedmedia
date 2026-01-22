/**
 * Utilitaires pour le cache de données avec tags (style NextFaster)
 * Utilise unstable_cache pour remplacer revalidate/dynamic et activer PPR
 * 
 * NOTE: Convex est optimisé pour le client. Pour Server Components,
 * on utilise ConvexHttpClient mais les données sont déjà optimisées côté client.
 * Le cache ici sert principalement pour les routes API et Server Actions.
 */

import { unstable_cache } from 'next/cache';
import { CACHE_TAGS } from './cache-utils';

// ConvexHttpClient sera créé à la demande pour éviter les problèmes d'initialisation
function getConvexClient() {
  if (typeof window !== 'undefined') {
    // Côté client, utiliser le client Convex existant
    return null; // Ne pas utiliser dans les Server Components
  }
  
  // Côté serveur, créer un client HTTP
  const { ConvexHttpClient } = require('convex/browser');
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}

/**
 * Récupère les décisions avec cache et tags (remplace revalidate)
 * NOTE: Pour les Server Components, on préfère laisser Convex gérer le cache côté client
 * Cette fonction est utile pour les routes API et Server Actions
 */
export async function getCachedDecisions(options: {
  limit?: number;
  status?: "announced" | "tracking" | "resolved";
  categorySlugs?: string[];
  sentiments?: ("positive" | "negative" | "neutral")[];
  impactLevels?: string[];
  regions?: string[];
  deciderTypes?: string[];
}) {
  // Pour l'instant, retourner undefined car Convex gère mieux le cache côté client
  // Cette fonction sera utilisée dans les routes API avec Edge Runtime
  return undefined;
}

/**
 * NOTE: Convex est optimisé pour le client avec son propre système de cache.
 * Pour activer PPR, on retire revalidate/dynamic des pages et on laisse
 * Convex gérer le cache côté client avec useQuery.
 * 
 * Les Server Actions et routes API utilisent revalidateTag() pour invalider
 * le cache Next.js après les mutations.
 */

