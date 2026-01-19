"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface RelatedNewsClientProps {
  decisionId: Id<"decisions">;
  autoExpand?: boolean;
}

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet?: string;
}

/**
 * 🎯 Composant client-side pour afficher les actualités liées
 * Utilise Google News RSS directement côté client (pas de stockage en base)
 */
export function RelatedNewsClient({ decisionId, autoExpand = false }: RelatedNewsClientProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(autoExpand);
  const [error, setError] = useState<string | null>(null);

  // Récupérer la décision pour obtenir les mots-clés
  const decision = useQuery(api.decisions.getDecisionById, { decisionId });

  // Construire les mots-clés de recherche
  const keywords = useMemo(() => {
    if (!decision) return "";
    const keywordsArray = [
      decision.decider,
      decision.title,
      ...(decision.impactedDomains || []),
    ].filter(Boolean);
    return keywordsArray.join(" ");
  }, [decision]);

  // Construire l'URL RSS Google News
  const rssUrl = useMemo(() => {
    if (!keywords) return null;
    return `/api/news-rss?q=${encodeURIComponent(keywords)}`;
  }, [keywords]);

  // Cache dans localStorage (clé = hash de la requête)
  const cacheKey = useMemo(() => {
    if (!keywords) return null;
    return `news_${keywords.replace(/\s+/g, "_").toLowerCase()}`;
  }, [keywords]);

  // Charger les actualités
  useEffect(() => {
    if (!rssUrl || !cacheKey || !expanded) return;

    // Vérifier le cache (valide 1h)
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < 60 * 60 * 1000) {
          // Cache valide (< 1h)
          setNews(data);
          return;
        }
      } catch (e) {
        // Cache invalide, continuer
      }
    }

    // Charger depuis l'API
    setLoading(true);
    setError(null);

    fetch(rssUrl)
      .then((res) => res.json())
      .then((data: NewsItem[]) => {
        setNews(data);
        // Mettre en cache
        if (cacheKey) {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ data, timestamp: Date.now() })
          );
        }
      })
      .catch((err) => {
        console.error("Error fetching news:", err);
        setError("Impossible de charger les actualités");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [rssUrl, cacheKey, expanded]);

  if (!decision) {
    return null;
  }

  if (!expanded) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Actualités liées</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(true)}
          >
            <SolarIcon icon="arrow-right-bold" className="size-4 mr-2" />
            Voir les articles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!autoExpand && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Actualités liées</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(false)}
          >
            <SolarIcon icon="arrow-down-bold" className="size-4 mr-2" />
            Masquer
          </Button>
        </div>
      )}

      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="p-4 text-center text-muted-foreground">
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && news.length === 0 && (
        <Card>
          <CardContent className="p-4 text-center text-muted-foreground">
            <p>Aucune actualité trouvée pour le moment.</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && news.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {news.slice(0, 6).map((item, index) => (
            <Link
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden rounded-lg border bg-card hover:border-primary/50 transition-all"
            >
              <div className="p-4 space-y-2">
                <p className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{item.source}</span>
                  {item.pubDate && (
                    <>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(item.pubDate), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </>
                  )}
                </div>
                {item.snippet && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.snippet}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

