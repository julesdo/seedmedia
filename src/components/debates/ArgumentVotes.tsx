"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useConvexAuth } from "convex/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ArgumentVotesProps {
  argumentId: Id<"debatArguments">;
  upvotes: number;
  downvotes: number;
  className?: string;
}

export function ArgumentVotes({
  argumentId,
  upvotes,
  downvotes,
  className,
}: ArgumentVotesProps) {
  const { isAuthenticated } = useConvexAuth();
  const voteArgument = useMutation(api.debates.voteDebatArgument);

  const handleVote = async (vote: "up" | "down") => {
    if (!isAuthenticated) {
      toast.error("Vous devez être connecté pour voter");
      return;
    }

    try {
      await voteArgument({
        argumentId,
        vote,
      });
      toast.success("Vote enregistré !");
    } catch (error: any) {
      console.error("Erreur lors du vote:", error);
      toast.error(error.message || "Erreur lors du vote");
    }
  };

  const totalVotes = upvotes + downvotes;
  const upvotePercent = totalVotes > 0 ? Math.round((upvotes / totalVotes) * 100) : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote("up")}
          disabled={!isAuthenticated}
          className="h-8 px-2"
        >
          <SolarIcon icon="arrow-up-bold" className="h-4 w-4 text-green-500" />
        </Button>
        <span className="text-sm font-medium min-w-[2ch] text-center">{upvotes}</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote("down")}
          disabled={!isAuthenticated}
          className="h-8 px-2"
        >
          <SolarIcon icon="arrow-down-bold" className="h-4 w-4 text-red-500" />
        </Button>
        <span className="text-sm font-medium min-w-[2ch] text-center">{downvotes}</span>
      </div>

      {totalVotes > 0 && (
        <Badge variant="secondary" className="text-xs">
          {upvotePercent}% favorable
        </Badge>
      )}
    </div>
  );
}

