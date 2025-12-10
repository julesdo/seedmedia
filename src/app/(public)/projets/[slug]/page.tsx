"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Author } from "@/components/articles/Author";
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
import { CommentsSection } from "@/components/comments/CommentsSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { generateProjectStructuredData, type ProjectData } from "@/lib/seo-utils";

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

  // Préparer les données pour le SEO
  const projectData: ProjectData = {
    title: project.title,
    description: project.summary || project.description || undefined,
    slug: project.slug,
    coverImage: project.images?.[0] || null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt || undefined,
    author: project.author
      ? {
          name: project.author.name || undefined,
          email: project.author.email || undefined,
          image: project.author.image || null,
        }
      : null,
    stage: project.stage || undefined,
    openSource: project.openSource || undefined,
  };

  const structuredData = generateProjectStructuredData(
    projectData,
    project.location
      ? {
          city: project.location.city,
          region: project.location.region,
          country: project.location.country,
        }
      : undefined
  );

  return (
    <>
      <SEOHead
        title={project.title}
        description={project.summary || project.description || project.title}
        image={project.images?.[0] || undefined}
        url={`/projets/${project.slug}`}
        type="website"
        publishedTime={project.createdAt ? new Date(project.createdAt).toISOString() : undefined}
        modifiedTime={project.updatedAt ? new Date(project.updatedAt).toISOString() : undefined}
        author={project.author ? (project.author.name || project.author.email || undefined) : undefined}
        canonical={`/projets/${project.slug}`}
      />
      <StructuredData data={structuredData} />
      <div className="container mx-auto px-4 py-4 md:py-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <article className="space-y-6 min-w-0">
          {/* Header avec meta */}
          <header className="space-y-4">
            {/* Type et métriques */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[11px] font-semibold px-2 py-0.5">
                  {STAGE_LABELS[project.stage]}
                </Badge>
                {project.openSource && (
                  <Badge variant="default" className="text-[11px] font-semibold px-2 py-0.5">
                    <SolarIcon icon="code-bold" className="h-3 w-3 mr-1" />
                    Open Source
                  </Badge>
                )}
                {project.featured && (
                  <Badge variant="outline" className="text-[11px] font-semibold px-2 py-0.5">
                    <SolarIcon icon="star-bold" className="h-3 w-3 mr-1" />
                    En vedette
                  </Badge>
                )}
              </div>
              
              {/* Métriques */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <SolarIcon icon="eye-bold" className="h-3 w-3" />
                  <span className="font-medium">{project.views || 0}</span>
                </div>
              </div>
            </div>

            {/* Titre */}
            <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight">
              {project.title}
            </h1>
                
            {/* Meta auteur et date */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {project.author && (
                <Author
                  author={project.author}
                  variant="detailed"
                  showCredibility={false}
                  size="sm"
                  linkToProfile={true}
                />
              )}
              
              {project.organization && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Link
                    href={`/organizations/${project.organization.slug}`}
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                  >
                    {project.organization.logo && (
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={project.organization.logo} alt={project.organization.name} />
                        <AvatarFallback className="text-[10px]">{project.organization.name[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                    {project.organization.name}
                  </Link>
                </>
              )}
              
              <span className="text-muted-foreground">•</span>
              
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(project.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span key={tag} className="text-[11px] text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Galerie d'images */}
          {project.images && project.images.length > 0 && (
            <div className="relative w-full aspect-video overflow-hidden rounded-lg border border-border/60">
              {project.images.length === 1 ? (
                <Image
                  src={project.images[0]}
                  alt={project.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="grid grid-cols-2 gap-1 h-full">
                  {project.images.slice(0, 4).map((image, index) => (
                    <div
                      key={index}
                      className={`relative ${
                        index === 0 ? "col-span-2" : ""
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${project.title} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Separator className="border-border/60" />

          {/* Résumé */}
          {project.summary && (
            <div className="border-l-2 border-primary/40 pl-3 py-2 bg-muted/20 rounded-r">
              <div className="flex items-center gap-1.5 mb-1.5">
                <SolarIcon icon="document-text-bold" className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Résumé</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{project.summary}</p>
            </div>
          )}

          {/* Description */}
          {project.description && (
            <div className="space-y-4">
              <Separator className="border-border/60" />
              <section className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:text-base prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-sm prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                <PlateEditorWrapper
                  value={project.description}
                  readOnly={true}
                  placeholder=""
                />
              </section>
            </div>
          )}

          {/* Métriques d'impact */}
          {project.impactMetrics && project.impactMetrics.length > 0 && (
            <>
              <Separator className="border-border/60" />
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1.5 border-b border-border/60">
                  <SolarIcon icon="chart-bold" className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold">Métriques d'impact</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {project.impactMetrics.map((metric, index) => (
                    <div key={index} className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground">{metric.label}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Localisation */}
          {project.location && (
            <>
              <Separator className="border-border/60" />
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-1.5 border-b border-border/60">
                  <SolarIcon icon="map-point-bold" className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold">Localisation</h2>
                </div>
                <div className="flex items-start gap-3">
                  <SolarIcon icon="map-point-bold" className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">
                    {project.location.city}
                    {project.location.region && `, ${project.location.region}`}
                    {project.location.country && `, ${project.location.country}`}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Section commentaires - Mobile */}
          {project._id && (
            <div className="lg:hidden">
              <Separator className="mb-6" />
              <CommentsSection targetType="project" targetId={project._id} />
            </div>
          )}
        </article>

        {/* Sidebar sticky avec métriques, liens et commentaires */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 flex flex-col max-h-[calc(100vh-5rem)] overflow-y-auto space-y-4">
            {/* Métriques */}
            <div className="border-b border-border/60 pb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3">Statistiques</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Vues</span>
                  <span className="font-semibold text-sm">{project.views || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Réactions</span>
                  <span className="font-semibold text-sm">{project.reactions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Commentaires</span>
                  <span className="font-semibold text-sm">{project.comments || 0}</span>
                </div>
              </div>
            </div>

            {/* Liens externes */}
            {project.links && project.links.length > 0 && (
              <div className="border-b border-border/60 pb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3">Liens</p>
                <div className="space-y-2">
                  {project.links.map((link, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-xs h-8"
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
                          className="h-3 w-3 mr-2"
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
                </div>
              </div>
            )}

            {/* Section commentaires - Desktop */}
            {project._id && (
              <div className="pt-2 flex-1 min-h-0">
                <CommentsSection targetType="project" targetId={project._id} />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
    </>
  );
}
