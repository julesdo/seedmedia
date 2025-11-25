"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#246BFD", "#1A5DE8", "#0F4FD9", "#0A3FC7", "#0529B5"];

export default function StatsPage() {
  const stats = useQuery(api.stats.getPlatformStats);

  if (stats === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Données pour le graphique des utilisateurs par rôle
  const usersByRoleData = [
    { name: "Explorateurs", value: stats.usersByRole.explorateur, color: COLORS[0] },
    { name: "Contributeurs", value: stats.usersByRole.contributeur, color: COLORS[1] },
    { name: "Éditeurs", value: stats.usersByRole.editeur, color: COLORS[2] },
  ];

  // Données pour le graphique des articles par statut
  const articlesByStatusData = [
    { name: "Publiés", value: stats.articlesCount, color: COLORS[0] },
    { name: "En attente", value: stats.pendingArticlesCount, color: COLORS[1] },
    { name: "Rejetés", value: stats.rejectedArticlesCount, color: COLORS[2] },
  ];

  // Données pour le graphique des propositions par statut
  const proposalsByStatusData = [
    { name: "Ouvertes", value: stats.openProposals, color: COLORS[0] },
    { name: "Fermées", value: stats.closedProposals, color: COLORS[1] },
    { name: "Approuvées", value: stats.approvedProposals, color: COLORS[2] },
    { name: "Rejetées", value: stats.rejectedProposals, color: COLORS[3] },
  ];

  // Données pour le graphique des actions par statut
  const actionsByStatusData = [
    { name: "Actives", value: stats.activeActionsCount, color: COLORS[0] },
    { name: "Terminées", value: stats.completedActionsCount, color: COLORS[1] },
    { name: "Annulées", value: stats.cancelledActionsCount, color: COLORS[2] },
  ];

  // Données pour le graphique des votes
  const votesData = [
    { name: "Positifs", value: stats.positiveVotes, color: COLORS[0] },
    { name: "Négatifs", value: stats.negativeVotes, color: COLORS[2] },
  ];

  // Données pour le graphique des corrections par statut
  const correctionsByStatusData = [
    { name: "Approuvées", value: stats.approvedCorrections, color: COLORS[0] },
    { name: "En attente", value: stats.pendingCorrections, color: COLORS[1] },
    { name: "Rejetées", value: stats.rejectedCorrections, color: COLORS[2] },
  ];

  // Données pour le graphique des follows par type
  const followsByTypeData = [
    { name: "Utilisateurs", value: stats.userFollows, color: COLORS[0] },
    { name: "Organisations", value: stats.orgFollows, color: COLORS[1] },
    { name: "Tags", value: stats.tagFollows, color: COLORS[2] },
  ];

  // Données pour le graphique comparatif (barres)
  const comparisonData = [
    { category: "Articles", value: stats.articlesCount },
    { category: "Projets", value: stats.projectsCount },
    { category: "Actions", value: stats.totalActionsCount },
    { category: "Débats", value: stats.totalDebatesCount },
    { category: "Organisations", value: stats.organizationsCount },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Statistiques de la plateforme</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble des métriques clés de Seed Media
          </p>
        </div>

        {/* Métriques clés */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <SolarIcon icon="users-group-rounded-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeUsersCount} actifs • {stats.recentUsers} nouveaux (30j)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Articles</CardTitle>
              <SolarIcon icon="document-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.articlesCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentArticles} nouveaux (30j) • {stats.pendingArticlesCount} en attente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organisations</CardTitle>
              <SolarIcon icon="buildings-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.organizationsCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.verifiedOrgsCount} vérifiées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crédibilité moyenne</CardTitle>
              <SolarIcon icon="star-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgCredibility}</div>
              <p className="text-xs text-muted-foreground">
                Score moyen de crédibilité
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Utilisateurs par rôle */}
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs par rôle</CardTitle>
              <CardDescription>Répartition des utilisateurs selon leur rôle</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  explorateur: { label: "Explorateurs", color: COLORS[0] },
                  contributeur: { label: "Contributeurs", color: COLORS[1] },
                  editeur: { label: "Éditeurs", color: COLORS[2] },
                }}
                className="h-[300px]"
              >
                <PieChart>
                  <Pie
                    data={usersByRoleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {usersByRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Articles par statut */}
          <Card>
            <CardHeader>
              <CardTitle>Articles par statut</CardTitle>
              <CardDescription>Répartition des articles selon leur statut</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  published: { label: "Publiés", color: COLORS[0] },
                  pending: { label: "En attente", color: COLORS[1] },
                  rejected: { label: "Rejetés", color: COLORS[2] },
                }}
                className="h-[300px]"
              >
                <PieChart>
                  <Pie
                    data={articlesByStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {articlesByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Comparaison des contenus */}
          <Card>
            <CardHeader>
              <CardTitle>Comparaison des contenus</CardTitle>
              <CardDescription>Nombre de contenus par type</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  articles: { label: "Articles", color: COLORS[0] },
                  projects: { label: "Projets", color: COLORS[1] },
                  actions: { label: "Actions", color: COLORS[2] },
                  debates: { label: "Débats", color: COLORS[3] },
                  organizations: { label: "Organisations", color: COLORS[4] },
                }}
                className="h-[300px]"
              >
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Votes sur articles */}
          <Card>
            <CardHeader>
              <CardTitle>Votes sur articles</CardTitle>
              <CardDescription>Répartition des votes positifs et négatifs</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  positive: { label: "Positifs", color: COLORS[0] },
                  negative: { label: "Négatifs", color: COLORS[2] },
                }}
                className="h-[300px]"
              >
                <PieChart>
                  <Pie
                    data={votesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {votesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Propositions de gouvernance */}
          <Card>
            <CardHeader>
              <CardTitle>Propositions de gouvernance</CardTitle>
              <CardDescription>Statut des propositions</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  open: { label: "Ouvertes", color: COLORS[0] },
                  closed: { label: "Fermées", color: COLORS[1] },
                  approved: { label: "Approuvées", color: COLORS[2] },
                  rejected: { label: "Rejetées", color: COLORS[3] },
                }}
                className="h-[300px]"
              >
                <BarChart data={proposalsByStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Corrections */}
          <Card>
            <CardHeader>
              <CardTitle>Corrections proposées</CardTitle>
              <CardDescription>Statut des corrections</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  approved: { label: "Approuvées", color: COLORS[0] },
                  pending: { label: "En attente", color: COLORS[1] },
                  rejected: { label: "Rejetées", color: COLORS[2] },
                }}
                className="h-[300px]"
              >
                <PieChart>
                  <Pie
                    data={correctionsByStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {correctionsByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Métriques supplémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commentaires</CardTitle>
              <SolarIcon icon="chat-round-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.commentsCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recentComments} nouveaux (30j)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Votes</CardTitle>
              <SolarIcon icon="hand-stars-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.votesCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.positiveVotes} positifs • {stats.negativeVotes} négatifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favoris</CardTitle>
              <SolarIcon icon="star-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.favoritesCount}</div>
              <p className="text-xs text-muted-foreground">
                Contenus favorisés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Follows</CardTitle>
              <SolarIcon icon="user-plus-rounded-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.followsCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.userFollows} utilisateurs • {stats.orgFollows} organisations • {stats.tagFollows} tags
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Débats</CardTitle>
              <SolarIcon icon="question-circle-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDebatesCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.openDebatesCount} ouverts • {stats.closedDebatesCount} fermés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
              <SolarIcon icon="hand-stars-bold" className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActionsCount}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeActionsCount} actives • {stats.completedActionsCount} terminées
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

