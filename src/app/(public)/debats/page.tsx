"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useMemo } from "react";

export default function DebatsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "polarization" | "arguments" | "activity">("recent");
  const [hasArticle, setHasArticle] = useState<boolean | undefined>(undefined);
  const [polarizationFilter, setPolarizationFilter] = useState<"all" | "low" | "medium" | "high">("all");

  const debates = useQuery(api.debates.getOpenDebates, {
    limit: 50,
    sortBy,
    hasArticle: hasArticle !== undefined ? hasArticle : undefined,
    minPolarization: polarizationFilter === "low" ? 0 : polarizationFilter === "medium" ? 30 : polarizationFilter === "high" ? 70 : undefined,
    maxPolarization: polarizationFilter === "low" ? 30 : polarizationFilter === "medium" ? 70 : undefined,
  });

  // Filtrer par recherche
  const filteredDebates = useMemo(() => {
    if (!debates) return [];
    if (!searchQuery.trim()) return debates;

    const query = searchQuery.toLowerCase();
    return debates.filter(
      (debat) =>
        debat.question.toLowerCase().includes(query) ||
        debat.description?.toLowerCase().includes(query) ||
        debat.article?.title.toLowerCase().includes(query)
    );
  }, [debates, searchQuery]);

  // État de chargement
  if (debates === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8 space-y-4">
        <h1 className="text-4xl font-bold">Débats ouverts</h1>
        <p className="text-muted-foreground text-lg">
          Participez aux débats structurés autour des questions clés de la résilience technologique.
        </p>
      </header>

      {/* Filtres et recherche */}
      <div className="mb-8 space-y-4">
        {/* Barre de recherche */}
        <div className="relative">
          <SolarIcon
            icon="magnifer-bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
          />
          <Input
            type="text"
            placeholder="Rechercher un débat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap gap-4">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récents</SelectItem>
              <SelectItem value="polarization">Plus polarisés</SelectItem>
              <SelectItem value="arguments">Plus d'arguments</SelectItem>
              <SelectItem value="activity">Plus actifs</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={hasArticle === undefined ? "all" : hasArticle ? "with" : "without"}
            onValueChange={(value) => {
              if (value === "all") setHasArticle(undefined);
              else setHasArticle(value === "with");
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Article associé" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les débats</SelectItem>
              <SelectItem value="with">Avec article</SelectItem>
              <SelectItem value="without">Sans article</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={polarizationFilter}
            onValueChange={(value: any) => setPolarizationFilter(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Polarisation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              <SelectItem value="low">Faible (0-30%)</SelectItem>
              <SelectItem value="medium">Moyenne (30-70%)</SelectItem>
              <SelectItem value="high">Élevée (70-100%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Résultats */}
        {filteredDebates.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {filteredDebates.length} débat{filteredDebates.length > 1 ? "s" : ""} trouvé
            {filteredDebates.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {filteredDebates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <SolarIcon icon="question-circle-bold" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {searchQuery || hasArticle !== undefined || polarizationFilter !== "all"
                ? "Aucun débat trouvé"
                : "Aucun débat ouvert pour le moment"}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery || hasArticle !== undefined || polarizationFilter !== "all"
                ? "Essayez de modifier vos critères de recherche ou de filtres"
                : "Les débats seront affichés ici dès qu'ils seront créés"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDebates.map((debat) => {
            const totalArguments = debat.argumentsForCount + debat.argumentsAgainstCount;
            const polarizationScore = debat.polarizationScore || 0;
            const polarizationPercent = Math.round(polarizationScore);

            return (
              <Link key={debat._id} href={`/debats/${debat.slug}`}>
                <Card className="border-l-4 border-transparent hover:border-primary transition-colors cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {debat.question}
                        </CardTitle>
                        {debat.description && (
                          <CardDescription className="line-clamp-2">{debat.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Badge
                          variant={
                            polarizationPercent >= 70
                              ? "destructive"
                              : polarizationPercent >= 30
                              ? "default"
                              : "secondary"
                          }
                        >
                          <SolarIcon icon="pulse-bold" className="h-3 w-3 mr-1" />
                          {polarizationPercent}%
                        </Badge>
                        {debat.article && (
                          <Badge variant="outline" className="text-xs">
                            <SolarIcon icon="document-bold" className="h-3 w-3 mr-1" />
                            Article
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{debat.argumentsForCount}</span>
                        <span>POUR</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SolarIcon icon="close-circle-bold" className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{debat.argumentsAgainstCount}</span>
                        <span>CONTRE</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SolarIcon icon="chat-round-bold" className="h-4 w-4" />
                        <span className="font-medium">{totalArguments}</span>
                        <span>argument{totalArguments > 1 ? "s" : ""}</span>
                      </div>
                      {debat.article && (
                        <>
                          <span>•</span>
                          <Link
                            href={`/articles/${debat.article.slug}`}
                            className="hover:underline flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SolarIcon icon="document-bold" className="h-4 w-4" />
                            {debat.article.title}
                          </Link>
                        </>
                      )}
                      <span className="ml-auto">
                        {formatDistanceToNow(new Date(debat.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                    <Button variant="ghost" className="w-full group-hover:bg-primary/10 transition-colors">
                      Voir le débat
                      <SolarIcon icon="arrow-right-bold" className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
