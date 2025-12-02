"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Link } from "next-view-transitions";
import { useConvexAuth } from "convex/react";
import { cn } from "@/lib/utils";

interface ArticleVotesProps {
  articleId: Id<"articles">;
}

const VOTE_TYPES = [
  {
    type: "solide" as const,
    label: "Solide",
    icon: "check-circle-bold",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  {
    type: "a_revoir" as const,
    label: "À revoir",
    icon: "refresh-bold",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
  },
  {
    type: "biaise" as const,
    label: "Biaisé",
    icon: "danger-triangle-bold",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  {
    type: "non_etaye" as const,
    label: "Non étayé",
    icon: "close-circle-bold",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
];

export function ArticleVotes({ articleId }: ArticleVotesProps) {
  const { isAuthenticated } = useConvexAuth();
  const votes = useQuery(api.articleVotes.getArticleVotes, { articleId });
  const myVote = useQuery(api.articleVotes.getMyArticleVote, { articleId });
  const voteOnArticle = useMutation(api.articleVotes.voteOnArticle);
  const removeVote = useMutation(api.articleVotes.removeArticleVote);

  const handleVote = async (voteType: typeof VOTE_TYPES[number]["type"]) => {
    if (!isAuthenticated) return;

    try {
      if (myVote?.voteType === voteType) {
        // Retirer le vote si on clique sur le même
        await removeVote({ articleId });
      } else {
        // Voter ou changer de vote
        await voteOnArticle({ articleId, voteType });
      }
    } catch (error) {
      console.error("Erreur lors du vote:", error);
    }
  };

  if (!votes) {
    return null;
  }

  const { counts, total } = votes;

  return (
    <div className="border-l-2 border-primary/40 pl-3 py-3 bg-muted/20 rounded-r space-y-3">
      <div className="flex items-center gap-2">
        <SolarIcon icon="hand-stars-bold" className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Votre avis</h3>
        {total > 0 && (
          <span className="text-[11px] text-muted-foreground">
            ({total} vote{total > 1 ? "s" : ""})
          </span>
        )}
      </div>

      {isAuthenticated ? (
        <div className="flex flex-wrap gap-2">
          {VOTE_TYPES.map((voteType) => {
            const isSelected = myVote?.voteType === voteType.type;
            const count = counts[voteType.type] || 0;

            return (
              <Button
                key={voteType.type}
                variant={isSelected ? "accent" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 px-3 text-xs transition-all duration-200 shadow-none relative overflow-hidden group",
                  !isSelected && "hover:bg-muted/50 border border-border/60 hover:border-border/80 hover:scale-105 active:scale-95"
                )}
                onClick={() => handleVote(voteType.type)}
              >
                <SolarIcon
                  icon={voteType.icon}
                  className={cn(
                    "h-3.5 w-3.5 mr-1.5 transition-all duration-200",
                    isSelected 
                      ? "text-white" 
                      : `${voteType.color} group-hover:scale-110`
                  )}
                />
                <span className={cn(
                  "font-medium transition-colors",
                  isSelected ? "text-white" : "text-foreground"
                )}>
                  {voteType.label}
                </span>
                {count > 0 && (
                  <span className={cn(
                    "ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded transition-all",
                    isSelected 
                      ? "bg-white/20 text-white" 
                      : `${voteType.bgColor} ${voteType.color} group-hover:scale-110`
                  )}>
                    {count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 border border-border/60 rounded-md px-3 py-2">
          <SolarIcon icon="info-circle-bold" className="h-3.5 w-3.5 shrink-0" />
          <span>
            <Link href="/signin" className="font-medium text-foreground underline hover:no-underline transition-colors">
              Connectez-vous
            </Link>{" "}
            pour partager votre avis
          </span>
        </div>
      )}
    </div>
  );
}

