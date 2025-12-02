"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
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
    <div className="container mx-auto px-4 py-4 md:py-6 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <article className="space-y-6 min-w-0">
        {/* Header */}
        <header className="space-y-4">
          {/* Status et métriques */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  debate.status === "closed"
                    ? "secondary"
                    : debate.polarizationScore && debate.polarizationScore >= 70
                    ? "destructive"
                    : "default"
                }
                className="text-[11px] font-semibold px-2 py-0.5"
              >
                {debate.status === "closed" ? (
                  <>
                    <SolarIcon icon="lock-bold" className="h-3 w-3 mr-1" />
                    Fermé
                  </>
                ) : (
                  <>
                    <SolarIcon icon="pulse-bold" className="h-3 w-3 mr-1" />
                    Polarisation: {Math.round(debate.polarizationScore || 0)}%
                  </>
                )}
              </Badge>

              {debate.article && (
                <Link href={`/articles/${debate.article.slug}`}>
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    <SolarIcon icon="document-bold" className="h-3 w-3 shrink-0" />
                    Article associé
                  </span>
                </Link>
              )}
            </div>
            
            {/* Métriques */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <SolarIcon icon="chat-round-bold" className="h-3 w-3" />
                <span className="font-medium">{argumentsFor.length + argumentsAgainst.length}</span>
              </div>
            </div>
          </div>

          {/* Question */}
          <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight">
            {debate.question}
          </h1>
              
          {/* Description et date */}
          {debate.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{debate.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(debate.createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
        </header>

        <Separator className="border-border/60" />

        {/* Synthèse éditoriale */}
        {debate.synthesis && (
          <div className="border-l-2 border-primary/40 pl-3 py-2 bg-muted/20 rounded-r">
            <div className="flex items-center gap-1.5 mb-1.5">
              <SolarIcon icon="document-text-bold" className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Synthèse {debate.synthesisType === "editorial" ? "éditoriale" : "automatique"}
              </span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{debate.synthesis}</p>
          </div>
        )}

        {/* Arguments */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Arguments POUR */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1.5 border-b border-border/60">
              <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-green-500" />
              <h2 className="text-lg font-semibold">Arguments POUR ({argumentsFor.length})</h2>
            </div>

            {argumentsFor.length === 0 ? (
              <div className="border border-border/60 rounded-lg bg-muted/20 p-6 text-center text-muted-foreground">
                <p className="text-xs">Aucun argument POUR pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {argumentsFor.map((arg: any) => (
                  <div key={arg._id} className="border-l-2 border-green-500/40 pl-3 py-2.5 bg-muted/20 rounded-r">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold flex-1">{arg.title}</h3>
                      {arg.author && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px]">
                              {arg.author.name?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          {arg.author.credibilityScore !== undefined && (
                            <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                              <SolarIcon icon="star-bold" className="h-3 w-3 mr-0.5" />
                              {arg.author.credibilityScore}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mb-2">
                      {arg.content}
                    </p>

                    {/* Sources */}
                    {arg.sources && arg.sources.length > 0 && (
                      <div className="space-y-1 mb-2">
                        <p className="text-[11px] font-medium text-muted-foreground">Sources :</p>
                        <ul className="space-y-0.5">
                          {arg.sources.map((source: string, index: number) => (
                            <li key={index}>
                              <a
                                href={source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-primary hover:underline break-all"
                              >
                                {source}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Votes et métadonnées */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
                      <ArgumentVotes
                        argumentId={arg._id}
                        upvotes={arg.upvotes || 0}
                        downvotes={arg.downvotes || 0}
                      />
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(arg.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isAuthenticated && isOpen && (
              <AddArgumentDialog
                debateId={debate._id}
                position="for"
                onSuccess={handleArgumentAdded}
                trigger={
                  <Button variant="default" size="sm" className="w-full h-8 text-xs shadow-none">
                    <SolarIcon icon="plus-bold" className="h-3.5 w-3.5 mr-1.5" />
                    Ajouter un argument POUR
                  </Button>
                }
              />
            )}
          </div>

          {/* Arguments CONTRE */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1.5 border-b border-border/60">
              <SolarIcon icon="close-circle-bold" className="h-4 w-4 text-red-500" />
              <h2 className="text-lg font-semibold">Arguments CONTRE ({argumentsAgainst.length})</h2>
            </div>

            {argumentsAgainst.length === 0 ? (
              <div className="border border-border/60 rounded-lg bg-muted/20 p-6 text-center text-muted-foreground">
                <p className="text-xs">Aucun argument CONTRE pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {argumentsAgainst.map((arg: any) => (
                  <div key={arg._id} className="border-l-2 border-red-500/40 pl-3 py-2.5 bg-muted/20 rounded-r">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold flex-1">{arg.title}</h3>
                      {arg.author && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px]">
                              {arg.author.name?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          {arg.author.credibilityScore !== undefined && (
                            <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                              <SolarIcon icon="star-bold" className="h-3 w-3 mr-0.5" />
                              {arg.author.credibilityScore}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mb-2">
                      {arg.content}
                    </p>

                    {/* Sources */}
                    {arg.sources && arg.sources.length > 0 && (
                      <div className="space-y-1 mb-2">
                        <p className="text-[11px] font-medium text-muted-foreground">Sources :</p>
                        <ul className="space-y-0.5">
                          {arg.sources.map((source: string, index: number) => (
                            <li key={index}>
                              <a
                                href={source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-primary hover:underline break-all"
                              >
                                {source}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Votes et métadonnées */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
                      <ArgumentVotes
                        argumentId={arg._id}
                        upvotes={arg.upvotes || 0}
                        downvotes={arg.downvotes || 0}
                      />
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(arg.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isAuthenticated && isOpen && (
              <AddArgumentDialog
                debateId={debate._id}
                position="against"
                onSuccess={handleArgumentAdded}
                trigger={
                  <Button variant="default" size="sm" className="w-full h-8 text-xs shadow-none">
                    <SolarIcon icon="plus-bold" className="h-3.5 w-3.5 mr-1.5" />
                    Ajouter un argument CONTRE
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {/* Mobile: Alerts et actions */}
        {!isAuthenticated && isOpen && (
          <div className="lg:hidden">
            <Separator className="mb-4" />
            <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <SolarIcon icon="info-circle-bold" className="h-3.5 w-3.5 shrink-0" />
                <span>
                  <Link href="/signin" className="font-medium text-foreground underline hover:no-underline">
                    Connectez-vous
                  </Link>{" "}
                  pour participer au débat
                </span>
              </div>
            </div>
          </div>
        )}

        {!isOpen && (
          <div className="lg:hidden">
            <Separator className="mb-4" />
            <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <SolarIcon icon="lock-bold" className="h-3.5 w-3.5 shrink-0" />
                <span>Ce débat est fermé. Aucun nouvel argument ne peut être ajouté.</span>
              </div>
            </div>
          </div>
        )}

        </article>

        {/* Sidebar sticky */}
        {debate._id && (
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              {/* Alerts */}
              {!isAuthenticated && isOpen && (
                <div className="border-l-2 border-primary/40 pl-3 py-2.5 bg-muted/20 rounded-r">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <SolarIcon icon="info-circle-bold" className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      <Link href="/signin" className="font-medium text-foreground underline hover:no-underline">
                        Connectez-vous
                      </Link>{" "}
                      pour participer
                    </span>
                  </div>
                </div>
              )}

              {!isOpen && (
                <div className="border-l-2 border-primary/40 pl-3 py-2.5 bg-muted/20 rounded-r">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <SolarIcon icon="lock-bold" className="h-3.5 w-3.5 shrink-0" />
                    <span>Débat fermé</span>
                  </div>
                </div>
              )}

              {/* Bouton fermer le débat (éditeurs uniquement) */}
              {isEditor && isOpen && (
                <CloseDebateDialog debateId={debate._id} debateSlug={debate.slug} />
              )}
            </div>
          </aside>
        )}
      </div>
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

