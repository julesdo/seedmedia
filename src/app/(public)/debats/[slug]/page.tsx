"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { AddArgumentDialog } from "@/components/debates/AddArgumentDialog";
import { ArgumentVotes } from "@/components/debates/ArgumentVotes";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function DebateDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated } = useConvexAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const debate = useQuery(api.debates.getDebateBySlug, { slug });
  const currentUser = useQuery(api.auth.getCurrentUser);
  const closeDebate = useMutation(api.debates.closeDebate);

  const handleArgumentAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const isEditor = currentUser?.role === "editeur";
  const isOpen = debate?.status === "open";

  // États de chargement
  if (debate === undefined) {
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

  // Débat non trouvé
  if (debate === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Alert variant="destructive">
          <SolarIcon icon="danger-triangle-bold" className="h-4 w-4" />
          <AlertDescription>
            Débat non trouvé. Il a peut-être été supprimé ou n'existe pas encore.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const argumentsFor = debate.argumentsFor || [];
  const argumentsAgainst = debate.argumentsAgainst || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <article className="space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">{debate.question}</h1>
              
              {debate.description && (
                <p className="text-lg text-muted-foreground">{debate.description}</p>
              )}

              <div className="flex items-center gap-4 flex-wrap">
                <Badge
                  variant={
                    debate.status === "closed"
                      ? "secondary"
                      : debate.polarizationScore && debate.polarizationScore >= 70
                      ? "destructive"
                      : "default"
                  }
                >
                  {debate.status === "closed" ? (
                    <>
                      <SolarIcon icon="lock-bold" className="h-4 w-4 mr-1" />
                      Fermé
                    </>
                  ) : (
                    <>
                      <SolarIcon icon="pulse-bold" className="h-4 w-4 mr-1" />
                      Polarisation: {Math.round(debate.polarizationScore || 0)}%
                    </>
                  )}
                </Badge>

                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(debate.createdAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>

                {debate.article && (
                  <Link href={`/articles/${debate.article.slug}`}>
                    <Badge variant="outline" className="cursor-pointer">
                      <SolarIcon icon="document-bold" className="h-3 w-3 mr-1" />
                      Article associé
                    </Badge>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </header>

        <Separator />

        {/* Synthèse éditoriale */}
        {debate.synthesis && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <SolarIcon icon="document-text-bold" className="h-5 w-5 text-primary" />
                Synthèse {debate.synthesisType === "editorial" ? "éditoriale" : "automatique"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{debate.synthesis}</p>
            </CardContent>
          </Card>
        )}

        {/* Arguments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Arguments POUR */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <SolarIcon icon="check-circle-bold" className="h-6 w-6 text-green-500" />
              <h2 className="text-2xl font-bold">Arguments POUR ({argumentsFor.length})</h2>
            </div>

            {argumentsFor.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Aucun argument POUR pour le moment.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {argumentsFor.map((arg: any) => (
                  <Card key={arg._id} className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base flex-1">{arg.title}</CardTitle>
                        {arg.author && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                {arg.author.name?.[0]?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            {arg.author.credibilityScore !== undefined && (
                              <Badge variant="secondary" className="text-xs">
                                <SolarIcon icon="star-bold" className="h-3 w-3 mr-1" />
                                {arg.author.credibilityScore}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {arg.content}
                      </p>

                      {/* Sources */}
                      {arg.sources && arg.sources.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Sources :</p>
                          <ul className="space-y-1">
                            {arg.sources.map((source: string, index: number) => (
                              <li key={index}>
                                <a
                                  href={source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline break-all"
                                >
                                  {source}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Votes et métadonnées */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <ArgumentVotes
                          argumentId={arg._id}
                          upvotes={arg.upvotes || 0}
                          downvotes={arg.downvotes || 0}
                        />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(arg.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {isAuthenticated && isOpen && (
              <AddArgumentDialog
                debateId={debate._id}
                position="for"
                onSuccess={handleArgumentAdded}
                trigger={
                  <Button variant="outline" className="w-full">
                    <SolarIcon icon="plus-bold" className="h-4 w-4 mr-2" />
                    Ajouter un argument POUR
                  </Button>
                }
              />
            )}
          </div>

          {/* Arguments CONTRE */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <SolarIcon icon="close-circle-bold" className="h-6 w-6 text-red-500" />
              <h2 className="text-2xl font-bold">Arguments CONTRE ({argumentsAgainst.length})</h2>
            </div>

            {argumentsAgainst.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Aucun argument CONTRE pour le moment.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {argumentsAgainst.map((arg: any) => (
                  <Card key={arg._id} className="border-l-4 border-l-red-500">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base flex-1">{arg.title}</CardTitle>
                        {arg.author && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                {arg.author.name?.[0]?.toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                            {arg.author.credibilityScore !== undefined && (
                              <Badge variant="secondary" className="text-xs">
                                <SolarIcon icon="star-bold" className="h-3 w-3 mr-1" />
                                {arg.author.credibilityScore}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {arg.content}
                      </p>

                      {/* Sources */}
                      {arg.sources && arg.sources.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">Sources :</p>
                          <ul className="space-y-1">
                            {arg.sources.map((source: string, index: number) => (
                              <li key={index}>
                                <a
                                  href={source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline break-all"
                                >
                                  {source}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Votes et métadonnées */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <ArgumentVotes
                          argumentId={arg._id}
                          upvotes={arg.upvotes || 0}
                          downvotes={arg.downvotes || 0}
                        />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(arg.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {isAuthenticated && isOpen && (
              <AddArgumentDialog
                debateId={debate._id}
                position="against"
                onSuccess={handleArgumentAdded}
                trigger={
                  <Button variant="outline" className="w-full">
                    <SolarIcon icon="plus-bold" className="h-4 w-4 mr-2" />
                    Ajouter un argument CONTRE
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {!isAuthenticated && isOpen && (
          <Alert>
            <SolarIcon icon="info-circle-bold" className="h-4 w-4" />
            <AlertDescription>
              <Link href="/signin" className="font-medium underline">
                Connectez-vous
              </Link>{" "}
              pour participer au débat en ajoutant vos arguments.
            </AlertDescription>
          </Alert>
        )}

        {!isOpen && (
          <Alert>
            <SolarIcon icon="lock-bold" className="h-4 w-4" />
            <AlertDescription>
              Ce débat est fermé. Aucun nouvel argument ne peut être ajouté.
            </AlertDescription>
          </Alert>
        )}

        {/* Bouton fermer le débat (éditeurs uniquement) */}
        {isEditor && isOpen && (
          <div className="flex justify-end">
            <CloseDebateDialog debateId={debate._id} debateSlug={debate.slug} />
          </div>
        )}
      </article>
    </div>
  );
}

function CloseDebateDialog({
  debateId,
  debateSlug,
}: {
  debateId: any;
  debateSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [synthesis, setSynthesis] = useState("");
  const [loading, setLoading] = useState(false);
  const closeDebate = useMutation(api.debates.closeDebate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      await closeDebate({
        debatId: debateId,
        synthesis: synthesis.trim() || undefined,
        synthesisType: synthesis.trim() ? "editorial" : undefined,
      });

      toast.success("Débat fermé avec succès !");
      setOpen(false);
      setSynthesis("");
    } catch (error: any) {
      console.error("Erreur lors de la fermeture du débat:", error);
      toast.error(error.message || "Erreur lors de la fermeture du débat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <SolarIcon icon="lock-bold" className="h-4 w-4 mr-2" />
          Fermer le débat
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fermer le débat</DialogTitle>
          <DialogDescription>
            Vous êtes sur le point de fermer ce débat. Vous pouvez optionnellement ajouter une
            synthèse éditoriale.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="synthesis">Synthèse éditoriale (optionnel)</Label>
            <Textarea
              id="synthesis"
              placeholder="Résumez les points clés du débat et les conclusions principales..."
              value={synthesis}
              onChange={(e) => setSynthesis(e.target.value)}
              rows={6}
            />
          </div>

          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? (
                <>
                  <SolarIcon icon="loading-bold" className="h-4 w-4 mr-2 animate-spin" />
                  Fermeture en cours...
                </>
              ) : (
                <>
                  <SolarIcon icon="lock-bold" className="h-4 w-4 mr-2" />
                  Fermer le débat
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

