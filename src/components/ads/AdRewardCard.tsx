"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Card pour gagner des Seeds via publicité récompensée
 * Cooldown de 4h, 10 Seeds par récompense
 * Design compact et optimisé mobile avec effets visuels engageants
 */
export function AdRewardCard() {
  const { isAuthenticated } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isClaiming, setIsClaiming] = useState(false);

  // TODO: Remplacer par la vraie query quand adRewards.ts sera créé
  // const adStatus = useQuery(api.adRewards.getAdRewardStatus, isAuthenticated ? {} : "skip");
  // const claimAdReward = useMutation(api.adRewards.claimAdReward);

  // Simuler le statut pour l'instant
  const canClaim = true; // adStatus?.canClaim ?? false;
  const timeRemaining = 0; // adStatus?.timeRemaining ?? 0;

  // Format du temps restant
  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleClaimReward = useCallback(async () => {
    setIsClaiming(true);
    try {
      // TODO: Remplacer par la vraie mutation
      // await claimAdReward();
      
      // Simuler pour l'instant
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("+10 Seeds", {
        description: "Récompense créditée !",
      });
      setShowModal(false);
      setCountdown(30);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la réclamation");
    } finally {
      setIsClaiming(false);
    }
  }, []);

  // Compte à rebours dans le modal
  useEffect(() => {
    if (showModal && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showModal && countdown === 0 && !isClaiming) {
      handleClaimReward();
    }
  }, [showModal, countdown, isClaiming, handleClaimReward]);

  const handleOpenAd = () => {
    if (!canClaim) {
      toast.info(`Disponible dans ${formatTimeRemaining(timeRemaining)}`);
      return;
    }

    setShowModal(true);
    setCountdown(30);
    // Ouvrir un nouvel onglet vers un partenaire/AdSense
    // TODO: Remplacer par la vraie URL de pub
    window.open("https://www.google.com", "_blank");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
        whileHover={{ y: -2 }}
      >
        <Card className="border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 relative overflow-hidden">
          {/* Effet de brillance subtil */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent pointer-events-none"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut",
            }}
          />
          
          <CardContent className="p-4 lg:p-6 relative z-0">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-base lg:text-lg font-bold mb-0.5">Gagner des Seeds</h3>
                <p className="text-[10px] lg:text-xs text-muted-foreground leading-tight">
                  Regardez une pub → +10 Seeds
                </p>
              </div>
              <motion.div
                className="ml-3 shrink-0"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <SeedDisplay amount={10} variant="default" className="text-xl lg:text-2xl font-bold" />
              </motion.div>
            </div>

            {!canClaim && timeRemaining > 0 ? (
              <div className="text-center py-2">
                <p className="text-xs lg:text-sm text-muted-foreground">
                  Disponible dans {formatTimeRemaining(timeRemaining)}
                </p>
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleOpenAd}
                  className="w-full h-9 lg:h-11 bg-gradient-to-r from-primary/10 via-primary/8 to-primary/10 hover:from-primary/20 hover:via-primary/15 hover:to-primary/20 border border-primary/20 text-primary text-sm lg:text-base relative overflow-hidden"
                  disabled={!canClaim}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{
                      x: ["-100%", "200%"],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      repeatDelay: 1.5,
                      ease: "easeInOut",
                    }}
                  />
                  <SolarIcon icon="play-circle-bold" className="size-3.5 lg:size-4 mr-1.5 relative z-10" />
                  <span className="relative z-10">Regarder une pub</span>
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal avec compte à rebours */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publicité en cours</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 space-y-4">
            <motion.div
              className="size-16 lg:size-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <SolarIcon icon="play-circle-bold" className="size-8 lg:size-10 text-primary" />
            </motion.div>
            <div>
              <motion.p
                key={countdown}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-3xl lg:text-4xl font-bold mb-2"
              >
                {countdown}s
              </motion.p>
              <p className="text-sm lg:text-base text-muted-foreground">
                {countdown > 0 
                  ? "Merci d'avoir regardé la publicité !" 
                  : "Réclamation en cours..."}
              </p>
            </div>
            {isClaiming && (
              <div className="flex items-center justify-center">
                <SolarIcon icon="loading-bold" className="size-5 animate-spin text-primary" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
