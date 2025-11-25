"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PlateEditorWrapper } from "@/components/articles/PlateEditorWrapper";
import { Link } from "next-view-transitions";
import { toast } from "sonner";
import { Author } from "@/components/articles/Author";
import { Separator } from "@/components/ui/separator";

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

  const action = useQuery(api.actions.getActionBySlug, { slug });
  const hasParticipated = useQuery(api.actions.hasUserParticipated, action ? { actionId: action._id } : "skip");
  const participate = useMutation(api.actions.participateInAction);

  const handleParticipate = async () => {
    if (!action) return;

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
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 max-w-4xl">
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (action === null) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 max-w-4xl">
          <Alert variant="destructive">
            <SolarIcon icon="danger-triangle-bold" className="h-4 w-4" />
            <AlertDescription>Action non trouvée</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const isActive = action.status === "active";
  const canParticipate = isActive && hasParticipated !== undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{ACTION_TYPE_LABELS[action.type]}</Badge>
            <Badge
              variant={action.status === "active" ? "default" : action.status === "completed" ? "secondary" : "destructive"}
            >
              {STATUS_LABELS[action.status]}
            </Badge>
            {action.featured && (
              <Badge variant="outline">
                <SolarIcon icon="star-bold" className="h-3 w-3 mr-1" />
                En vedette
              </Badge>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gradient-light">{action.title}</h1>
          <p className="text-lg text-muted-foreground">{action.summary}</p>

          {/* Auteur et organisation */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {action.author && (
              <Author
                author={action.author}
                variant="compact"
                size="sm"
              />
            )}
            {action.organization && (
              <>
                <span>•</span>
                <Link
                  href={`/organizations/${action.organization.slug}`}
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  {action.organization.logo && (
                    <img src={action.organization.logo} alt={action.organization.name} className="h-5 w-5 rounded" />
                  )}
                  {action.organization.name}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* CTA Participation */}
        {isActive && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    {action.type === "petition"
                      ? "Signez cette pétition"
                      : action.type === "contribution"
                      ? "Participez à cette contribution"
                      : "Inscrivez-vous à cet événement"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {action.participants} personne{action.participants > 1 ? "s" : ""} déjà{" "}
                    {action.type === "petition"
                      ? "ont signé"
                      : action.type === "contribution"
                      ? "participent"
                      : "inscrites"}
                  </p>
                </div>
                {canParticipate && (
                  <Button
                    onClick={handleParticipate}
                    variant={hasParticipated?.hasParticipated ? "outline" : "default"}
                    size="lg"
                  >
                    <SolarIcon
                      icon={
                        action.type === "petition"
                          ? "pen-new-square-bold"
                          : action.type === "contribution"
                          ? "hand-stars-bold"
                          : "calendar-mark-bold"
                      }
                      className="h-5 w-5 mr-2"
                    />
                    {hasParticipated?.hasParticipated
                      ? action.type === "petition"
                        ? "Retirer ma signature"
                        : action.type === "contribution"
                        ? "Ne plus participer"
                        : "Se désinscrire"
                      : action.type === "petition"
                      ? "Signer la pétition"
                      : action.type === "contribution"
                      ? "Participer"
                      : "S'inscrire"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Métadonnées */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {action.target && action.type === "petition" && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <SolarIcon icon="target-bold" className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Cible</p>
                    <p className="font-medium">{action.target}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {action.deadline && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <SolarIcon icon="calendar-bold" className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {action.type === "event" ? "Date de l'événement" : "Date limite"}
                    </p>
                    <p className="font-medium">
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
              </CardContent>
            </Card>
          )}

          {action.location && action.type === "event" && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <SolarIcon icon="map-point-bold" className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Localisation</p>
                    <p className="font-medium">
                      {action.location.city}
                      {action.location.region && `, ${action.location.region}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <PlateEditorWrapper value={action.description} onChange={() => {}} readOnly />
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        {action.tags.length > 0 && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-2">
                {action.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Participants */}
        {action.participants > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SolarIcon icon="users-group-two-rounded-bold" className="h-5 w-5" />
                Participants ({action.participants})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {action.participants} personne{action.participants > 1 ? "s" : ""}{" "}
                {action.type === "petition"
                  ? "ont signé cette pétition"
                  : action.type === "contribution"
                  ? "participent à cette contribution"
                  : "sont inscrites à cet événement"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

