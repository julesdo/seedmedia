"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useEffect, useMemo } from "react";

interface RelatedNewsWidgetProps {
  decisionId: Id<"decisions">;
}

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet?: string;
}

export function RelatedNewsWidget({ decisionId }: RelatedNewsWidgetProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Charger les actualités
  useEffect(() => {
    if (!rssUrl || !decision) return;

    setLoading(true);
    fetch(rssUrl)
      .then((res) => res.json())
      .then((data: NewsItem[]) => {
        setNews(data.slice(0, 3)); // Limiter à 3 articles
      })
      .catch((err) => {
        console.error("Error fetching news:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [rssUrl, decision]);

  if (!decision || news.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <SolarIcon icon="document-text-bold" className="size-3.5 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-muted-foreground">Actualités liées</h3>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {news.map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-2.5 rounded-lg border border-border/30 bg-background/40 hover:bg-background/60 hover:border-border/50 transition-all group"
            >
              <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
                {item.title}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="truncate">{item.source}</span>
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
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

