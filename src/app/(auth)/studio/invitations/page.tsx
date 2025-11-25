"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useTransitionRouter } from "next-view-transitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { toast } from "sonner";
import { Link } from "next-view-transitions";
import { cn } from "@/lib/utils";

export default function InvitationsPage() {
  const router = useTransitionRouter();
  const invitations = useQuery(api.invitations.getUserInvitations);
  const acceptInvitation = useMutation(api.invitations.acceptInvitation);
  const rejectInvitation = useMutation(api.invitations.rejectInvitation);

  const handleAccept = async (token: string, organizationId: string) => {
    try {
      await acceptInvitation({ token });
      toast.success("Invitation acceptée ! Vous êtes maintenant membre de l'organisation.");
      router.push(`/discover/organizations/${organizationId}`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'acceptation de l'invitation");
    }
  };

  const handleReject = async (token: string) => {
    try {
      await rejectInvitation({ token });
      toast.success("Invitation refusée");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du refus de l'invitation");
    }
  };

  if (invitations === undefined) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === "pending");
  const expiredInvitations = invitations.filter((inv) => inv.status === "expired");
  const acceptedInvitations = invitations.filter((inv) => inv.status === "accepted");
  const rejectedInvitations = invitations.filter((inv) => inv.status === "rejected");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes invitations</h1>
        <p className="text-muted-foreground mt-2">
          Gérez toutes vos invitations à rejoindre des organisations
        </p>
      </div>

      {invitations.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SolarIcon icon="mailbox-bold" className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Aucune invitation</EmptyTitle>
            <EmptyDescription>
              Vous n'avez pas encore reçu d'invitations à rejoindre des organisations.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {pendingInvitations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Invitations en attente ({pendingInvitations.length})
              </h2>
              {pendingInvitations.map((invitation) => (
                <Card key={invitation._id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {invitation.organization && (
                        <>
                          <Link href={`/discover/organizations/${invitation.organization._id}`}>
                            <Avatar className="h-16 w-16 ring-2 ring-border/50 hover:ring-primary/30 transition-colors cursor-pointer">
                              <AvatarImage
                                src={invitation.organization.logo || undefined}
                                alt={invitation.organization.name}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-xl font-semibold">
                                {invitation.organization.name[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <Link href={`/discover/organizations/${invitation.organization._id}`}>
                                  <h3 className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer">
                                    {invitation.organization.name}
                                  </h3>
                                </Link>
                                {invitation.organization.description && (
                                  <p className="text-sm text-muted-foreground/80 mt-1 line-clamp-2">
                                    {invitation.organization.description}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "shrink-0",
                                  invitation.role === "admin"
                                    ? "bg-blue-500/20 text-blue-500 border-blue-500/30"
                                    : "bg-muted/50"
                                )}
                              >
                                {invitation.role === "admin" ? "Administrateur" : "Membre"}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mt-3">
                              <SolarIcon icon="calendar-bold" className="h-3.5 w-3.5" />
                              <span>
                                Expire le {new Date(invitation.expiresAt).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 mt-4">
                              <Button
                                size="sm"
                                onClick={() => handleAccept(invitation.token, invitation.organization!._id)}
                              >
                                <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-2" />
                                Accepter
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(invitation.token)}
                              >
                                <SolarIcon icon="close-circle-bold" className="h-4 w-4 mr-2" />
                                Refuser
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {acceptedInvitations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Invitations acceptées ({acceptedInvitations.length})
              </h2>
              {acceptedInvitations.map((invitation) => (
                <Card key={invitation._id} className="opacity-70 hover:opacity-100 transition-opacity">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {invitation.organization && (
                        <>
                          <Link href={`/discover/organizations/${invitation.organization._id}`}>
                            <Avatar className="h-16 w-16 ring-2 ring-border/50 hover:ring-primary/30 transition-colors cursor-pointer">
                              <AvatarImage
                                src={invitation.organization.logo || undefined}
                                alt={invitation.organization.name}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-xl font-semibold">
                                {invitation.organization.name[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <Link href={`/organizations/${invitation.organization._id}`}>
                                  <h3 className="text-lg font-semibold hover:text-primary transition-colors cursor-pointer">
                                    {invitation.organization.name}
                                  </h3>
                                </Link>
                                {invitation.organization.description && (
                                  <p className="text-sm text-muted-foreground/80 mt-1 line-clamp-2">
                                    {invitation.organization.description}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
                                Acceptée
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mt-3">
                              <SolarIcon icon="calendar-bold" className="h-3.5 w-3.5" />
                              <span>
                                Acceptée le {new Date(invitation.updatedAt || invitation.createdAt).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {rejectedInvitations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Invitations refusées ({rejectedInvitations.length})
              </h2>
              {rejectedInvitations.map((invitation) => (
                <Card key={invitation._id} className="opacity-60">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {invitation.organization && (
                        <>
                          <Avatar className="h-16 w-16 ring-2 ring-border/50">
                            <AvatarImage
                              src={invitation.organization.logo || undefined}
                              alt={invitation.organization.name}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-xl font-semibold">
                              {invitation.organization.name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {invitation.organization.name}
                                </h3>
                                {invitation.organization.description && (
                                  <p className="text-sm text-muted-foreground/80 mt-1 line-clamp-2">
                                    {invitation.organization.description}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className="bg-red-500/20 text-red-500 border-red-500/30">
                                Refusée
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mt-3">
                              <SolarIcon icon="calendar-bold" className="h-3.5 w-3.5" />
                              <span>
                                Refusée le {new Date(invitation.updatedAt || invitation.createdAt).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {expiredInvitations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Invitations expirées ({expiredInvitations.length})
              </h2>
              {expiredInvitations.map((invitation) => (
                <Card key={invitation._id} className="opacity-60">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {invitation.organization && (
                        <>
                          <Avatar className="h-16 w-16 ring-2 ring-border/50">
                            <AvatarImage
                              src={invitation.organization.logo || undefined}
                              alt={invitation.organization.name}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-xl font-semibold">
                              {invitation.organization.name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {invitation.organization.name}
                                </h3>
                                {invitation.organization.description && (
                                  <p className="text-sm text-muted-foreground/80 mt-1 line-clamp-2">
                                    {invitation.organization.description}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline" className="bg-gray-500/20 text-gray-500 border-gray-500/30">
                                Expirée
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mt-3">
                              <SolarIcon icon="calendar-bold" className="h-3.5 w-3.5" />
                              <span>
                                Expirée le {new Date(invitation.expiresAt).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

