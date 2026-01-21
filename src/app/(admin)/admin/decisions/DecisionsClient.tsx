"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Page de gestion des décisions
 */
export function DecisionsClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const limit = 50;
  const [selectedDecision, setSelectedDecision] = useState<Id<"decisions"> | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolveResult, setResolveResult] = useState<"yes" | "no">("yes");

  const decisions = useQuery(api.decisions.getDecisions, {
    limit,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    type: typeFilter !== "all" ? (typeFilter as any) : undefined,
  });

  const deleteDecision = useMutation(api.admin.deleteDecision);
  const resolveDecision = useMutation(api.admin.resolveDecision);

  const filteredDecisions = decisions?.filter((decision) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        decision.title.toLowerCase().includes(query) ||
        decision.question.toLowerCase().includes(query) ||
        decision.decider.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  const handleDelete = async () => {
    if (!selectedDecision) return;

    try {
      await deleteDecision({ decisionId: selectedDecision });
      toast.success("Décision supprimée avec succès");
      setShowDeleteDialog(false);
      setSelectedDecision(null);
    } catch (error: any) {
      toast.error(`Erreur : ${error.message}`);
    }
  };

  const handleResolve = async () => {
    if (!selectedDecision) return;

    try {
      await resolveDecision({
        decisionId: selectedDecision,
        result: resolveResult,
      });
      toast.success("Décision résolue avec succès");
      setShowResolveDialog(false);
      setSelectedDecision(null);
    } catch (error: any) {
      toast.error(`Erreur : ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Décisions</h2>
          <p className="text-muted-foreground">
            Gérer toutes les décisions de l'application
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/decisions/new">
            <SolarIcon icon="add-circle-bold" className="size-4 mr-2" />
            Créer une décision
          </Link>
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Recherche</Label>
              <Input
                placeholder="Rechercher par titre, question ou décideur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="announced">Annoncées</SelectItem>
                  <SelectItem value="tracking">En suivi</SelectItem>
                  <SelectItem value="resolved">Résolues</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="law">Loi</SelectItem>
                  <SelectItem value="sanction">Sanction</SelectItem>
                  <SelectItem value="tax">Taxe</SelectItem>
                  <SelectItem value="agreement">Accord</SelectItem>
                  <SelectItem value="policy">Politique</SelectItem>
                  <SelectItem value="regulation">Réglementation</SelectItem>
                  <SelectItem value="crisis">Crise</SelectItem>
                  <SelectItem value="disaster">Catastrophe</SelectItem>
                  <SelectItem value="conflict">Conflit</SelectItem>
                  <SelectItem value="discovery">Découverte</SelectItem>
                  <SelectItem value="election">Élection</SelectItem>
                  <SelectItem value="economic_event">Événement économique</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des décisions</CardTitle>
          <CardDescription>
            {filteredDecisions.length} décision{filteredDecisions.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {decisions === undefined ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : filteredDecisions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune décision trouvée
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Titre</TableHead>
                      <TableHead className="min-w-[250px]">Question</TableHead>
                      <TableHead className="min-w-[100px]">Statut</TableHead>
                      <TableHead className="min-w-[120px]">Type</TableHead>
                      <TableHead className="min-w-[150px]">Décideur</TableHead>
                      <TableHead className="min-w-[120px]">Créée le</TableHead>
                      <TableHead className="min-w-[150px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDecisions.map((decision) => (
                      <TableRow key={decision._id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {decision.title}
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                          {decision.question}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant={
                              decision.status === "resolved"
                                ? "default"
                                : decision.status === "tracking"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {decision.status === "resolved"
                              ? "Résolue"
                              : decision.status === "tracking"
                              ? "En suivi"
                              : "Annoncée"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline">{decision.type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">{decision.decider}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(decision.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <Link href={`/admin/decisions/${decision._id}`}>
                                <SolarIcon icon="pen-bold" className="size-4" />
                              </Link>
                            </Button>
                            {decision.status !== "resolved" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedDecision(decision._id);
                                  setShowResolveDialog(true);
                                }}
                              >
                                <SolarIcon icon="check-circle-bold" className="size-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDecision(decision._id);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <SolarIcon icon="trash-bin-trash-bold" className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la décision</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette décision ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de résolution */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Résoudre la décision</DialogTitle>
            <DialogDescription>
              Choisissez le résultat de cette décision.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Résultat</Label>
              <Select
                value={resolveResult}
                onValueChange={(value) => setResolveResult(value as "yes" | "no")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">OUI</SelectItem>
                  <SelectItem value="no">NON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleResolve}>
              Résoudre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

