"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DecisionDetail } from "@/components/decisions/DecisionDetail";
import { DecisionReelFeed } from "@/components/decisions/DecisionReelFeed";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DecisionDetailClientProps {
  slug: string;
}

export function DecisionDetailClient({ slug }: DecisionDetailClientProps) {
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

  if (decision === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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

