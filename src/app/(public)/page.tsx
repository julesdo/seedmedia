import { Suspense } from "react";
import { HomePageClient } from "./HomePageClient";
import { Skeleton } from "@/components/ui/skeleton";
import { CachedHomePageHeader } from "@/components/cache/CachedHomePageHeader";

// PPR activé : Pas de revalidate/dynamic pour permettre PPR
// Le cache est géré via unstable_cache avec tags dans les Server Components
// Cela permet à Next.js de précalculer le shell statique et streamer les données dynamiques

function HomePageSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-12 max-w-7xl">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-96 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  // ✅ Nouveau design : MarketGrid avec grille responsive
  // Desktop : 3 colonnes | Tablet : 2 colonnes | Mobile : 1 colonne

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Masqué en mobile - Cached avec "use cache" */}
      <Suspense fallback={null}>
        <CachedHomePageHeader />
      </Suspense>

      {/* Contenu principal - Grille de marchés */}
      <Suspense fallback={<HomePageSkeleton />}>
        <HomePageClient />
      </Suspense>

      {/* Espace pour la bottom nav mobile */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}
