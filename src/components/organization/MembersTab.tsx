"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { MemberCard } from "./MemberCard";
import { Id } from "../../../convex/_generated/dataModel";

interface MembersTabProps {
  isMember?: boolean;
  canInvite?: boolean;
  members?: Array<{
    _id: Id<"users">;
    role: "owner" | "admin" | "member";
    joinedAt: number;
    user?: {
      _id: Id<"users">;
      email: string;
      name?: string;
      image?: string;
    };
  }> | undefined;
}

export function MembersTab({ isMember, canInvite, members }: MembersTabProps) {
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

  // Si les données ne sont pas encore chargées, ne rien afficher
  if (members === undefined) {
    return null;
  }

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

