"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Widget de promotion sobre et fermable pour la sidebar desktop
 */
export function ShopPromoWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Vérifier si la promotion a été fermée
    const promoClosed = localStorage.getItem("shop-promo-closed");
    if (!promoClosed) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("shop-promo-closed", "true");
  };

  const handleClick = () => {
    router.push("/shop");
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border border-border/50 bg-card relative overflow-hidden">
            {/* Bouton fermer */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 z-10 size-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
              aria-label="Fermer la promotion"
            >
              <X className="size-3 text-muted-foreground" />
            </button>

            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Icône et titre */}
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <SolarIcon icon="wallet-bold" className="size-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold mb-0.5">Rechargez vos Seeds</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Profitez de bonus jusqu'à +360%
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  onClick={handleClick}
                  className="w-full h-9 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                  size="sm"
                >
                  Voir la boutique
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

