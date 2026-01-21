import { Suspense } from "react";
import { AdminClient } from "./AdminClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminClient />
    </Suspense>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-6 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

