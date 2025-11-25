"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { extractTextFromPlateValue } from "@/components/articles/PlateEditorWrapper";
import type { TElement } from "platejs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

export default function GouvernancePage() {
  const { isAuthenticated } = useConvexAuth();
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "votes" | "ending_soon">("recent");

  const proposals = useQuery(api.governance.getOpenProposals, {
    limit: 50,
    status: "open",
    proposalType: typeFilter as any,
    sortBy,
  });

  // État de chargement
  if (proposals === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold">Gouvernance ouverte</h1>
        <p className="text-muted-foreground text-lg">
          Participez à la gouvernance de Seed en proposant et en votant sur les décisions importantes de la plateforme.
        </p>
        {!isAuthenticated && (
          <div className="bg-muted/50 p-4 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <Link href="/signin" className="font-medium underline">
                Connectez-vous
              </Link>{" "}
              pour proposer des décisions et voter sur les propositions en cours.
            </p>
          </div>
        )}
      </header>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={typeFilter || "none"}
                onValueChange={(value) => setTypeFilter(value === "none" ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
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
        </CardContent>
      </Card>

      {proposals.length === 0 ? (
        <div className="text-center py-12">
          <SolarIcon icon="document-text-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Aucune proposition ouverte</p>
          <p className="text-sm text-muted-foreground">
            Aucune proposition ouverte pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {proposals.map((proposal) => {
            const totalVotes = (proposal.votesFor || 0) + (proposal.votesAgainst || 0) + (proposal.votesAbstain || 0);
            const remainingTime = proposal.voteEndAt ? Math.max(0, proposal.voteEndAt - Date.now()) : null;
            const daysRemaining = remainingTime ? Math.floor(remainingTime / (1000 * 60 * 60 * 24)) : null;

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

            // Déterminer le gradient et l'icône selon le type de proposition
            const getProposalStyle = (type: string) => {
              switch (type) {
                case "editorial_rules":
                  return {
                    gradient: "from-blue-500/20 to-blue-600/10",
                    icon: "document-text-bold",
                  };
                case "product_evolution":
                  return {
                    gradient: "from-purple-500/20 to-purple-600/10",
                    icon: "settings-bold",
                  };
                case "ethical_charter":
                  return {
                    gradient: "from-green-500/20 to-green-600/10",
                    icon: "shield-check-bold",
                  };
                case "category_addition":
                  return {
                    gradient: "from-orange-500/20 to-orange-600/10",
                    icon: "tag-bold",
                  };
                case "expert_nomination":
                  return {
                    gradient: "from-pink-500/20 to-pink-600/10",
                    icon: "user-id-bold",
                  };
                default:
                  return {
                    gradient: "from-primary/20 to-muted",
                    icon: "document-text-bold",
                  };
              }
            };

            const proposalStyle = getProposalStyle(proposal.proposalType);

            return (
              <Link key={proposal._id} href={`/gouvernance/${proposal.slug}`}>
                <article className="group cursor-pointer">
                  {/* Image placeholder avec gradient selon le type */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg mb-4 bg-muted">
                    <div className={`absolute inset-0 bg-gradient-to-br ${proposalStyle.gradient} flex items-center justify-center`}>
                      <SolarIcon 
                        icon={proposalStyle.icon} 
                        width={96} 
                        height={96} 
                        className="text-muted-foreground" 
                      />
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="space-y-3">
                    {/* Métadonnées */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {proposal.proposer && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={proposal.proposer.image || undefined} />
                            <AvatarFallback className="text-xs">
                              {proposal.proposer.name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{proposal.proposer.name}</span>
                        </div>
                      )}
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(proposal.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>

                    {/* Titre */}
                    <h2 className="text-2xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {proposal.title}
                    </h2>

                    {/* Description */}
                    {descriptionText && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{descriptionText}</p>
                    )}

                    {/* Tags et métriques */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {proposal.proposalType === "editorial_rules" && "Règles"}
                          {proposal.proposalType === "product_evolution" && "Produit"}
                          {proposal.proposalType === "ethical_charter" && "Éthique"}
                          {proposal.proposalType === "category_addition" && "Catégorie"}
                          {proposal.proposalType === "expert_nomination" && "Nomination"}
                          {proposal.proposalType === "other" && "Autre"}
                        </Badge>
                        {daysRemaining !== null && daysRemaining > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {daysRemaining}j restant{daysRemaining > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="check-circle-bold" className="h-3 w-3 text-green-600 dark:text-green-400" />
                          <span>{proposal.votesFor || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="close-circle-bold" className="h-3 w-3 text-red-600 dark:text-red-400" />
                          <span>{proposal.votesAgainst || 0}</span>
                        </div>
                        {totalVotes > 0 && (
                          <div className="flex items-center gap-1">
                            <SolarIcon icon="users-group-two-rounded-bold" className="h-3 w-3" />
                            <span>{totalVotes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

