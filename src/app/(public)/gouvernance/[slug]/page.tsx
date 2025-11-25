"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Author } from "@/components/articles/Author";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConvexAuth } from "convex/react";
import { PlateEditorWrapper } from "@/components/articles/PlateEditorWrapper";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { extractTextFromPlateValue } from "@/components/articles/PlateEditorWrapper";
import { CommentsSection } from "@/components/comments/CommentsSection";
import type { TElement } from "platejs";

export default function PublicProposalPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated } = useConvexAuth();

  // Récupérer la proposition par slug
  const proposal = useQuery(api.governance.getProposalBySlug, { slug });
  const currentUser = useQuery(api.users.getCurrentUser);

  // Vérifier si l'utilisateur a déjà voté
  const userVote = proposal?.votes?.find(
    (vote) => vote.userId === currentUser?._id
  );

  // Mutation pour voter
  const voteOnProposal = useMutation(api.governance.voteOnProposal);
  
  // Mutation pour fermer la proposition (éditeurs uniquement)
  const closeProposal = useMutation(api.governance.closeProposal);
  const [isClosing, setIsClosing] = useState(false);

  const handleVote = async (voteType: "for" | "against" | "abstain") => {
    if (!proposal || !currentUser) return;

    try {
      await voteOnProposal({
        proposalId: proposal._id,
        vote: voteType,
      });
    } catch (error) {
      console.error("Erreur lors du vote:", error);
    }
  };

  const handleCloseProposal = async () => {
    if (!proposal || !currentUser || currentUser.role !== "editeur") return;
    
    if (!confirm("Êtes-vous sûr de vouloir fermer cette proposition ? Le résultat sera calculé automatiquement.")) {
      return;
    }

    setIsClosing(true);
    try {
      await closeProposal({ proposalId: proposal._id });
      // La page se rafraîchira automatiquement grâce à la query
    } catch (error: any) {
      console.error("Erreur lors de la fermeture:", error);
      alert(error.message || "Erreur lors de la fermeture de la proposition");
    } finally {
      setIsClosing(false);
    }
  };

  // États de chargement
  if (proposal === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Proposition non trouvée
  if (proposal === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <SolarIcon icon="danger-triangle-bold" className="h-4 w-4" />
          <AlertDescription>
            Proposition non trouvée. Elle a peut-être été supprimée ou n'existe pas encore.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const totalVotes = (proposal.votesFor || 0) + (proposal.votesAgainst || 0) + (proposal.votesAbstain || 0);
  const forPercentage = totalVotes > 0 ? ((proposal.votesFor || 0) / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? ((proposal.votesAgainst || 0) / totalVotes) * 100 : 0;
  const abstainPercentage = totalVotes > 0 ? ((proposal.votesAbstain || 0) / totalVotes) * 100 : 0;
  
  // Calculer si le quorum est atteint
  const quorumReached = totalVotes >= proposal.quorumRequired;
  const quorumProgress = Math.min((totalVotes / proposal.quorumRequired) * 100, 100);
  
  // Calculer si la majorité est atteinte (pour les votes POUR)
  const majorityReached = quorumReached && forPercentage >= proposal.majorityRequired;
  
  // Déterminer le résultat actuel
  const currentResult = proposal.status === "open" 
    ? (quorumReached 
        ? (majorityReached ? "approved" : "rejected")
        : "pending")
    : proposal.result || null;

  const remainingTime = proposal.voteEndAt ? Math.max(0, proposal.voteEndAt - Date.now()) : null;
  const daysRemaining = remainingTime ? Math.floor(remainingTime / (1000 * 60 * 60 * 24)) : null;
  const hoursRemaining = remainingTime
    ? Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    : null;

  // Déterminer le gradient et l'icône selon le type de proposition
  const getProposalStyle = (type: string) => {
    switch (type) {
      case "editorial_rules":
        return {
          gradient: "from-blue-500/20 to-blue-600/10",
          icon: "document-text-bold",
          label: "Règles éditoriales",
        };
      case "product_evolution":
        return {
          gradient: "from-purple-500/20 to-purple-600/10",
          icon: "settings-bold",
          label: "Évolution produit",
        };
      case "ethical_charter":
        return {
          gradient: "from-green-500/20 to-green-600/10",
          icon: "shield-check-bold",
          label: "Charte éthique",
        };
      case "category_addition":
        return {
          gradient: "from-orange-500/20 to-orange-600/10",
          icon: "tag-bold",
          label: "Catégorie",
        };
      case "expert_nomination":
        return {
          gradient: "from-pink-500/20 to-pink-600/10",
          icon: "user-id-bold",
          label: "Nomination",
        };
      default:
        return {
          gradient: "from-primary/20 to-muted",
          icon: "document-text-bold",
          label: "Autre",
        };
    }
  };

  const proposalStyle = getProposalStyle(proposal.proposalType);

  // Préparer la description pour l'affichage
  const descriptionValue = proposal.description 
    ? (typeof proposal.description === "string" 
        ? proposal.description 
        : JSON.stringify(proposal.description))
    : undefined;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <article className="space-y-8">
        {/* Header avec meta */}
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{proposalStyle.label}</Badge>
                {proposal.status === "open" && (
                  <Badge variant="default">Ouverte</Badge>
                )}
                {proposal.status === "closed" && (
                  <Badge variant="secondary">Fermée</Badge>
                )}
                {daysRemaining !== null && daysRemaining > 0 && (
                  <Badge variant="secondary">
                    {daysRemaining} jour{daysRemaining > 1 ? "s" : ""} restant
                    {daysRemaining > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                {proposal.title}
              </h1>
            </div>
            {/* Bouton fermer pour les éditeurs */}
            {proposal.status === "open" && currentUser?.role === "editeur" && (
              <Button
                variant="outline"
                onClick={handleCloseProposal}
                disabled={isClosing}
                className="shrink-0"
              >
                <SolarIcon icon="lock-bold" className="h-4 w-4 mr-2" />
                {isClosing ? "Fermeture..." : "Fermer la proposition"}
              </Button>
            )}
          </div>

          {/* Métadonnées */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {proposal.proposer && (
              <Author
                author={proposal.proposer}
                variant="default"
                size="sm"
                showDate
                date={proposal.createdAt}
              />
            )}
            {proposal.voteEndAt && (
              <>
                <span>•</span>
                <span>
                  Clôture{" "}
                  {formatDistanceToNow(new Date(proposal.voteEndAt), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </span>
              </>
            )}
          </div>
        </header>

        {/* Image placeholder avec gradient */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
          <div className={`absolute inset-0 bg-gradient-to-br ${proposalStyle.gradient} flex items-center justify-center`}>
            <SolarIcon
              icon={proposalStyle.icon}
              width={96}
              height={96}
              className="text-muted-foreground"
            />
          </div>
        </div>

        <Separator />

        {/* Statistiques de vote */}
        <Card>
          <CardHeader>
            <CardTitle>Résultats du vote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <SolarIcon icon="check-circle-bold" className="h-4 w-4" />
                  <span className="font-medium">POUR</span>
                  <span className="text-muted-foreground">
                    ({proposal.votesFor || 0})
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {Math.round(forPercentage)}%
                </span>
              </div>
              <Progress value={forPercentage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <SolarIcon icon="close-circle-bold" className="h-4 w-4" />
                  <span className="font-medium">CONTRE</span>
                  <span className="text-muted-foreground">
                    ({proposal.votesAgainst || 0})
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {Math.round(againstPercentage)}%
                </span>
              </div>
              <Progress value={againstPercentage} className="h-2" />
            </div>

            {proposal.votesAbstain > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <SolarIcon icon="minus-circle-bold" className="h-4 w-4" />
                    <span className="font-medium">ABSTENTION</span>
                    <span className="text-muted-foreground">
                      ({proposal.votesAbstain || 0})
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {Math.round(abstainPercentage)}%
                  </span>
                </div>
                <Progress value={abstainPercentage} className="h-2" />
              </div>
            )}

            <Separator />

            {/* Quorum */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Quorum</span>
                <span className={quorumReached ? "text-green-600 dark:text-green-400 font-semibold" : "text-muted-foreground"}>
                  {totalVotes}/{proposal.quorumRequired} {quorumReached ? "✓" : ""}
                </span>
              </div>
              <Progress value={quorumProgress} className="h-2" />
              {!quorumReached && (
                <p className="text-xs text-muted-foreground">
                  Il manque {proposal.quorumRequired - totalVotes} vote{proposal.quorumRequired - totalVotes > 1 ? "s" : ""} pour atteindre le quorum
                </p>
              )}
            </div>

            {/* Majorité */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Majorité requise</span>
                <span className={majorityReached ? "text-green-600 dark:text-green-400 font-semibold" : "text-muted-foreground"}>
                  {proposal.majorityRequired}% {majorityReached ? "✓" : ""}
                </span>
              </div>
              {quorumReached && (
                <div className="text-xs text-muted-foreground">
                  {forPercentage >= proposal.majorityRequired ? (
                    <span className="text-green-600 dark:text-green-400">
                      Majorité atteinte ({Math.round(forPercentage)}% pour)
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">
                      Majorité non atteinte ({Math.round(forPercentage)}% pour, besoin de {proposal.majorityRequired}%)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Résultat actuel */}
            {proposal.status === "open" && quorumReached && (
              <Alert className={majorityReached ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"}>
                <SolarIcon 
                  icon={majorityReached ? "check-circle-bold" : "close-circle-bold"} 
                  className={`h-4 w-4 ${majorityReached ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} 
                />
                <AlertDescription className={majorityReached ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}>
                  {majorityReached 
                    ? "La proposition est actuellement approuvée selon les critères de vote."
                    : "La proposition est actuellement rejetée selon les critères de vote."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Actions de vote */}
        {proposal.status === "open" && isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle>Voter sur cette proposition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userVote ? (
                <Alert>
                  <SolarIcon icon="info-circle-bold" className="h-4 w-4" />
                  <AlertDescription>
                    Vous avez déjà voté{" "}
                    {userVote.vote === "for" && "POUR"}
                    {userVote.vote === "against" && "CONTRE"}
                    {userVote.vote === "abstain" && "ABSTENTION"}
                    {" "}cette proposition.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleVote("for")}
                    variant="default"
                    className="flex-1"
                  >
                    <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-2" />
                    Voter POUR
                  </Button>
                  <Button
                    onClick={() => handleVote("against")}
                    variant="destructive"
                    className="flex-1"
                  >
                    <SolarIcon icon="close-circle-bold" className="h-4 w-4 mr-2" />
                    Voter CONTRE
                  </Button>
                  <Button
                    onClick={() => handleVote("abstain")}
                    variant="outline"
                    className="flex-1"
                  >
                    <SolarIcon icon="minus-circle-bold" className="h-4 w-4 mr-2" />
                    S'abstenir
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!isAuthenticated && proposal.status === "open" && (
          <Alert>
            <SolarIcon icon="info-circle-bold" className="h-4 w-4" />
            <AlertDescription>
              <a href="/signin" className="underline">
                Connectez-vous
              </a>{" "}
              pour voter sur cette proposition.
            </AlertDescription>
          </Alert>
        )}

        {/* Description */}
        {descriptionValue && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Description</h2>
            <div className="prose prose-sm max-w-none">
              <PlateEditorWrapper
                value={descriptionValue}
                readOnly={true}
              />
            </div>
          </div>
        )}

        {/* Liste des votes */}
        {proposal.votes && proposal.votes.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">
              Votes ({proposal.votes.length})
            </h2>
            <div className="space-y-2">
              {proposal.votes.map((vote) => {
                // Adapter la structure du votant pour le composant Author
                const voterAuthor = vote.voter ? {
                  _id: vote.voter._id,
                  name: vote.voter.name || "Votant anonyme",
                  image: vote.voter.image || null,
                  email: vote.voter.email,
                  credibilityScore: vote.voter.credibilityScore,
                } : null;

                return (
                  <div
                    key={vote._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    {voterAuthor ? (
                      <Author
                        author={voterAuthor}
                        variant="detailed"
                        size="md"
                        showCredibility
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-sm">Votant anonyme</p>
                        </div>
                      </div>
                    )}
                    <Badge
                      variant={
                        vote.vote === "for"
                          ? "default"
                          : vote.vote === "against"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {vote.vote === "for" && (
                        <>
                          <SolarIcon
                            icon="check-circle-bold"
                            className="h-3 w-3 mr-1"
                          />
                          POUR
                        </>
                      )}
                      {vote.vote === "against" && (
                        <>
                          <SolarIcon
                            icon="close-circle-bold"
                            className="h-3 w-3 mr-1"
                          />
                          CONTRE
                        </>
                      )}
                      {vote.vote === "abstain" && (
                        <>
                          <SolarIcon
                            icon="minus-circle-bold"
                            className="h-3 w-3 mr-1"
                          />
                          ABSTENTION
                        </>
                      )}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section commentaires (arguments) */}
        <div className="mt-12">
          <CommentsSection
            targetType="proposal"
            targetId={proposal._id}
          />
        </div>
      </article>
    </div>
  );
}

