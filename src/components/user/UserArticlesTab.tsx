"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Link } from "next-view-transitions";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface UserArticlesTabProps {
  articles?: any[] | undefined;
}

export function UserArticlesTab({ articles }: UserArticlesTabProps) {
  if (articles === undefined) {
    return null;
  }

  if (articles.length === 0) {
    return (
      <Empty>
        <EmptyMedia>
          <SolarIcon icon="document-text-bold" className="h-12 w-12 text-muted-foreground" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>Aucun article</EmptyTitle>
          <EmptyDescription>
            Cet utilisateur n'a pas encore publié d'articles.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {articles.map((article) => (
        <Card key={article._id} className="group hover:shadow-lg transition-shadow">
          <Link href={`/articles/${article.slug}`}>
            {article.coverImage && (
              <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-t-lg">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </AspectRatio>
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-2 mb-2">
                <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
                  {article.title}
                </CardTitle>
              </div>
              {article.summary && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {article.summary}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <SolarIcon icon="eye-bold" className="h-3 w-3" />
                    {article.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <SolarIcon icon="heart-bold" className="h-3 w-3" />
                    {article.reactions}
                  </span>
                  <span className="flex items-center gap-1">
                    <SolarIcon icon="chat-round-bold" className="h-3 w-3" />
                    {article.comments}
                  </span>
                </div>
                {article.publishedAt && (
                  <span>
                    {formatDistanceToNow(new Date(article.publishedAt), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                )}
              </div>
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {article.tags.slice(0, 3).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
}

