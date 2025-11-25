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
import { fr } from "date-fns/locale";

const STATUS_LABELS = {
  active: "Active",
  completed: "Terminée",
  cancelled: "Annulée",
} as const;

const STATUS_VARIANTS = {
  active: "default",
  completed: "secondary",
  cancelled: "destructive",
} as const;

const TYPE_LABELS = {
  petition: "Pétition",
  contribution: "Contribution",
  event: "Événement",
} as const;

export default function MyActionsPage() {
  const myActions = useQuery(api.actions.getMyActions);

  if (myActions === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mes actions</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos actions et suivez leur progression
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

  const allActions = myActions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes actions</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos actions et suivez leur progression
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/actions/nouvelle">
            <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
            Nouvelle action
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <SolarIcon icon="hand-stars-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allActions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allActions.filter((a: any) => a.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <SolarIcon icon="verified-check-bold" className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allActions.filter((a: any) => a.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <SolarIcon icon="users-group-rounded-bold" className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allActions.reduce((sum: number, a: any) => sum + (a.participants || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des actions */}
      <Card>
        <CardHeader>
          <CardTitle>Liste de vos actions</CardTitle>
          <CardDescription>
            Toutes vos actions avec leur statut et leurs métriques
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allActions.length === 0 ? (
            <div className="text-center py-12">
              <SolarIcon icon="hand-stars-bold" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune action pour le moment</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par créer votre première action
              </p>
              <Button asChild>
                <Link href="/studio/actions/nouvelle">
                  Nouvelle action
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Date limite</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allActions.map((action: any) => {
                  const createdDate = new Date(action.createdAt);
                  const deadlineDate = action.deadline ? new Date(action.deadline) : null;

                  return (
                    <TableRow key={action._id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/studio/actions/${action.slug || action._id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {action.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TYPE_LABELS[action.type as keyof typeof TYPE_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_VARIANTS[action.status as keyof typeof STATUS_VARIANTS] as any
                          }
                        >
                          {STATUS_LABELS[action.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="users-group-rounded-bold" className="h-3 w-3" />
                          <span className="text-sm">{action.participants || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {deadlineDate ? (
                          <div className="text-sm">
                            {deadlineDate < new Date() ? (
                              <span className="text-destructive">Expirée</span>
                            ) : (
                              formatDistanceToNow(deadlineDate, {
                                addSuffix: true,
                                locale: fr,
                              })
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Aucune</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(createdDate, {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/studio/actions/${action.slug || action._id}`}>
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

