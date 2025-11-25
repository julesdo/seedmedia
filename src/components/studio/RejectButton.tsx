"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

export function RejectButton({ correctionId }: { correctionId: Id<"articleCorrections"> }) {
  const reject = useMutation(api.articleCorrections.rejectCorrection);

  const handleReject = async () => {
    try {
      await reject({ correctionId });
      toast.success("Correction rejetée");
    } catch (error) {
      toast.error((error as Error).message || "Erreur lors du rejet");
    }
  };

  return (
    <Button size="sm" variant="destructive" onClick={handleReject}>
      Rejeter
    </Button>
  );
}

