"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { extractTextFromPlateValue } from "@/components/articles/PlateEditorWrapper";
import type { TElement } from "platejs";
import { useState } from "react";

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
          <Card>
            <CardHeader>
              <CardTitle>Propositions ouvertes au vote</CardTitle>
              <CardDescription>
                Votez sur les propositions de gouvernance en cours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtres */}
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
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
                      <SelectItem value="editorial_rules">Règles éditoriales</SelectItem>
                      <SelectItem value="product_evolution">Évolution du produit</SelectItem>
                      <SelectItem value="ethical_charter">Charte éthique</SelectItem>
                      <SelectItem value="category_addition">Ajout de catégories</SelectItem>
                      <SelectItem value="expert_nomination">Nomination d'experts</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
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
                <div className="space-y-4">
                  {(openProposals as any[]).map((proposal: any) => {
                    const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
                    const forPercentage =
                      totalVotes > 0
                        ? (proposal.votesFor / totalVotes) * 100
                        : 0;
                    const againstPercentage =
                      totalVotes > 0
                        ? (proposal.votesAgainst / totalVotes) * 100
                        : 0;

                    const remainingTime = proposal.voteEndAt
                      ? Math.max(0, proposal.voteEndAt - Date.now())
                      : null;
                    const daysRemaining = remainingTime
                      ? Math.floor(remainingTime / (1000 * 60 * 60 * 24))
                      : null;

                    // Extraire le texte brut de la description (Plate.js JSON)
                    let descriptionText = "";
                    try {
                      if (proposal.description) {
                        const parsed = typeof proposal.description === "string" 
                          ? JSON.parse(proposal.description) 
                          : proposal.description;
                        descriptionText = extractTextFromPlateValue(parsed as TElement[]);
                      }
                    } catch {
                      // Si ce n'est pas du JSON Plate.js, utiliser directement
                      descriptionText = proposal.description || "";
                    }

                    return (
                      <Card key={proposal._id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {
                                    PROPOSAL_TYPE_LABELS[
                                      proposal.proposalType as keyof typeof PROPOSAL_TYPE_LABELS
                                    ]
                                  }
                                </Badge>
                                <Link
                                  href={`/gouvernance/${proposal.slug}`}
                                  className="text-lg font-semibold hover:text-primary transition-colors"
                                >
                                  {proposal.title}
                                </Link>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {descriptionText || "Aucune description"}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  Par {proposal.proposer?.name || "Anonyme"}
                                </span>
                                {daysRemaining !== null && (
                                  <span>
                                    {daysRemaining > 0
                                      ? `${daysRemaining} jours restants`
                                      : "Vote terminé"}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant={
                                STATUS_VARIANTS[
                                  proposal.status as keyof typeof STATUS_VARIANTS
                                ] as any
                              }
                            >
                              {STATUS_LABELS[proposal.status as keyof typeof STATUS_LABELS]}
                            </Badge>
                          </div>

                          {/* Votes */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                Pour ({proposal.votesFor})
                              </span>
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                Contre ({proposal.votesAgainst})
                              </span>
                              <span className="text-muted-foreground">
                                Abstention ({proposal.votesAbstain})
                              </span>
                            </div>
                            <Progress value={forPercentage} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                              Quorum : {proposal.totalVotes}/{proposal.quorumRequired} • Majorité requise : {proposal.majorityRequired}%
                            </div>
                          </div>

                          <Button asChild variant="outline" size="sm">
                            <Link href={`/gouvernance/${proposal.slug}`}>
                              Voir et voter
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mes propositions</CardTitle>
              <CardDescription>
                Gérez vos propositions de gouvernance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtres pour mes propositions */}
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
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
                <div className="flex-1 min-w-[200px]">
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
                <div className="space-y-4">
                  {(myProposals as any[]).map((proposal: any) => {
                    const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
                    const forPercentage =
                      totalVotes > 0
                        ? (proposal.votesFor / totalVotes) * 100
                        : 0;
                    const againstPercentage =
                      totalVotes > 0
                        ? (proposal.votesAgainst / totalVotes) * 100
                        : 0;

                    const remainingTime = proposal.voteEndAt
                      ? Math.max(0, proposal.voteEndAt - Date.now())
                      : null;
                    const daysRemaining = remainingTime
                      ? Math.floor(remainingTime / (1000 * 60 * 60 * 24))
                      : null;

                    // Extraire le texte brut de la description (Plate.js JSON)
                    let descriptionText = "";
                    try {
                      if (proposal.description) {
                        const parsed = typeof proposal.description === "string" 
                          ? JSON.parse(proposal.description) 
                          : proposal.description;
                        descriptionText = extractTextFromPlateValue(parsed as TElement[]);
                      }
                    } catch {
                      // Si ce n'est pas du JSON Plate.js, utiliser directement
                      descriptionText = proposal.description || "";
                    }

                    return (
                      <Card key={proposal._id} className="border-l-4 border-l-transparent hover:border-l-primary transition-colors">
                        <div className="p-4 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {
                                    PROPOSAL_TYPE_LABELS[
                                      proposal.proposalType as keyof typeof PROPOSAL_TYPE_LABELS
                                    ]
                                  }
                                </Badge>
                                <Link
                                  href={`/gouvernance/${proposal.slug}`}
                                  className="text-lg font-semibold hover:opacity-80 transition-opacity"
                                >
                                  {proposal.title}
                                </Link>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {descriptionText || "Aucune description"}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {proposal.status === "draft" && (
                                  <span className="text-muted-foreground">
                                    Brouillon créé {formatDistanceToNow(new Date(proposal.createdAt), {
                                      addSuffix: true,
                                      locale: fr,
                                    })}
                                  </span>
                                )}
                                {proposal.status === "open" && daysRemaining !== null && (
                                  <span>
                                    {daysRemaining > 0
                                      ? `${daysRemaining} jours restants`
                                      : "Vote terminé"}
                                  </span>
                                )}
                                {proposal.status === "closed" && (
                                  <span>
                                    Fermé {formatDistanceToNow(new Date(proposal.updatedAt), {
                                      addSuffix: true,
                                      locale: fr,
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant={
                                STATUS_VARIANTS[
                                  proposal.status as keyof typeof STATUS_VARIANTS
                                ] as any
                              }
                            >
                              {STATUS_LABELS[proposal.status as keyof typeof STATUS_LABELS]}
                            </Badge>
                          </div>

                          {/* Votes - seulement si le vote est ouvert ou fermé */}
                          {(proposal.status === "open" || proposal.status === "closed") && (
                            <div className="space-y-2">
                              {totalVotes > 0 ? (
                                <>
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                      Pour ({proposal.votesFor})
                                    </span>
                                    <span className="text-red-600 dark:text-red-400 font-medium">
                                      Contre ({proposal.votesAgainst})
                                    </span>
                                    <span className="text-muted-foreground">
                                      Abstention ({proposal.votesAbstain})
                                    </span>
                                  </div>
                                  <Progress value={forPercentage} className="h-2" />
                                  <div className="text-xs text-muted-foreground">
                                    Quorum : {proposal.totalVotes}/{proposal.quorumRequired} • Majorité requise : {proposal.majorityRequired}%
                                  </div>
                                </>
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  Aucun vote pour le moment
                                </div>
                              )}
                              {/* Résultat si fermé */}
                              {proposal.status === "closed" && proposal.result && (
                                <div className="text-xs">
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
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/gouvernance/${proposal.slug}`}>
                                {proposal.status === "draft" ? "Voir et publier" : "Voir la proposition"}
                              </Link>
                            </Button>
                            {proposal.status === "draft" && (
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/studio/gouvernance/${proposal.slug}`}>
                                  <SolarIcon icon="edit-bold" className="h-4 w-4 mr-2" />
                                  Modifier
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des décisions</CardTitle>
              <CardDescription>
                Consultez les propositions passées et leurs résultats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtres pour l'historique */}
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
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
                <div className="flex-1 min-w-[200px]">
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
                <div className="flex-1 min-w-[200px]">
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
                <div className="space-y-4">
                  {(history as any[]).map((proposal: any) => {
                    const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
                    const forPercentage =
                      totalVotes > 0
                        ? (proposal.votesFor / totalVotes) * 100
                        : 0;

                    // Extraire le texte brut de la description (Plate.js JSON)
                    let descriptionText = "";
                    try {
                      if (proposal.description) {
                        const parsed = typeof proposal.description === "string" 
                          ? JSON.parse(proposal.description) 
                          : proposal.description;
                        descriptionText = extractTextFromPlateValue(parsed as TElement[]);
                      }
                    } catch {
                      descriptionText = proposal.description || "";
                    }

                    return (
                      <Card key={proposal._id} className="border-l-4 border-l-transparent hover:border-l-primary transition-colors">
                        <div className="p-4 space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {
                                    PROPOSAL_TYPE_LABELS[
                                      proposal.proposalType as keyof typeof PROPOSAL_TYPE_LABELS
                                    ]
                                  }
                                </Badge>
                                <Link
                                  href={`/gouvernance/${proposal.slug}`}
                                  className="text-lg font-semibold hover:opacity-80 transition-opacity"
                                >
                                  {proposal.title}
                                </Link>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {descriptionText || "Aucune description"}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>
                                  Fermé {formatDistanceToNow(new Date(proposal.updatedAt), {
                                    addSuffix: true,
                                    locale: fr,
                                  })}
                                </span>
                                {proposal.actionExecuted && (
                                  <Badge variant="default" className="text-xs">
                                    Action exécutée
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
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
                              <Badge variant="secondary">
                                {STATUS_LABELS[proposal.status as keyof typeof STATUS_LABELS]}
                              </Badge>
                            </div>
                          </div>

                          {/* Résultats du vote */}
                          {totalVotes > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  Pour ({proposal.votesFor})
                                </span>
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                  Contre ({proposal.votesAgainst})
                                </span>
                                <span className="text-muted-foreground">
                                  Abstention ({proposal.votesAbstain})
                                </span>
                              </div>
                              <Progress value={forPercentage} className="h-2" />
                              <div className="text-xs text-muted-foreground">
                                Quorum : {proposal.totalVotes}/{proposal.quorumRequired} • Majorité requise : {proposal.majorityRequired}%
                              </div>
                            </div>
                          )}

                          <Button asChild variant="outline" size="sm">
                            <Link href={`/gouvernance/${proposal.slug}`}>
                              Voir la proposition
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

