"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeedDisplay } from "@/components/ui/SeedDisplay";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";

/**
 * Card pour inviter des amis et gagner des Seeds
 * 100 Seeds pour le parrain ET le parrainé
 * Design compact et optimisé mobile avec effets visuels engageants
 */
export function ReferralCard() {
  const { user, isAuthenticated } = useUser();
  const [copied, setCopied] = useState(false);

  // TODO: Remplacer par la vraie query quand referrals.ts sera créé
  // const referralStats = useQuery(api.referrals.getReferralStats, isAuthenticated ? {} : "skip");
  
  // Simuler pour l'instant
  const referralCode = user?.referralCode || user?._id?.slice(-8).toUpperCase() || "USER123";
  const referralCount = 0; // referralStats?.referralCount ?? 0;
  const seedsEarned = 0; // referralStats?.seedsEarned ?? 0;

  const referralLink = typeof window !== "undefined" 
    ? `${window.location.origin}/sign-up?ref=${referralCode}`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Lien copié !", {
        description: "Partagez ce lien avec vos amis",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Impossible de copier le lien");
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
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
              <h3 className="text-base lg:text-lg font-bold mb-0.5">Inviter un ami</h3>
              <p className="text-[10px] lg:text-xs text-muted-foreground leading-tight">
                Vous + votre ami = 100 Seeds chacun
              </p>
            </div>
            <motion.div
              className="ml-3 shrink-0"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <SeedDisplay amount={100} variant="default" className="text-xl lg:text-2xl font-bold" />
            </motion.div>
          </div>

          {/* Code de parrainage - Compact avec animation */}
          <motion.div
            className="mb-3 lg:mb-4 p-2.5 lg:p-3 rounded-lg bg-muted/50 border border-border/50"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <p className="text-[10px] lg:text-xs text-muted-foreground mb-1">Code</p>
            <div className="flex items-center gap-1.5">
              <code className="flex-1 text-sm lg:text-base font-bold font-mono bg-background px-2 lg:px-3 py-1.5 lg:py-2 rounded border border-border/50 truncate">
                {referralCode}
              </code>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopyLink}
                  className={cn(
                    "shrink-0 h-8 w-8 lg:h-9 lg:w-9",
                    copied && "bg-primary text-primary-foreground"
                  )}
                >
                  <SolarIcon 
                    icon={copied ? "check-circle-bold" : "copy-bold"} 
                    className="size-3.5 lg:size-4" 
                  />
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Bouton copier le lien avec effet */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleCopyLink}
              className="w-full h-9 lg:h-11 bg-gradient-to-r from-primary/10 via-primary/8 to-primary/10 hover:from-primary/20 hover:via-primary/15 hover:to-primary/20 border border-primary/20 text-primary text-sm lg:text-base relative overflow-hidden"
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
              <SolarIcon icon="share-bold" className="size-3.5 lg:size-4 mr-1.5 relative z-10" />
              <span className="relative z-10">Copier le lien</span>
            </Button>
          </motion.div>

          {/* Stats - Compact */}
          {(referralCount > 0 || seedsEarned > 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-border/30"
            >
              <div className="grid grid-cols-2 gap-3 lg:gap-4 text-center">
                <div>
                  <p className="text-[10px] lg:text-xs text-muted-foreground mb-0.5">Filleuls</p>
                  <p className="text-base lg:text-lg font-bold">{referralCount}</p>
                </div>
                <div>
                  <p className="text-[10px] lg:text-xs text-muted-foreground mb-0.5">Seeds gagnés</p>
                  <p className="text-base lg:text-lg font-bold text-primary">{seedsEarned}</p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
