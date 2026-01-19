"use client";

import { Suspense } from "react";
import { PortfolioClient } from "./PortfolioClient";
import { Skeleton } from "@/components/ui/skeleton";

function PortfolioPageContent() {
  return <PortfolioClient />;
}

export default function PortfolioPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      }
    >
      <PortfolioPageContent />
    </Suspense>
  );
}

