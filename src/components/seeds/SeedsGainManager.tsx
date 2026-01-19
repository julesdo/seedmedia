"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { SeedsEarnedModal } from "@/components/ui/SeedsEarnedModal";
import { useNotificationToast } from "@/lib/notificationToast";

/**
 * Composant global qui détecte les gains de Seeds et affiche la modale de félicitations
 */
export function SeedsGainManager() {
  const { user } = useUser();
  const { showNotification } = useNotificationToast();
  const [seedsGain, setSeedsGain] = useState<{ amount: number; reason?: string } | null>(null);
  const previousBalanceRef = useRef<number>(0);
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    if (!user?.seedsBalance) {
      previousBalanceRef.current = 0;
      isInitialMountRef.current = true;
      return;
    }

    const currentBalance = user.seedsBalance;
    const previousBalance = previousBalanceRef.current;

    // Ignorer le premier rendu (initialisation)
    if (isInitialMountRef.current) {
      previousBalanceRef.current = currentBalance;
      isInitialMountRef.current = false;
      return;
    }

    // Détecter un gain (balance a augmenté)
    if (currentBalance > previousBalance) {
      const gain = currentBalance - previousBalance;
      
      // Ignorer les gains trop petits (probablement des erreurs d'arrondi)
      if (gain >= 1) {
        setSeedsGain({
          amount: gain,
        });

        // Enregistrer la notification dans la base de données
        showNotification(
          "seeds_earned",
          "Seeds gagnés !",
          `Vous avez gagné ${gain.toLocaleString('fr-FR')} Seeds`,
          {
            link: "/portfolio",
            toastType: "success",
          }
        );
      }
    }

    // Mettre à jour la référence
    previousBalanceRef.current = currentBalance;
  }, [user?.seedsBalance, showNotification]);

  return (
    <SeedsEarnedModal
      open={!!seedsGain}
      onOpenChange={(open) => {
        if (!open) {
          setSeedsGain(null);
        }
      }}
      seedsEarned={seedsGain?.amount || 0}
      reason={seedsGain?.reason}
    />
  );
}

