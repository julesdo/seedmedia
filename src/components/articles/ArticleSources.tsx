"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ArticleSourcesProps {
  articleId: Id<"articles">;
}

const SOURCE_TYPE_LABELS = {
  scientific_paper: "Article scientifique",
  expert_statement: "Déclaration d'expert",
  official_data: "Données officielles",
  news_article: "Article de presse",
  website: "Site web",
  other: "Autre",
} as const;

const SOURCE_TYPE_ICONS = {
  scientific_paper: "document-text-bold",
  expert_statement: "user-check-rounded-bold",
  official_data: "shield-check-bold",
  news_article: "newspaper-bold",
  website: "link-bold",
  other: "file-bold",
} as const;

function getReliabilityBadgeVariant(score: number) {
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "outline";
}

function getReliabilityLabel(score: number) {
  if (score >= 80) return "Très fiable";
  if (score >= 60) return "Fiable";
  if (score >= 40) return "Moyennement fiable";
  return "Peu fiable";
}

export function ArticleSources({ articleId }: ArticleSourcesProps) {
  const sources = useQuery(api.articles.getArticleSources, { articleId });

  if (sources === undefined) {
    return (
      <div className="border border-border/60 rounded-lg bg-muted/20 p-3">
        <div className="flex items-center gap-2 mb-3">
          <SolarIcon icon="document-bold" className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Sources</h3>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="border border-border/60 rounded-lg bg-muted/20 p-3">
      <div className="flex items-center gap-2 mb-3">
        <SolarIcon icon="document-bold" className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          Sources ({sources.length})
        </h3>
      </div>
      <div className="space-y-2.5">
          {sources.map((source) => {
            const sourceType = source.sourceType as keyof typeof SOURCE_TYPE_LABELS;
            const icon = SOURCE_TYPE_ICONS[sourceType] || "file-bold";
            
            return (
              <div
                key={source._id}
                className="flex items-start gap-2 p-2.5 rounded-lg border border-border/60 bg-background/50 hover:bg-muted/30 transition-colors"
              >
                <div className="shrink-0 mt-0.5">
                  <SolarIcon icon={icon as any} className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {source.url ? (
                        <Link
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-xs hover:text-primary transition-colors line-clamp-2"
                        >
                          {source.title || source.url}
                          <SolarIcon
                            icon="external-link-bold"
                            className="h-2.5 w-2.5 inline-block ml-1"
                          />
                        </Link>
                      ) : (
                        <p className="font-medium text-xs">{source.title || "Source sans titre"}</p>
                      )}
                    </div>
                    <Badge
                      variant={getReliabilityBadgeVariant(source.reliabilityScore)}
                      className="shrink-0 text-[11px] px-1.5 py-0"
                    >
                      {getReliabilityLabel(source.reliabilityScore)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                      {SOURCE_TYPE_LABELS[sourceType]}
                    </Badge>
                    
                    {source.author && (
                      <span className="flex items-center gap-1">
                        <SolarIcon icon="user-bold" className="h-3 w-3" />
                        {source.author}
                      </span>
                    )}
                    
                    {source.publicationDate && (
                      <span className="flex items-center gap-1">
                        <SolarIcon icon="calendar-bold" className="h-3 w-3" />
                        {format(new Date(source.publicationDate), "PPP", { locale: fr })}
                      </span>
                    )}

                    {source.addedByUser && (
                      <span className="flex items-center gap-1">
                        <Avatar className="h-3.5 w-3.5">
                          <AvatarFallback className="text-[8px]">
                            {source.addedByUser.name[0]?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        Ajouté par {source.addedByUser.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

