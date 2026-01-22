import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { CACHE_TAGS, revalidateDecision, revalidateAllDecisions } from '@/lib/cache-utils';

// NOTE: Edge Runtime désactivé car incompatible avec cacheComponents
// Pour activer Edge Runtime, désactiver cacheComponents dans next.config.ts
// export const runtime = 'edge';

/**
 * API Route pour invalider le cache des décisions
 * Utilise revalidateTag() pour un contrôle précis du cache
 * Edge Runtime pour latence minimale
 * 
 * Usage:
 * POST /api/revalidate/decisions?slug=decision-slug
 * POST /api/revalidate/decisions?all=true
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const decisionId = searchParams.get('id');
    const all = searchParams.get('all') === 'true';

    // Vérifier le secret (optionnel mais recommandé)
    const secret = searchParams.get('secret');
    if (process.env.REVALIDATE_SECRET && secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    if (all) {
      // Invalider toutes les décisions
      await revalidateAllDecisions();
      return NextResponse.json({ 
        revalidated: true, 
        message: 'All decisions cache invalidated',
        tags: [CACHE_TAGS.DECISIONS, CACHE_TAGS.MARKET_GRID, CACHE_TAGS.TRENDING, CACHE_TAGS.HOT_DECISIONS]
      });
    } else if (slug) {
      // Invalider une décision spécifique
      await revalidateDecision(slug, decisionId || undefined);
      return NextResponse.json({ 
        revalidated: true, 
        message: `Decision ${slug} cache invalidated`,
        slug,
        tags: [
          CACHE_TAGS.DECISIONS,
          CACHE_TAGS.DECISION(slug),
          CACHE_TAGS.MARKET_GRID,
          CACHE_TAGS.TRENDING,
          CACHE_TAGS.HOT_DECISIONS
        ]
      });
    } else {
      return NextResponse.json({ 
        error: 'Missing slug or all parameter' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error revalidating decisions cache:', error);
    return NextResponse.json({ 
      error: 'Error revalidating cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

