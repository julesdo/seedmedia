"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { useTransitionRouter } from "next-view-transitions";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { UserHeader } from "@/components/user/UserHeader";
import { UserArticlesTab } from "@/components/user/UserArticlesTab";
import { UserContributionsTab } from "@/components/user/UserContributionsTab";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function UserProfilePage() {
  const params = useParams();
  const router = useTransitionRouter();
  const userId = params.id as Id<"users">;
  const [activeTab, setActiveTab] = useState("articles");

  // Récupérer les données publiques
  const user = useQuery(api.users.getUserPublic, { userId });
  const stats = useQuery(api.users.getUserStats, { userId });
  
  // Précharger toutes les données des tabs
  const articles = useQuery(api.users.getUserArticlesPublic, { userId });
  const corrections = useQuery(api.users.getUserCorrectionsPublic, { userId });

  // États de chargement
  if (user === undefined || stats === undefined) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="space-y-8">
          {/* Header skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <div className="p-4 space-y-2">
                  <Skeleton className="h-8 w-8 mx-auto" />
                  <Skeleton className="h-6 w-12 mx-auto" />
                  <Skeleton className="h-4 w-16 mx-auto" />
                </div>
              </Card>
            ))}
          </div>

          {/* Tabs skeleton */}
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // Utilisateur non trouvé
  if (user === null) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-gradient-light">Utilisateur non trouvé</h1>
            <p className="text-muted-foreground opacity-70">
              L'utilisateur que vous recherchez n'existe pas ou a été supprimé.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="space-y-6">
        {/* Header avec avatar, nom, description, badges, stats intégrées, boutons d'action et onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          <UserHeader 
            user={user}
            stats={stats || null}
            isOwnProfile={user.isOwnProfile}
            onEdit={user.isOwnProfile ? () => router.push(`/studio/profile`) : undefined}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Contenu des onglets */}
          <div className="pt-6">
            <TabsContent value="articles" className="mt-0">
              <UserArticlesTab articles={articles} />
            </TabsContent>

            <TabsContent value="contributions" className="mt-0">
              <UserContributionsTab corrections={corrections} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

