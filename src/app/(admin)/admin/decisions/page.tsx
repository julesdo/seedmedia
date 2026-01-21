import { Suspense } from "react";
import { DecisionsClient } from "./DecisionsClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function DecisionsPage() {
  return (
    <Suspense fallback={<DecisionsSkeleton />}>
      <DecisionsClient />
    </Suspense>
  );
}

function DecisionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

