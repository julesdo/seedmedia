"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useState } from "react";
import { toast } from "sonner";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "next-view-transitions";
import { useTransitionRouter } from "next-view-transitions";

interface MembersManagementProps {
  organizationId: Id<"organizations">;
  canEdit?: boolean;
  canInvite?: boolean;
  role?: "owner" | "admin" | "member" | null;
}

export function MembersManagement({
  organizationId,
  canEdit,
  canInvite,
  role,
}: MembersManagementProps) {
  const router = useTransitionRouter();
  const [memberToRemove, setMemberToRemove] = useState<Id<"users"> | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [memberToTransfer, setMemberToTransfer] = useState<Id<"users"> | null>(null);

  const organization = useQuery(api.organizations.getOrganization, { organizationId });
  const removeMember = useMutation(api.members.removeMember);
  const updateMemberRole = useMutation(api.members.updateMemberRole);
  const leaveOrganization = useMutation(api.members.leaveOrganization);
  const transferOwnership = useMutation(api.organizations.transferOwnership);

  const handleRemoveMember = async (userId: Id<"users">) => {
    try {
      await removeMember({ organizationId, userId });
      toast.success("Membre retiré");
      setMemberToRemove(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du retrait du membre");
    }
  };

  const handleUpdateRole = async (userId: Id<"users">, newRole: "admin" | "member") => {
    try {
      await updateMemberRole({ organizationId, userId, role: newRole });
      toast.success("Rôle mis à jour");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour du rôle");
    }
  };

  const handleLeaveOrganization = async () => {
    try {
      await leaveOrganization({ organizationId });
      toast.success("Vous avez quitté l'organisation");
      setShowLeaveDialog(false);
      // Rediriger vers la page des organisations
      router.push("/organizations");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la sortie de l'organisation");
    }
  };

  const handleTransferOwnership = async (newOwnerId: Id<"users">) => {
    try {
      await transferOwnership({ organizationId, newOwnerId });
      toast.success("Propriété transférée avec succès");
      setMemberToTransfer(null);
      // Recharger la page pour voir les changements
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du transfert de propriété");
    }
  };

  if (organization === undefined) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const members = organization?.members || [];

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

  const roleLabels: Record<string, string> = {
    owner: "Propriétaire",
    admin: "Administrateur",
    member: "Membre",
  };

  const roleColors: Record<string, string> = {
    owner: "bg-primary/20 text-primary border-primary/30",
    admin: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    member: "",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-gradient-light">Membres</CardTitle>
            <CardDescription>
              {members.length} membre{members.length > 1 ? "s" : ""} dans cette organisation
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-4 rounded-lg bg-background border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Link href={`/profile/${member.userId}`}>
                    <Avatar className="h-10 w-10 ring-2 ring-border/50 hover:ring-primary/30 transition-colors cursor-pointer">
                      <AvatarImage
                        src={member.user?.image || undefined}
                        alt={member.user?.name || member.user?.email || ""}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-gradient-light">
                        {member.user?.name?.[0]?.toUpperCase() ||
                          member.user?.email?.[0]?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link href={`/profile/${member.userId}`}>
                      <div className="font-medium text-gradient-light hover:text-primary transition-colors cursor-pointer">
                        {member.user?.name || member.user?.email || "Utilisateur"}
                      </div>
                    </Link>
                    <div className="text-sm text-muted-foreground opacity-70">
                      {member.user?.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={roleColors[member.role] || ""}>
                    {roleLabels[member.role]}
                  </Badge>
                  {canEdit &&
                    member.role !== "owner" &&
                    (role === "owner" || (role === "admin" && member.role === "member")) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="glass" size="icon-sm">
                            <SolarIcon icon="menu-dots-bold" className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.role !== "admin" && role === "owner" && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateRole(member.userId, "admin")}
                            >
                              <SolarIcon icon="user-check-bold" className="h-4 w-4 mr-2" />
                              Promouvoir admin
                            </DropdownMenuItem>
                          )}
                          {member.role === "admin" && role === "owner" && (
                            <DropdownMenuItem
                              onClick={() => handleUpdateRole(member.userId, "member")}
                            >
                              <SolarIcon icon="user-minus-bold" className="h-4 w-4 mr-2" />
                              Rétrograder membre
                            </DropdownMenuItem>
                          )}
                          {role === "owner" && member.role !== "owner" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setMemberToTransfer(member.userId)}
                                className="text-primary"
                              >
                                <SolarIcon icon="crown-bold" className="h-4 w-4 mr-2" />
                                Transférer la propriété
                              </DropdownMenuItem>
                            </>
                          )}
                          {member.role !== "owner" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setMemberToRemove(member.userId)}
                                className="text-destructive"
                              >
                                <SolarIcon icon="user-cross-bold" className="h-4 w-4 mr-2" />
                                Retirer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert Dialog pour retirer un membre */}
      <AlertDialog
        open={memberToRemove !== null}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gradient-light">Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action retirera le membre de l'organisation. Il pourra toujours être réinvité plus tard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Section "Quitter l'organisation" pour les membres non-propriétaires */}
      {role && role !== "owner" && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-gradient-light text-destructive">Zone de danger</CardTitle>
            <CardDescription>
              Actions irréversibles concernant votre appartenance à cette organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="space-y-1">
                  <div className="font-medium text-destructive">Quitter l'organisation</div>
                  <div className="text-sm text-muted-foreground">
                    Vous perdrez l'accès à cette organisation et à toutes ses ressources.
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowLeaveDialog(true)}
                  icon="logout-bold"
                >
                  Quitter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Dialog pour quitter l'organisation */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gradient-light">Quitter l'organisation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Vous perdrez l'accès à cette organisation et à toutes ses ressources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveOrganization}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Quitter l'organisation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog pour transférer la propriété */}
      <AlertDialog
        open={memberToTransfer !== null}
        onOpenChange={(open) => !open && setMemberToTransfer(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gradient-light">Transférer la propriété ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Vous transférerez la propriété de l'organisation à ce membre.
              Vous deviendrez administrateur et perdrez les droits de propriétaire (suppression de l'organisation, etc.).
              {memberToTransfer && (
                <span className="block mt-2 font-semibold">
                  Nouveau propriétaire : {members.find(m => m.userId === memberToTransfer)?.user?.name || members.find(m => m.userId === memberToTransfer)?.user?.email || "Membre"}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => memberToTransfer && handleTransferOwnership(memberToTransfer)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Transférer la propriété
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

