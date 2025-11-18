"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Link } from "next-view-transitions";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

interface FeedTabProps {
  articles?: any[] | undefined;
  projects?: any[] | undefined;
  actions?: any[] | undefined;
}

type FeedItem = {
  type: "article" | "project" | "action";
  id: string;
  title: string;
  summary?: string;
  date: number;
  coverImage?: string;
  tags?: string[];
  author?: { name?: string; image?: string };
  metrics?: { views?: number; reactions?: number; comments?: number };
  stage?: string;
  openSource?: boolean;
  slug?: string;
};

export function FeedTab({ articles, projects, actions }: FeedTabProps) {
  // Ne pas afficher de skeleton, utiliser les données en cache ou afficher vide
  // Si les données sont undefined, ne rien afficher pour éviter de casser la transition
  if (articles === undefined || projects === undefined || actions === undefined) {
    return null;
  }

  const feedItems: FeedItem[] = [
    ...(articles || []).map((article) => ({
      type: "article" as const,
      id: article._id,
      title: article.title,
      summary: article.summary,
      date: article.publishedAt || article.createdAt,
      coverImage: article.coverImage,
      tags: article.tags,
      metrics: {
        views: article.views,
        reactions: article.reactions,
        comments: article.comments,
      },
      slug: article.slug,
    })),
    ...(projects || []).map((project) => ({
      type: "project" as const,
      id: project._id,
      title: project.title,
      summary: project.summary,
      date: project.createdAt,
      coverImage: project.images?.[0],
      tags: project.tags,
      stage: project.stage,
      openSource: project.openSource,
      metrics: {
        views: project.views,
        reactions: project.reactions,
      },
      slug: project.slug,
    })),
    ...(actions || []).map((action) => ({
      type: "action" as const,
      id: action._id,
      title: action.title,
      summary: action.description,
      date: action.createdAt,
      tags: action.tags,
    })),
  ].sort((a, b) => b.date - a.date); // Trier par date décroissante

  if (feedItems.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SolarIcon icon="document-add-bold" className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Aucune actualité</EmptyTitle>
          <EmptyDescription>
            Cette organisation n'a pas encore publié de contenu. Vérifiez les articles, projets et actions pour en savoir plus.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return "document-text-bold";
      case "project":
        return "folder-with-files-bold";
      case "action":
        return "hand-stars-bold";
      default:
        return "file-bold";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "article":
        return "Article";
      case "project":
        return "Projet";
      case "action":
        return "Action";
      default:
        return "Publication";
    }
  };

  const stageLabels: Record<string, string> = {
    idea: "Idée",
    prototype: "Prototype",
    beta: "Bêta",
    production: "Production",
  };

  const stageColors: Record<string, string> = {
    idea: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    prototype: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    beta: "bg-orange-500/20 text-orange-500 border-orange-500/30",
    production: "bg-green-500/20 text-green-500 border-green-500/30",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {feedItems.map((item) => {
        const isArticle = item.type === "article";
        const isProject = item.type === "project";
        const isAction = item.type === "action";

        const content = (
          <Card className="hover:scale-[1.01] transition-transform cursor-pointer group">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-border/50">
                    <SolarIcon icon={getTypeIcon(item.type)} className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(item.type)}
                    </Badge>
                    {isProject && item.stage && (
                      <Badge variant="outline" className={`text-xs ${stageColors[item.stage]}`}>
                        {stageLabels[item.stage]}
                      </Badge>
                    )}
                    {isProject && item.openSource && (
                      <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-500 border-purple-500/30">
                        <SolarIcon icon="code-bold" className="h-3 w-3 mr-1" />
                        Open Source
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground opacity-70 ml-auto">
                      {formatDate(item.date)}
                    </span>
                  </div>
                  <CardTitle className="text-gradient-light group-hover:text-primary transition-colors line-clamp-2 mb-2">
                    {item.title}
                  </CardTitle>
                  {item.summary && (
                    <p className="text-sm text-muted-foreground opacity-80 line-clamp-2">
                      {item.summary}
                    </p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {item.tags.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{item.tags.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}
                  {item.metrics && (
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground opacity-70">
                      {item.metrics.views !== undefined && (
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="eye-bold" className="h-3 w-3" />
                          <span>{item.metrics.views}</span>
                        </div>
                      )}
                      {item.metrics.reactions !== undefined && (
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="heart-bold" className="h-3 w-3" />
                          <span>{item.metrics.reactions}</span>
                        </div>
                      )}
                      {item.metrics.comments !== undefined && (
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="chat-round-bold" className="h-3 w-3" />
                          <span>{item.metrics.comments}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            {item.coverImage && (
              <CardContent className="pt-0">
                <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </AspectRatio>
              </CardContent>
            )}
          </Card>
        );

        if ((isArticle && item.slug) || (isProject && item.slug)) {
          return (
            <Link
              key={`${item.type}-${item.id}`}
              href={isArticle ? `/articles/${item.slug}` : `/projects/${item.slug}`}
            >
              {content}
            </Link>
          );
        }

        return <div key={`${item.type}-${item.id}`}>{content}</div>;
      })}
    </div>
  );
}

