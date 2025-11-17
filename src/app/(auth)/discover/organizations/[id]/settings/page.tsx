"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettings } from "@/components/organization/settings/GeneralSettings";
import { MembersManagement } from "@/components/organization/settings/MembersManagement";
import { InvitationsManagement } from "@/components/organization/settings/InvitationsManagement";

export default function OrganizationSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.id as Id<"organizations">;

  // Vérifier que l'utilisateur est membre et a les permissions
  const organization = useQuery(api.organizations.getOrganizationPublic, { organizationId });

  // État de chargement
  if (organization === undefined) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="space-y-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-full" />
          <Card>
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
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
            <Button variant="accent" onClick={() => router.push("/organizations")}>
              Retour aux organisations
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Vérifier les permissions - doit être membre avec droits d'édition ou d'invitation
  if (!organization.isMember || (!organization.canEdit && !organization.canInvite)) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <SolarIcon icon="lock-password-bold" className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
            <h1 className="text-2xl font-bold text-gradient-light">Accès refusé</h1>
            <p className="text-muted-foreground opacity-70 max-w-md">
              Vous n'avez pas les permissions nécessaires pour accéder aux paramètres de cette organisation.
              Seuls les membres avec les droits d'administration peuvent accéder à cette page.
            </p>
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="glass" onClick={() => router.push(`/discover/organizations/${organizationId}`)}>
                <SolarIcon icon="arrow-left-bold" className="h-4 w-4 mr-2" />
                Retour au profil
              </Button>
              <Button variant="accent" onClick={() => router.push("/organizations")}>
                Mes organisations
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="glass"
                size="icon-sm"
                onClick={() => router.push(`/discover/organizations/${organizationId}`)}
              >
                <SolarIcon icon="arrow-left-bold" className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold text-gradient-light">Paramètres</h1>
            </div>
            <p className="text-muted-foreground opacity-70">
              Gérez les paramètres et les membres de {organization.name}
            </p>
          </div>
        </div>

        <Separator />

        {/* Onglets */}
        <Tabs defaultValue={organization.canEdit ? "general" : "members"} className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
            {organization.canEdit && <TabsTrigger value="general">Général</TabsTrigger>}
            <TabsTrigger value="members">Membres</TabsTrigger>
            {organization.canInvite && <TabsTrigger value="invitations">Invitations</TabsTrigger>}
          </TabsList>

          {organization.canEdit && (
            <TabsContent value="general">
              <GeneralSettings organizationId={organizationId} organization={organization} />
            </TabsContent>
          )}

          <TabsContent value="members">
            <MembersManagement
              organizationId={organizationId}
              canEdit={organization.canEdit}
              canInvite={organization.canInvite}
              role={organization.role}
            />
          </TabsContent>

          {organization.canInvite && (
            <TabsContent value="invitations">
              <InvitationsManagement organizationId={organizationId} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

