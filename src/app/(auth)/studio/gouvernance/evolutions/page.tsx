"use client";

import * as React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";

const EVOLUTION_TYPE_LABELS = {
  vote_parameters: "Paramètres de vote",
  credibility_rules: "Règles de crédibilité",
  role_permissions: "Permissions de rôle",
  content_rules: "Règles de contenu",
  other: "Autre",
} as const;

const STATUS_LABELS = {
  pending: "En attente",
  active: "Active",
  rejected: "Rejetée",
  superseded: "Remplacée",
} as const;

const STATUS_VARIANTS = {
  pending: "secondary",
  active: "default",
  rejected: "destructive",
  superseded: "outline",
} as const;

export default function EvolutionsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>("pending");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [selectedEvolution, setSelectedEvolution] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const evolutions = useQuery(api.governanceEvolution.getAllEvolutions, {
    status: statusFilter as any,
    evolutionType: typeFilter as any,
    limit: 50,
  });
  const currentUser = useQuery(api.users.getCurrentUser);

  const approveEvolution = useMutation(api.governanceEvolution.approveAndApplyEvolution);
  const rejectEvolution = useMutation(api.governanceEvolution.rejectEvolution);

  const handleApprove = async () => {
    if (!selectedEvolution) return;

    try {
      await approveEvolution({ evolutionId: selectedEvolution as any });
      toast.success("Évolution approuvée et appliquée avec succès");
      setSelectedEvolution(null);
      setActionType(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'approbation");
    }
  };

  const handleReject = async () => {
    if (!selectedEvolution) return;

    try {
      await rejectEvolution({ evolutionId: selectedEvolution as any });
      toast.success("Évolution rejetée");
      setSelectedEvolution(null);
      setActionType(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du rejet");
    }
  };

  const isEditor = currentUser?.role === "editeur";

  // Calculer les statistiques
  const stats = React.useMemo(() => {
    if (!evolutions) return { total: 0, pending: 0, active: 0, rejected: 0 };
    
    return {
      total: evolutions.length,
      pending: evolutions.filter((e: any) => e.status === "pending").length,
      active: evolutions.filter((e: any) => e.status === "active").length,
      rejected: evolutions.filter((e: any) => e.status === "rejected").length,
    };
  }, [evolutions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Évolutions de gouvernance</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les propositions d'évolution des règles de gouvernance
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <SolarIcon icon="settings-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <SolarIcon icon="clock-circle-bold" className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
            <SolarIcon icon="close-circle-bold" className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

        {!isEditor && (
          <Alert>
            <SolarIcon icon="info-circle-bold" className="h-4 w-4" />
            <AlertDescription>
              Seuls les éditeurs peuvent approuver ou rejeter les évolutions.
            </AlertDescription>
          </Alert>
        )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <Select
                value={statusFilter || "none"}
                onValueChange={(value) => setStatusFilter(value === "none" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="rejected">Rejetée</SelectItem>
                  <SelectItem value="superseded">Remplacée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={typeFilter || "none"}
                onValueChange={(value) => setTypeFilter(value === "none" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tous les types</SelectItem>
                  <SelectItem value="vote_parameters">Paramètres de vote</SelectItem>
                  <SelectItem value="credibility_rules">Règles de crédibilité</SelectItem>
                  <SelectItem value="role_permissions">Permissions de rôle</SelectItem>
                  <SelectItem value="content_rules">Règles de contenu</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des évolutions */}
      {evolutions === undefined ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      ) : evolutions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <SolarIcon
              icon="settings-bold"
              className="h-12 w-12 mx-auto text-muted-foreground mb-4"
            />
            <h3 className="text-lg font-semibold mb-2">Aucune évolution</h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter
                ? `Aucune évolution avec le statut "${STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS]}"`
                : "Aucune évolution trouvée"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Évolutions</CardTitle>
            <CardDescription>
              {evolutions.length} évolution{evolutions.length > 1 ? "s" : ""} trouvée{evolutions.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Proposé par</TableHead>
                    <TableHead>Date</TableHead>
                    {isEditor && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evolutions.map((evolution: any) => (
                    <TableRow key={evolution._id}>
                      <TableCell>
                        <Badge variant="outline">
                          {EVOLUTION_TYPE_LABELS[evolution.evolutionType as keyof typeof EVOLUTION_TYPE_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {evolution.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_VARIANTS[evolution.status as keyof typeof STATUS_VARIANTS] as any
                          }
                        >
                          {STATUS_LABELS[evolution.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {evolution.proposer?.name || "Anonyme"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(evolution.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </TableCell>
                      {isEditor && (
                        <TableCell className="text-right">
                          {evolution.status === "pending" && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedEvolution(evolution._id);
                                  setActionType("approve");
                                }}
                              >
                                <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-2" />
                                Approuver
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedEvolution(evolution._id);
                                  setActionType("reject");
                                }}
                              >
                                <SolarIcon icon="close-circle-bold" className="h-4 w-4 mr-2" />
                                Rejeter
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmation */}
      <AlertDialog
        open={selectedEvolution !== null && actionType !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEvolution(null);
            setActionType(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approuver l'évolution" : "Rejeter l'évolution"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? "Êtes-vous sûr de vouloir approuver et appliquer cette évolution ? Les anciennes évolutions du même type seront remplacées."
                : "Êtes-vous sûr de vouloir rejeter cette évolution ? Cette action est irréversible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={actionType === "approve" ? handleApprove : handleReject}
              className={actionType === "reject" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {actionType === "approve" ? "Approuver" : "Rejeter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
