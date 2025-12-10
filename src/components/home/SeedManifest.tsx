"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Link } from "next-view-transitions";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function SeedManifest() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-border/60 bg-gradient-to-br from-background/95 to-muted/20 backdrop-blur-sm">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="p-4">
          <CollapsibleTrigger className="w-full flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <SolarIcon icon="planet-bold" className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h3 className="font-semibold text-sm leading-tight">Qu'est-ce que Seed ?</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                Le média social de la résilience technologique
              </p>
            </div>
            <SolarIcon
              icon={isOpen ? "alt-arrow-up-bold" : "alt-arrow-down-bold"}
              className="h-4 w-4 text-muted-foreground shrink-0 transition-transform"
            />
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-4 space-y-3">
            <div className="space-y-2.5 text-sm text-muted-foreground leading-relaxed">
              <p>
                Seed est une <strong className="text-foreground">plateforme d'information et d'utilité publique</strong> où la communauté publie, organise, vérifie et fait évoluer les contenus grâce à une gouvernance partagée.
              </p>
              <div className="space-y-2 pt-1">
                <div className="flex items-start gap-2">
                  <SolarIcon icon="verified-check-bold" className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong className="text-foreground">Pas d'algos opaques</strong>, pas de ligne éditoriale imposée
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <SolarIcon icon="users-group-two-rounded-bold" className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong className="text-foreground">Gouvernance communautaire</strong> : vous décidez de l'évolution de la plateforme
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <SolarIcon icon="shield-check-bold" className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs">
                    <strong className="text-foreground">Vérification collaborative</strong> : la communauté valide et améliore les contenus
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-2 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                <Link href="/articles">
                  Explorer les articles
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="text-xs" asChild>
                <Link href="/projets">
                  Découvrir les projets
                </Link>
              </Button>
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
}

