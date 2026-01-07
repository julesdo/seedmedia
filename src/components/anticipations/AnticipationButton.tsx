"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';
import dynamic from "next/dynamic";

// Lazy load AnticipationModal (modal, pas besoin au chargement initial)
const AnticipationModal = dynamic(
  () => import("./AnticipationModal").then((mod) => ({ default: mod.AnticipationModal })),
  {
    ssr: false, // Modal, pas besoin de SSR
  }
);

interface AnticipationButtonProps {
  decisionId: Id<"decisions">;
  decisionTitle: string;
  question: string;
  answer1: string;
  answer2: string;
  answer3: string;
  status: "announced" | "tracking" | "resolved";
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AnticipationButton({
  decisionId,
  decisionTitle,
  question,
  answer1,
  answer2,
  answer3,
  status,
  className,
  variant = "default",
  size = "default",
}: AnticipationButtonProps) {
  const t = useTranslations('anticipations');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  // Vérifier si l'utilisateur a déjà anticipé cette décision
  const myAnticipation = useQuery(
    api.anticipations.getAnticipationsForDecision,
    isAuthenticated ? { decisionId } : "skip"
  );

  // Trouver l'anticipation de l'utilisateur actuel
  const userAnticipation = myAnticipation?.find(
    (a) => a.user?._id !== undefined
  );

  const handleClick = () => {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    if (status === "resolved") {
      return; // Ne pas permettre d'anticiper une décision résolue
    }

    if (userAnticipation) {
      // L'utilisateur a déjà anticipé, on pourrait rediriger vers la page de détail
      return;
    }

    setIsModalOpen(true);
  };

  if (status === "resolved") {
    return null; // Ne pas afficher le bouton pour les décisions résolues
  }

  if (userAnticipation) {
    return (
      <Button
        variant="outline"
        size={size}
        className={cn("gap-2", className)}
        disabled
      >
        <SolarIcon icon="check-circle-bold" className="size-4" />
        <span>{t('button.alreadyAnticipated')}</span>
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className={cn("gap-2", className)}
      >
        <SolarIcon icon="star-bold" className="size-4" />
        <span>{t('button.anticipate')}</span>
      </Button>

      <AnticipationModal
        decisionId={decisionId}
        decisionTitle={decisionTitle}
        question={question}
        answer1={answer1}
        answer2={answer2}
        answer3={answer3}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}

