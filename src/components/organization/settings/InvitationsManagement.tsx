"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";

interface InvitationsManagementProps {
  organizationId: Id<"organizations">;
}

export function InvitationsManagement({ organizationId }: InvitationsManagementProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [invitationToDelete, setInvitationToDelete] = useState<Id<"invitations"> | null>(null);

  const invitations = useQuery(api.invitations.getOrganizationInvitations, { organizationId });
  const inviteUser = useMutation(api.invitations.inviteUser);
  const deleteInvitation = useMutation(api.invitations.deleteInvitation);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Veuillez entrer un email");
      return;
    }

    setIsInviting(true);
    try {
      await inviteUser({
        organizationId,
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      toast.success("Invitation envoyée");
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("member");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi de l'invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: Id<"invitations">) => {
    try {
      await deleteInvitation({ invitationId });
      toast.success("Invitation supprimée");
      setInvitationToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  if (invitations === undefined) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    accepted: "Acceptée",
    rejected: "Refusée",
    expired: "Expirée",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    accepted: "bg-green-500/20 text-green-500 border-green-500/30",
    rejected: "bg-red-500/20 text-red-500 border-red-500/30",
    expired: "bg-gray-500/20 text-gray-500 border-gray-500/30",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gradient-light">Invitations</CardTitle>
              <CardDescription>
                Gérez les invitations à rejoindre cette organisation
              </CardDescription>
            </div>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="accent" icon="user-plus-bold">
                  Inviter un membre
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-gradient-light">Inviter un membre</DialogTitle>
                  <DialogDescription>
                    Envoyez une invitation par email pour rejoindre cette organisation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-gradient-light">Email</Label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gradient-light">Rôle</Label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                      className="w-full px-4 py-3 rounded-lg bg-background border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                    >
                      <option value="member">Membre</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="glass" onClick={() => setIsInviteDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button
                      variant="accent"
                      onClick={handleInvite}
                      disabled={isInviting}
                      icon="check-circle-bold"
                    >
                      {isInviting ? "Envoi..." : "Envoyer l'invitation"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {invitations && invitations.length > 0 ? (
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div
                  key={invitation._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gradient-light truncate">
                      {invitation.email}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={statusColors[invitation.status] || ""}>
                        {statusLabels[invitation.status]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {invitation.role === "admin" ? "Administrateur" : "Membre"}
                      </Badge>
                    </div>
                  </div>
                  {invitation.status === "pending" && (
                    <Button
                      variant="glass"
                      size="icon-sm"
                      onClick={() => setInvitationToDelete(invitation._id)}
                    >
                      <SolarIcon icon="close-circle-bold" className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SolarIcon icon="mailbox-bold" className="h-6 w-6" />
                </EmptyMedia>
                <EmptyTitle>Aucune invitation</EmptyTitle>
                <EmptyDescription>
                  Aucune invitation n'a été envoyée pour le moment.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      {/* Alert Dialog pour supprimer une invitation */}
      <AlertDialog
        open={invitationToDelete !== null}
        onOpenChange={(open) => !open && setInvitationToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gradient-light">
              Supprimer cette invitation ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement l'invitation. Vous pourrez toujours en envoyer une nouvelle plus tard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => invitationToDelete && handleDeleteInvitation(invitationToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

