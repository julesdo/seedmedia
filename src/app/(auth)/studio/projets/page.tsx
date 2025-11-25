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

const STAGE_LABELS = {
  idea: "Idée",
  prototype: "Prototype",
  beta: "Bêta",
  production: "Production",
} as const;

const STAGE_VARIANTS = {
  idea: "secondary",
  prototype: "default",
  beta: "default",
  production: "default",
} as const;

export default function MyProjectsPage() {
  const myProjects = useQuery(api.projects.getMyProjects);

  if (myProjects === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mes projets</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos projets et suivez leur progression
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

  const allProjects = myProjects || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes projets</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos projets et suivez leur progression
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/projets/nouveau">
            <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
            Nouveau projet
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <SolarIcon icon="folder-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En production</CardTitle>
            <SolarIcon icon="rocket-bold" className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allProjects.filter((p: any) => p.stage === "production").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En bêta</CardTitle>
            <SolarIcon icon="test-tube-bold" className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allProjects.filter((p: any) => p.stage === "beta").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open source</CardTitle>
            <SolarIcon icon="code-bold" className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allProjects.filter((p: any) => p.openSource).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des projets */}
      <Card>
        <CardHeader>
          <CardTitle>Liste de vos projets</CardTitle>
          <CardDescription>
            Tous vos projets avec leur stade et leurs métriques
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allProjects.length === 0 ? (
            <div className="text-center py-12">
              <SolarIcon icon="folder-bold" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun projet pour le moment</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par créer votre premier projet
              </p>
              <Button asChild>
                <Link href="/studio/projets/nouveau">
                  Nouveau projet
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Stade</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead>Vues</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allProjects.map((project: any) => {
                  const createdDate = new Date(project.createdAt);

                  return (
                    <TableRow key={project._id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/studio/projets/${project.slug || project._id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {project.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STAGE_VARIANTS[project.stage as keyof typeof STAGE_VARIANTS] as any
                          }
                        >
                          {STAGE_LABELS[project.stage as keyof typeof STAGE_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {project.orgId ? (
                          <span className="text-sm text-muted-foreground">Organisation</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Personnel</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="image-bold" className="h-3 w-3" />
                          <span className="text-sm">{project.images?.length || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="eye-bold" className="h-3 w-3" />
                          <span className="text-sm">{project.views || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(createdDate, {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/studio/projets/${project.slug || project._id}`}>
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

