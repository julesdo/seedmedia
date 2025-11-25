"use client";

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Évolutions de gouvernance</h1>
          <p className="text-muted-foreground">
            Gérez les propositions d'évolution des règles de gouvernance
          </p>
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
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
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
          <div className="space-y-4">
            {evolutions.map((evolution: any) => (
              <Card key={evolution._id} className="border-l-4 border-l-transparent hover:border-l-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {EVOLUTION_TYPE_LABELS[evolution.evolutionType as keyof typeof EVOLUTION_TYPE_LABELS]}
                        </Badge>
                        <Badge
                          variant={
                            STATUS_VARIANTS[evolution.status as keyof typeof STATUS_VARIANTS] as any
                          }
                        >
                          {STATUS_LABELS[evolution.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {evolution.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {evolution.proposer && (
                          <span>
                            Proposé par {evolution.proposer.name}{" "}
                            {formatDistanceToNow(new Date(evolution.createdAt), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        )}
                        {evolution.approvedAt && evolution.approver && (
                          <>
                            <span>•</span>
                            <span>
                              {evolution.status === "rejected" ? "Rejetée" : "Approuvée"} par{" "}
                              {evolution.approver.name}{" "}
                              {formatDistanceToNow(new Date(evolution.approvedAt), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                          </>
                        )}
                        {evolution.appliedAt && evolution.applier && (
                          <>
                            <span>•</span>
                            <span>
                              Appliquée par {evolution.applier.name}{" "}
                              {formatDistanceToNow(new Date(evolution.appliedAt), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {isEditor && evolution.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
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
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
