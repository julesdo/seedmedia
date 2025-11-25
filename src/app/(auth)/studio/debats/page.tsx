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
  open: "Ouvert",
  closed: "Fermé",
} as const;

const STATUS_VARIANTS = {
  open: "default",
  closed: "secondary",
} as const;

export default function MyDebatesPage() {
  const myDebates = useQuery(api.debates.getMyDebates, {
    limit: 50,
  });

  // Grouper par statut
  const debatesByStatus = {
    open: myDebates?.filter((d: any) => d.status === "open") || [],
    closed: myDebates?.filter((d: any) => d.status === "closed") || [],
  };

  if (myDebates === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mes débats</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos débats et suivez leur progression
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

  const allDebates = myDebates || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes débats</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos débats et suivez leur progression
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/debats/nouveau">
            <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
            Créer un débat
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <SolarIcon icon="question-circle-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allDebates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ouverts</CardTitle>
            <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{debatesByStatus.open.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fermés</CardTitle>
            <SolarIcon icon="close-circle-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{debatesByStatus.closed.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arguments totaux</CardTitle>
            <SolarIcon icon="chat-round-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allDebates.reduce(
                (sum: number, d: any) =>
                  sum + (d.argumentsForCount || 0) + (d.argumentsAgainstCount || 0),
                0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des débats */}
      <Card>
        <CardHeader>
          <CardTitle>Liste de vos débats</CardTitle>
          <CardDescription>
            Tous vos débats avec leur statut et leurs métriques
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allDebates.length === 0 ? (
            <div className="text-center py-12">
              <SolarIcon
                icon="question-circle-bold"
                className="h-12 w-12 mx-auto text-muted-foreground mb-4"
              />
              <h3 className="text-lg font-semibold mb-2">Aucun débat pour le moment</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Créez votre premier débat pour engager la communauté
              </p>
              <Button asChild>
                <Link href="/studio/debats/nouveau">Créer un débat</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Arguments</TableHead>
                  <TableHead>Polarisation</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allDebates.map((debat: any) => {
                  const totalArguments =
                    (debat.argumentsForCount || 0) + (debat.argumentsAgainstCount || 0);
                  const polarizationPercent = Math.round(debat.polarizationScore || 0);

                  return (
                    <TableRow key={debat._id}>
                      <TableCell className="font-medium max-w-xs">
                        <Link
                          href={`/debats/${debat.slug}`}
                          className="hover:text-primary transition-colors line-clamp-2"
                        >
                          {debat.question}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_VARIANTS[debat.status as keyof typeof STATUS_VARIANTS] as any
                          }
                        >
                          {STATUS_LABELS[debat.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <SolarIcon icon="check-circle-bold" className="h-3 w-3 text-green-500" />
                            <span className="text-sm">{debat.argumentsForCount || 0}</span>
                          </div>
                          <span className="text-muted-foreground">/</span>
                          <div className="flex items-center gap-1">
                            <SolarIcon icon="close-circle-bold" className="h-3 w-3 text-red-500" />
                            <span className="text-sm">{debat.argumentsAgainstCount || 0}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({totalArguments})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            polarizationPercent >= 70
                              ? "destructive"
                              : polarizationPercent >= 30
                              ? "default"
                              : "secondary"
                          }
                        >
                          {polarizationPercent}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {debat.article ? (
                          <Link
                            href={`/articles/${debat.article.slug}`}
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <SolarIcon icon="document-bold" className="h-3 w-3" />
                            {debat.article.title}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(debat.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/debats/${debat.slug}`}>Voir</Link>
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

