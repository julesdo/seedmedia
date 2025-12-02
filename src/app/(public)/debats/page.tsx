"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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
import { Separator } from "@/components/ui/separator";

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
    <div className="container mx-auto px-4 py-4 md:py-6 max-w-6xl">
      <header className="mb-6 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Débats ouverts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Participez aux débats structurés autour des questions clés.
            </p>
          </div>
          {filteredDebates.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/60">
              <SolarIcon icon="chat-round-bold" className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{filteredDebates.length}</span>
              <span className="text-xs text-muted-foreground">
                débat{filteredDebates.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </header>

      <Separator className="mb-4 border-border/60" />

      {/* Filtres et recherche */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Barre de recherche */}
        <div className="relative flex-1 min-w-[200px]">
          <SolarIcon
            icon="search-bold"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70 pointer-events-none z-10"
          />
          <Input
            type="text"
            placeholder="Rechercher un débat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {/* Filtres */}
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[140px] h-8 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
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
          <SelectTrigger className="w-[120px] h-8 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
            <SelectValue placeholder="Article" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="with">Avec</SelectItem>
            <SelectItem value="without">Sans</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={polarizationFilter}
          onValueChange={(value: any) => setPolarizationFilter(value)}
        >
          <SelectTrigger className="w-[120px] h-8 text-xs border-border/60 bg-muted/30 hover:bg-muted/50">
            <SelectValue placeholder="Polarisation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="high">Élevée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredDebates.length === 0 ? (
        <div className="border border-border/60 rounded-lg bg-muted/20 p-8 text-center">
          <SolarIcon icon="question-circle-bold" className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm font-semibold mb-1">
            {searchQuery || hasArticle !== undefined || polarizationFilter !== "all"
              ? "Aucun débat trouvé"
              : "Aucun débat ouvert pour le moment"}
          </p>
          <p className="text-xs text-muted-foreground">
            {searchQuery || hasArticle !== undefined || polarizationFilter !== "all"
              ? "Essayez de modifier vos critères de recherche"
              : "Les débats seront affichés ici dès qu'ils seront créés"}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredDebates.map((debat) => {
            const totalArguments = debat.argumentsForCount + debat.argumentsAgainstCount;
            const polarizationScore = debat.polarizationScore || 0;
            const polarizationPercent = Math.round(polarizationScore);
            const forPercentage = totalArguments > 0 ? Math.round((debat.argumentsForCount / totalArguments) * 100) : 50;
            const againstPercentage = 100 - forPercentage;
            const isHighlyPolarized = polarizationPercent >= 70;
            const isActive = totalArguments >= 10;
            const isRecent = Date.now() - debat.createdAt < 7 * 24 * 60 * 60 * 1000; // Moins de 7 jours

            return (
              <Link key={debat._id} href={`/debats/${debat.slug}`}>
                <div className={`
                  border-l-2 pl-3 py-2.5 bg-muted/20 rounded-r hover:bg-muted/30 transition-all group
                  ${isHighlyPolarized ? 'border-orange-500/40' : 'border-primary/40'}
                  ${isActive ? 'ring-1 ring-primary/20' : ''}
                `}>
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-2">
                          {debat.question}
                        </h3>
                        {isActive && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                            <SolarIcon icon="fire-bold" className="h-2.5 w-2.5 mr-0.5" />
                            Actif
                          </Badge>
                        )}
                        {isRecent && !isActive && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                            <SolarIcon icon="sparkle-bold" className="h-2.5 w-2.5 mr-0.5" />
                            Nouveau
                          </Badge>
                        )}
                      </div>
                      {debat.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                          {debat.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 items-end shrink-0">
                      <Badge
                        variant={
                          polarizationPercent >= 70
                            ? "destructive"
                            : polarizationPercent >= 30
                            ? "default"
                            : "secondary"
                        }
                        className="text-[11px] px-1.5 py-0"
                      >
                        <SolarIcon icon="pulse-bold" className="h-3 w-3 mr-0.5" />
                        {polarizationPercent}%
                      </Badge>
                      {debat.article && (
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                          <SolarIcon icon="document-bold" className="h-3 w-3 mr-0.5" />
                          Article
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Barre de progression bicolore */}
                  {totalArguments > 0 ? (
                    <div className="mb-1.5">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex">
                          <div
                            className="bg-green-500/80 transition-all"
                            style={{ width: `${forPercentage}%` }}
                            title={`${debat.argumentsForCount} arguments POUR`}
                          />
                          <div
                            className="bg-red-500/80 transition-all"
                            style={{ width: `${againstPercentage}%` }}
                            title={`${debat.argumentsAgainstCount} arguments CONTRE`}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium">
                          <span className="text-green-600 dark:text-green-400">{debat.argumentsForCount}</span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-red-600 dark:text-red-400">{debat.argumentsAgainstCount}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-1.5">
                      <div className="flex-1 h-2 bg-muted rounded-full" />
                    </div>
                  )}

                  {/* Métriques compactes */}
                  <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <SolarIcon icon="chat-round-bold" className="h-3 w-3" />
                      <span className="font-medium">{totalArguments} argument{totalArguments > 1 ? "s" : ""}</span>
                    </div>
                    {debat.article && (
                      <>
                        <span>•</span>
                        <Link
                          href={`/articles/${debat.article.slug}`}
                          className="hover:text-foreground transition-colors flex items-center gap-1 truncate max-w-[180px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SolarIcon icon="document-bold" className="h-3 w-3 shrink-0" />
                          <span className="truncate text-[11px]">{debat.article.title}</span>
                        </Link>
                      </>
                    )}
                    <span className="ml-auto text-[11px]">
                      {formatDistanceToNow(new Date(debat.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
