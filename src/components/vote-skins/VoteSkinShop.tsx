"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
import { motion } from "motion/react";
import { SeedDisplay } from "@/components/ui/SeedDisplay";

const SKIN_PRICES: Record<string, number> = {
  default: 0,
  neon: 200,
  stamp: 300,
  gold: 500,
};

const SKIN_DESCRIPTIONS: Record<string, string> = {
  default: "Style classique et sobre",
  neon: "Effet néon vibrant et moderne",
  stamp: "Style tampon officiel",
  gold: "Style doré premium",
};

/**
 * 🎯 FEATURE 5: LES SKINS DE VOTE - Boutique de skins
 */
export function VoteSkinShop() {
  const { user } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const userSkins = useQuery(api.voteSkins.getUserSkins);
  const purchaseSkin = useMutation(api.voteSkins.purchaseSkin);
  const selectSkin = useMutation(api.voteSkins.selectSkin);

  const handlePurchase = async (skinType: string) => {
    if (skinType === "default") return;

    try {
      await purchaseSkin({ skinType: skinType as "neon" | "stamp" | "gold" });
      toast.success("Skin acheté !", {
        description: `Vous avez payé ${SKIN_PRICES[skinType]} pour le skin ${skinType}.`,
      });
      // Sélectionner automatiquement le skin acheté
      await selectSkin({ skinType: skinType as any });
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible d'acheter le skin.",
      });
    }
  };

  const handleSelect = async (skinType: string) => {
    try {
      await selectSkin({ skinType: skinType as any });
      toast.success("Skin sélectionné !");
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible de sélectionner le skin.",
      });
    }
  };

  const skins = [
    { type: "default", name: "Classique", icon: "check-circle-bold" },
    { type: "neon", name: "Néon", icon: "flash-bold" },
    { type: "stamp", name: "Tampon", icon: "stamp-bold" },
    { type: "gold", name: "Or", icon: "medal-ribbons-star-bold" },
  ];

  const ownedSkins = userSkins?.skins || ["default"];
  const selectedSkin = userSkins?.selectedSkin || "default";

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SolarIcon icon="palette-bold" className="size-4" />
          <span className="hidden sm:inline">Skins de vote</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SolarIcon icon="palette-bold" className="size-5 text-primary" />
            Boutique de Skins de Vote
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {skins.map((skin) => {
            const isOwned = ownedSkins.includes(skin.type);
            const isSelected = selectedSkin === skin.type;
            const price = SKIN_PRICES[skin.type];
            const canAfford = (user?.seedsBalance || 0) >= price;

            return (
              <Card
                key={skin.type}
                className={cn(
                  "relative overflow-hidden transition-all",
                  isSelected && "ring-2 ring-primary",
                  !isOwned && "opacity-75"
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className="bg-primary">
                      <SolarIcon icon="check-circle-bold" className="size-3 mr-1" />
                      Actif
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <SolarIcon icon={skin.icon as any} className="size-5" />
                      {skin.name}
                    </CardTitle>
                    {price > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <SeedDisplay amount={price} variant="compact" iconSize="size-2.5" />
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {SKIN_DESCRIPTIONS[skin.type]}
                  </p>
                  <div className="flex gap-2">
                    {isOwned ? (
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSelect(skin.type)}
                        disabled={isSelected}
                      >
                        {isSelected ? (
                          <>
                            <SolarIcon icon="check-circle-bold" className="size-4 mr-2" />
                            Sélectionné
                          </>
                        ) : (
                          "Sélectionner"
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handlePurchase(skin.type)}
                        disabled={!canAfford || !user}
                      >
                        {canAfford ? (
                          <>
                            <SeedDisplay amount={price} variant="compact" iconSize="size-3" />
                            <span className="ml-1">Acheter</span>
                          </>
                        ) : (
                          "Pas assez de Seeds"
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

