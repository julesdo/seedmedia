"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * Page de gestion des événements spéciaux
 */
export function SpecialEventsClient() {
  const router = useRouter();
  const events = useQuery(api.admin.getAllSpecialEvents, {});
  const deleteEvent = useMutation(api.admin.deleteSpecialEvent);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Id<"specialEvents"> | null>(null);

  const handleDelete = async () => {
    if (!eventToDelete) return;

    try {
      await deleteEvent({ eventId: eventToDelete });
      toast.success("Événement spécial supprimé");
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
    } catch (error: any) {
      toast.error(`Erreur : ${error.message}`);
    }
  };

  const getEventStatus = (event: any) => {
    const now = Date.now();
    if (event.startDate && event.startDate > now) {
      return { label: "À venir", variant: "secondary" as const };
    }
    if (event.endDate && event.endDate < now) {
      return { label: "Terminé", variant: "outline" as const };
    }
    return { label: "En cours", variant: "default" as const };
  };

  if (events === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Événements spéciaux</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les événements spéciaux et leurs règles de cohorte
          </p>
        </div>
        <Button onClick={() => router.push("/admin/config/special-events/new")}>
          <SolarIcon icon="add-circle-bold" className="size-4 mr-2" />
          Créer un événement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des événements spéciaux</CardTitle>
          <CardDescription>
            {events.length} événement{events.length > 1 ? "s" : ""} spécial{events.length > 1 ? "aux" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Nom</TableHead>
                  <TableHead className="min-w-[150px]">Slug</TableHead>
                  <TableHead className="min-w-[120px]">Statut</TableHead>
                  <TableHead className="min-w-[150px]">Dates</TableHead>
                  <TableHead className="min-w-[100px]">Priorité</TableHead>
                  <TableHead className="min-w-[100px]">Mise en avant</TableHead>
                  <TableHead className="min-w-[150px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Aucun événement spécial
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => {
                    const status = getEventStatus(event);
                    return (
                      <TableRow key={event._id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          <code className="text-xs">{event.slug}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {event.startDate ? (
                            <div>
                              {new Date(event.startDate).toLocaleDateString("fr-FR")}
                              {event.endDate && (
                                <> - {new Date(event.endDate).toLocaleDateString("fr-FR")}</>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{event.priority ?? 0}</TableCell>
                        <TableCell>
                          {event.featured ? (
                            <Badge variant="default">Oui</Badge>
                          ) : (
                            <span className="text-muted-foreground">Non</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/config/special-events/${event._id}`)}
                            >
                              <SolarIcon icon="pen-bold" className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEventToDelete(event._id);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <SolarIcon icon="trash-bin-trash-bold" className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'événement spécial</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet événement spécial ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

