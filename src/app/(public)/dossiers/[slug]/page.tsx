"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function DossierDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const dossier = useQuery(api.dossiers.getDossierBySlug, { slug });

  // États de chargement
  if (dossier === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Dossier non trouvé
  if (dossier === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert variant="destructive">
          <SolarIcon icon="danger-triangle-bold" className="h-4 w-4" />
          <AlertDescription>
            Dossier non trouvé. Il a peut-être été supprimé ou n'existe pas encore.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <article className="space-y-8">
        {/* Header */}
        <header className="space-y-4">
          {dossier.coverImage && (
            <div className="relative h-64 md:h-96 w-full overflow-hidden rounded-lg">
              <Image
                src={dossier.coverImage}
                alt={dossier.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <h1 className="text-4xl md:text-5xl font-bold">{dossier.title}</h1>
                {dossier.featured && (
                  <Badge variant="default">
                    <SolarIcon icon="star-bold" className="h-4 w-4 mr-1" />
                    Mis en avant
                  </Badge>
                )}
              </div>
              
              <p className="text-lg text-muted-foreground">{dossier.description}</p>
              
              {/* Tags */}
              {dossier.tags && dossier.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {dossier.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Articles du dossier */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Articles ({dossier.articles?.length || 0})</h2>
          </div>

          {!dossier.articles || dossier.articles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <SolarIcon icon="document-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Aucun article dans ce dossier pour le moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dossier.articles.map((article) => (
                <Link key={article._id} href={`/articles/${article.slug}`}>
                  <Card className="h-full border-t-2 border-transparent hover:border-primary transition-colors cursor-pointer">
                    {article.coverImage && (
                      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={article.coverImage}
                          alt={article.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                      {article.summary && (
                        <CardDescription className="line-clamp-2">{article.summary}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span>
                          {formatDistanceToNow(new Date(article.publishedAt || article.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                        {article.qualityScore !== undefined && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <SolarIcon icon="star-bold" className="h-3 w-3" />
                              <span>{article.qualityScore}</span>
                            </div>
                          </>
                        )}
                      </div>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {article.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </article>
    </div>
  );
}

