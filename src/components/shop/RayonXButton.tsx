"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent } from "@/components/ui/card";

interface RayonXButtonProps {
  decisionId: Id<"decisions">;
}

/**
 * 🛒 PHASE 5: SHOP - Bouton pour acheter "RAYON X" (Data Insider)
 * Coût : 50 Seeds
 * Affiche la répartition des votes des "Top 1% Users" vs "La Masse"
 */
export function RayonXButton({ decisionId }: RayonXButtonProps) {
  const { user } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const hasRayonX = useQuery(api.shop.hasRayonX, { decisionId });
  const topUsersVotes = useQuery(
    api.shop.getTopUsersVotes,
    hasRayonX ? { decisionId } : "skip"
  );
  const purchaseRayonX = useMutation(api.shop.purchaseRayonX);

  const price = 50;

  const handlePurchase = async () => {
    if ((user?.seedsBalance || 0) < price) {
      toast.error(`Vous n'avez pas assez de Seeds. Vous avez ${user?.seedsBalance || 0}`);
      return;
    }

    try {
      await purchaseRayonX({ decisionId });

      toast.success("RAYON X acheté !", {
        description: `Vous pouvez maintenant voir les votes des Top 1% Users.`,
      });

      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible d'acheter RAYON X.",
      });
    }
  };

  if (!user) {
    return null;
  }

  // Si l'utilisateur a déjà acheté, afficher les données
  if (hasRayonX && topUsersVotes) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            <SolarIcon icon="eye-bold" className="size-3 mr-1" />
            RAYON X
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SolarIcon icon="eye-bold" className="size-5 text-primary" />
              RAYON X - Data Insider
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold mb-2">Top 1% Users</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400">OUI:</span>
                      <span className="font-bold">{topUsersVotes.topUsers.yes}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-600 dark:text-red-400">NON:</span>
                      <span className="font-bold">{topUsersVotes.topUsers.no}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span>Total:</span>
                      <span className="font-bold">{topUsersVotes.topUsers.total}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-2">La Masse</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600 dark:text-green-400">OUI:</span>
                      <span className="font-bold">{topUsersVotes.masse.yes}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-red-600 dark:text-red-400">NON:</span>
                      <span className="font-bold">{topUsersVotes.masse.no}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span>Total:</span>
                      <span className="font-bold">{topUsersVotes.masse.total}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Sinon, afficher le bouton d'achat
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <SolarIcon icon="eye-bold" className="size-3 mr-1" />
          RAYON X
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>RAYON X - Data Insider</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Découvrez la répartition des votes des "Top 1% Users" (utilisateurs avec le meilleur
              ROI) vs "La Masse". Cette fonctionnalité vous donne un avantage stratégique pour
              comprendre les tendances des experts.
            </p>
            <p className="text-sm font-semibold">
              Coût : <SeedDisplay amount={price} variant="inline" />
            </p>
          </div>
          <Button
            onClick={handlePurchase}
            disabled={(user?.seedsBalance || 0) < price}
            className="w-full"
          >
            <SeedDisplay amount={price} variant="compact" iconSize="size-3" />
            <span className="ml-2">Acheter RAYON X</span>
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Vous avez <SeedDisplay amount={user?.seedsBalance || 0} variant="inline" iconSize="size-2.5" /> disponibles
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

