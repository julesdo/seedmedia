"use client";

import { motion, AnimatePresence } from "motion/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { SeedDisplay } from "@/components/ui/SeedDisplay";

interface SeedsEarnedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seedsEarned: number;
  reason?: string;
}

/**
 * Formate un montant de Seeds pour l'affichage
 */
function formatSeedAmount(amount: number): string {
  const absVal = Math.abs(amount);
  
  // Si très grand, utiliser abréviations
  if (absVal >= 1000000) {
    const mValue = amount / 1000000;
    return `${mValue.toFixed(absVal >= 10000000 ? 1 : 2)}M`;
  }
  
  if (absVal >= 1000) {
    const kValue = amount / 1000;
    return `${kValue.toFixed(absVal >= 10000 ? 1 : 2)}K`;
  }
  
  // Arrondir à 1-2 décimales max
  if (absVal >= 1) {
    return amount.toFixed(absVal >= 10 ? 1 : 2);
  }
  
  return amount.toFixed(2);
}

export function SeedsEarnedModal({
  open,
  onOpenChange,
  seedsEarned,
  reason,
}: SeedsEarnedModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const hasTriggeredConfettiRef = useRef(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Effet confettis au moment de l'ouverture
  useEffect(() => {
    if (open && !hasTriggeredConfettiRef.current) {
      hasTriggeredConfettiRef.current = true;
      
      // Délai pour que le drawer soit visible
      const timer = setTimeout(() => {
        // Confettis depuis le centre du haut
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#246BFD', '#4A8AFF', '#71717A', '#A1A1AA'],
        });
        
        // Confettis depuis les côtés
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#246BFD', '#4A8AFF', '#71717A', '#A1A1AA'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#246BFD', '#4A8AFF', '#71717A', '#A1A1AA'],
          });
        }, 250);
      }, 500);

      return () => clearTimeout(timer);
    }
    
    if (!open) {
      hasTriggeredConfettiRef.current = false;
    }
  }, [open]);

  // Sur mobile, utiliser Drawer
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} side="bottom">
        <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl p-0 overflow-hidden w-full max-w-full">
          <div className="relative h-full flex flex-col overflow-hidden w-full max-w-full min-w-0 bg-background">
            {/* Contenu centré verticalement */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
              {/* Titre */}
              <SheetHeader className="p-0 mb-4">
                <SheetTitle className="text-xl font-bold text-center">
                  Seeds gagnés !
                </SheetTitle>
              </SheetHeader>
              
              {/* Icône Party Popper */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1,
                }}
                className="mb-4"
              >
                <img 
                  src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Party%20Popper.png" 
                  alt="Party Popper" 
                  width="80" 
                  height="80"
                  className="mx-auto"
                />
              </motion.div>
              
              {/* Montant gagné avec SeedDisplay */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-4 flex items-center justify-center gap-2 flex-wrap"
              >
                <span className="text-5xl font-bold text-primary">+</span>
                <div className="flex items-center gap-1.5">
                  <SolarIcon icon="leaf-bold" className="size-10 text-primary shrink-0" />
                  <span className="text-5xl font-bold text-primary whitespace-nowrap">
                    {seedsEarned.toLocaleString('fr-FR')}
                  </span>
                </div>
              </motion.div>
              
              {/* Raison (optionnelle) */}
              {reason && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-muted-foreground text-center mb-6"
                >
                  {reason}
                </motion.p>
              )}
            </div>

            {/* Footer avec bouton */}
            <SheetFooter className="px-4 pb-6 pt-4 shrink-0 border-t border-border/20">
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full h-12 text-sm font-bold rounded-xl bg-primary hover:opacity-90 text-white"
              >
                Continuer
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Sur desktop, utiliser Dialog
  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-md border p-0 gap-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative bg-background p-6 text-center"
            >
              {/* Bouton fermer */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-7 w-7"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Titre */}
              <h2 className="text-xl font-semibold pt-10 mb-3">
                Seeds gagnés !
              </h2>

              {/* Icône Party Popper */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1,
                }}
                className="mb-4"
              >
                <img 
                  src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Party%20Popper.png" 
                  alt="Party Popper" 
                  width="60" 
                  height="60"
                  className="mx-auto"
                />
              </motion.div>

              {/* Montant gagné avec SeedDisplay */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-4 flex items-center justify-center gap-2 flex-wrap"
              >
                <span className="text-4xl font-bold text-primary">+</span>
                <div className="flex items-center gap-1.5">
                  <SolarIcon icon="leaf-bold" className="size-8 text-primary shrink-0" />
                  <span className="text-4xl font-bold text-primary whitespace-nowrap">
                    {seedsEarned.toLocaleString('fr-FR')}
                  </span>
                </div>
              </motion.div>

              {/* Raison (optionnelle) */}
              {reason && (
                <p className="text-sm text-muted-foreground mb-6">
                  {reason}
                </p>
              )}

              {/* Bouton de fermeture */}
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full"
                variant="outline"
              >
                Continuer
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
