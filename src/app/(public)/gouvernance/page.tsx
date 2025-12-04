"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, Suspense } from "react";
import { useQueryState } from "nuqs";
import { ProposalCard } from "@/components/governance/ProposalCard";
import { cn } from "@/lib/utils";

function GouvernancePageContent() {
  const { isAuthenticated } = useConvexAuth();
  
  // Utiliser nuqs pour gérer les search params
  const [sortBy, setSortBy] = useQueryState<"recent" | "oldest" | "votes" | "ending_soon">("sort", {
    defaultValue: "recent",
    parse: (value) => {
      if (["recent", "oldest", "votes", "ending_soon"].includes(value)) {
        return value as "recent" | "oldest" | "votes" | "ending_soon";
      }
      return "recent";
    },
  });
  
  const [typeFilter, setTypeFilter] = useQueryState<"editorial_rules" | "product_evolution" | "ethical_charter" | "category_addition" | "expert_nomination" | "other">("type", {
    defaultValue: null,
    parse: (value) => {
      if (["editorial_rules", "product_evolution", "ethical_charter", "category_addition", "expert_nomination", "other"].includes(value)) {
        return value as any;
      }
      return null;
    },
  });

  // Récupérer les propositions ouvertes
  const openProposals = useQuery(api.governance.getOpenProposals, {
    limit: 50,
    status: "open",
    proposalType: typeFilter || undefined,
    sortBy: sortBy || "recent",
  });

  // Récupérer les propositions fermées (historique)
  const closedProposals = useQuery(api.governance.getProposalsHistory, {
    limit: 10,
    sortBy: "recent",
  });

  // Récupérer les statistiques de la plateforme
  const platformStats = useQuery(api.stats.getPlatformStats);

  // Séparer les propositions urgentes (≤ 3 jours) des autres
  const { urgentProposals, otherOpenProposals } = useMemo(() => {
    if (!openProposals) return { urgentProposals: [], otherOpenProposals: [] };
    
    const urgent: typeof openProposals = [];
    const other: typeof openProposals = [];
    
    openProposals.forEach((proposal) => {
      if (proposal.voteEndAt) {
        const remainingTime = Math.max(0, proposal.voteEndAt - Date.now());
        const daysRemaining = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
        if (daysRemaining <= 3) {
          urgent.push(proposal);
        } else {
          other.push(proposal);
        }
      } else {
        other.push(proposal);
      }
    });
    
    return { urgentProposals: urgent, otherOpenProposals: other };
  }, [openProposals]);

  if (openProposals === undefined || closedProposals === undefined || platformStats === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <div className="space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 max-w-7xl">
        {/* Header solennel */}
        <header className="mb-10 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                Gouvernance ouverte
              </h1>
              <p className="text-base text-muted-foreground max-w-2xl">
                Participez à la gouvernance de Seed en proposant et en votant sur les décisions importantes qui façonnent l'avenir de la plateforme.
              </p>
            </div>
            {isAuthenticated && (
              <Button asChild variant="accent" size="default">
                <Link href="/studio/gouvernance/nouvelle">
                  <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
                  Nouvelle proposition
                </Link>
              </Button>
            )}
          </div>

          {!isAuthenticated && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <SolarIcon icon="info-circle-bold" className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <Link href="/sign-in" className="font-medium text-primary hover:underline">
                      Connectez-vous
                    </Link>{" "}
                    pour proposer des décisions et voter sur les propositions en cours.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistiques de gouvernance */}
          {platformStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card className="border-border/60 bg-card">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <SolarIcon icon="document-text-bold" className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                  <p className="text-2xl font-bold">{platformStats.proposalsCount || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">propositions</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-muted-foreground">Ouvertes</span>
                  </div>
                  <p className="text-2xl font-bold">{platformStats.openProposals || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">en cours</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <SolarIcon icon="verified-check-bold" className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-muted-foreground">Approuvées</span>
                  </div>
                  <p className="text-2xl font-bold">{platformStats.approvedProposals || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">décisions</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <SolarIcon icon="users-group-two-rounded-bold" className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Fermées</span>
                  </div>
                  <p className="text-2xl font-bold">{platformStats.closedProposals || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">propositions</p>
                </CardContent>
              </Card>
            </div>
          )}
        </header>

        {/* Filtres */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={sortBy || "recent"} onValueChange={(value: any) => setSortBy(value === "recent" ? null : value)}>
              <SelectTrigger className="w-[160px] h-9 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récentes</SelectItem>
                <SelectItem value="oldest">Plus anciennes</SelectItem>
                <SelectItem value="votes">Plus de votes</SelectItem>
                <SelectItem value="ending_soon">Se terminant bientôt</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter || "all"} onValueChange={(value) => setTypeFilter(value === "all" ? null : (value as any))}>
              <SelectTrigger className="w-[180px] h-9 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="editorial_rules">Règles éditoriales</SelectItem>
                <SelectItem value="product_evolution">Évolution du produit</SelectItem>
                <SelectItem value="ethical_charter">Charte éthique</SelectItem>
                <SelectItem value="category_addition">Ajout de catégories</SelectItem>
                <SelectItem value="expert_nomination">Nomination d'experts</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>

            {(typeFilter || sortBy !== "recent") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeFilter(null);
                  setSortBy(null);
                }}
                className="h-9 text-xs"
              >
                <SolarIcon icon="refresh-bold" className="h-3.5 w-3.5 mr-1.5" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        {/* Section Urgentes */}
        {urgentProposals.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <SolarIcon icon="danger-triangle-bold" className="h-5 w-5 text-destructive" />
                <h2 className="text-2xl font-bold">Urgentes</h2>
              </div>
              <Badge variant="destructive" className="h-6 px-2 text-xs">
                {urgentProposals.length} proposition{urgentProposals.length > 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {urgentProposals.map((proposal) => (
                <ProposalCard key={proposal._id} proposal={proposal} />
              ))}
            </div>
          </section>
        )}

        {/* Section Propositions ouvertes */}
        <section className={cn("mb-10", urgentProposals.length > 0 && "mt-12")}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <SolarIcon icon="document-text-bold" className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Votes en cours</h2>
            </div>
            {otherOpenProposals.length > 0 && (
              <Badge variant="secondary" className="h-6 px-2 text-xs">
                {otherOpenProposals.length} proposition{otherOpenProposals.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          {otherOpenProposals.length === 0 && urgentProposals.length === 0 ? (
            <div className="text-center py-16 border border-border/60 rounded-xl bg-muted/20">
              <SolarIcon icon="document-text-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-base font-semibold mb-2">Aucune proposition ouverte</p>
              <p className="text-sm text-muted-foreground mb-4">
                Aucune proposition ouverte pour le moment.
              </p>
              {isAuthenticated && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/studio/gouvernance/nouvelle">
                    Créer une proposition
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherOpenProposals.map((proposal) => (
                <ProposalCard key={proposal._id} proposal={proposal} />
              ))}
            </div>
          )}
        </section>

        {/* Section Historique */}
        {closedProposals.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <SolarIcon icon="history-bold" className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-2xl font-bold">Historique</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/gouvernance/historique">
                  Voir tout
                  <SolarIcon icon="arrow-right-bold" className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {closedProposals.slice(0, 6).map((proposal) => (
                <ProposalCard key={proposal._id} proposal={proposal} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function GouvernancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
          <div className="space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <GouvernancePageContent />
    </Suspense>
  );
}

