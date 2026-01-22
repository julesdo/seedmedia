import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

// NOTE: Edge Runtime désactivé car incompatible avec cacheComponents
// export const runtime = 'edge';

/**
 * API Route pour invalider le cache des actualités
 * Edge Runtime pour latence minimale
 * 
 * Usage:
 * POST /api/revalidate/news?query=search-query
 * POST /api/revalidate/news?all=true
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const all = searchParams.get('all') === 'true';

    // Vérifier le secret (optionnel mais recommandé)
    const secret = searchParams.get('secret');
    if (process.env.REVALIDATE_SECRET && secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    if (all) {
      // Invalider toutes les actualités
      revalidateTag('news-rss');
      return NextResponse.json({ 
        revalidated: true, 
        message: 'All news cache invalidated',
        tag: 'news-rss'
      });
    } else if (query) {
      // Invalider une requête spécifique
      revalidateTag(`news-rss-${query}`);
      revalidateTag('news-rss'); // Invalider aussi le tag général
      return NextResponse.json({ 
        revalidated: true, 
        message: `News cache for query "${query}" invalidated`,
        query,
        tags: [`news-rss-${query}`, 'news-rss']
      });
    } else {
      return NextResponse.json({ 
        error: 'Missing query or all parameter' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error revalidating news cache:', error);
    return NextResponse.json({ 
      error: 'Error revalidating cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

