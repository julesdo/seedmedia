"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Link } from "next-view-transitions";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function MyFavoritesPage() {
  const favorites = useQuery(api.favorites.getMyFavorites);

  if (favorites === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gradient-light mb-2">Mes favoris</h1>
          <p className="text-muted-foreground">
            Retrouvez tous vos contenus favoris en un seul endroit
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gradient-light mb-2">Mes favoris</h1>
          <p className="text-muted-foreground">
            Retrouvez tous vos contenus favoris en un seul endroit
          </p>
        </div>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SolarIcon icon="star-outline" className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Aucun favori</EmptyTitle>
            <EmptyDescription>
              Vous n'avez pas encore ajouté de contenu à vos favoris. Explorez les articles, projets et actions pour en découvrir.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "article":
        return "Article";
      case "project":
        return "Projet";
      case "action":
        return "Action";
      default:
        return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return "document-text-bold";
      case "project":
        return "folder-bold";
      case "action":
        return "hand-stars-bold";
      default:
        return "file-bold";
    }
  };

  const getTypeHref = (type: string, slug: string) => {
    switch (type) {
      case "article":
        return `/articles/${slug}`;
      case "project":
        return `/projects/${slug}`;
      case "action":
        return `/actions/${slug}`;
      default:
        return "#";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient-light mb-2">Mes favoris</h1>
        <p className="text-muted-foreground">
          {favorites.length} {favorites.length === 1 ? "contenu favori" : "contenus favoris"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((favorite) => {
          if (!favorite.content) return null;

          return (
            <Card key={favorite._id} className="h-full hover:scale-[1.02] transition-transform group relative">
              {/* Bouton favori en haut à droite */}
              <div className="absolute top-3 right-3 z-10">
                <FavoriteButton
                  targetType={favorite.targetType}
                  targetId={favorite.targetId}
                  variant="ghost"
                  size="sm"
                  className="backdrop-blur-sm bg-background/90"
                />
              </div>

              <Link href={getTypeHref(favorite.targetType, favorite.content.slug)}>
                {favorite.content.coverImage && (
                  <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-t-lg">
                    <img
                      src={favorite.content.coverImage}
                      alt={favorite.content.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  </AspectRatio>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(favorite.targetType)}
                    </Badge>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground opacity-70">
                      {favorite.content.views !== undefined && (
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="eye-bold" className="h-3 w-3" />
                          <span>{favorite.content.views}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-gradient-light group-hover:text-primary transition-colors line-clamp-2">
                    {favorite.content.title}
                  </CardTitle>
                  {(favorite.content.summary || favorite.content.description) && (
                    <p className="text-sm text-muted-foreground opacity-80 mt-2 line-clamp-2">
                      {favorite.content.summary || favorite.content.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {favorite.author && (
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={favorite.author.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {favorite.author.name?.[0]?.toUpperCase() || favorite.author.email[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {favorite.author.name || favorite.author.email}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground opacity-60">
                    <span>
                      Ajouté {formatDistanceToNow(new Date(favorite.createdAt), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

