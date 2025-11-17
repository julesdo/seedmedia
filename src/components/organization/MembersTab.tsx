"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { MemberCard } from "./MemberCard";

interface MembersTabProps {
  organizationId: Id<"organizations">;
  isMember?: boolean;
  canInvite?: boolean;
}

export function MembersTab({ organizationId, isMember, canInvite }: MembersTabProps) {
  // Pour l'instant, on récupère l'organisation avec ses membres
  const organization = useQuery(api.organizations.getOrganizationPublic, {
    organizationId,
  });

  if (organization === undefined) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Note: Pour l'instant, on ne peut pas récupérer les membres sans être membre
  // Il faudrait créer une fonction getOrganizationMembersPublic
  // Pour l'instant, on affiche un message si l'utilisateur n'est pas membre
  if (!isMember) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SolarIcon icon="users-group-two-rounded-bold" className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Membres privés</EmptyTitle>
          <EmptyDescription>
            Vous devez être membre de cette organisation pour voir la liste des membres.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  // Si membre, récupérer avec getOrganization qui inclut les membres
  const organizationWithMembers = useQuery(api.organizations.getOrganization, {
    organizationId,
  });

  const members = organizationWithMembers?.members || [];

  if (members.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SolarIcon icon="users-group-two-rounded-bold" className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Aucun membre</EmptyTitle>
          <EmptyDescription>
            Cette organisation n'a pas encore de membres.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((member) => (
        <MemberCard key={member._id} member={member} />
      ))}
    </div>
  );
}

