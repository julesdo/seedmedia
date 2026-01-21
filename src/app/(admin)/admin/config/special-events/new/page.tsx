import { Suspense } from "react";
import { SpecialEventFormClient } from "../SpecialEventFormClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function NewSpecialEventPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Créer un nouvel événement spécial</h2>
        <p className="text-muted-foreground">
          Remplissez le formulaire pour créer un nouvel événement spécial
        </p>
      </div>

      <Suspense fallback={<SpecialEventFormSkeleton />}>
        <SpecialEventFormClient />
      </Suspense>
    </div>
  );
}

function SpecialEventFormSkeleton() {
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

