"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { useUser } from "@/contexts/UserContext";

/**
 * 🛒 PHASE 5: SHOP - Bouton pour acheter "BADGE FONDATEUR"
 * Coût unique : 5000 Seeds
 * Cosmétique : affiche le pseudo en couleur Or + icône spéciale partout
 */
export function FounderBadgeButton() {
  const { user } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const purchaseFounderBadge = useMutation(api.shop.purchaseFounderBadge);

  const price = 5000;

  const handlePurchase = async () => {
    if ((user?.seedsBalance || 0) < price) {
      toast.error(`Vous n'avez pas assez de Seeds. Vous avez ${user?.seedsBalance || 0}`);
      return;
    }

    try {
      await purchaseFounderBadge({});

      toast.success("Badge Fondateur acheté !", {
        description: `Votre pseudo sera maintenant affiché en couleur Or avec une icône spéciale partout.`,
      });

      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible d'acheter le Badge Fondateur.",
      });
    }
  };

  if (!user) {
    return null;
  }

  // Si l'utilisateur a déjà le badge, ne rien afficher (ou afficher un indicateur)
  if (user.isFounderMember) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br from-yellow-500/20 via-amber-500/20 to-yellow-500/20 border border-yellow-500/50">
        <SolarIcon icon="medal-ribbons-star-bold" className="size-4 text-yellow-500" />
        <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
          Badge Fondateur
        </span>
      </div>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <SolarIcon icon="medal-ribbons-star-bold" className="size-3 mr-1" />
          Badge Fondateur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Badge Fondateur</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Achetez le Badge Fondateur pour afficher votre pseudo en couleur Or avec une icône
              spéciale partout sur la plateforme. C'est un statut cosmétique qui montre votre
              engagement envers la plateforme.
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
            <span className="ml-2">Acheter Badge Fondateur</span>
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Vous avez <SeedDisplay amount={user?.seedsBalance || 0} variant="inline" iconSize="size-2.5" /> disponibles
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

