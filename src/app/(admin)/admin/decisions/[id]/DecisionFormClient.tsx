"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DecisionForm } from "../DecisionForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface DecisionFormClientProps {
  decisionId: string;
}

export function DecisionFormClient({ decisionId }: DecisionFormClientProps) {
  const decision = useQuery(api.decisions.getDecisionById, {
    decisionId: decisionId as Id<"decisions">,
  });

  if (decision === undefined) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Décision non trouvée</h2>
          <p className="text-muted-foreground">
            La décision que vous recherchez n'existe pas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Modifier la décision</h2>
        <p className="text-muted-foreground">
          {decision.title}
        </p>
      </div>

      <DecisionForm decisionId={decision._id} initialData={decision} />
    </div>
  );
}

