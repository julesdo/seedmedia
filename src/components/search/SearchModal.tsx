"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslations } from 'next-intl';

// Composant Skeleton personnalisé pour les cards de décision avec animation shimmer subtile
function DecisionSkeleton() {
  return (
    <div className="rounded-xl border border-border/20 bg-background/50 p-4 sm:p-5 overflow-hidden">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Titre */}
          <div className="space-y-2">
            <div className="h-5 sm:h-4 bg-muted/30 rounded-md w-3/4 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="h-5 sm:h-4 bg-muted/25 rounded-md w-1/2 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animationDelay: "0.2s" }} />
            </div>
          </div>
          {/* Métadonnées */}
          <div className="flex items-center gap-2">
            <div className="h-4 bg-muted/25 rounded-full w-24 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/8 to-transparent" style={{ animationDelay: "0.3s" }} />
            </div>
            <div className="h-4 bg-muted/20 rounded-full w-20 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/8 to-transparent" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
          {/* Badges */}
          <div className="flex items-center gap-2">
            <div className="h-6 bg-muted/25 rounded-full w-16 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/8 to-transparent" style={{ animationDelay: "0.5s" }} />
            </div>
            <div className="h-6 bg-muted/20 rounded-full w-20 relative overflow-hidden">
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/8 to-transparent" style={{ animationDelay: "0.6s" }} />
            </div>
          </div>
        </div>
        {/* Icône */}
        <div className="flex-shrink-0 pt-1">
          <div className="rounded-full bg-muted/20 w-9 h-9 relative overflow-hidden">
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/8 to-transparent" style={{ animationDelay: "0.7s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

export function SearchModal({ open, onOpenChange, initialQuery = "" }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  // Réinitialiser la query quand la modale s'ouvre
  useEffect(() => {
    if (open) {
      setSearchQuery(initialQuery);
      setShowFilters(false);
      // Focus sur l'input après l'animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, initialQuery]);

  const t = useTranslations('search');
  const tCommon = useTranslations('common');
  
  const types = [
    { label: t('types.all'), value: undefined, icon: "list-bold" },
    { label: t('types.law'), value: "law", icon: "document-text-bold" },
    { label: t('types.sanction'), value: "sanction", icon: "forbidden-circle-bold" },
    { label: t('types.tax'), value: "tax", icon: "wallet-money-bold" },
    { label: t('types.agreement'), value: "agreement", icon: "handshake-bold" },
    { label: t('types.policy'), value: "policy", icon: "diploma-verified-bold" },
    { label: t('types.regulation'), value: "regulation", icon: "clipboard-check-bold" },
  ];

  const statuses = [
    { label: t('statuses.all'), value: undefined, icon: "list-bold" },
    { label: t('statuses.announced'), value: "announced", icon: "megaphone-bold" },
    { label: t('statuses.tracking'), value: "tracking", icon: "eye-bold" },
    { label: t('statuses.resolved'), value: "resolved", icon: "check-circle-bold" },
  ];

  const results = useQuery(
    api.decisions.searchDecisions,
    searchQuery.trim()
      ? {
          query: searchQuery.trim(),
          limit: 20,
          type: selectedType as any,
          status: selectedStatus as any,
        }
      : "skip"
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  const activeFiltersCount = (selectedType ? 1 : 0) + (selectedStatus ? 1 : 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // Mobile-first: plein écran sur mobile
          "inset-0 w-full h-full max-w-none max-h-none rounded-none",
          // Desktop: centré avec max-width
          "sm:inset-auto sm:max-w-2xl sm:max-h-[90vh] sm:rounded-lg sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          "p-0 gap-0 overflow-hidden flex flex-col",
          "data-[state=open]:animate-in data-[state=closed]:animate-out"
        )}
        onKeyDown={handleKeyDown}
        showCloseButton={true}
      >
        {/* Header fixe avec recherche */}
        <div className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          {/* Barre de recherche principale - Mobile-first avec taille optimale */}
          <div className="px-4 pt-4 pb-3 sm:px-6 sm:pt-5 sm:pb-4">
            <div className="relative">
              <SolarIcon
                icon="magnifer-bold"
                className="absolute left-4 top-1/2 -translate-y-1/2 size-5 sm:size-4 text-muted-foreground pointer-events-none"
              />
              <Input
                ref={inputRef}
                type="search"
                placeholder={t('placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    onOpenChange(false);
                  }
                }}
                className={cn(
                  // Mobile: input plus grand pour faciliter la saisie
                  "pl-12 h-14 text-base",
                  // Desktop: taille normale
                  "sm:h-11 sm:text-sm",
                  "bg-muted/30 border-border/50 focus:bg-background focus:border-primary/50",
                  "transition-all"
                )}
                autoFocus
              />
              {/* Bouton pour afficher/masquer les filtres */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10",
                  "sm:h-8 sm:w-8",
                  activeFiltersCount > 0 && "bg-primary/10 text-primary"
                )}
              >
                <SolarIcon icon="filter-bold" className="size-5 sm:size-4" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-semibold">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Filtres - Mobile: sheet-like, Desktop: inline */}
          <div
            className={cn(
              "border-t border-border/50 bg-muted/30 transition-all duration-200 overflow-hidden",
              showFilters ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
              "sm:max-h-none sm:opacity-100 sm:border-t-0"
            )}
          >
            <div className="px-4 py-3 sm:px-6 sm:py-4 space-y-3">
              {/* Types */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider sm:hidden">
                  <SolarIcon icon="list-bold" className="size-3.5" />
                  Type
                </div>
                <div className="flex flex-wrap gap-2">
                  {types.map((type) => (
                    <Button
                      key={type.value || "all"}
                      variant={selectedType === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType(type.value)}
                      className={cn(
                        // Mobile: boutons plus grands pour le touch
                        "h-10 px-4 text-sm",
                        // Desktop: taille normale
                        "sm:h-8 sm:px-3 sm:text-xs",
                        "gap-2 transition-all",
                        selectedType === type.value && "shadow-sm"
                      )}
                    >
                      <SolarIcon icon={type.icon} className="size-4 sm:size-3.5" />
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Statuts */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider sm:hidden">
                  <SolarIcon icon="check-circle-bold" className="size-3.5" />
                  Statut
                </div>
                <div className="flex flex-wrap gap-2">
                  {statuses.map((status) => (
                    <Button
                      key={status.value || "all"}
                      variant={selectedStatus === status.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedStatus(status.value)}
                      className={cn(
                        // Mobile: boutons plus grands pour le touch
                        "h-10 px-4 text-sm",
                        // Desktop: taille normale
                        "sm:h-8 sm:px-3 sm:text-xs",
                        "gap-2 transition-all",
                        selectedStatus === status.value && "shadow-sm"
                      )}
                    >
                      <SolarIcon icon={status.icon} className="size-4 sm:size-3.5" />
                      {status.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Résultats avec scroll - Optimisé pour mobile */}
        <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
          <div className="px-4 py-4 sm:px-6 sm:py-5">
            {!searchQuery.trim() ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-12 text-center">
                <div className="size-20 sm:size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <SolarIcon icon="magnifer-bold" className="size-10 sm:size-8 text-muted-foreground opacity-50" />
                </div>
                <p className="text-base sm:text-sm text-muted-foreground font-medium">
                  {t('startTyping')}
                </p>
                <p className="text-sm sm:text-xs text-muted-foreground/70 mt-2">
                  {t('useFilters')}
                </p>
              </div>
            ) : results === undefined ? (
              <div className="space-y-3 sm:space-y-4">
                {[...Array(5)].map((_, i) => (
                  <DecisionSkeleton key={i} />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-12 text-center">
                <div className="size-20 sm:size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <SolarIcon icon="magnifer-bold" className="size-10 sm:size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg sm:text-base font-semibold mb-2">{t('noResults')}</h3>
                <p className="text-sm sm:text-xs text-muted-foreground max-w-sm">
                  {t('noResultsDescription', { query: searchQuery })}
                </p>
                {(selectedType || selectedStatus) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedType(undefined);
                      setSelectedStatus(undefined);
                    }}
                    className="mt-4"
                  >
                    <SolarIcon icon="close-circle-bold" className="size-4 mr-2" />
                    {t('resetFilters')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {/* Compteur de résultats */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm sm:text-xs text-muted-foreground font-medium">
                    {results.length} résultat{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}
                  </div>
                  {(selectedType || selectedStatus) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedType(undefined);
                        setSelectedStatus(undefined);
                      }}
                      className="h-7 text-xs"
                    >
                      <SolarIcon icon="close-circle-bold" className="size-3 mr-1" />
                      Réinitialiser
                    </Button>
                  )}
                </div>

                {/* Liste des résultats - Optimisée pour le touch */}
                {results.map((decision) => (
                  <Link
                    key={decision._id}
                    href={`/${decision.slug}`}
                    onClick={() => onOpenChange(false)}
                    className="block"
                  >
                    <div
                      className={cn(
                        "group rounded-xl border border-border/50 bg-background p-4 sm:p-5",
                        "active:scale-[0.98] transition-all duration-150",
                        "hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm",
                        // Mobile: zone de tap plus grande
                        "min-h-[120px] sm:min-h-[100px]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
                          <h3
                            className={cn(
                              "font-semibold line-clamp-2 transition-colors",
                              "text-lg sm:text-base",
                              "group-active:text-primary"
                            )}
                          >
                            {decision.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-wrap text-sm sm:text-xs text-muted-foreground">
                            <span className="font-medium">{decision.decider}</span>
                            <span>•</span>
                            <span>{new Date(decision.date).toLocaleDateString("fr-FR")}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {decision.type && (
                              <Badge variant="secondary" className="text-xs sm:text-[10px] px-2 py-0.5">
                                {decision.type}
                              </Badge>
                            )}
                            {decision.status && (
                              <Badge
                                variant={
                                  decision.status === "resolved"
                                    ? "default"
                                    : decision.status === "tracking"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="text-xs sm:text-[10px] px-2 py-0.5"
                              >
                                {decision.status === "resolved"
                                  ? "Résolue"
                                  : decision.status === "tracking"
                                    ? "En suivi"
                                    : "Annoncée"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 pt-1">
                          <div className="rounded-full bg-muted/50 p-2 group-hover:bg-primary/10 group-active:bg-primary/20 transition-colors">
                            <SolarIcon
                              icon="arrow-right-bold"
                              className="size-5 sm:size-4 text-muted-foreground group-hover:text-primary group-active:text-primary transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Styles pour l'animation shimmer subtile et fluide */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(400%) skewX(-12deg);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </Dialog>
  );
}

