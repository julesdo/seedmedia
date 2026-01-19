"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DecisionDetail } from "@/components/decisions/DecisionDetail";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Skeleton pour le feed reel qui ressemble exactement à l'UI finale (sans texte)
function ReelFeedSkeleton() {
  return (
    <div className="fixed inset-0 z-50 lg:hidden bg-background">
      {/* Image de fond skeleton */}
      <div className="absolute inset-0">
        <Skeleton className="w-full h-full rounded-none" />
        {/* Overlay gradient progressif style TikTok - Plus foncé vers le bas - Utilise la couleur de bg */}
        {/* Au niveau du titre (50-60%), overlay suffisamment sombre pour la lecture, puis de plus en plus foncé */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, 
              hsl(var(--background) / 0.95) 0%,
              hsl(var(--background) / 0.92) 15%,
              hsl(var(--background) / 0.85) 30%,
              hsl(var(--background) / 0.75) 45%,
              hsl(var(--background) / 0.70) 55%,
              hsl(var(--background) / 0.60) 65%,
              hsl(var(--background) / 0.45) 75%,
              hsl(var(--background) / 0.30) 85%,
              hsl(var(--background) / 0.15) 95%,
              hsl(var(--background) / 0.05) 100%
            )`
          }}
        />
      </div>

      {/* Contenu superposé */}
      <div className="relative h-full flex flex-col">
        {/* Header skeleton - Exactement comme l'UI */}
        <header className="sticky top-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 via-black/40 to-transparent backdrop-blur-sm">
          {/* Bouton retour */}
          <Skeleton className="h-10 w-10 rounded-full bg-black/40" />
          
          {/* Badges au centre - Deux badges orange + badge gris */}
          <div className="flex items-center gap-2">
            {/* Badge orange avec icône */}
            <Skeleton className="h-6 w-12 rounded-full bg-orange-500/30" />
            {/* Badge orange avec icône */}
            <Skeleton className="h-6 w-12 rounded-full bg-orange-500/30" />
            {/* Badge gris "Annoncée" */}
            <Skeleton className="h-5 w-16 rounded-full bg-gray-500/30" />
          </div>
          
          {/* Save button */}
          <Skeleton className="h-10 w-10 rounded-full bg-black/40" />
        </header>

        {/* Contenu principal skeleton */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 min-h-0">
          {/* Titre + métadonnées */}
          <div className="space-y-3">
            {/* Titre principal - 2-3 lignes */}
            <div className="space-y-2">
              <Skeleton className="h-7 w-full rounded bg-white/20" />
              <Skeleton className="h-7 w-4/5 rounded bg-white/20" />
            </div>
            {/* Métadonnées (décideur • temps) */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20 rounded bg-white/20" />
              <Skeleton className="h-4 w-1 rounded bg-white/20" />
              <Skeleton className="h-4 w-24 rounded bg-white/20" />
            </div>
          </div>

          {/* Card Quiz - Semi-transparente avec bordure */}
          <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-4">
            {/* Icône bleue circulaire en haut centre */}
            <div className="flex justify-center">
              <Skeleton className="h-8 w-8 rounded-full bg-blue-500/30" />
            </div>
            
            {/* Question skeleton */}
            <Skeleton className="h-5 w-full rounded bg-white/20" />
            <Skeleton className="h-5 w-5/6 rounded bg-white/20" />
            
            {/* Trois sections de réponses */}
            <div className="space-y-3">
              {/* Section Rouge (en haut) */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/20 border border-red-500/30">
                <Skeleton className="h-8 w-8 rounded-full bg-red-500/40" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-5 w-24 rounded bg-white/20" />
                  <Skeleton className="h-3.5 w-full rounded bg-white/15" />
                  <Skeleton className="h-3.5 w-4/5 rounded bg-white/15" />
                </div>
                <Skeleton className="h-5 w-5 rounded bg-white/20" />
              </div>
              
              {/* Section Jaune (milieu) */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                <Skeleton className="h-8 w-8 rounded-full bg-yellow-500/40" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-5 w-28 rounded bg-white/20" />
                  <Skeleton className="h-3.5 w-full rounded bg-white/15" />
                  <Skeleton className="h-3.5 w-3/4 rounded bg-white/15" />
                </div>
                <Skeleton className="h-5 w-5 rounded bg-white/20" />
              </div>
              
              {/* Section Verte (en bas) */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/20 border border-green-500/30">
                <Skeleton className="h-8 w-8 rounded-full bg-green-500/40" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-5 w-20 rounded bg-white/20" />
                  <Skeleton className="h-3.5 w-full rounded bg-white/15" />
                  <Skeleton className="h-3.5 w-5/6 rounded bg-white/15" />
                </div>
                <Skeleton className="h-5 w-5 rounded bg-white/20" />
              </div>
            </div>
          </div>

          {/* Texte descriptif en dessous */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full rounded bg-white/20" />
            <Skeleton className="h-4 w-full rounded bg-white/20" />
            <Skeleton className="h-4 w-3/4 rounded bg-white/20" />
          </div>
        </main>

        {/* Footer skeleton - Exactement comme l'UI */}
        <footer className="sticky bottom-0 z-20 flex items-center justify-between p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-md">
          <div className="flex items-center gap-4">
            {/* Logo 'N' */}
            <Skeleton className="h-10 w-10 rounded-full bg-black/40" />
            {/* Icône share */}
            <Skeleton className="h-10 w-10 rounded-full bg-black/40" />
          </div>
          {/* Compteur anticipations */}
          <Skeleton className="h-4 w-28 rounded bg-white/20" />
        </footer>
      </div>
    </div>
  );
}

// Lazy load DecisionReelFeed (lourd, seulement utilisé sur mobile)
const DecisionReelFeed = dynamic(
  () => import("@/components/decisions/DecisionReelFeed").then((mod) => ({ default: mod.DecisionReelFeed })),
  {
    loading: () => <ReelFeedSkeleton />,
    ssr: false, // Pas besoin de SSR pour ce composant (mobile uniquement)
  }
);

interface DecisionDetailClientProps {
  slug: string;
  initialDecisions?: any[]; // Décisions préchargées pour le feed reel
}

export function DecisionDetailClient({ slug, initialDecisions }: DecisionDetailClientProps) {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const decision = useQuery(api.decisions.getDecisionBySlug, { slug });

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Cacher top bar et bottom nav sur mobile pour cette page
  useEffect(() => {
    if (isMobile) {
      // Ajouter une classe au body pour cacher les éléments
      document.body.classList.add("hide-mobile-nav");
      return () => {
        document.body.classList.remove("hide-mobile-nav");
      };
    }
  }, [isMobile]);

  // Afficher immédiatement le skeleton (navigation optimiste)
  // Ne pas attendre que decision soit défini
  if (decision === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-150">
        <Skeleton className="aspect-video w-full mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!decision) {
    notFound();
  }

  // Sur mobile : utiliser le reel feed fullscreen
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 lg:hidden bg-background">
        <DecisionReelFeed
          initialDecisionId={decision._id}
          initialDecisions={initialDecisions}
          onBack={() => router.back()}
        />
      </div>
    );
  }

  // Sur desktop : utiliser la vue détail classique
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <DecisionDetail decisionId={decision._id} />
    </div>
  );
}

