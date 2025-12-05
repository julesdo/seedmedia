"use client";

import { Button } from "@/components/ui/button";
import { Link } from "next-view-transitions";
import { useConvexAuth } from "convex/react";

export function HomeHero() {
  const { isAuthenticated } = useConvexAuth();

  return (
    <section className="relative border-b border-border/40 bg-gradient-to-b from-background to-muted/20 py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Seed
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Plus qu'un média de la résilience technologique, Seed est une plateforme d'information et d'utilité publique où la communauté publie, organise, vérifie et fait évoluer les contenus grâce à une gouvernance partagée.
          </p>
          <p className="text-sm text-muted-foreground/80 max-w-2xl mx-auto">
            Pas d'algos opaques, pas de ligne éditoriale imposée.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/articles">Explorer</Link>
            </Button>
            {!isAuthenticated && (
              <Button variant="outline" size="lg" asChild>
                <Link href="/sign-up">Rejoindre Seed</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

