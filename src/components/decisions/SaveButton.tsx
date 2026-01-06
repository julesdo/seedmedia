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
}

export function SaveButton({
  decisionId,
  className,
  size = "default",
  variant = "ghost",
}: SaveButtonProps) {
  const t = useTranslations('decisions');
  const tErrors = useTranslations('errors');
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const isSaved = useQuery(
    api.favorites.isFavorite,
    isAuthenticated
      ? {
          targetType: "decision",
          targetId: decisionId,
        }
      : "skip"
  );

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

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      disabled={isSaving}
    >
      <SolarIcon
        icon={isSaved ? "bookmark-bold" : "bookmark"}
        className={cn(
          "size-4",
          isSaved && "text-primary fill-primary"
        )}
      />
      {size !== "icon" && (
        <span>{isSaved ? t('save.saved') : t('save.save')}</span>
      )}
    </Button>
  );
}

