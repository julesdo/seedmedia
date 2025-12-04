"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function StudioDashboardPage() {
  const user = useQuery(api.auth.getCurrentUser);
  const myArticles = useQuery(api.articles.getMyArticles, {
    limit: 10,
  });
  const myProjects = useQuery(api.projects.getMyProjects);
  const myActions = useQuery(api.actions.getMyActions);
  const myDebates = useQuery(api.debates.getMyDebates, { limit: 10 });
  const openProposals = useQuery(api.governance.getOpenProposals, { limit: 3 });
  
  const pendingArticles = myArticles?.filter((a: any) => a.status === "pending") || [];
  const draftArticles = myArticles?.filter((a: any) => a.status === "draft") || [];
  const publishedArticles = myArticles?.filter((a: any) => a.status === "published") || [];
  
  const activeActions = myActions?.filter((a: any) => a.status === "active") || [];
  const openDebates = myDebates?.filter((d: any) => d.status === "open") || [];

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10 max-w-7xl">
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Studio Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Bienvenue dans votre espace de production Seed
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Articles</CardTitle>
              <SolarIcon icon="document-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myArticles !== undefined ? myArticles.length : <Skeleton className="h-8 w-16" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {publishedArticles.length} publiés • {pendingArticles.length} en attente
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projets</CardTitle>
              <SolarIcon icon="folder-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myProjects !== undefined ? myProjects.length : <Skeleton className="h-8 w-16" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Projets créés
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
              <SolarIcon icon="hand-stars-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {myActions !== undefined ? myActions.length : <Skeleton className="h-8 w-16" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {activeActions.length} actives
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crédibilité</CardTitle>
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

        {/* Quick Actions & Recent Content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Actions rapides */}
          <Card className="border border-border/60 bg-card">
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start" variant="accent">
                <Link href="/studio/articles/nouveau">
                  <SolarIcon icon="pen-new-round-bold" className="h-4 w-4 mr-2" />
                  Nouvel article
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/studio/projets/nouveau">
                  <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
                  Nouveau projet
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/studio/actions/nouvelle">
                  <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
                  Nouvelle action
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/studio/debats/nouveau">
                  <SolarIcon icon="question-circle-bold" className="h-4 w-4 mr-2" />
                  Nouveau débat
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Contributions en attente */}
          <Card className="border border-border/60 bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>En attente</CardTitle>
                  <CardDescription>Articles en cours de validation</CardDescription>
                </div>
                {pendingArticles.length > 0 && (
                  <Badge variant="secondary">{pendingArticles.length}</Badge>
                )}
              </div>
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
                    <Link
                      key={article._id}
                      href={`/studio/articles/${article.slug}`}
                      className="flex items-center justify-between p-3 rounded-md border border-border/60 hover:border-border/80 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:opacity-80 transition-opacity">
                          {article.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">En attente de validation</p>
                      </div>
                      <SolarIcon icon="arrow-right-bold" className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                    </Link>
                  ))}
                  {pendingArticles.length > 3 && (
                    <Button variant="ghost" size="sm" asChild className="w-full mt-2">
                      <Link href="/studio/articles">
                        Voir tout ({pendingArticles.length})
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Brouillons */}
          <Card className="border border-border/60 bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Brouillons</CardTitle>
                  <CardDescription>Articles en cours de rédaction</CardDescription>
                </div>
                {draftArticles.length > 0 && (
                  <Badge variant="secondary">{draftArticles.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {myArticles === undefined ? (
                <Skeleton className="h-20 w-full" />
              ) : draftArticles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun brouillon
                </p>
              ) : (
                <div className="space-y-2">
                  {draftArticles.slice(0, 3).map((article: any) => (
                    <Link
                      key={article._id}
                      href={`/studio/articles/${article.slug}`}
                      className="flex items-center justify-between p-3 rounded-md border border-border/60 hover:border-border/80 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:opacity-80 transition-opacity">
                          {article.title || "Sans titre"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">Brouillon</p>
                      </div>
                      <SolarIcon icon="arrow-right-bold" className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                    </Link>
                  ))}
                  {draftArticles.length > 3 && (
                    <Button variant="ghost" size="sm" asChild className="w-full mt-2">
                      <Link href="/studio/articles">
                        Voir tout ({draftArticles.length})
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gouvernance & Activité récente */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Propositions de gouvernance */}
          <Card className="border border-border/60 bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gouvernance</CardTitle>
                  <CardDescription>Propositions en cours de vote</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/studio/gouvernance">Voir tout</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {openProposals === undefined ? (
                <Skeleton className="h-20 w-full" />
              ) : openProposals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune proposition ouverte pour le moment
                </p>
              ) : (
                <div className="space-y-2">
                  {openProposals.slice(0, 3).map((proposal: any) => (
                    <Link
                      key={proposal._id}
                      href={`/studio/gouvernance/${proposal.slug}`}
                      className="flex items-start justify-between p-3 rounded-md border border-border/60 hover:border-border/80 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2 group-hover:opacity-80 transition-opacity">
                          {proposal.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <SolarIcon icon="check-circle-bold" className="h-3 w-3" />
                            {proposal.votesFor || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <SolarIcon icon="close-circle-bold" className="h-3 w-3" />
                            {proposal.votesAgainst || 0}
                          </span>
                        </div>
                      </div>
                      <SolarIcon icon="arrow-right-bold" className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0 mt-0.5" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card className="border border-border/60 bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Activité récente</CardTitle>
                  <CardDescription>Vos contenus récemment publiés</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {myArticles === undefined ? (
                <Skeleton className="h-20 w-full" />
              ) : publishedArticles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun contenu publié récemment
                </p>
              ) : (
                <div className="space-y-2">
                  {publishedArticles.slice(0, 3).map((article: any) => {
                    const publishedDate = article.publishedAt
                      ? new Date(article.publishedAt)
                      : new Date(article.createdAt);
                    
                    return (
                      <Link
                        key={article._id}
                        href={`/studio/articles/${article.slug}`}
                        className="flex items-start justify-between p-3 rounded-md border border-border/60 hover:border-border/80 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2 group-hover:opacity-80 transition-opacity">
                            {article.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Publié {formatDistanceToNow(publishedDate, { addSuffix: true, locale: fr })}
                          </p>
                        </div>
                        <SolarIcon icon="arrow-right-bold" className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0 mt-0.5" />
                      </Link>
                    );
                  })}
                  {publishedArticles.length > 3 && (
                    <Button variant="ghost" size="sm" asChild className="w-full mt-2">
                      <Link href="/studio/articles">
                        Voir tout ({publishedArticles.length})
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

