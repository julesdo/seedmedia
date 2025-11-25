"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  targetType: "user" | "organization" | "tag";
  targetId: string | { toString(): string };
  followersCount?: number;
  showCount?: boolean;
  variant?: "default" | "ghost" | "outline" | "accent";
  size?: "sm" | "default" | "lg";
  className?: string;
  hideIfNotAuthenticated?: boolean;
}

export function FollowButton({
  targetType,
  targetId,
  followersCount,
  showCount = true,
  variant = "default",
  size = "default",
  className,
  hideIfNotAuthenticated = false,
}: FollowButtonProps) {
  const router = useRouter();
  const targetIdString = typeof targetId === "string" ? targetId : targetId.toString();
  
  const isFollowing = useQuery(api.follows.isFollowing, {
    targetType,
    targetId: targetIdString,
  });
  const toggleFollow = useMutation(api.follows.toggleFollow);

  const handleToggle = async () => {
    try {
      const result = await toggleFollow({
        targetType,
        targetId: targetIdString,
      });

      if (result.following) {
        toast.success(
          targetType === "user"
            ? "Vous suivez maintenant cet utilisateur"
            : targetType === "organization"
            ? "Vous suivez maintenant cette organisation"
            : "Vous suivez maintenant ce tag"
        );
      } else {
        toast.success(
          targetType === "user"
            ? "Vous ne suivez plus cet utilisateur"
            : targetType === "organization"
            ? "Vous ne suivez plus cette organisation"
            : "Vous ne suivez plus ce tag"
        );
      }
    } catch (error: any) {
      if (error.message === "Not authenticated") {
        toast.error("Vous devez être connecté pour suivre");
        router.push("/login");
      } else {
        toast.error("Erreur lors du suivi");
      }
    }
  };

  // Si l'utilisateur n'est pas connecté, ne pas afficher le bouton
  if (isFollowing === undefined) {
    if (hideIfNotAuthenticated) {
      return null;
    }
    // Afficher un bouton désactivé si on veut toujours l'afficher
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant={variant}
          size={size}
          disabled
          icon="user-plus-rounded-bold"
        >
          {targetType === "user"
            ? "Suivre"
            : targetType === "organization"
            ? "Suivre"
            : "Suivre"}
        </Button>
        {showCount && followersCount !== undefined && (
          <span className="text-sm text-muted-foreground">
            {followersCount} {followersCount === 1 ? "abonné" : "abonnés"}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant={isFollowing ? "outline" : variant}
        size={size}
        onClick={handleToggle}
        icon={isFollowing ? "user-check-rounded-bold" : "user-plus-rounded-bold"}
        className={cn(
          isFollowing && "border-primary/50 text-primary hover:bg-primary/10"
        )}
      >
        {isFollowing
          ? targetType === "user"
            ? "Suivi"
            : targetType === "organization"
            ? "Suivi"
            : "Suivi"
          : targetType === "user"
          ? "Suivre"
          : targetType === "organization"
          ? "Suivre"
          : "Suivre"}
      </Button>
      {showCount && followersCount !== undefined && (
        <span className="text-sm text-muted-foreground">
          {followersCount} {followersCount === 1 ? "abonné" : "abonnés"}
        </span>
      )}
    </div>
  );
}

