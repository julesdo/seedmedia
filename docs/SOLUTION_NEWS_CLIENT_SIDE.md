# 📰 Solution Client-Side pour les Articles Liés

## Problème Actuel

Le système d'agrégation de news actuel est **très gourmand** :
- ❌ Parcourt 100+ sources RSS (70 haute fiabilité + 30 moyenne)
- ❌ Récupère les métadonnées (images) via API (`fetchUrlMetadata`)
- ❌ Sauvegarde tout en base (`newsItems`)
- ❌ Cron jobs toutes les heures/6h
- ❌ Coûts : Requêtes HTTP, stockage, API, calculs

## Solution Proposée : Client-Side avec Google News RSS

### Avantages
- ✅ **Zéro coût** : Pas d'API payante, pas de stockage en base
- ✅ **Zéro backend** : Tout côté client (pas de bot, pas de cron)
- ✅ **Toujours à jour** : Les news sont récupérées en temps réel
- ✅ **Léger** : Charge seulement si l'utilisateur demande (lazy loading)
- ✅ **Simple** : Utilise Google News RSS (gratuit, pas d'API key)

### Implémentation

#### 1. Composant `RelatedNewsClient.tsx`

```tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet?: string;
}

interface RelatedNewsClientProps {
  decisionId: string;
  keywords: string[]; // [decider, title, ...impactedDomains]
}

export function RelatedNewsClient({ decisionId, keywords }: RelatedNewsClientProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Construire la requête Google News RSS
  const rssUrl = useMemo(() => {
    const query = keywords.filter(Boolean).join(' ');
    return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`;
  }, [keywords]);

  // Cache dans localStorage (clé = hash de la requête)
  const cacheKey = useMemo(() => {
    return `news_${btoa(rssUrl).replace(/[^a-zA-Z0-9]/g, '')}`;
  }, [rssUrl]);

  const fetchNews = async () => {
    // Vérifier le cache (valide 1h)
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      if (age < 60 * 60 * 1000) { // 1 heure
        setNews(data);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Utiliser un proxy CORS si nécessaire (ou faire via API route Next.js)
      // Pour éviter CORS, on peut créer une API route Next.js qui fetch le RSS
      const response = await fetch(`/api/news-rss?url=${encodeURIComponent(rssUrl)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const xml = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      
      const items = Array.from(doc.querySelectorAll('item')).map((item) => {
        const title = item.querySelector('title')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || '';
        const source = item.querySelector('source')?.textContent || 'Google News';
        const description = item.querySelector('description')?.textContent || '';
        
        // Extraire le snippet (premiers mots de la description)
        const snippet = description.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
        
        return {
          title,
          link,
          pubDate,
          source,
          snippet,
        };
      });

      // Limiter à 10 articles
      const limitedNews = items.slice(0, 10);

      // Mettre en cache
      localStorage.setItem(cacheKey, JSON.stringify({
        data: limitedNews,
        timestamp: Date.now(),
      }));

      setNews(limitedNews);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Impossible de charger les articles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && news.length === 0 && !loading) {
      fetchNews();
    }
  }, [expanded]);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-sm text-primary hover:underline"
      >
        📰 Voir les articles liés
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Articles liés</h2>
        <button
          onClick={() => setExpanded(false)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Masquer
        </button>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">
          Chargement des articles...
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive">
          {error}
        </div>
      )}

      {news.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {news.map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-4 rounded-lg border bg-card hover:border-primary/50 transition-all"
            >
              <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary">
                {item.title}
              </h3>
              {item.snippet && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {item.snippet}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.source}</span>
                <span>{new Date(item.pubDate).toLocaleDateString('fr-FR')}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 2. API Route Next.js (pour éviter CORS)

```typescript
// app/api/news-rss/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SeedMedia/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch RSS');
    }

    const xml = await response.text();
    
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching RSS:', error);
    return NextResponse.json({ error: 'Failed to fetch RSS' }, { status: 500 });
  }
}
```

#### 3. Utilisation dans `DecisionDetail.tsx`

```tsx
// Remplacer :
{decision.newsItems && decision.newsItems.length > 0 && (
  <div className="space-y-4">
    <h2 className="text-xl font-bold">{t('detail.relatedNews')}</h2>
    {/* ... */}
  </div>
)}

// Par :
<RelatedNewsClient
  decisionId={decision._id}
  keywords={[
    decision.decider,
    decision.title,
    ...decision.impactedDomains,
  ]}
/>
```

### Migration

1. **Supprimer le bot Agrégateur** :
   - Désactiver dans la table `bots`
   - Supprimer les cron jobs d'agrégation
   - Supprimer `convex/bots/aggregateNews.ts`

2. **Supprimer la table `newsItems`** (optionnel, pour nettoyer) :
   - Ou garder pour rétrocompatibilité mais ne plus l'utiliser

3. **Mettre à jour le frontend** :
   - Remplacer `decision.newsItems` par `<RelatedNewsClient />`
   - Supprimer les imports de `api.news.getNewsForDecision`

### Coûts Comparaison

| Aspect | Actuel (Bot) | Nouveau (Client) |
|--------|--------------|------------------|
| **Requêtes HTTP** | 100+ par agrégation | 1 par utilisateur (caché) |
| **Stockage** | Tous les articles en base | Aucun |
| **API** | `fetchUrlMetadata` (coûts) | Aucun |
| **Cron jobs** | Toutes les heures/6h | Aucun |
| **Backend** | Bot + mutations + queries | Aucun |
| **Coût total** | **Élevé** | **Zéro** |

### Limitations

- ⚠️ **CORS** : Google News RSS peut bloquer les requêtes directes → Solution : API route Next.js
- ⚠️ **Rate limiting** : Google peut limiter les requêtes → Solution : Cache localStorage (1h)
- ⚠️ **Pas d'images** : RSS ne contient pas toujours les images → Solution : Accepter (ou utiliser Open Graph si nécessaire)

### Alternatives

Si Google News RSS ne suffit pas :
1. **NewsAPI** (gratuit jusqu'à 100 requêtes/jour) - mais nécessite API key
2. **RSS feeds directs** de médias fiables (Le Monde, BBC, etc.) - mais nécessite parsing multiple
3. **Embed Google News** - mais moins personnalisable

---

**Recommandation** : Utiliser Google News RSS via API route Next.js avec cache localStorage. C'est la solution la plus simple, gratuite et légère.

