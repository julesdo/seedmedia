"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DecisionDetail } from "@/components/decisions/DecisionDetail";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

interface DecisionDetailClientProps {
  slug: string;
}

export function DecisionDetailClient({ slug }: DecisionDetailClientProps) {
  const decision = useQuery(api.decisions.getDecisionBySlug, { slug });

  // Afficher immédiatement le skeleton (navigation optimiste)
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

  // Toujours utiliser la vue détail responsive (mobile et desktop)
  return (
    <div className="w-full">
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-150">
          <Skeleton className="aspect-video w-full mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      }>
        <DecisionDetail decisionId={decision._id} />
      </Suspense>
    </div>
  );
}

