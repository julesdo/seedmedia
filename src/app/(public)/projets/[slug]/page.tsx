"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Author } from "@/components/articles/Author";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlateEditorWrapper } from "@/components/articles/PlateEditorWrapper";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

const STAGE_LABELS = {
  idea: "Idée",
  prototype: "Prototype",
  beta: "Bêta",
  production: "Production",
} as const;

export default function PublicProjectPage() {
  const params = useParams();
  const slug = params.slug as string;
  const incrementViews = useMutation(api.projects.incrementProjectViews);
  const [viewerIp, setViewerIp] = useState<string | null>(null);

  // Récupérer le projet par slug
  const project = useQuery(api.projects.getProjectBySlug, { slug });

  // Récupérer l'IP du viewer
  useEffect(() => {
    fetch("/api/get-ip")
      .then((res) => res.json())
      .then((data) => setViewerIp(data.ip))
      .catch(() => setViewerIp(null));
  }, []);

  // Incrémenter les vues une seule fois quand le projet est chargé
  const hasIncrementedViews = useRef(false);
  useEffect(() => {
    if (project?._id && viewerIp !== undefined && !hasIncrementedViews.current) {
      hasIncrementedViews.current = true;
      incrementViews({ projectId: project._id, viewerIp: viewerIp || undefined }).catch((error) => {
        console.error("Erreur lors de l'incrémentation des vues:", error);
      });
    }
  }, [project?._id, viewerIp, incrementViews]);

  // États de chargement
  if (project === undefined) {
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

  // Projet non trouvé
  if (project === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert variant="destructive">
          <SolarIcon icon="danger-triangle-bold" className="h-4 w-4" />
          <AlertDescription>
            Projet non trouvé. Il a peut-être été supprimé ou n'existe pas encore.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <article className="space-y-8">
        {/* Header avec meta */}
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-sm">
                  {STAGE_LABELS[project.stage]}
                </Badge>
                {project.openSource && (
                  <Badge variant="default" className="text-sm">
                    <SolarIcon icon="code-bold" className="h-3 w-3 mr-1" />
                    Open Source
                  </Badge>
                )}
                {project.featured && (
                  <Badge variant="default" className="text-sm">
                    <SolarIcon icon="star-bold" className="h-3 w-3 mr-1" />
                    En vedette
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                {project.title}
              </h1>
              <p className="text-xl text-muted-foreground">{project.summary}</p>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
            {project.author && (
              <Author
                author={project.author}
                variant="default"
                size="md"
              />
            )}
            {project.organization && (
              <div className="flex items-center gap-2">
                <SolarIcon icon="buildings-bold" className="h-4 w-4" />
                <Link
                  href={`/organizations/${project.organization.slug}`}
                  className="hover:text-foreground transition-colors"
                >
                  {project.organization.name}
                </Link>
              </div>
            )}
            <div className="flex items-center gap-1">
              <SolarIcon icon="calendar-bold" className="h-4 w-4" />
              <span>
                {formatDistanceToNow(new Date(project.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <SolarIcon icon="eye-bold" className="h-4 w-4" />
              <span>{project.views || 0} vues</span>
            </div>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </header>

        {/* Galerie d'images */}
        {project.images && project.images.length > 0 && (
          <div className="space-y-4">
            {project.images.length === 1 ? (
              <div className="relative h-96 w-full rounded-lg overflow-hidden">
                <Image
                  src={project.images[0]}
                  alt={project.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {project.images.slice(0, 4).map((image, index) => (
                  <div
                    key={index}
                    className={`relative ${
                      index === 0 ? "col-span-2 h-64" : "h-48"
                    } rounded-lg overflow-hidden`}
                  >
                    <Image
                      src={image}
                      alt={`${project.title} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Description */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Description</h2>
              <div className="prose max-w-none">
                <PlateEditorWrapper
                  value={project.description}
                  onChange={() => {}}
                  readOnly
                />
              </div>
            </div>

            {/* Métriques d'impact */}
            {project.impactMetrics && project.impactMetrics.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Métriques d'impact</h2>
                <div className="grid grid-cols-2 gap-4">
                  {project.impactMetrics.map((metric, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground mb-1">
                          {metric.label}
                        </div>
                        <div className="text-2xl font-bold">{metric.value}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Localisation */}
            {project.location && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Localisation</h2>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-1">
                      {project.location.city && (
                        <div className="flex items-center gap-2">
                          <SolarIcon icon="map-point-bold" className="h-4 w-4" />
                          <span>
                            {project.location.city}
                            {project.location.region && `, ${project.location.region}`}
                            {project.location.country && `, ${project.location.country}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Métriques */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Vues</span>
                  <span className="font-semibold">{project.views || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Réactions</span>
                  <span className="font-semibold">{project.reactions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Commentaires</span>
                  <span className="font-semibold">{project.comments || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Liens externes */}
            {project.links && project.links.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Liens</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {project.links.map((link, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <SolarIcon
                          icon={
                            link.type === "github"
                              ? "code-bold"
                              : link.type === "demo"
                              ? "play-bold"
                              : "link-bold"
                          }
                          className="h-4 w-4 mr-2"
                        />
                        {link.type === "github"
                          ? "GitHub"
                          : link.type === "demo"
                          ? "Démo"
                          : link.type === "documentation"
                          ? "Documentation"
                          : "Site web"}
                      </a>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </article>
    </div>
  );
}

