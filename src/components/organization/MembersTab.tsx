"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { MemberCard } from "./MemberCard";
import { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";

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

interface MembersTabProps {
  isMember?: boolean;
  canInvite?: boolean;
  organizationId?: Id<"organizations">;
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

export function MembersTab({ isMember, canInvite, organizationId, members }: MembersTabProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);

  const inviteUser = useMutation(api.invitations.inviteUser);

  const handleInvite = async () => {
    if (!organizationId) {
      toast.error("Organisation introuvable");
      return;
    }

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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gradient-light">Membres</CardTitle>
                <CardDescription>
                  Gérez les membres de cette organisation
                </CardDescription>
              </div>
              {canInvite && organizationId && (
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
              )}
            </div>
          </CardHeader>
        </Card>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gradient-light">Membres</CardTitle>
              <CardDescription>
                {members.length} membre{members.length > 1 ? "s" : ""} dans cette organisation
              </CardDescription>
            </div>
            {canInvite && organizationId && (
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
            )}
          </div>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <MemberCard key={member._id} member={member} />
        ))}
      </div>
    </div>
  );
}

