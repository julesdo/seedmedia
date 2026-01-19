"use client";

import { motion } from "motion/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "motion/react";

interface BoostSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionTitle?: string;
}

export function BoostSuccessModal({
  open,
  onOpenChange,
  decisionTitle,
}: BoostSuccessModalProps) {
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
              {/* Icône Rocket */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1,
                }}
                className="mb-6"
              >
                <img 
                  src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png" 
                  alt="Rocket" 
                  width="100" 
                  height="100"
                  className="mx-auto"
                />
              </motion.div>
              
              {/* Titre */}
              <SheetHeader className="p-0 mb-4">
                <SheetTitle className="text-xl font-bold text-center">
                  Décision boostée !
                </SheetTitle>
              </SheetHeader>
              
              {/* Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground text-center mb-6"
              >
                {decisionTitle && (
                  <span className="font-semibold text-foreground">{decisionTitle}</span>
                )}
                <br />
                Votre décision est maintenant en haut du feed pour 1 heure !
              </motion.p>
            </div>

            {/* Footer avec bouton */}
            <SheetFooter className="px-4 pb-6 pt-4 shrink-0 border-t border-border/20">
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full h-12 text-sm font-bold rounded-xl bg-primary hover:opacity-90 text-white"
              >
                Parfait !
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

              {/* Icône Rocket */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
                className="mx-auto mb-4"
              >
                <img 
                  src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Rocket.png" 
                  alt="Rocket" 
                  width="80" 
                  height="80"
                  className="mx-auto"
                />
              </motion.div>

              {/* Titre */}
              <h2 className="text-xl font-semibold mb-3">
                Décision boostée !
              </h2>

              {/* Message */}
              <p className="text-sm text-muted-foreground mb-6">
                {decisionTitle && (
                  <>
                    <span className="font-semibold text-foreground">{decisionTitle}</span>
                    <br />
                  </>
                )}
                Votre décision est maintenant en haut du feed pour 1 heure !
              </p>

              {/* Bouton de fermeture */}
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full"
                variant="outline"
              >
                Parfait !
              </Button>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

