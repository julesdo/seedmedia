"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  targetType: "article" | "project" | "action";
  targetId: Id<"articles"> | Id<"projects"> | Id<"actions">;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg";
  className?: string;
  showLabel?: boolean;
}

export function FavoriteButton({
  targetType,
  targetId,
  variant = "ghost",
  size = "default",
  className,
  showLabel = false,
}: FavoriteButtonProps) {
  const router = useRouter();
  const isFavorite = useQuery(api.favorites.isFavorite, {
    targetType,
    targetId,
  });
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);

  const handleToggle = async () => {
    try {
      const result = await toggleFavorite({
        targetType,
        targetId,
      });

      if (result.favorited) {
        toast.success("Ajouté aux favoris");
      } else {
        toast.success("Retiré des favoris");
      }
    } catch (error: any) {
      if (error.message === "Not authenticated") {
        toast.error("Vous devez être connecté pour ajouter aux favoris");
        router.push("/login");
      } else {
        toast.error("Erreur lors de l'ajout aux favoris");
      }
    }
  };

  // Si l'utilisateur n'est pas connecté, ne pas afficher le bouton
  if (isFavorite === undefined) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      icon={isFavorite ? "star-bold" : "star-outline"}
      className={cn(
        className,
        isFavorite && "text-yellow-500 hover:text-yellow-600"
      )}
    >
      {showLabel && (isFavorite ? "Favori" : "Ajouter aux favoris")}
    </Button>
  );
}

