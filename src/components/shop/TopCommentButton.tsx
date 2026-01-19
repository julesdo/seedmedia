"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { useUser } from "@/contexts/UserContext";

interface TopCommentButtonProps {
  decisionId: Id<"decisions">;
  argumentId: Id<"topArguments">;
  currentBidPrice?: number;
}

/**
 * 🛒 PHASE 5: SHOP - Bouton pour acheter "TOP COMMENT" (King of the Hill)
 */
export function TopCommentButton({
  decisionId,
  argumentId,
  currentBidPrice = 0,
}: TopCommentButtonProps) {
  const { user } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState<number>(Math.ceil(currentBidPrice * 1.1));

  const decision = useQuery(api.decisions.getDecisionById, { decisionId });
  const purchaseTopComment = useMutation(api.shop.purchaseTopComment);

  const minimumBid = decision?.currentBidPrice
    ? Math.ceil(decision.currentBidPrice * 1.1)
    : 50;

  const handlePurchase = async () => {
    if (bidAmount < minimumBid) {
      toast.error(`Vous devez investir au moins ${minimumBid} Seeds`);
      return;
    }

    if ((user?.seedsBalance || 0) < bidAmount) {
      toast.error(`Vous n'avez pas assez de Seeds. Vous avez ${user?.seedsBalance || 0}`);
      return;
    }

    try {
      await purchaseTopComment({
        decisionId,
        argumentId,
        bidAmount,
      });

      toast.success("Commentaire mis en vedette !", {
        description: `Vous avez investi ${bidAmount} Seeds pour mettre votre commentaire en vedette.`,
      });

      setIsDialogOpen(false);
      setBidAmount(minimumBid);
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible de mettre le commentaire en vedette.",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setBidAmount(minimumBid)}
        >
          <SolarIcon icon="crown-bold" className="size-3 mr-1" />
          Mettre en vedette
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mettre en vedette (TOP COMMENT)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Investissez des Seeds pour mettre votre commentaire en vedette. Le prix minimum est
              de {minimumBid} Seeds (prix actuel + 10%).
            </p>
            <p className="text-xs text-muted-foreground">
              Prix actuel : <SeedDisplay amount={decision?.currentBidPrice || 0} variant="inline" />
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Montant à investir
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={minimumBid}
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                placeholder={`Minimum: ${minimumBid}`}
              />
              <Button
                onClick={handlePurchase}
                disabled={bidAmount < minimumBid || (user?.seedsBalance || 0) < bidAmount}
              >
                <SeedDisplay amount={bidAmount} variant="compact" iconSize="size-3" />
                <span className="ml-1">Acheter</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Vous avez <SeedDisplay amount={user?.seedsBalance || 0} variant="inline" iconSize="size-2.5" /> disponibles
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

