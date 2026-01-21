import { Suspense } from "react";
import { DecisionForm } from "../DecisionForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function NewDecisionPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Créer une nouvelle décision</h2>
        <p className="text-muted-foreground">
          Remplissez le formulaire pour créer une nouvelle décision
        </p>
      </div>

      <Suspense fallback={<DecisionFormSkeleton />}>
        <DecisionForm />
      </Suspense>
    </div>
  );
}

function DecisionFormSkeleton() {
  return (
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
  );
}

