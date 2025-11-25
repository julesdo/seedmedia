"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudioDashboardPage() {
  const user = useQuery(api.auth.getCurrentUser);
  const myArticles = useQuery(api.articles.getMyArticles, {
    limit: 10,
  });
  const pendingArticles = myArticles?.filter((a: any) => a.status === "pending") || [];
  const draftArticles = myArticles?.filter((a: any) => a.status === "draft") || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Studio Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenue dans votre espace de production Seed
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mes articles</CardTitle>
            <SolarIcon icon="document-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myArticles !== undefined ? myArticles.length : <Skeleton className="h-8 w-16" />}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingArticles.length} en attente de validation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brouillons</CardTitle>
            <SolarIcon icon="pen-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myArticles !== undefined ? draftArticles.length : <Skeleton className="h-8 w-16" />}
            </div>
            <p className="text-xs text-muted-foreground">
              Articles en cours de rédaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de crédibilité</CardTitle>
            <SolarIcon icon="star-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user ? (user.credibilityScore || 0) : <Skeleton className="h-8 w-16" />}
            </div>
            <p className="text-xs text-muted-foreground">
              {user?.role === "editeur" ? "Éditeur" : user?.role === "contributeur" ? "Contributeur" : "Explorateur"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start">
              <Link href="/studio/articles/nouveau">
                <SolarIcon icon="pen-new-round-bold" className="h-4 w-4 mr-2" />
                Rédiger un article
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/studio/fact-check">
                <SolarIcon icon="verified-check-bold" className="h-4 w-4 mr-2" />
                File de fact-check
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href="/studio/gouvernance">
                <SolarIcon icon="vote-bold" className="h-4 w-4 mr-2" />
                Gouvernance
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contributions en attente</CardTitle>
            <CardDescription>Articles en cours de validation</CardDescription>
          </CardHeader>
          <CardContent>
            {myArticles === undefined ? (
              <Skeleton className="h-20 w-full" />
            ) : pendingArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune contribution en attente
              </p>
            ) : (
              <div className="space-y-2">
                {pendingArticles.slice(0, 3).map((article: any) => (
                  <div
                    key={article._id}
                    className="flex items-center justify-between p-2 rounded-md border"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{article.title}</p>
                      <p className="text-xs text-muted-foreground">En attente de validation</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/studio/articles/${article.slug}`}>Voir</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dernières décisions de gouvernance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dernières décisions de gouvernance</CardTitle>
              <CardDescription>Suivez les propositions en cours de vote</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/studio/gouvernance">Voir tout</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune proposition ouverte pour le moment
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

