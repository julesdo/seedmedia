"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslations } from 'next-intl';

interface SaveButtonProps {
  decisionId: Id<"decisions">;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost";
  isSaved?: boolean; // Optionnel : passé depuis le parent pour éviter les requêtes multiples
}

export function SaveButton({
  decisionId,
  className,
  size = "default",
  variant = "outline",
  isSaved: isSavedProp,
}: SaveButtonProps) {
  const t = useTranslations('decisions');
  const tErrors = useTranslations('errors');
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Si isSaved est passé en prop, l'utiliser directement (optimisation pour les listes)
  // Sinon, faire une requête individuelle (pour les pages de détail)
  const isSavedFromQuery = useQuery(
    api.favorites.isFavorite,
    isSavedProp === undefined && isAuthenticated
      ? {
          targetType: "decision",
          targetId: decisionId,
        }
      : "skip"
  );

  const isSaved = isSavedProp !== undefined ? isSavedProp : isSavedFromQuery;

  const toggleSave = useMutation(api.favorites.toggleFavorite);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    setIsSaving(true);
    try {
      const result = await toggleSave({
        targetType: "decision",
        targetId: decisionId,
      });

      if (result.favorited) {
        toast.success(t('save.savedToast'));
      } else {
        toast.success(t('save.unsavedToast'));
      }
    } catch (error: any) {
      toast.error(tErrors('generic'), {
        description: error.message || tErrors('generic'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toujours afficher l'icône, même si isSaved est undefined (chargement)
  // Utiliser false par défaut si undefined pour garantir le rendu
  const saved = isSaved === true;
  // Utiliser variant accent (bleu/primary) quand sauvegardé, sinon utiliser le variant passé en props
  const buttonVariant = saved ? "accent" : variant;

  return (
    <Button
      onClick={handleClick}
      variant={buttonVariant}
      size={size}
      className={cn(className)}
      disabled={isSaving}
    >
      <SolarIcon
        icon="bookmark-bold"
        className={cn(
          size === "icon" ? "size-5" : "size-4",
          // Si le bouton a text-white dans className, forcer l'icône en blanc
          className?.includes("text-white") && "!text-white"
        )}
        style={{
          // Si className contient text-white, forcer la couleur blanche
          color: className?.includes("text-white")
            ? "white"
            : saved 
            ? "hsl(var(--primary))" 
            : "hsl(var(--muted-foreground))",
          opacity: className?.includes("text-white") ? 1 : (saved ? 1 : 0.7)
        }}
      />
      {size !== "icon" && (
        <span className={cn(
          saved ? "text-primary" : "text-muted-foreground"
        )}>
          {saved ? t('save.saved') : t('save.save')}
        </span>
      )}
    </Button>
  );
}

