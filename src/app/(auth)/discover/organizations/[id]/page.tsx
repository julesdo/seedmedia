"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { useTransitionRouter } from "next-view-transitions";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";
import { OrganizationHeader } from "@/components/organization/OrganizationHeader";
import { FeedTab } from "@/components/organization/FeedTab";
import { ArticlesTab } from "@/components/organization/ArticlesTab";
import { ProjectsTab } from "@/components/organization/ProjectsTab";
import { ActionsTab } from "@/components/organization/ActionsTab";
import { MembersTab } from "@/components/organization/MembersTab";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useTransitionRouter();
  const organizationId = params.id as Id<"organizations">;
  const [activeTab, setActiveTab] = useState("feed");

  // Récupérer les données publiques
  const organization = useQuery(api.organizations.getOrganizationPublic, { organizationId });
  const stats = useQuery(api.organizations.getOrganizationStats, { organizationId });
  
  // Précharger toutes les données des tabs pour éviter les refetch à chaque changement
  // Convex gère les mises à jour en temps réel, donc ces queries restent actives
  const articles = useQuery(api.organizations.getOrganizationArticlesPublic, { organizationId });
  const projects = useQuery(api.organizations.getOrganizationProjectsPublic, { organizationId });
  const actions = useQuery(api.organizations.getOrganizationActionsPublic, { organizationId });
  
  // Pour MembersTab, on a besoin de l'organisation complète si l'utilisateur est membre
  // Utiliser une query conditionnelle avec "skip" si l'utilisateur n'est pas membre
  const organizationWithMembers = useQuery(
    api.organizations.getOrganization,
    organization?.isMember ? { organizationId } : "skip"
  );


  // États de chargement
  if (organization === undefined || stats === undefined) {
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

  // Organisation non trouvée
  if (organization === null) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-gradient-light">Organisation non trouvée</h1>
            <p className="text-muted-foreground opacity-70">
              L'organisation que vous recherchez n'existe pas ou a été supprimée.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="space-y-6">
        {/* Header avec logo, nom, description, badges, stats intégrées, boutons d'action et onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          <OrganizationHeader 
            organization={organization} 
            stats={stats || null}
            isMember={organization.isMember}
            canEdit={organization.canEdit}
            onEdit={() => router.push(`/discover/organizations/${organizationId}/settings`)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Contenu des onglets */}
          <div className="pt-6">
            <TabsContent value="feed" className="mt-0">
              <FeedTab 
                articles={articles}
                projects={projects}
                actions={actions}
              />
            </TabsContent>

            <TabsContent value="articles" className="mt-0">
              <ArticlesTab articles={articles} />
            </TabsContent>

            <TabsContent value="projects" className="mt-0">
              <ProjectsTab projects={projects} />
            </TabsContent>

            <TabsContent value="actions" className="mt-0">
              <ActionsTab actions={actions} />
            </TabsContent>

            {organization.isMember && (
              <TabsContent value="members" className="mt-0">
                <MembersTab
                  isMember={organization.isMember}
                  canInvite={organization.canInvite}
                  members={organizationWithMembers?.members}
                />
              </TabsContent>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}

