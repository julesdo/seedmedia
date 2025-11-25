"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Link } from "next-view-transitions";
import { useConvexAuth } from "convex/react";

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
    <div className="border-l-4 border-primary/50 pl-4 py-4 bg-gradient-to-r from-primary/10 to-transparent rounded-r space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/20">
          <SolarIcon icon="hand-stars-bold" className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-base">Votre avis</h3>
          {total > 0 && (
            <p className="text-xs text-muted-foreground">
              {total} vote{total > 1 ? "s" : ""} au total
            </p>
          )}
        </div>
      </div>

      {isAuthenticated ? (
        <>
          {/* Boutons de vote */}
          <div className="grid grid-cols-2 gap-2">
            {VOTE_TYPES.map((voteType) => {
              const isSelected = myVote?.voteType === voteType.type;
              const count = counts[voteType.type] || 0;
              const percentage = total > 0 ? (count / total) * 100 : 0;

              return (
                <Button
                  key={voteType.type}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={`flex flex-col items-center gap-1.5 h-auto py-2.5 transition-all ${
                    isSelected ? `${voteType.bgColor} ${voteType.borderColor} border-2` : ""
                  } hover:scale-105 active:scale-95`}
                  onClick={() => handleVote(voteType.type)}
                >
                  <SolarIcon
                    icon={voteType.icon}
                    className={`h-4 w-4 ${isSelected ? voteType.color : "text-muted-foreground"}`}
                  />
                  <span className={`text-xs font-semibold ${isSelected ? "" : "text-muted-foreground"}`}>
                    {voteType.label}
                  </span>
                  {count > 0 && (
                    <span className={`text-[10px] ${isSelected ? "text-foreground/70" : "text-muted-foreground"}`}>
                      {count}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Graphique des résultats */}
          {total > 0 && (
            <div className="space-y-2 pt-3 border-t border-border/50">
              {VOTE_TYPES.map((voteType) => {
                const count = counts[voteType.type] || 0;
                const percentage = total > 0 ? (count / total) * 100 : 0;

                if (count === 0) return null;

                return (
                  <div key={voteType.type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <SolarIcon
                          icon={voteType.icon}
                          className={`h-3.5 w-3.5 ${voteType.color}`}
                        />
                        <span className="font-medium">{voteType.label}</span>
                      </div>
                      <span className="text-muted-foreground font-medium">
                        {count} ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <Alert className="py-2">
          <SolarIcon icon="info-circle-bold" className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <Link href="/signin" className="font-medium underline">
              Connectez-vous
            </Link>{" "}
            pour voter sur cet article.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

