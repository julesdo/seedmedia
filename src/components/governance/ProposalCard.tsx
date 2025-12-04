"use client";

import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const PROPOSAL_TYPE_LABELS = {
  editorial_rules: { label: "Règles éditoriales", icon: "document-text-bold", color: "from-blue-500/20 to-blue-600/10" },
  product_evolution: { label: "Évolution du produit", icon: "settings-bold", color: "from-purple-500/20 to-purple-600/10" },
  ethical_charter: { label: "Charte éthique", icon: "shield-check-bold", color: "from-green-500/20 to-green-600/10" },
  category_addition: { label: "Ajout de catégories", icon: "tag-bold", color: "from-orange-500/20 to-orange-600/10" },
  expert_nomination: { label: "Nomination d'experts", icon: "user-id-bold", color: "from-pink-500/20 to-pink-600/10" },
  other: { label: "Autre", icon: "document-text-bold", color: "from-primary/20 to-muted" },
} as const;

interface ProposalCardProps {
  proposal: {
    _id: string;
    slug: string;
    title: string;
    description?: string | null;
    proposalType: "editorial_rules" | "product_evolution" | "ethical_charter" | "category_addition" | "expert_nomination" | "other";
    status: "draft" | "open" | "closed" | "approved" | "rejected";
    votesFor: number;
    votesAgainst: number;
    votesAbstain: number;
    totalVotes: number;
    quorumRequired: number;
    majorityRequired: number;
    voteStartAt?: number | null;
    voteEndAt?: number | null;
    proposer?: {
      _id: string;
      name?: string | null;
      image?: string | null;
    } | null;
    createdAt: number;
  };
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  const remainingTime = proposal.voteEndAt ? Math.max(0, proposal.voteEndAt - Date.now()) : null;
  const daysRemaining = remainingTime ? Math.floor(remainingTime / (1000 * 60 * 60 * 24)) : null;
  const hoursRemaining = remainingTime ? Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : null;
  
  const quorumProgress = proposal.quorumRequired > 0 
    ? Math.min(100, (totalVotes / proposal.quorumRequired) * 100)
    : 0;
  
  const approvalRate = totalVotes > 0 
    ? (proposal.votesFor / totalVotes) * 100 
    : 0;
  
  const isUrgent = daysRemaining !== null && daysRemaining <= 3;
  const isEndingSoon = daysRemaining !== null && daysRemaining <= 7;

  const proposalStyle = PROPOSAL_TYPE_LABELS[proposal.proposalType] || PROPOSAL_TYPE_LABELS.other;

  return (
    <Link href={`/gouvernance/${proposal.slug}`}>
      <article className="group cursor-pointer">
        {/* Image avec gradient selon le type */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg mb-4 bg-muted border border-border/60">
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br flex items-center justify-center",
            proposalStyle.color
          )}>
            <SolarIcon 
              icon={proposalStyle.icon as any} 
              className="h-16 w-16 text-muted-foreground opacity-50" 
            />
          </div>
          
          {/* Badge de statut et urgence */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
            <Badge 
              variant={proposal.status === "open" ? "default" : "secondary"}
              className="text-[10px] px-2 py-0.5 h-5 backdrop-blur-sm"
            >
              {proposal.status === "open" && "Vote ouvert"}
              {proposal.status === "closed" && "Vote fermé"}
              {proposal.status === "approved" && "Approuvée"}
              {proposal.status === "rejected" && "Rejetée"}
            </Badge>
            {isUrgent && proposal.status === "open" && (
              <Badge variant="destructive" className="text-[10px] px-2 py-0.5 h-5 backdrop-blur-sm">
                <SolarIcon icon="clock-circle-bold" className="h-2.5 w-2.5 mr-1" />
                Urgent
              </Badge>
            )}
            {isEndingSoon && !isUrgent && proposal.status === "open" && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 backdrop-blur-sm border-orange-500/50 text-orange-600 dark:text-orange-400">
                <SolarIcon icon="clock-circle-bold" className="h-2.5 w-2.5 mr-1" />
                Bientôt
              </Badge>
            )}
          </div>

          {/* Type de proposition */}
          <div className="absolute bottom-3 right-3 z-10">
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5 backdrop-blur-sm">
              {proposalStyle.label}
            </Badge>
          </div>
        </div>

        {/* Contenu */}
        <div className="space-y-2.5">
          {/* Métadonnées */}
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            {proposal.proposer && (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={proposal.proposer.image || undefined} />
                  <AvatarFallback className="text-[10px]">
                    {proposal.proposer.name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span>{proposal.proposer.name || "Auteur"}</span>
              </div>
            )}
            {proposal.proposer && <span>•</span>}
            <span>
              {formatDistanceToNow(new Date(proposal.createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>

          {/* Titre */}
          <h3 className="text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
            {proposal.title}
          </h3>

          {/* Statistiques de vote */}
          {proposal.status === "open" && (
            <div className="space-y-2 pt-1">
              {/* Barre de progression du quorum */}
              {proposal.quorumRequired > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Quorum: {totalVotes} / {proposal.quorumRequired}</span>
                    <span>{Math.round(quorumProgress)}%</span>
                  </div>
                  <Progress value={quorumProgress} className="h-1.5" />
                </div>
              )}

              {/* Votes pour/contre */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <SolarIcon icon="check-circle-bold" className="h-3.5 w-3.5" />
                  <span className="font-semibold">{proposal.votesFor}</span>
                </div>
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <SolarIcon icon="close-circle-bold" className="h-3.5 w-3.5" />
                  <span className="font-semibold">{proposal.votesAgainst}</span>
                </div>
                {proposal.votesAbstain > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <SolarIcon icon="minus-circle-bold" className="h-3.5 w-3.5" />
                    <span>{proposal.votesAbstain}</span>
                  </div>
                )}
                {totalVotes > 0 && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground text-[10px]">
                      {Math.round(approvalRate)}% pour
                    </span>
                  </>
                )}
              </div>

              {/* Temps restant */}
              {daysRemaining !== null && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <SolarIcon icon="calendar-bold" className="h-3 w-3" />
                  <span>
                    {daysRemaining > 0 
                      ? `${daysRemaining}j${hoursRemaining && hoursRemaining > 0 ? ` ${hoursRemaining}h` : ""} restant${daysRemaining > 1 ? "s" : ""}`
                      : "Vote terminé"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Résultat si fermé */}
          {proposal.status !== "open" && totalVotes > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <Badge 
                variant={proposal.status === "approved" ? "default" : "destructive"}
                className="text-[10px] px-1.5 py-0.5 h-5"
              >
                {proposal.status === "approved" && "✓ Approuvée"}
                {proposal.status === "rejected" && "✗ Rejetée"}
                {proposal.status === "closed" && "Fermée"}
              </Badge>
              <span className="text-muted-foreground">
                {totalVotes} vote{totalVotes > 1 ? "s" : ""} • {Math.round(approvalRate)}% pour
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

