"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

export function ApproveButton({ correctionId }: { correctionId: Id<"articleCorrections"> }) {
  const approve = useMutation(api.articleCorrections.approveCorrection);

  const handleApprove = async () => {
    try {
      await approve({ correctionId });
      toast.success("Correction approuvée");
    } catch (error) {
      toast.error((error as Error).message || "Erreur lors de l'approbation");
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleApprove}>
      Approuver
    </Button>
  );
}

