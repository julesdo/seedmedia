"use client";

import { SolarIcon } from "@/components/icons/SolarIcon";

export function SeedPitch() {
  return (
    <div className="w-full h-full p-5 flex flex-col justify-center">
      <div className="space-y-4">
        {/* Titre principal */}
        <h2 className="text-lg font-semibold leading-snug text-foreground">
          Seed est un espace d'information{" "}
          <span className="text-primary">construit par la communauté</span>
        </h2>

        {/* Description principale */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tu peux y publier un sujet, ajouter des sources, débattre avec des arguments pour/contre, 
          et tout le monde voit les règles publiquement.
        </p>

        {/* Points clés */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <SolarIcon icon="forbidden-circle-bold" className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <span>Pas de publicité</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <SolarIcon icon="eye-closed-bold" className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <span>Pas d'algorithmes opaques</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <SolarIcon icon="document-text-bold" className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <span>Pas de ligne éditoriale imposée</span>
          </div>
        </div>

        {/* Conclusion */}
        <p className="text-sm text-foreground pt-3">
          Juste un endroit fiable pour comprendre des sujets importants,{" "}
          <span className="text-primary">ensemble</span>.
        </p>
      </div>
    </div>
  );
}

