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
import { CommentsSection } from "@/components/comments/CommentsSection";
import { Link } from "next-view-transitions";

const PROPOSAL_TYPE_LABELS = {
  editorial_rules: "Règles éditoriales",
  product_evolution: "Évolution produit",
  ethical_charter: "Charte éthique",
  category_addition: "Catégorie",
  expert_nomination: "Nomination",
  other: "Autre",
} as const;

const STATUS_LABELS = {
  draft: "Brouillon",
  open: "Ouverte",
  closed: "Fermée",
  approved: "Approuvée",
  rejected: "Rejetée",
} as const;

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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
  
  const remainingTime = proposal.voteEndAt ? Math.max(0, proposal.voteEndAt - Date.now()) : null;
  const daysRemaining = remainingTime ? Math.floor(remainingTime / (1000 * 60 * 60 * 24)) : null;

  const isOpen = proposal.status === "open";
  const isEditor = currentUser?.role === "editeur";

  // Préparer la description pour l'affichage
  const descriptionValue = proposal.description 
    ? (typeof proposal.description === "string" 
        ? proposal.description 
        : JSON.stringify(proposal.description))
    : undefined;

  return (
    <div className="container mx-auto px-4 py-4 md:py-6 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <article className="space-y-6 min-w-0">
          {/* Header avec meta */}
          <header className="space-y-4">
            {/* Type et statut */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[11px] font-semibold px-2 py-0.5">
                  {PROPOSAL_TYPE_LABELS[proposal.proposalType] || "Autre"}
                </Badge>
                <Badge
                  variant={
                    proposal.status === "open"
                      ? "default"
                      : proposal.status === "closed"
                      ? "secondary"
                      : proposal.status === "approved"
                      ? "default"
                      : "destructive"
                  }
                  className="text-[11px] font-semibold px-2 py-0.5"
                >
                  {STATUS_LABELS[proposal.status]}
                </Badge>
                {daysRemaining !== null && daysRemaining > 0 && isOpen && (
                  <Badge variant="outline" className="text-[11px] font-semibold px-2 py-0.5">
                    {daysRemaining} jour{daysRemaining > 1 ? "s" : ""} restant{daysRemaining > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              
              {/* Métriques */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <SolarIcon icon="vote-bold" className="h-3 w-3" />
                  <span className="font-medium">{totalVotes}</span>
                </div>
              </div>
            </div>

            {/* Titre */}
            <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight">
              {proposal.title}
            </h1>
                
            {/* Meta auteur et date */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {proposal.proposer && (
                <Author
                  author={proposal.proposer}
                  variant="detailed"
                  showCredibility={false}
                  size="sm"
                  linkToProfile={true}
                />
              )}
              
              <span className="text-muted-foreground">•</span>
              
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(proposal.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>

              {proposal.voteEndAt && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
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

          <Separator className="border-border/60" />

          {/* Description */}
          {descriptionValue && (
            <div className="space-y-4">
              <section className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:text-base prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-sm prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                <PlateEditorWrapper
                  value={descriptionValue}
                  readOnly={true}
                  placeholder=""
                />
              </section>
            </div>
          )}

          {/* Liste des votes */}
          {proposal.votes && proposal.votes.length > 0 && (
            <>
              <Separator className="border-border/60" />
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1.5 border-b border-border/60">
                  <SolarIcon icon="vote-bold" className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold">
                    Votes ({proposal.votes.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {proposal.votes.map((vote) => {
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
                        className="flex items-center justify-between py-2 border-b border-border/60 last:border-0"
                      >
                        {voterAuthor ? (
                          <Author
                            author={voterAuthor}
                            variant="detailed"
                            size="sm"
                            showCredibility
                            linkToProfile={true}
                          />
                        ) : (
                          <div className="flex items-center gap-3">
                            <p className="font-medium text-sm">Votant anonyme</p>
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
                          className="text-[11px] font-semibold px-2 py-0.5"
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
            </>
          )}

          {/* Section commentaires - Mobile */}
          {proposal._id && (
            <div className="lg:hidden">
              <Separator className="mb-6" />
              <CommentsSection targetType="proposal" targetId={proposal._id} />
            </div>
          )}
        </article>

        {/* Sidebar sticky avec statistiques, vote et commentaires */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 flex flex-col max-h-[calc(100vh-5rem)] overflow-y-auto space-y-4">
            {/* Statistiques de vote */}
            <div className="border-b border-border/60 pb-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3">Résultats du vote</p>
              <div className="space-y-4">
                {/* POUR */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                      <SolarIcon icon="check-circle-bold" className="h-3 w-3" />
                      <span className="font-medium">POUR</span>
                      <span className="text-muted-foreground">({proposal.votesFor || 0})</span>
                    </div>
                    <span className="text-muted-foreground font-medium">
                      {Math.round(forPercentage)}%
                    </span>
                  </div>
                  <Progress value={forPercentage} className="h-1.5" />
                </div>

                {/* CONTRE */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <SolarIcon icon="close-circle-bold" className="h-3 w-3" />
                      <span className="font-medium">CONTRE</span>
                      <span className="text-muted-foreground">({proposal.votesAgainst || 0})</span>
                    </div>
                    <span className="text-muted-foreground font-medium">
                      {Math.round(againstPercentage)}%
                    </span>
                  </div>
                  <Progress value={againstPercentage} className="h-1.5" />
                </div>

                {/* ABSTENTION */}
                {proposal.votesAbstain > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <SolarIcon icon="minus-circle-bold" className="h-3 w-3" />
                        <span className="font-medium">ABSTENTION</span>
                        <span className="text-muted-foreground">({proposal.votesAbstain || 0})</span>
                      </div>
                      <span className="text-muted-foreground font-medium">
                        {Math.round(abstainPercentage)}%
                      </span>
                    </div>
                    <Progress value={abstainPercentage} className="h-1.5" />
                  </div>
                )}

                <Separator className="my-3" />

                {/* Quorum */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Quorum</span>
                    <span className={quorumReached ? "text-green-600 dark:text-green-400 font-semibold" : "font-medium"}>
                      {totalVotes}/{proposal.quorumRequired} {quorumReached ? "✓" : ""}
                    </span>
                  </div>
                  <Progress value={quorumProgress} className="h-1.5" />
                  {!quorumReached && (
                    <p className="text-[10px] text-muted-foreground">
                      Il manque {proposal.quorumRequired - totalVotes} vote{proposal.quorumRequired - totalVotes > 1 ? "s" : ""} pour atteindre le quorum
                    </p>
                  )}
                </div>

                {/* Majorité */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Majorité requise</span>
                    <span className={majorityReached ? "text-green-600 dark:text-green-400 font-semibold" : "font-medium"}>
                      {proposal.majorityRequired}% {majorityReached ? "✓" : ""}
                    </span>
                  </div>
                  {quorumReached && (
                    <p className="text-[10px] text-muted-foreground">
                      {forPercentage >= proposal.majorityRequired ? (
                        <span className="text-green-600 dark:text-green-400">
                          Majorité atteinte ({Math.round(forPercentage)}% pour)
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">
                          Majorité non atteinte ({Math.round(forPercentage)}% pour)
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Résultat actuel */}
                {isOpen && quorumReached && (
                  <Alert className={majorityReached ? "border-green-500 bg-green-500/10" : "border-red-500 bg-red-500/10"} variant="default">
                    <SolarIcon 
                      icon={majorityReached ? "check-circle-bold" : "close-circle-bold"} 
                      className={`h-3 w-3 ${majorityReached ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`} 
                    />
                    <AlertDescription className={`text-[11px] ${majorityReached ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                      {majorityReached 
                        ? "Proposition approuvée selon les critères."
                        : "Proposition rejetée selon les critères."}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Actions de vote */}
            {isOpen && (
              <div className="border-b border-border/60 pb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3">Voter</p>
                {isAuthenticated ? (
                  userVote ? (
                    <Alert variant="default">
                      <SolarIcon icon="info-circle-bold" className="h-3 w-3" />
                      <AlertDescription className="text-[11px]">
                        Vous avez voté{" "}
                        {userVote.vote === "for" && "POUR"}
                        {userVote.vote === "against" && "CONTRE"}
                        {userVote.vote === "abstain" && "ABSTENTION"}
                        {" "}cette proposition.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleVote("for")}
                        variant="default"
                        className="w-full text-xs h-8"
                        size="sm"
                      >
                        <SolarIcon icon="check-circle-bold" className="h-3 w-3 mr-2" />
                        Voter POUR
                      </Button>
                      <Button
                        onClick={() => handleVote("against")}
                        variant="destructive"
                        className="w-full text-xs h-8"
                        size="sm"
                      >
                        <SolarIcon icon="close-circle-bold" className="h-3 w-3 mr-2" />
                        Voter CONTRE
                      </Button>
                      <Button
                        onClick={() => handleVote("abstain")}
                        variant="outline"
                        className="w-full text-xs h-8"
                        size="sm"
                      >
                        <SolarIcon icon="minus-circle-bold" className="h-3 w-3 mr-2" />
                        S'abstenir
                      </Button>
                    </div>
                  )
                ) : (
                  <Alert variant="default">
                    <SolarIcon icon="info-circle-bold" className="h-3 w-3" />
                    <AlertDescription className="text-[11px]">
                      <Link href="/signin" className="underline">
                        Connectez-vous
                      </Link>{" "}
                      pour voter.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Bouton fermer pour les éditeurs */}
            {isOpen && isEditor && (
              <div className="border-b border-border/60 pb-4">
                <Button
                  variant="outline"
                  onClick={handleCloseProposal}
                  disabled={isClosing}
                  className="w-full text-xs h-8"
                  size="sm"
                >
                  <SolarIcon icon="lock-bold" className="h-3 w-3 mr-2" />
                  {isClosing ? "Fermeture..." : "Fermer la proposition"}
                </Button>
              </div>
            )}

            {/* Section commentaires - Desktop */}
            {proposal._id && (
              <div className="pt-2 flex-1 min-h-0">
                <CommentsSection targetType="proposal" targetId={proposal._id} />
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Alerts et bouton fermer - Mobile */}
      {isOpen && !isAuthenticated && (
        <div className="lg:hidden mt-6">
          <Alert>
            <SolarIcon icon="info-circle-bold" className="h-4 w-4" />
            <AlertDescription>
              <Link href="/signin" className="underline">
                Connectez-vous
              </Link>{" "}
              pour voter sur cette proposition.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {isOpen && isEditor && (
        <div className="lg:hidden mt-6">
          <Button
            variant="outline"
            onClick={handleCloseProposal}
            disabled={isClosing}
            className="w-full"
          >
            <SolarIcon icon="lock-bold" className="h-4 w-4 mr-2" />
            {isClosing ? "Fermeture..." : "Fermer la proposition"}
          </Button>
        </div>
      )}
    </div>
  );
}
