"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "next-view-transitions";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";

const STATUS_LABELS = {
  draft: "Brouillon",
  pending: "En attente",
  published: "Publié",
  rejected: "Rejeté",
} as const;

const STATUS_VARIANTS = {
  draft: "secondary",
  pending: "default",
  published: "default",
  rejected: "destructive",
} as const;

export default function MyArticlesPage() {
  const myArticles = useQuery(api.articles.getMyArticles, {
    limit: 50,
  });

  // Grouper par statut
  const articlesByStatus = {
    draft: myArticles?.filter((a: any) => a.status === "draft") || [],
    pending: myArticles?.filter((a: any) => a.status === "pending") || [],
    published: myArticles?.filter((a: any) => a.status === "published") || [],
    rejected: myArticles?.filter((a: any) => a.status === "rejected") || [],
  };

  if (myArticles === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mes articles</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos articles et suivez leur statut
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const allArticles = myArticles || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes articles</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos articles et suivez leur statut
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/articles/nouveau">
            <SolarIcon icon="pen-new-round-bold" className="h-4 w-4 mr-2" />
            Rédiger un article
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <SolarIcon icon="document-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allArticles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publiés</CardTitle>
            <SolarIcon icon="verified-check-bold" className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articlesByStatus.published.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <SolarIcon icon="clock-circle-bold" className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articlesByStatus.pending.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
            <SolarIcon icon="pen-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articlesByStatus.draft.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des articles */}
      <Card>
        <CardHeader>
          <CardTitle>Liste de vos articles</CardTitle>
          <CardDescription>
            Tous vos articles avec leur statut et leurs métriques
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allArticles.length === 0 ? (
            <div className="text-center py-12">
              <SolarIcon icon="document-bold" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun article pour le moment</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par créer votre premier article
              </p>
              <Button asChild>
                <Link href="/studio/articles/nouveau">
                  Rédiger un article
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Sources</TableHead>
                  <TableHead>Vues</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allArticles.map((article: any) => {
                  const publishedDate = article.publishedAt
                    ? new Date(article.publishedAt)
                    : new Date(article.createdAt);

                  return (
                    <TableRow key={article._id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/studio/articles/${article.slug || article._id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {article.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_VARIANTS[article.status as keyof typeof STATUS_VARIANTS] as any
                          }
                        >
                          {STATUS_LABELS[article.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="star-bold" className="h-3 w-3" />
                          <span className="text-sm">{article.qualityScore || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="document-text-bold" className="h-3 w-3" />
                          <span className="text-sm">{article.sourcesCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="eye-bold" className="h-3 w-3" />
                          <span className="text-sm">{article.views || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(publishedDate, {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/studio/articles/${article.slug || article._id}`}>
                            Éditer
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

