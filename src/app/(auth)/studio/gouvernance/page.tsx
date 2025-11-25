"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { extractTextFromPlateValue } from "@/components/articles/PlateEditorWrapper";
import type { TElement } from "platejs";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PROPOSAL_TYPE_LABELS = {
  editorial_rules: "Règles éditoriales",
  product_evolution: "Évolution du produit",
  ethical_charter: "Charte éthique",
  category_addition: "Ajout de catégories",
  expert_nomination: "Process de nomination des experts",
  other: "Autre",
} as const;

const STATUS_LABELS = {
  draft: "Brouillon",
  open: "Vote ouvert",
  closed: "Vote fermé",
  approved: "Approuvée",
  rejected: "Rejetée",
} as const;

const STATUS_VARIANTS = {
  draft: "secondary",
  open: "default",
  closed: "secondary",
  approved: "default",
  rejected: "destructive",
} as const;

export default function GovernancePage() {
  const [statusFilter, setStatusFilter] = useState<"draft" | "open" | "closed" | "approved" | "rejected" | undefined>("open");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "votes" | "ending_soon">("recent");

  const openProposals = useQuery(api.governance.getOpenProposals, {
    limit: 50,
    status: statusFilter,
    proposalType: typeFilter as any,
    sortBy,
  });
  const user = useQuery(api.auth.getCurrentUser);

  const [myStatusFilter, setMyStatusFilter] = useState<string | undefined>(undefined);
  const [mySortBy, setMySortBy] = useState<"recent" | "oldest" | "votes">("recent");

  const myProposals = useQuery(api.governance.getMyProposals, {
    limit: 50,
    status: myStatusFilter as any,
    sortBy: mySortBy,
  });

  const [historyTypeFilter, setHistoryTypeFilter] = useState<string | undefined>(undefined);
  const [historyResultFilter, setHistoryResultFilter] = useState<string | undefined>(undefined);
  const [historySortBy, setHistorySortBy] = useState<"recent" | "oldest" | "votes">("recent");

  const history = useQuery(api.governance.getProposalsHistory, {
    limit: 50,
    proposalType: historyTypeFilter as any,
    result: historyResultFilter as any,
    sortBy: historySortBy,
  });

  const extractDescriptionText = (description: any) => {
    try {
      if (description) {
        const parsed = typeof description === "string" 
          ? JSON.parse(description) 
          : description;
        return extractTextFromPlateValue(parsed as TElement[]);
      }
    } catch {
      return description || "";
    }
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gouvernance</h1>
          <p className="text-muted-foreground mt-2">
            Proposez des décisions et votez sur les propositions de la communauté
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/gouvernance/nouvelle">
            <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
            Nouvelle proposition
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open">
            Votes ouverts
            {openProposals !== undefined && openProposals !== null && (
              <Badge variant="secondary" className="ml-2">
                {(openProposals as any[]).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my">Mes propositions</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {/* Filtres */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-[200px]">
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <Select
                value={statusFilter || "open"}
                onValueChange={(value) => setStatusFilter(value === "none" ? undefined : value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="open">Vote ouvert</SelectItem>
                  <SelectItem value="closed">Vote fermé</SelectItem>
                  <SelectItem value="approved">Approuvée</SelectItem>
                  <SelectItem value="rejected">Rejetée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[200px]">
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
                  <SelectItem value="editorial_rules">Règles éditoriales</SelectItem>
                  <SelectItem value="product_evolution">Évolution du produit</SelectItem>
                  <SelectItem value="ethical_charter">Charte éthique</SelectItem>
                  <SelectItem value="category_addition">Ajout de catégories</SelectItem>
                  <SelectItem value="expert_nomination">Nomination d'experts</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[200px]">
              <label className="text-sm font-medium mb-2 block">Trier par</label>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récentes</SelectItem>
                  <SelectItem value="oldest">Plus anciennes</SelectItem>
                  <SelectItem value="votes">Plus de votes</SelectItem>
                  <SelectItem value="ending_soon">Se terminant bientôt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {openProposals === undefined ? (
            <Skeleton className="h-64 w-full" />
          ) : (openProposals as any[]).length === 0 ? (
            <div className="text-center py-12">
              <SolarIcon
                icon="vote-bold"
                className="h-12 w-12 mx-auto text-muted-foreground mb-4"
              />
              <h3 className="text-lg font-semibold mb-2">
                Aucune proposition ouverte
              </h3>
              <p className="text-sm text-muted-foreground">
                Il n'y a actuellement aucune proposition en cours de vote
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Quorum</TableHead>
                  <TableHead>Proposé par</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(openProposals as any[]).map((proposal: any) => {
                  const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
                  const forPercentage =
                    totalVotes > 0
                      ? (proposal.votesFor / totalVotes) * 100
                      : 0;

                  const remainingTime = proposal.voteEndAt
                    ? Math.max(0, proposal.voteEndAt - Date.now())
                    : null;
                  const daysRemaining = remainingTime
                    ? Math.floor(remainingTime / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <TableRow key={proposal._id}>
                      <TableCell className="font-medium max-w-xs">
                        <Link
                          href={`/gouvernance/${proposal.slug}`}
                          className="hover:text-primary transition-colors line-clamp-2"
                        >
                          {proposal.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {
                            PROPOSAL_TYPE_LABELS[
                              proposal.proposalType as keyof typeof PROPOSAL_TYPE_LABELS
                            ]
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_VARIANTS[
                              proposal.status as keyof typeof STATUS_VARIANTS
                            ] as any
                          }
                        >
                          {STATUS_LABELS[proposal.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600 dark:text-green-400">
                            {proposal.votesFor}
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-red-600 dark:text-red-400">
                            {proposal.votesAgainst}
                          </span>
                          <span className="text-muted-foreground">
                            ({totalVotes})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {proposal.totalVotes}/{proposal.quorumRequired}
                        </span>
                        {daysRemaining !== null && (
                          <div className="text-xs text-muted-foreground">
                            {daysRemaining > 0
                              ? `${daysRemaining}j restants`
                              : "Terminé"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {proposal.proposer?.name || "Anonyme"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(proposal.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" asChild>
                          <Link href={`/gouvernance/${proposal.slug}`}>
                            Voir et voter
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          {/* Filtres pour mes propositions */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-[200px]">
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <Select
                value={myStatusFilter || "none"}
                onValueChange={(value) => setMyStatusFilter(value === "none" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="open">Vote ouvert</SelectItem>
                  <SelectItem value="closed">Vote fermé</SelectItem>
                  <SelectItem value="approved">Approuvée</SelectItem>
                  <SelectItem value="rejected">Rejetée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[200px]">
              <label className="text-sm font-medium mb-2 block">Trier par</label>
              <Select
                value={mySortBy}
                onValueChange={(value) => setMySortBy(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récentes</SelectItem>
                  <SelectItem value="oldest">Plus anciennes</SelectItem>
                  <SelectItem value="votes">Plus de votes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {myProposals === undefined ? (
            <Skeleton className="h-64 w-full" />
          ) : (myProposals as any[]).length === 0 ? (
            <div className="text-center py-12">
              <SolarIcon
                icon="document-add-bold"
                className="h-12 w-12 mx-auto text-muted-foreground mb-4"
              />
              <h3 className="text-lg font-semibold mb-2">
                Aucune proposition pour le moment
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Créez une nouvelle proposition pour faire évoluer Seed
              </p>
              <Button asChild>
                <Link href="/studio/gouvernance/nouvelle">
                  Nouvelle proposition
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Résultat</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(myProposals as any[]).map((proposal: any) => {
                  const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;

                  const remainingTime = proposal.voteEndAt
                    ? Math.max(0, proposal.voteEndAt - Date.now())
                    : null;
                  const daysRemaining = remainingTime
                    ? Math.floor(remainingTime / (1000 * 60 * 60 * 24))
                    : null;

                  return (
                    <TableRow key={proposal._id}>
                      <TableCell className="font-medium max-w-xs">
                        <Link
                          href={`/gouvernance/${proposal.slug}`}
                          className="hover:text-primary transition-colors line-clamp-2"
                        >
                          {proposal.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {
                            PROPOSAL_TYPE_LABELS[
                              proposal.proposalType as keyof typeof PROPOSAL_TYPE_LABELS
                            ]
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            STATUS_VARIANTS[
                              proposal.status as keyof typeof STATUS_VARIANTS
                            ] as any
                          }
                        >
                          {STATUS_LABELS[proposal.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600 dark:text-green-400">
                            {proposal.votesFor}
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-red-600 dark:text-red-400">
                            {proposal.votesAgainst}
                          </span>
                          <span className="text-muted-foreground">
                            ({totalVotes})
                          </span>
                          {proposal.status === "open" && daysRemaining !== null && (
                            <span className="text-xs text-muted-foreground">
                              • {daysRemaining > 0 ? `${daysRemaining}j` : "Terminé"}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {proposal.status === "closed" && proposal.result ? (
                          <Badge
                            variant={
                              proposal.result === "approved"
                                ? "default"
                                : proposal.result === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {proposal.result === "approved" && "✓ Approuvée"}
                            {proposal.result === "rejected" && "✗ Rejetée"}
                            {proposal.result === "quorum_not_met" && "⚠ Quorum non atteint"}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(proposal.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" asChild>
                            <Link href={`/gouvernance/${proposal.slug}`}>
                              Voir
                            </Link>
                          </Button>
                          {proposal.status === "draft" && (
                            <Button variant="ghost" asChild>
                              <Link href={`/studio/gouvernance/${proposal.slug}`}>
                                <SolarIcon icon="edit-bold" className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {/* Filtres pour l'historique */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-[200px]">
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={historyTypeFilter || "none"}
                onValueChange={(value) => setHistoryTypeFilter(value === "none" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tous les types</SelectItem>
                  <SelectItem value="editorial_rules">Règles éditoriales</SelectItem>
                  <SelectItem value="product_evolution">Évolution du produit</SelectItem>
                  <SelectItem value="ethical_charter">Charte éthique</SelectItem>
                  <SelectItem value="category_addition">Ajout de catégories</SelectItem>
                  <SelectItem value="expert_nomination">Nomination d'experts</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[200px]">
              <label className="text-sm font-medium mb-2 block">Résultat</label>
              <Select
                value={historyResultFilter || "none"}
                onValueChange={(value) => setHistoryResultFilter(value === "none" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tous les résultats</SelectItem>
                  <SelectItem value="approved">Approuvées</SelectItem>
                  <SelectItem value="rejected">Rejetées</SelectItem>
                  <SelectItem value="quorum_not_met">Quorum non atteint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-[200px]">
              <label className="text-sm font-medium mb-2 block">Trier par</label>
              <Select
                value={historySortBy}
                onValueChange={(value) => setHistorySortBy(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récentes</SelectItem>
                  <SelectItem value="oldest">Plus anciennes</SelectItem>
                  <SelectItem value="votes">Plus de votes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {history === undefined ? (
            <Skeleton className="h-64 w-full" />
          ) : (history as any[]).length === 0 ? (
            <div className="text-center py-12">
              <SolarIcon
                icon="history-bold"
                className="h-12 w-12 mx-auto text-muted-foreground mb-4"
              />
              <h3 className="text-lg font-semibold mb-2">
                Aucun historique pour le moment
              </h3>
              <p className="text-sm text-muted-foreground">
                Les propositions fermées apparaîtront ici
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Résultat</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Quorum</TableHead>
                  <TableHead>Proposé par</TableHead>
                  <TableHead>Date de fermeture</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(history as any[]).map((proposal: any) => {
                  const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;

                  return (
                    <TableRow key={proposal._id}>
                      <TableCell className="font-medium max-w-xs">
                        <Link
                          href={`/gouvernance/${proposal.slug}`}
                          className="hover:text-primary transition-colors line-clamp-2"
                        >
                          {proposal.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {
                            PROPOSAL_TYPE_LABELS[
                              proposal.proposalType as keyof typeof PROPOSAL_TYPE_LABELS
                            ]
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            proposal.result === "approved"
                              ? "default"
                              : proposal.result === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {proposal.result === "approved" && "✓ Approuvée"}
                          {proposal.result === "rejected" && "✗ Rejetée"}
                          {proposal.result === "quorum_not_met" && "⚠ Quorum non atteint"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600 dark:text-green-400">
                            {proposal.votesFor}
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-red-600 dark:text-red-400">
                            {proposal.votesAgainst}
                          </span>
                          <span className="text-muted-foreground">
                            ({totalVotes})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {proposal.totalVotes}/{proposal.quorumRequired}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {proposal.proposer?.name || "Anonyme"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(proposal.updatedAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" asChild>
                          <Link href={`/gouvernance/${proposal.slug}`}>
                            Voir
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
