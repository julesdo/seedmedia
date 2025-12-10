"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "next-view-transitions";
import { toast } from "sonner";
import { Author } from "@/components/articles/Author";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useConvexAuth } from "convex/react";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlateEditorWrapper } from "@/components/articles/PlateEditorWrapper";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { generateActionStructuredData, type ActionData } from "@/lib/seo-utils";

const ACTION_TYPE_LABELS = {
  petition: "Pétition",
  contribution: "Contribution",
  event: "Événement",
} as const;

const STATUS_LABELS = {
  active: "Active",
  completed: "Terminée",
  cancelled: "Annulée",
} as const;

export default function PublicActionPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated } = useConvexAuth();

  const action = useQuery(api.actions.getActionBySlug, { slug });
  const hasParticipated = useQuery(api.actions.hasUserParticipated, action ? { actionId: action._id } : "skip");
  const participate = useMutation(api.actions.participateInAction);

  const handleParticipate = async () => {
    if (!action) return;

    if (!isAuthenticated) {
      toast.error("Vous devez être connecté pour participer");
      return;
    }

    try {
      const result = await participate({ actionId: action._id });
      if (result.participated) {
        toast.success(
          action.type === "petition"
            ? "Vous avez signé la pétition !"
            : action.type === "contribution"
            ? "Vous participez à cette contribution !"
            : "Vous êtes inscrit à cet événement !"
        );
      } else {
        toast.info("Participation retirée");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la participation");
    }
  };

  if (action === undefined) {
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

  if (action === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert variant="destructive">
          <SolarIcon icon="danger-triangle-bold" className="h-4 w-4" />
          <AlertDescription>Action non trouvée</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isActive = action.status === "active";
  const canParticipate = isActive && hasParticipated !== undefined;

  // Préparer les données pour le SEO
  const actionData: ActionData = {
    title: action.title,
    description: action.summary || action.description || undefined,
    slug: action.slug,
    coverImage: action.coverImage || null,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt || undefined,
    author: action.author
      ? {
          name: action.author.name || undefined,
          email: action.author.email || undefined,
          image: action.author.image || null,
        }
      : null,
    type: action.type || undefined,
    target: action.target || undefined,
    status: action.status || undefined,
  };

  const structuredData = generateActionStructuredData(
    actionData,
    action.location && action.type === "event"
      ? {
          city: action.location.city,
          region: action.location.region,
          country: action.location.country,
        }
      : undefined,
    action.deadline && action.type === "event" ? new Date(action.deadline).toISOString() : undefined,
    action.deadline && action.type === "event" ? new Date(action.deadline).toISOString() : undefined
  );

  return (
    <>
      <SEOHead
        title={action.title}
        description={action.summary || action.description || action.title}
        image={action.coverImage || undefined}
        url={`/actions/${action.slug}`}
        type="website"
        publishedTime={action.createdAt ? new Date(action.createdAt).toISOString() : undefined}
        modifiedTime={action.updatedAt ? new Date(action.updatedAt).toISOString() : undefined}
        author={action.author ? (action.author.name || action.author.email || undefined) : undefined}
        canonical={`/actions/${action.slug}`}
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
                  {ACTION_TYPE_LABELS[action.type]}
                </Badge>
                <Badge
                  variant={action.status === "active" ? "default" : action.status === "completed" ? "secondary" : "destructive"}
                  className="text-[11px] font-semibold px-2 py-0.5"
                >
                  {STATUS_LABELS[action.status]}
                </Badge>
                {action.featured && (
                  <Badge variant="outline" className="text-[11px] font-semibold px-2 py-0.5">
                    <SolarIcon icon="star-bold" className="h-3 w-3 mr-1" />
                    En vedette
                  </Badge>
                )}
              </div>
              
              {/* Métriques */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <SolarIcon icon="users-group-two-rounded-bold" className="h-3 w-3" />
                  <span className="font-medium">{action.participants || 0}</span>
                </div>
              </div>
            </div>

            {/* Titre */}
            <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight">
              {action.title}
            </h1>
                
            {/* Meta auteur et date */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {action.author && (
                <Author
                  author={action.author}
                  variant="detailed"
                  showCredibility={false}
                  size="sm"
                  linkToProfile={true}
                />
              )}
              
              {action.organization && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <Link
                    href={`/organizations/${action.organization.slug}`}
                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                  >
                    {action.organization.logo && (
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={action.organization.logo} alt={action.organization.name} />
                        <AvatarFallback className="text-[10px]">{action.organization.name[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                    {action.organization.name}
                  </Link>
                </>
              )}
              
              <span className="text-muted-foreground">•</span>
              
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(action.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>

            {/* Tags */}
            {action.tags && action.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {action.tags.map((tag) => (
                  <span key={tag} className="text-[11px] text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <Separator className="border-border/60" />

          {/* Résumé */}
          {action.summary && (
            <div className="border-l-2 border-primary/40 pl-3 py-2 bg-muted/20 rounded-r">
              <div className="flex items-center gap-1.5 mb-1.5">
                <SolarIcon icon="document-text-bold" className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Résumé</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground">{action.summary}</p>
            </div>
          )}

          {/* Description */}
          {action.description && (
            <div className="space-y-4">
              <Separator className="border-border/60" />
              <section className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:text-base prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-sm prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                <PlateEditorWrapper
                  value={action.description}
                  readOnly={true}
                  placeholder=""
                />
              </section>
            </div>
          )}

          {/* Métadonnées */}
          {(action.deadline || action.target || action.location) && (
            <>
              <Separator className="border-border/60" />
              <div className="space-y-4">
                {action.target && action.type === "petition" && (
                  <div className="flex items-start gap-3">
                    <SolarIcon icon="target-bold" className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-0.5">Cible</p>
                      <p className="text-sm text-foreground">{action.target}</p>
                    </div>
                  </div>
                )}

                {action.deadline && (
                  <div className="flex items-start gap-3">
                    <SolarIcon icon="calendar-bold" className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                        {action.type === "event" ? "Date de l'événement" : "Date limite"}
                      </p>
                      <p className="text-sm text-foreground">
                        {new Date(action.deadline).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {action.location && action.type === "event" && (
                  <div className="flex items-start gap-3">
                    <SolarIcon icon="map-point-bold" className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-0.5">Localisation</p>
                      <p className="text-sm text-foreground">
                        {action.location.city}
                        {action.location.region && `, ${action.location.region}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Section commentaires - Mobile */}
          {action._id && (
            <div className="lg:hidden">
              <Separator className="mb-6" />
              <CommentsSection targetType="action" targetId={action._id} />
            </div>
          )}
        </article>

        {/* Sidebar sticky avec participation et commentaires */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 flex flex-col max-h-[calc(100vh-5rem)] overflow-y-auto space-y-4">
            {/* Participation */}
            {isActive && (
              <div className="border-b border-border/60 pb-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      {action.type === "petition"
                        ? "Signatures"
                        : action.type === "contribution"
                        ? "Participants"
                        : "Inscrits"}
                    </p>
                    <p className="text-2xl font-bold">{action.participants || 0}</p>
                  </div>
                  {canParticipate && (
                    <Button
                      onClick={handleParticipate}
                      variant={hasParticipated?.hasParticipated ? "outline" : "default"}
                      className="w-full"
                      size="sm"
                    >
                      <SolarIcon
                        icon={
                          action.type === "petition"
                            ? "pen-new-square-bold"
                            : action.type === "contribution"
                            ? "hand-stars-bold"
                            : "calendar-mark-bold"
                        }
                        className="h-4 w-4 mr-2"
                      />
                      {hasParticipated?.hasParticipated
                        ? action.type === "petition"
                          ? "Retirer ma signature"
                          : action.type === "contribution"
                          ? "Ne plus participer"
                          : "Se désinscrire"
                        : action.type === "petition"
                        ? "Signer"
                        : action.type === "contribution"
                        ? "Participer"
                        : "S'inscrire"}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Section commentaires - Desktop */}
            {action._id && (
              <div className="pt-2 flex-1 min-h-0">
                <CommentsSection targetType="action" targetId={action._id} />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
    </>
  );
}
