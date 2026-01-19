"use client";

import { motion, AnimatePresence } from "motion/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { YES_COLORS, NO_COLORS } from "@/lib/colors";

interface PurchaseSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  decisionId: Id<"decisions">;
  decisionTitle: string;
  position: "yes" | "no";
  shares: number;
  timeAddedMs?: number; // Temps ajouté à la fenêtre d'investissement (en millisecondes)
}

export function PurchaseSuccessModal({
  open,
  onOpenChange,
  decisionId,
  decisionTitle,
  position,
  shares,
  timeAddedMs = 0,
}: PurchaseSuccessModalProps) {
  // Formater le temps ajouté
  const formatTimeAdded = (ms: number): string => {
    if (ms <= 0) return "";
    
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? `${minutes}min` : ""}`;
    }
    if (minutes > 0) {
      return `${minutes}min`;
    }
    return "";
  };
  
  const timeAddedText = formatTimeAdded(timeAddedMs);
  const [isMobile, setIsMobile] = useState(false);
  const hasTriggeredConfettiRef = useRef(false);
  const router = useRouter();

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
          colors: position === "yes" 
            ? ['#246BFD', '#4A8AFF', '#FFFFFF'] 
            : ['#71717A', '#A1A1AA', '#FFFFFF'],
        });
        
        // Confettis depuis les côtés
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: position === "yes" 
              ? ['#246BFD', '#4A8AFF', '#FFFFFF'] 
              : ['#71717A', '#A1A1AA', '#FFFFFF'],
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: position === "yes" 
              ? ['#246BFD', '#4A8AFF', '#FFFFFF'] 
              : ['#71717A', '#A1A1AA', '#FFFFFF'],
          });
        }, 250);
      }, 500);

      return () => clearTimeout(timer);
    }
    
    if (!open) {
      hasTriggeredConfettiRef.current = false;
    }
  }, [open, position]);

  const handleViewPortfolio = () => {
    onOpenChange(false);
    // Naviguer vers le portefeuille avec les paramètres pour ouvrir le détail
    router.push(`/portfolio?decisionId=${decisionId}&position=${position}`);
  };

  const colors = position === "yes" ? YES_COLORS : NO_COLORS;
  const positionLabel = position === "yes" ? "OUI" : "NON";

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
                  Achat réussi !
                </SheetTitle>
              </SheetHeader>
              
              {/* Icône de succès */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1,
                }}
                className={cn(
                  "mb-4 size-20 rounded-full flex items-center justify-center",
                  position === "yes"
                    ? cn("bg-gradient-to-br", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to)
                    : cn("bg-gradient-to-br", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to)
                )}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {position === "yes" ? (
                    <svg className="size-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="size-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </motion.div>
              </motion.div>
              
              {/* Détails de l'achat */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-4 space-y-2"
              >
                <p className="text-sm text-muted-foreground">
                  {shares} action{shares > 1 ? "s" : ""} {positionLabel}
                </p>
                {timeAddedText && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xs font-medium text-primary"
                  >
                    +{timeAddedText} ajouté à la fenêtre d'investissement
                  </motion.p>
                )}
                <p className="text-xs text-muted-foreground/80 line-clamp-2">
                  {decisionTitle}
                </p>
              </motion.div>
            </div>

            {/* Footer avec boutons */}
            <SheetFooter className="px-4 pb-6 pt-4 shrink-0 border-t border-border/20 gap-2">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="flex-1 h-12 text-sm font-semibold rounded-xl"
              >
                Continuer
              </Button>
              <Button
                onClick={handleViewPortfolio}
                className={cn(
                  "flex-1 h-12 text-sm font-bold rounded-xl text-white",
                  position === "yes"
                    ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "hover:opacity-90")
                    : cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "hover:opacity-90")
                )}
              >
                Voir le portefeuille
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
                Achat réussi !
              </h2>

              {/* Icône de succès */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.1,
                }}
                className={cn(
                  "mb-4 mx-auto size-16 rounded-full flex items-center justify-center",
                  position === "yes"
                    ? cn("bg-gradient-to-br", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to)
                    : cn("bg-gradient-to-br", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to)
                )}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  {position === "yes" ? (
                    <svg className="size-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="size-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </motion.div>
              </motion.div>

              {/* Détails de l'achat */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-6 space-y-2"
              >
                <p className="text-sm text-muted-foreground">
                  {shares} action{shares > 1 ? "s" : ""} {positionLabel}
                </p>
                {timeAddedText && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xs font-medium text-primary"
                  >
                    +{timeAddedText} ajouté à la fenêtre d'investissement
                  </motion.p>
                )}
                <p className="text-xs text-muted-foreground/80 line-clamp-2">
                  {decisionTitle}
                </p>
              </motion.div>

              {/* Boutons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => onOpenChange(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Continuer
                </Button>
                <Button
                  onClick={handleViewPortfolio}
                  className={cn(
                    "flex-1 text-white",
                    position === "yes"
                      ? cn("bg-gradient-to-r", YES_COLORS.gradient.from, YES_COLORS.gradient.via, YES_COLORS.gradient.to, "hover:opacity-90")
                      : cn("bg-gradient-to-r", NO_COLORS.gradient.from, NO_COLORS.gradient.via, NO_COLORS.gradient.to, "hover:opacity-90")
                  )}
                >
                  Voir le portefeuille
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

