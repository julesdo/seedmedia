"use client";

import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Id } from "../../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrganizationActionsProps {
  organizationId: Id<"organizations">;
  isMember?: boolean;
  canEdit?: boolean;
  onEdit?: () => void;
}

export function OrganizationActions({
  organizationId,
  isMember,
  canEdit,
  onEdit,
}: OrganizationActionsProps) {
  const [isPending, setIsPending] = useState(false);
  const [optimisticFollowing, setOptimisticFollowing] = useState<boolean | null>(null);

  const isFollowing = useQuery(api.follows.isFollowing, {
    targetType: "organization",
    targetId: organizationId,
  });

  const toggleFollow = useMutation(api.follows.toggleFollow);

  const handleFollow = async () => {
    if (isPending || isFollowing === undefined) return;

    setIsPending(true);
    const currentFollowing = optimisticFollowing ?? isFollowing;
    setOptimisticFollowing(!currentFollowing);

    try {
      const result = await toggleFollow({
        targetType: "organization",
        targetId: organizationId,
      });
      setOptimisticFollowing(null); // Reset optimistic update
      toast.success(
        result.following
          ? "Vous suivez maintenant cette organisation"
          : "Vous ne suivez plus cette organisation"
      );
    } catch (error: any) {
      setOptimisticFollowing(null); // Reset on error
      toast.error(error.message || "Erreur lors de la modification du suivi");
    } finally {
      setIsPending(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Découvrez cette organisation",
          url,
        });
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== "AbortError") {
          // Fallback to clipboard
          await navigator.clipboard.writeText(url);
          toast.success("Lien copié dans le presse-papiers");
        }
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papiers");
    }
  };

  const following = optimisticFollowing ?? isFollowing ?? false;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isMember && (
        <Button
          variant={following ? "outline" : "accent"}
          onClick={handleFollow}
          disabled={isPending || isFollowing === undefined}
          icon={following ? "user-check-bold" : "user-plus-bold"}
        >
          {following ? "Suivi" : "Suivre"}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="glass" icon="share-bold">
            Partager
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleShare}>
            <SolarIcon icon="link-bold" className="h-4 w-4 mr-2" />
            Copier le lien
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              const url = window.location.href;
              window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, "_blank");
            }}
          >
            <SolarIcon icon="twitter-bold" className="h-4 w-4 mr-2" />
            Partager sur Twitter
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              const url = window.location.href;
              window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
            }}
          >
            <SolarIcon icon="linkedin-bold" className="h-4 w-4 mr-2" />
            Partager sur LinkedIn
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {canEdit && onEdit && (
        <Button variant="glass" onClick={onEdit} icon="settings-bold">
          Paramètres
        </Button>
      )}
    </div>
  );
}

