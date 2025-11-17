"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

interface ArticlesTabProps {
  organizationId: Id<"organizations">;
}

export function ArticlesTab({ organizationId }: ArticlesTabProps) {
  const articles = useQuery(api.organizations.getOrganizationArticlesPublic, {
    organizationId,
  });

  if (articles === undefined) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-48 w-full" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SolarIcon icon="document-text-bold" className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Aucun article</EmptyTitle>
          <EmptyDescription>
            Cette organisation n'a pas encore publié d'articles.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <Link key={article._id} href={`/articles/${article.slug}`}>
          <Card className="h-full hover:scale-[1.02] transition-transform cursor-pointer group">
            {article.coverImage && (
              <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-t-lg">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
              </AspectRatio>
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 ring-2 ring-border/50">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light text-xs">
                      A
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground opacity-70 truncate">Auteur</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground opacity-70">
                  <div className="flex items-center gap-1">
                    <SolarIcon icon="eye-bold" className="h-3 w-3" />
                    <span>{article.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <SolarIcon icon="heart-bold" className="h-3 w-3" />
                    <span>{article.reactions}</span>
                  </div>
                </div>
              </div>
              <CardTitle className="text-gradient-light group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground opacity-80 mt-2 line-clamp-2">
                {article.summary}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {article.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {article.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{article.tags.length - 3}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground opacity-60">
                  {formatDate(article.publishedAt || article.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

