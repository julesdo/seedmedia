"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";

const WELCOME_CARD_DISMISSED_KEY = "seed-welcome-card-dismissed";

export function WelcomeCard() {
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_CARD_DISMISSED_KEY);
    setIsDismissed(dismissed === "true");
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(WELCOME_CARD_DISMISSED_KEY, "true");
    setIsDismissed(true);
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="border-t border-border/60 px-5 pb-4 pt-4">
      <div className="relative rounded-xl border border-border/60 bg-muted/30 p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="absolute right-1 top-1 h-5 w-5 text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <SolarIcon icon="close-circle-bold" className="h-3.5 w-3.5" />
        </Button>

        <div className="pr-5 space-y-1">
          <p className="text-xs font-semibold leading-tight text-foreground">
            Bienvenue sur Seed
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Média citoyen où tu peux lire des articles, participer à des actions concrètes et contribuer à la gouvernance. Gagne des points de crédibilité en contribuant.
          </p>
        </div>
      </div>
    </div>
  );
}

